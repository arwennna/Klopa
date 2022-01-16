var pg = require('pg');

var config = {
    user: 'xyehoygy',
    database: 'xyehoygy',
    password: 'GD6Pj-0UammOKUTrHO2ZnC8BZFSy3YoG',
    host:   'rogue.db.elephantsql.com',
    port: 5432,
    max: 1000,
    idleTimeoutMillis: 30000
};

var pool = new pg.Pool(config);

module.exports = pool;
