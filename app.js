/*
https://github.com/latomcus/api-platform
App entry point
*/

"use strict"
const cluster = require('cluster')

if (cluster.isMaster) {
    console.log(`+ Master process [${process.pid}] is running`)
    require('./lib/master') //create master process
} else {
    require('./lib/worker') //create worker processes
}