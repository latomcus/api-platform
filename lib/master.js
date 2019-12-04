/*
https://github.com/latomcus/api-platform
Master worker
*/

"use strict"
const cluster = require('cluster')
const config = require('../config')
var numCPUs = require('os').cpus().length

if (config.worker_count != null){
    if (config.worker_count > 0 && config.worker_count <= numCPUs){
        numCPUs = config.worker_count
    }
}

numCPUs = (numCPUs === 1) ? numCPUs : numCPUs - 1 //minimum needed is 1 master and 1 worker
console.log(`+ Master: [${numCPUs + 1}] processes running`)

//numCPUs = 1
if (config.cache.enabled){
    var cache = require('./cache') //spin out cache server listening on dedicated port
    console.log(`+ Master: cache [${process.pid}] is enabled`)
    //numCPUs-- //decrement count since cache is a separete process
}

for (let i = 0; i < numCPUs; i++) {
    var inst = cluster.fork() //create worker
    console.log(`+ Master: ${i} worker process [${inst.process.pid}] is running`)

    inst.send({ action: 'on_start', payload: { }}) //on_start event

    if (config.cache.enabled){
        inst.send({ action: 'connect to cache', payload: { id: i, pid: inst.process.pid }}) //send instruction to ping cache server
    }

    inst.on('message', function(message){
        console.log(`+ ${numCPUs} master received message [${message.action}]`)
        Object.keys(cluster.workers).forEach(function(id) {
            cluster.workers[id].send(message)
        })
    })
}

if (config.ssl.enabled){
    console.log(`+ Master: ${numCPUs} workers listening https://localhost:${config.port}`)
}
else {
    console.log(`+ Master: ${numCPUs} workers listening http://localhost:${config.port}`)
}
console.log(`+ Master: database selected [${config.data_source}]`)

cluster.on('disconnect', function(worker, code, signal) {
    var newWorker = cluster.fork() //if workr dies, create new one
    console.log(`- Worker: ${worker.process.pid} died. New: ${newWorker.process.pid}`)
})

