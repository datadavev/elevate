const Cesium = require('cesium');

/**
 * 
 * @param points list of {longitude: dd, latitude: dd}
 * @param options 
 */
function elevatePoints(points, options) {
    if (options && options.token) {
        Cesium.Ion.defaultAccessToken = options.token;
    }
    return new Promise(function(resolve, reject) {
        let cpoints = [];
        let results = [];
        points.forEach((pt) => {
            cpoints.push(Cesium.Cartographic.fromDegrees(pt.longitude, pt.latitude));
            pt.height = 0.0;
            results.push(pt);
        })
        let tp = Cesium.createWorldTerrain();
        Cesium.sampleTerrainMostDetailed(tp, cpoints)
        .then((computed) => {
            for (let i=0; i< computed.length; i+=1) {
                results[i].height = computed[i].height;
            }    
            return resolve( results );
        });    
    });
}

module.exports = {
    elevatePoints: elevatePoints
  };
