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
const {Client} = require('pg');
const Cursor = require('pg-cursor');

async function nullPointCount(db) {
    const { rows } = await db.query(`SELECT COUNT(*) AS cnt FROM POINT WHERE height is NULL`)
    const QCount = rows[0]["cnt"];
    return QCount;
}

async function nullPointRows(db, page_size) {
    const point_rows = await db.query(`SELECT h3 as h3, longitude as longitude, latitude as latitude, height as height FROM POINT WHERE height is NULL limit $1`, [page_size]);
    return point_rows.rows;
}

async function updateDb(db, points) {
    const updQ = `UPDATE POINT SET height=$1 WHERE h3=$2`;
    try {
        await db.query("BEGIN");
        let n = 0;
        for (const pt of points) {
            const res = await db.query(updQ.run, [pt["height"], pt["h3"]]);
            n += 1;
            console.info(`response is ${res}`)
            //console.info(`[${pt.longitude}, ${pt.latitude}, ${pt.height}]`);
        };
        console.info(`Updated ${n} points`);
        await db.query("COMMIT");
    } catch (e) {
        await db.query('ROLLBACK')
        throw e
    }
}

async function saveResults(batch, source, options) {
    try {
        console.info(`Page ${batch} computing...`);
        const results = await elevate.elevatePoints(source, options)
        console.info(`Page ${batch} saving...`);
        await updateDb(db, results);
        console.info(`Page ${batch} complete.`);
    } catch(e) {
        console.error(e);
    };    
}

async function updateAllRecords(options) {
    console.info(`token: ${options.token}`);

    const db = new Client(options.database);
    await db.connect();

    // 1000 seems to be about the limit
    const page_size = 1000;
    const QCount = await nullPointCount(db);

    const total_rows = QCount;
    const npages = Math.floor(total_rows / page_size) + 1;
    console.info(`Total rows to calculate = ${total_rows}`);
    console.info(`Total pages to process = ${npages}`);

    let moreWork = true;
    let batch = 0;
    while (moreWork) {
        const total_rows = await nullPointCount(db);
        console.info(`Points remaining: ${total_rows}`);
        if (total_rows > 0) {
            const source = [];
            batch = batch + 1;
            console.info(`Page ${batch} loading...`);
            const point_rows = await nullPointRows(db, page_size);
            for (const row of point_rows) {
                source.push(
                    {
                        "h3": row.h3,
                        longitude: row.longitude,
                        latitude: row.latitude,
                        height: row.height,
                    }
                );
            }
            saveResults(batch, source, options)
        } else {
            moreWork = false;
        }
    }
    db.close();
    console.info("Done.");    
}

let options = cli.parse({
    database: ['d', 'PostgreSQL connection string', 'string'],
    token: ['k', 'Cesium Ion access token (CESIUM_ION_TOKEN)', 'string'],
});

options.token = options.token ? options.token : process.env.CESIUM_ION_TOKEN;

if (options.database) {
    console.debug(`database: ${options.database}`);
    Promise.resolve(updateAllRecords(options));
} else {
    cli.getUsage();
}