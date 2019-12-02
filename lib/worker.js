/*
    https://github.com/latomcus/api-platform
    Worker
*/

"use strict"
var calls_counter = 0
const express = require('express')
const cors = require('cors')
const app = express()
var cookieParser = require('cookie-parser')
const responseTime = require('response-time')
const axios = require('axios')
const cluster = require('cluster')
const multer = require('multer')
const fs = require('fs')
var randomstring = require('randomstring')

const config = require('../config')
const db = require('./db')
db.init()
const actions = require('./actions')

var glob = require('glob'), path = require('path')

//local variables
var functions = []

var load_functions = function(){
    glob.sync('./lib/functions/**/*.js').forEach(function(file) {
        var full_path = path.resolve(file)
        //console.log(full_path)
        var f = require(full_path)
        functions.push({ object: f, module: file })
    })
}
load_functions()

var bodyParser = require('body-parser')
app.disable('x-powered-by')
app.disable('etag')
//app.set('query parser', false)
app.use(responseTime({digits: 1, header: 'api-response-time' }))
app.use(cors())
app.use(bodyParser.json({limit: '1mb' }))
app.use(bodyParser.urlencoded({ parameterLimit: 10000, limit: '1mb', extended: true }))
app.use(cookieParser())

app.use('/', express.static('public')) //set up static files folder
app.options('*', require('cors')({
    allowedHeaders: ['Set-Cookie, X-Auth-Token, Origin, X-Requested-With, Content-Type, Accept']
}));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.files)
    },
    filename: function (req, file, cb) {
        const file_name = randomstring.generate().substring(0,15) + path.extname(file.originalname).toLowerCase()
        cb(null, file_name)
    }
})

var upload = multer({ storage: storage, limits: 10 * 1024 * 1024 }) //limit: 10MB

app.listen(config.port, () => {
    //console.log(`- DB source: ${config.data_source} Server running: http://localhost:${config.port}`)
})

process.on('uncaughtException', function(err) {
    console.log(`- Error: ${cluster.worker.id} worker. Err - ${err.code} - ${err.message}`)
})

app.get('/ping', (req, res) =>{
    return out(res, {code: 'w.0.01', message: 'PONG'})
})

//handle all POSTs
app.post('/:app_key?/:token?', upload.any(), (req, res) =>{
    //try to read from query
     var app_key = req.params.app_key
    var token = req.params.token

    //if not available, try to read from body
    if (!app_key){ app_key = req.body.app_key }
    if (!token){ token = req.body.token }

    //if not available, try to read from cookies
    if (!app_key){ if (req.cookies['app_key']) { app_key = req.cookies['app_key'] } }
    if (!token){ if (req.cookies['token']) { token = req.cookies['token'] } }

    //determine action
    var action = req.body.action //read request body for posted data
    //if (!action && req.files.length > 0) { action = 'Upload files'} //files are being uploaded

    //check secirity rules
    if (!isPermitted(app_key, action)){
        return out(res, {code: 'w.0.02', message: 'Not authorized'})
    }

     //at least action must exist
    if (!action) {
        return out(res, {code: 'w.0.03', message: 'Missing action'})
    }

    var data_in = {
        token: (token)? token: '',
        action: action,
        payload: (req.body.payload)? req.body.payload : {}
    }

    if (req.headers['content-type'].startsWith('multipart/form-data')){
        if (req.files.length === 0){
            return out(res, { code: 'w.0.05', message: 'No uploaded files'})
        }

        var fp = [] //array of uploaded files
        for (var i = 0; i < req.files.length; i++){
            fp.push({
                fieldname: req.files[i].fieldname,
                originalname: req.files[i].originalname,
                encoding: req.files[i].encoding,
                mimetype: req.files[i].mimetype,
                filename: req.files[i].filename
            })
        }
        data_in.payload.files = fp
    }

    if (config.cache.enabled){
        //find if data is cached
        axios.post(config.cache.url + '/find', data_in,  {'Connection':'keep-alive'})
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
                out(res, { code: 'w.0.07', message: 'Cache system error', error: error })
            })
    }
    else {
        handleRequest(res, data_in)
    }
})

function find_function(action){
    for(var i = 0; i < functions.length; i++){
        var f = functions[i].object
        var keys = Object.keys(f)
        for(var j = 0; j < keys.length; j++){
            var name = keys[j]
            if (name === action) {
                return f[name]
            }
        }
    }
    return null
}

function find_functions(action){
    var fns = []
    for(var i = 0; i < functions.length; i++){
        var f = functions[i].object
        var keys = Object.keys(f)
        for(var j = 0; j < keys.length; j++){
            var name = keys[j]
            if (name === action) {
                fns.push({ module: functions[i].module, function: f[name]})
            }
        }
    }
    return fns
}

function handleRequest(res, data_in){
    //handle actions if found in functions
    var fn = find_function(data_in.action)

    if (typeof fn === 'function'){
        data_in.functions = functions

        fn(data_in, function(data_out){
            actions.process(data_in, data_out, res) //process actions, if nay
            out(res, data_out) //send output
        })
        return //function found, terminate flow
    }

    //if data_source is none
    if (config.data_source === 'none') {
        return out(res, {code: 'w.0.08', message: 'Unknown action'})
    }

    //if actions are not cached or handled in functions, call database
    db.execute(data_in)
        .then(data_out => {
            actions.process(data_in, data_out, res) //process actions, if any
            out(res, data_out) //send database output
        }, err => {
            //todo: log err
            out(res, {code: 'w.0.09', message: 'System error occurred'})
        }).catch(err => {
            //todo: log err
            out(res, {code: 'w.0.10', message: 'System error occurred'})
        })
}

//remove post-processing actions, send json back to client
function out(res, data_out){
    calls_counter++
    delete data_out.actions
    res.json (data_out)
}

function isPermitted(app_key, action){
    for (var i = 0; i < config.security.length; i++){
        if (config.security[i].app_key === app_key) {
            for (var j = 0; j < config.security[i].permissions.length; j++){
                var p = config.security[i].permissions[j]
                if (p === action){ return true }
            }
        }
    }
    return false
}

process.on('message', message => {

    if (message.action === 'on_start'){
        if (message.payload.id === 0) { //fire up on_start event for first process only
            var fns = find_functions(message.action)
            for (var i = 0; i < fns.length; i++){
                message.module = fns[i].module
                fns[i].function(message) //call function
            }
        }
    }

    if (message.action === 'connect to cache'){
        axios.get(config.cache.url + '/ping') //ping cache server, report response
        .then(function(response){
            var r = response.data
            if (r.message === 'PONG'){
                console.log(`+ ${message.payload.id} worker [${message.payload.pid}] connected to cache. Cache response: ${r.message}`)
            }
            else{
                console.log(`- Error: ${message.payload.id} worker [${message.payload.pid}] connected to cache. Cache error response: ${r.message}`)
            }
        })
        .catch(function(error){
            console.log(`- Error: ${message.payload.id} worker [${message.payload.pid}] ping to cache ${error}`)
        })
    }

    if (message.action === 'reload functions'){
        reload_functions()
        console.log(`+ ${cluster.worker.id} worker [${cluster.worker.process.pid}] functions reload. ${Object.keys(require.cache).length}`)
    }

    if (message.action === 'statistics'){
        console.log(`+ ${cluster.worker.id} worker [${cluster.worker.process.pid}] calls count [${calls_counter}]`)
    }

    // add different message handlers as needed
})

var unload_functions = function(){
    for(var i = 0; i < functions.length; i++){
        //console.log(functions[i].module)
        delete require.cache[require.resolve(functions[i].module)]
    }
    functions = []
}

function reload_functions(){
    unload_functions()
    load_functions()
}

app.get('/functions/reload', (req, res) =>{
    var r = { action: 'reload functions' }
    process.send(r)
    res.json(r)
})

app.get('/statistics', (req, res) =>{
    var r = { action: 'statistics' }
    process.send(r)
    res.json(r)
})


