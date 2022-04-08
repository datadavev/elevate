# elevate - compute Cesium terrain height for locations

Given an sqlite database containing a table with columns
`geohas, longitude, latitude, height` compute height for all
rows where height = some missing value (defaults to -9999).

Note - the limits to computation are unknown, but it appears something in the order of
50k requests can be made before needing to wait for a while. This is a fairly slow 
process for large numbers of points.

## Installation

```
git clone https://github.com/datadavev/elevate.git
cd elevate
npm install
```

Minimal database schema:
```
CREATE TABLE points (
    geohash VARCHAR PRIMARY KEY, 
    longitude REAL, 
    latitude REAL, 
    height REAL
);
```

`geohash` is a VARCHAR that just needs to be unique. The [geohash](https://en.wikipedia.org/wiki/Geohash) value 
is unused other than ensuring row uniqueness.

## Operation

```
$ node elevate.js

Usage:
  elevate.js [OPTIONS] [ARGS]

Options:
  -f, --source FILE      SQLite File
  -k, --token STRING     Cesium Ion access token (CESIUM_ION_TOKEN env variable)
  -t, --table STRING     Name of table with geohash, longitude, latitude, and
                         height fields (points)
  -m, --missing NUMBER   Missing value for elevations (-9999)
  -h, --help             Display help and usage details
```

