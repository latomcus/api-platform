/*
https://github.com/latomcus/api-platform
App entry point
*/

"use strict"
const cluster = require('cluster')

if (cluster.isMaster) {
    console.log(`+ Master ${process.pid} is running`)
    require('./master')
} else {
    require('./worker')
}