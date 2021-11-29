# elevate - compute Cesium terrain height for locations

Given an sqlite database containing a table with columns
`id, longitude, latitude, height` compute height for all
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
    id INTEGER PRIMARY KEY, 
    longitude REAL, 
    latitude REAL, 
    height REAL
);
```

`id` can be a VARCHAR or any other type as long as values are unique.

## Operation

```
$ node elevate.js

Usage:
  elevate.js [OPTIONS] [ARGS]

Options:
  -f, --source FILE      SQLite File
  -k, --token STRING     Cesium Ion access token
  -t, --table STRING     Name of table with id, longitude, latitude, and
                         height fields (points)
  -m, --missing NUMBER   Missing value for elevations (-9999)
  -h, --help             Display help and usage details
```

