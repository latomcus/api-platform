/*
https://github.com/latomcus/api-platform

Contains settings for port, database, etc
*/

"use strict";
module.exports = {

    port: 3000,

    data_source: "mssql", //Options: "mssql" or "postgres" or "mysql"

    cache: {
        max_size: 10000, //max number of object to keep in cache (memory)
        default_expiration: "absolute", //Options: "absolute" or "sliding"
        default_duration: 60, //in minutes
    },

    email: {
        //for other email server configuratins, please adopt code as per specificaitons in https://community.nodemailer.com/
        service: 'Gmail',
        user: 'your-email@gmail.com',
        password: 'app-secret-key', //to setup, see https://support.google.com/mail/answer/185833?hl=en
    },

    mssql: {
        user: "api_user",
        password: "secret",
        server: "COMPUTER2\\SQLEXPRESS",
        database: "api_database",
        parseJSON: true,
    },

    postgres: {
        connectionString: 'postgres://api_user:secret@localhost:5432/api_database',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },

    mysql: {
        host: 'localhost',
        user: 'api_user',
        password: 'secret',
        database: 'api_database',
    },

}
