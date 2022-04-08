/**
 * Implements a mechanism to get terrain height for a list of points.
 * 
 * Loosely based on https://github.com/jimmyangel/sampleterrain
 * 
 * Note that height is relative to the WGS84 ellipsoid, which is not the same
 * as the height relative to mean sea level (MSL). Additional calculation is
 * required to compute MSL.
 * 
 * https://cesium.com/blog/2015/10/26/cloudahoy-migration-to-cesium/
 * 
 * Apparently: MSL = WSG84 - 2(Geoid)
 * 
 * https://www.unavco.org/software/geodetic-utilities/geoid-height-calculator/geoid-height-calculator.html
 * 
 * This looks like a useful starting point:
 * https://github.com/vandry/geoidheight
 */

const cli = require('cli');
const elevate = require('./lib/');
const Database = require('better-sqlite3')


async function updateAllRecords(options) {
    console.info(`token: ${options.token}`);
    // 1000 seems to be about the limit
    const page_size = 1000;
    const db = new Database(options.source);
    const QCount = db.prepare(`SELECT COUNT(*) AS cnt FROM ${options.table} WHERE height=-9999`);
    const total_rows = QCount.get().cnt;
    const npages = Math.floor(total_rows / page_size) + 1;
    console.info(`Total rows to calculate = ${total_rows}`);
    console.info(`Total pages to process = ${npages}`);

    const Qpage = db.prepare(`SELECT geohash, longitude, latitude, height FROM ${options.table} WHERE height=-9999 LIMIT ?`);
    const updQ = db.prepare(`UPDATE ${options.table} SET height=@height WHERE geohash=@geohash`);
    const updateDb = db.transaction((points) => {
        let n = 0;
        for (const pt of points) {
            updQ.run(pt);
            n += 1;
            //console.info(`[${pt.longitude}, ${pt.latitude}, ${pt.height}]`);
        };
        console.info(`Updated ${n} points`);
    });
    let moreWork = true;
    let batch = 0;
    while (moreWork) {
        const total_rows = QCount.get().cnt;        
        console.info(`Points remaining: ${total_rows}`);
        if (total_rows > 0) {
            const source = [];
            batch = batch + 1;
            console.info(`Page ${batch} loading...`);
            for (const row of Qpage.iterate(page_size)) {
                source.push(
                    {
                        "geohash": row.geohash,
                        longitude: row.longitude,
                        latitude: row.latitude,
                        height: row.height,
                    }
                );
            }
            try {
                console.info(`Page ${batch} computing...`);
                const results = await elevate.elevatePoints(source, options)
                console.info(`Page ${batch} saving...`);
                updateDb(results);
                console.info(`Page ${batch} complete.`);
            } catch(e) {
                console.error(e);
            };            
        } else {
            moreWork = false;
        }
    }
    db.close();
    console.info("Done.");    
}

let options = cli.parse({
    source: ['f', 'SQLite File', 'file'],
    token: ['k', 'Cesium Ion access token (CESIUM_ION_TOKEN)', 'string'],
    table: ['t', 'Name of table with geohash, longitude, latitude, and height fields (heights)', 'string'],
    missing: ['m', 'Missing value for elevations (-9999)', 'float'],
});

options.token = options.token ? options.token : process.env.CESIUM_ION_TOKEN;
options.missing = options.missing ? options.missing : -9999;
options.table = options.table ? options.table : 'heights';

if (options.source) {
    console.debug(`source: ${options.source}`);
    Promise.resolve(updateAllRecords(options));
} else {
    cli.getUsage();
}