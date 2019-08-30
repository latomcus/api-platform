/*
https://github.com/latomcus/api-platform
Worker
*/

"use strict"
const express = require('express')
const cors = require('cors')
const app = express()
var cookieParser = require('cookie-parser')
const responseTime = require('response-time')
const axios = require('axios')
const cluster = require('cluster')

const config = require('../config')
const db = require('./db')
db.init()
const actions = require('./actions')
const functions = require('./functions')

var bodyParser = require('body-parser')
app.disable('x-powered-by')
app.use(responseTime())
app.use(cors())
app.use(bodyParser.json({limit: '1mb' }))
app.use(bodyParser.urlencoded({ parameterLimit: 10000, limit: '1mb', extended: true }))
app.use(cookieParser())

app.use('/', express.static('public')) //set up static files folder
app.options('*', require('cors')({
    allowedHeaders: ['Set-Cookie, X-Auth-Token, Origin, X-Requested-With, Content-Type, Accept']
}));

app.listen(config.port, () => {
    //console.log(`- DB source: ${config.data_source} Server running: http://localhost:${config.port}`)
})

process.on('uncaughtException', function(err) {
    console.log(`- Error: ${cluster.worker.id} worker:uncaughtException - ${err.code}`)
})

//handle all json POST data
app.post('/', (req, res) =>{
    var data_in = req.body //read request body for posted data

    if (!data_in.action) { //at least action must exist
        return out(res, {code: 's.a.0', message: 'Missing action'})
    }

    //if security token is not supplied with JSON, try to read cookie and append to data_in object
    if (!data_in.token) {
        var token = req.cookies['token']
        if (token) {
            data_in.token = token
        }
    }

    //find if data is cached
    axios.post(config.cache.url + '/find', data_in)
        .then(function(response){
            var data_out = response.data
            if (data_out.code === '') {
                //data not found in cache, proceed with Functions, then Database
                return handleRequest(res, data_in)
            }
            return out(res, data_out)
        })
        .catch(function(error){
            console.log('Error in worker', error)
            out(res, { code: 'w.0.01', message: 'Cache system error', error: error })
        })
})

function handleRequest(res, data_in){
    //handle actions if found in functions.js
    var fn = functions[data_in.action]
    if (typeof fn === 'function'){
        fn(data_in.token, data_in.params, function(data_out){
            actions.process(data_in, data_out, res) //process actions, if nay
            out(res, data_out) //send output
        })
        return //function found, terminate flow
    }

    //if actions are not cached or handled in functions.js, call database
    db.execute(data_in)
        .then(data_out => {
            actions.process(data_in, data_out, res) //process actions, if any
            out(res, data_out) //send output
    })
}

//remove post-processing actions, send json back to client
function out(res, data_out){
    delete data_out.actions
    res.json (data_out)
}

process.on('message', message => {
    if (message.action === 'connect to cache'){
        axios.get(config.cache.url + '/ping') //ping cache server, report response
        .then(function(response){
            var r = response.data
            console.log(`+ ${message.params.id} worker [${message.params.pid}] connected to cache. Cache response: ${r.message}`)
        })
        .catch(function(error){
            console.log(`- Error: ${message.params.id} worker [${message.params.pid}] ping to cache ${error}`)
        })
    }

    // add different message handlers as needed

})