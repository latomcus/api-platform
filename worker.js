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

const config = require('./config')
const db = require('./lib/db')
db.init()
const actions = require('./lib/actions')
const functions = require('./lib/functions')

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
const cacheURL = 'http://localhost:' + config.cache.port

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
    axios.post(cacheURL + '/find', data_in)
        .then(function(response){
            var data_out = response.data
            if (data_out.code === '') {
                return handleRequest(res, data_in)
            }
            return out(res, data_out)
        })
        .catch(function(error){
            console.log(error)
            out(res, { code: 'w.0.01', message: 'Cache system error', error: error })
        })
})

function handleRequest(res, data_in){
    //handle actions if found in functions.js
    var fn = functions[data_in.action]
    if (typeof fn === 'function'){
        fn(data_in.token, data_in.params, function(data_out){
            actions.process(data_in, data_out, res)
            out(res, data_out)
        })
        return //function found, terminate flow
    }

    //if actions are not cached or handled in functions.js, call database
    db.execute(data_in)
        .then(data_out => {
            actions.process(data_in, data_out, res)
            out(res, data_out)
    })
}

//remove post-processing actions, send json back to client
function out(res, data_out){
    delete data_out.actions
    res.json (data_out)
}
