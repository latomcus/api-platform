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

const sql = require('mssql') //mssql library
const pgPool = require('pg').Pool //postgres library
const mysql = require('mysql')

var pg_pool = new pgPool()
if (config.data_source === 'postgres') {
    pg_pool = new pgPool(config.postgres)
}
var mysql_pool = {}
if (config.data_source === 'mysql') {
    mysql_pool = mysql.createPool(config.mysql)
}

app.listen(config.port, () => {
    //todo: validate database config
    console.log(`- Server started: http://localhost:${config.port}`)
    console.log(`- Database source: ${config.data_source}`)
})

app.post('/', (req, res) =>{
    var data_in = req.body //read request body for posted data

    if (!data_in.action) { //at least action must exist
        res.json({code: 's.a.0', message: 'Missing action'})
        return
    }

    //if security token is not supplied with JSON, try to read cookie and append to data_in object
    if (!data_in.token) {
        var token = req.cookies['token']
        if (token) {
            data_in.token = token
        }
    }

    //find if data is cached
    var data_out = cache.find(data_in) //todo: add redis for cache
    if (data_out) {
        //console.log('app.cache found')
        delete data_out.actions
        res.json(data_out)
        return
    }

    //handle actions if found in functions.js
    var fn = functions[data_in.action]
    if (typeof fn === 'function'){
        data_out = fn(data_in.token, data_in.params)
        actions.process(data_in, data_out, res)
        delete data_out.actions
        res.json(data_out)
        return
    }

    //if actions are not cached or handled in functions.js, call database
    call_db(data_in)
        .then(data_out => {
            actions.process(data_in, data_out, res)
            delete data_out.actions
            res.json (data_out)
            return
        })
})

async function call_db(data_in) {
    if (config.data_source === 'postgres'){
        return new Promise((resolve, reject) => {
            pg_pool.query('select response from service.process()')
            .then(result => {
                resolve(result.rows[0].response);
                pg_pool.close()
            })
            .catch(err =>{
                reject(err)
            })
        })
    }

    if (config.data_source === 'mssql'){
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config.mssql).connect().then(pool => {
                return pool.request()
                    .input('token', sql.VarChar(60), data_in.token)
                    .input('action', sql.VarChar(200), data_in.action)
                    .input('params', sql.NVarChar(sql.MAX), JSON.stringify(data_in.params))
                    .execute('service.process')
            }).then(result => {
                resolve(result.recordset[0])
                sql.close()
            }).catch(err => {
                reject(err)
                sql.close()
            });
        });
    }

    if (config.data_source === 'mysql'){
        return new Promise((resolve, reject) => {
            mysql_pool.query("call process(?,?,?)",
                [data_in.token, data_in.action, JSON.stringify(data_in.params)],
                function(err, result, fields) {
                    if (err){
                        console.log(err)
                        reject(err)
                    }
                    else {
                        resolve(JSON.parse(result[0][0].result))
                    }
                }
            )
        })
    }
}