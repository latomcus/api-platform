/*
All code related to communications with SQL databases

*/
const config = require('../config')
const sql = require('mssql') //mssql library
const pgPool = require('pg').Pool //postgres library
const mysql = require('mysql')

var pg_pool = new pgPool()
var mysql_pool = {}

module.exports = {
    init: function(){
        if (config.data_source === 'postgres') {
            pg_pool = new pgPool(config.postgres)
        }

        if (config.data_source === 'mysql') {
            mysql_pool = mysql.createPool(config.mysql)

        }
    },

    execute: async function(data_in){
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
}