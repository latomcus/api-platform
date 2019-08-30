/*
https://github.com/latomcus/api-platform
Master worker
*/

"use strict"
const cluster = require('cluster')
const config = require('../config')
var numCPUs = require('os').cpus().length

if (config.cache.auto_start){
    var cache = require('./cache') //spin out cache server listening on dedicated port
    numCPUs-- //decrement count since cache is a separete process
}
numCPUs = (numCPUs < 3) ? 2 : numCPUs-1 //minimum needed is 1 master and 1 worker

for (let i = 0; i < numCPUs; i++) {
    var inst = cluster.fork() //create workers
    console.log(`+ ${i} worker [${inst.process.pid}] is running`)
    inst.send({ action: 'connect to cache', params: { id: i, pid: inst.process.pid }}) //send instruction to ping cache server
}

console.log(`+ ${numCPUs} workers running @ http://localhost:${config.port}`)
console.log(`+ Database: ${config.data_source}`)

cluster.on('disconnect', function(worker, code, signal) {
    var newWorker = cluster.fork() //if workr dies, create new one
    console.log(`- Worker: ${worker.process.pid} died. New: ${newWorker.process.pid}`)
})
