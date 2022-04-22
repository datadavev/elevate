# elevate - compute Cesium terrain height for locations

Given a PostgreSQL database containing a table with columns
`h3, longitude, latitude, height` compute height for all
rows where height is NULL.

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
                      Table "public.point"
  Column   |       Type        | Collation | Nullable | Default 
-----------+-------------------+-----------+----------+---------
 h3        | character varying |           | not null | 
 longitude | double precision  |           | not null | 
 latitude  | double precision  |           | not null | 
 height    | double precision  |           |          | 
Indexes:
    "point_pkey" PRIMARY KEY, btree (h3)
    "ix_point_height" btree (height)
```

`h3` is a VARCHAR that just needs to be unique. The [h3](https://uber.github.io/h3-py/intro.html) value 
is unused other than ensuring row uniqueness.

## Operation

```
$ node elevate.js

Usage:
  elevate.js [OPTIONS] [ARGS]

Options:
  -d, --database DB      PostgreSQL connection string
  -k, --token STRING     Cesium Ion access token (CESIUM_ION_TOKEN env variable)
  -h, --help             Display help and usage details
```

