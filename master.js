/*
https://github.com/latomcus/api-platform
Master worker
*/

"use strict"
const cluster = require('cluster')
const config = require('./config')
require('./lib/tcp_cache') //spin out cache server listening on dedicated port
var numCPUs = require('os').cpus().length
numCPUs = (numCPUs < 3) ? 2 : numCPUs-1 //minimum needed is 1 master and 1 worker

for (let i = 0; i < numCPUs; i++) {
    var inst = cluster.fork()
    //console.log(`+ ${i} worker ${inst.process.pid} running`)
}

console.log(`+ ${numCPUs} workers running @ http://localhost:${config.port}`)
console.log(`+ Database: ${config.data_source}`)

cluster.on('disconnect', function(worker, code, signal) {
    var newWorker = cluster.fork()
    console.log(`- Worker: ${worker.process.pid} died. New: ${newWorker.process.pid}`)
})