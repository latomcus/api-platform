/*
https://github.com/latomcus/api-platform

Main application code
*/

"use strict"
const express = require('express')
var cors = require('cors')
const app = express()
var cookieParser = require('cookie-parser')

const config = require('./config')
const db = require('./lib/db')
db.init()
const actions = require('./lib/actions')
const functions = require('./lib/functions')
const cache = require('./lib/cache')

var bodyParser = require('body-parser')
app.disable('x-powered-by')
app.use(cors())
app.use(bodyParser.json({limit: '1mb' }))
app.use(bodyParser.urlencoded({ parameterLimit: 10000, limit: '1mb', extended: true }))
app.use(cookieParser())

app.use('/', express.static('public')) //set up static files folder
app.options('*', require('cors')({
    allowedHeaders: ['Set-Cookie, X-Auth-Token, Origin, X-Requested-With, Content-Type, Accept']
}));

app.listen(config.port, () => {
    console.log(`- Server started: http://localhost:${config.port}`)
    console.log(`- Database source: ${config.data_source}`)
})

//handle all json POST data
app.post('/', (req, res) =>{
    res._api_start = new Date()
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
    var data_out = cache.find(data_in)
    if (data_out) {
        return out(res, data_out)
    }

    //handle actions if found in functions.js
    var fn = functions[data_in.action]
    if (typeof fn === 'function'){
        data_out = fn(data_in.token, data_in.params)
        actions.process(data_in, data_out, res)
        return out(res, data_out)
    }

    //if actions are not cached or handled in functions.js, call database
    db.execute(data_in)
        .then(data_out => {
            actions.process(data_in, data_out, res)
            out(res, data_out)
        })
})

//calculate duration in ms, remove post-processing actions, send json back to client
function out(res, data_out){
    delete data_out.actions
    data_out.duration = new Date().getTime() - res._api_start.getTime()
    res.json (data_out)
}