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
var functions = requireReload('./functions')

var bodyParser = require('body-parser')
app.disable('x-powered-by')
app.use(responseTime({digits: 1, header: 'api-response-time' }))
app.use(cors())
app.use(bodyParser.json({limit: '1mb' }))
app.use(bodyParser.urlencoded({ parameterLimit: 10000, limit: '1mb', extended: true }))
app.use(cookieParser())

app.use('/', express.static('public')) //set up static files folder
app.options('*', require('cors')({
    allowedHeaders: ['Set-Cookie, X-Auth-Token, Origin, X-Requested-With, Content-Type, Accept']
}));

var account_sid = function (req, res, next) {
    var sid = req.header('api-account-sid')
    if (sid != config.account_sid){
        return out(res, { code: 'w.0.01', message: 'Valid api-account-sid header is required'})
    }
    //res.setHeader('api-account-sid', config.account_sid)
    //res.setHeader('api-worker-pid', cluster.worker.process.pid)
    next()
}
app.use(account_sid)

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
        return out(res, {code: 'w.0.02', message: 'Missing action'})
    }

    //if security token is not supplied with JSON, try to read cookie and append to data_in object
    if (!data_in.token) {
        var token = req.cookies['token']
        if (token) {
            data_in.token = token
        }
    }

    //find if data is cached
    axios.post(config.cache.url + '/find', data_in, {headers: {
            'api-account-sid': req.header('api-account-sid')
        }})
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
            out(res, { code: 'w.0.03', message: 'Cache system error', error: error })
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
    //data_out.worker = cluster.worker.process.pid
    //console.log(cluster.worker.process.pid)
    res.json (data_out)
}

process.on('message', message => {
    if (message.action === 'connect to cache'){
        axios.get(config.cache.url + '/ping', { headers: {
            'api-account-sid': config.account_sid
        }}) //ping cache server, report response
        .then(function(response){
            var r = response.data
            if (r.message === 'PONG'){
                console.log(`+ ${message.params.id} worker [${message.params.pid}] connected to cache. Cache response: ${r.message}`)
            }
            else{
                console.log(`- Error: ${message.params.id} worker [${message.params.pid}] connected to cache. Cache error response: ${r.message}`)
            }
        })
        .catch(function(error){
            console.log(`- Error: ${message.params.id} worker [${message.params.pid}] ping to cache ${error}`)
        })
    }

    if (message.action === 'reload functions'){
        functions = requireReload('./functions')
        console.log(`+ ${cluster.worker.id} worker [${cluster.worker.process.pid}] functions reload. ${Object.keys(require.cache).length}`)
    }

    // add different message handlers as needed
})

function requireReload(module){
    //rename to _temp
    //require _temp
    //if ok, unload _temp
    //rename to _run
    //load _run
    //return require('./functions')
    delete require.cache[require.resolve(module)]
    return require(module)
}

app.get('/functions/reload', (req, res) =>{
    var r = { action: 'reload functions' }
    //r.worker = cluster.worker.process.pid
    process.send(r)
    res.json(r)
})

