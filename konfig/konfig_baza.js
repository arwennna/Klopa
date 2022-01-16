var pg = require('pg');

var config = {
    user: 'xxxxxxxx',
    database: 'xxxxxxxx',
    password: 'xxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxx',
    host:   'xxxxx.db.elephantsql.com',
    port: 5432,
    max: 1000,
    idleTimeoutMillis: 30000
};

var pool = new pg.Pool(config);

module.exports = pool;
