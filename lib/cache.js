/*
https://github.com/latomcus/api-platform

Handles in memory caching.
Max number of objects in cache is determined by value in config.cache.max_size.

*/

"use strict"
const config = require('../config') //importing configuration settings
const cluster = require('cluster')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.disable('x-powered-by')
app.use(bodyParser.json({limit: '5mb' }))

const url = require('url')
const cache_url = url.parse(config.cache.url)

var account_sid = function (req, res, next) {
    var sid = req.header('api-account-sid')
    if (sid != config.account_sid){
        var err = { code: 'c.0.01', message: 'Valid api-account-sid header is required'}
        //console.log(err)
        return res.json(err)
    }
    //res.setHeader('api-account-sid', config.account_sid)
    next()
}
app.use(account_sid)

app.listen(cache_url.port, () => {
   console.log(`+ Cache is listening ${config.cache.url}`)
})

process.on('uncaughtException', function(err) {
    console.log(`- Error: cache:uncaughtException - ${err}`)
})

var cache_array = [] //main cache array

app.get('/functions/reload', (req, res) =>{
    cluster.process.send({ action: 'reload functions' })
    res.json({ code: '', message: 'reload'})
})

app.get('/ping', (req, res) =>{
    res.json({ code: '', message: 'PONG'})
})

app.get('/count', (req, res) =>{
    res.json( { count: cache_array.length } )
})

app.post('/find', (req, res)=>{
    var api_account_sid = req.header('api-account-sid')
    var data_in = req.body //read request body for posted data
    var resD = find(api_account_sid, data_in)
    if (!resD) {
        resD = {code: ''}
    }
    res.json(resD)
})

app.post('/add', (req, res)=>{
    var a = req.body
    //console.dir('/add', a)
    add(a.data_in, a.data_out, a.key_type, a.expiration, a.minutes)
    res.json({ code: ''})
})

app.post('/remove', (req, res)=>{
    var a = req.body
    remove(a.key_type, a.key_value)
    res.json({ code: ''})
})

//add object to cache
var add = function(data_in, data_out, key_type, expiration, minutes){
    //console.log('cache.add')

    if (cache_array.length < config.cache.max_size){ //check cache overall size
        //console.log(`cache.add.find`)
        //console.log(data_in)
        var found_data_out = find(data_in)
        //console.log('cache', cache_array.length, key_type)

        if (found_data_out) return //object found, no need to add it to cache
        //data_out.cached = 'true' //flag object that it's cached

        //validate and populate expiration type
        var exp = config.cache.default_expiration
        if (expiration){
            exp = (expiration === 'sliding') ? 'sliding' : 'absolute'
        }

        //validate and set duration
        var mins = config.cache.default_duration
        if (minutes){
            mins = minutes
        }

        var key_value = ''
        switch (key_type) {
            case 'action':
                key_value = data_in.action
                break
        }
                
        cache_array.push({
            data_in: data_in,
            data_out: data_out,
            key_type: key_type, //Options: 'action', or 'token,action', or 'token,action,params', or 'action,params'
            key_value: key_value, //stores data based on key_type
            expiration: exp, //expiration type: "absolute" or "sliding"
            created: new Date(), //date and time when cache object is created
            minutes: mins, //how long object should be kept
        })
        //console.log(`cache.add.length ${cache_array.length}`)
    }
}

var remove_expired = function(){
    cache_array = cache_array.filter((item) => new Date(item.created.getTime() + item.minutes * 60000) > new Date() )
}

var remove = function(key_type, key_value){
    //console.log('cache.remove', cache_array.length)

    if (key_type === 'action'){
        cache_array = cache_array.filter((item) => item.data_in.action !== key_value)
    }
        
    if (key_type === 'token,action'){
        cache_array = cache_array.filter((item) =>
            item.data_in.token + item.data_in.action !== key_value)
    }
    
    if (key_type === 'token,action,params'){
        cache_array = cache_array.filter((item) =>
            item.data_in.token + item.data_in.action + JSON.stringify(item.data_in.params) !== key_value)
    }
    
    if (key_type === 'action,params'){
        cache_array = cache_array.filter((item) =>
            item.data_in.action + JSON.stringify(item.data_in.params) !== key_value)
    }
}

var find = function(api_account_sid, data_in){
    //console.log('cache.find')
    var now = new Date()

    if (now.getMilliseconds() % 50 === 0) /*
        No need to run it every time
        Clear expired objects leasurely, 1000/50 or 20 in 1000 chance. Lower the value of 50 to 30, or 20 for more agressive clean up */
        remove_expired() //clear expired objects

    for (var i = 0; i < cache_array.length; i++){
        var c = cache_array[i]

        var expires = new Date(c.created)
        expires = new Date(expires.getTime() + (c.minutes * 60 * 1000))
        //console.log('find 1', expires, now, c.created)

        if (expires > now){
            if (c.key_type === 'action') {
                if (c.key_value === data_in.action) {
                    return update_expiration(c)
                }
            }

            if (c.key_type === 'token,action') {
                if (c.key_value === data_in.action &&
                    c.key_value === data_in.token + data_in.action) {
                    return update_expiration(c)
                }
            }

            if (c.key_type === 'token,action,params') {
                if (c.key_value === data_in.action &&
                    c.key_value === data_in.token + data_in.action + JSON.stringify(data_in.params)) {
                    return update_expiration(c)
                }
            }

            if (c.key_type === 'action,params') {
                if (c.key_value === data_in.action &&
                    c.key_value === data_in.action + JSON.stringify(data_in.params)) {
                    return update_expiration(c)
                }
            }
        }
    }
    return null
}

var update_expiration = function(cache_item){
    if (cache_item.expiration === 'sliding'){
        cache_item.created = new Date() //reset created date to keep it in memory, i.e. sliding expiration
    }
    return cache_item.data_out
}