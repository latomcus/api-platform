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
        cb(null, 'upload')
    },
    filename: function (req, file, cb) {
        //file.fieldname + '-' + Date.now()
        cb(null, randomstring.generate())
    }
  })
  
var upload = multer({ storage: storage, limits: 10 * 1024 * 1024 }) //limit: 10MB

app.listen(config.port, () => {
    //console.log(`- DB source: ${config.data_source} Server running: http://localhost:${config.port}`)
})

process.on('uncaughtException', function(err) {
    console.log(`- Error: ${cluster.worker.id} worker:uncaughtException - ${err.code}`)
})

app.get('/ping', (req, res) =>{
    return out(res, {code: 'w.0.01', message: 'PONG'})
})

//handle all POSTs
app.post('/:token?', upload.any(), (req, res) =>{
//app.post('/:token?',  (req, res) =>{

    if (req.headers['content-type'].startsWith('multipart/form-data')){
        var token = req.body.token
        if (!token){ //no token, no files stored
             for (var i = 0; i < req.files.length; i++){
                fs.unlink('./upload/' + req.files[i].filename, (err) => {
                    //if (err) throw err
                })
            }
            return out(res, {code: 'w.0.02', message: 'Missing token'})
        }

        if (req.files.length === 0){
            return out(res, { code: 'w.0.03', message: 'No uploaded files'})
        }

        //validate token and save images metadata to database
        var d = { action: 'Save images metadata', token: token, params: { files: req.files } }
        //todo: send to db

        //compose reply
        var r = {code: 'w.0.04', message: 'Uploaded', data: { files: []} }

        for (var i = 0; i < req.files.length; i++){
            r.data.files.push({
                fieldname: req.files[i].fieldname,
                originalname: req.files[i].originalname,
                //encoding: req.files[i].encoding,
                //mimetype: req.files[i].mimetype,
                filename: req.files[i].filename
            })
        }
        return out(res, r)
    }

    var data_in = req.body //read request body for posted data
   
    if (!data_in.action) { //at least action must exist
        return out(res, {code: 'w.0.05', message: 'Missing action'})
    }

    //if security token is not supplied with JSON, try to read cookie and append to data_in object
    if (!data_in.token) {
        var token = req.cookies['token']
        if (token) {
            data_in.token = token
        }
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
                out(res, { code: 'w.0.06', message: 'Cache system error', error: error })
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
        return out(res, {code: 'w.0.07', message: 'Unknown action'})
    }

    //if actions are not cached or handled in functions, call database
    db.execute(data_in)
        .then(data_out => {
            actions.process(data_in, data_out, res) //process actions, if any
            out(res, data_out) //send output
    })
}

//remove post-processing actions, send json back to client
function out(res, data_out){
    calls_counter++
    delete data_out.actions
    res.json (data_out)
}

function isPermitted(token, action){
    for (var i = 0; i < config.security.length; i++){
        if (config.security[i].token === token) {
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
        if (message.params.id === 0) { //fire up on_start event for first process only
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


