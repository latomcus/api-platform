"use strict"
const config = require('../../config')
const cluster = require('cluster')

module.exports = {

    'on_start': function (message){
        console.log(`+ ${cluster.worker.id} worker [${cluster.worker.process.pid}] received [on_start] event in [${message.module}] module`)
    },

    'list apis': function (data_in, callback){
        var fns = data_in.functions
        var list = []
        for(var i = 0; i < fns.length; i++){
            var f = fns[i].object
            var keys = Object.keys(f)
            for(var j = 0; j < keys.length; j++){
                var name = keys[j]
                if (name.startsWith('about-->')) {
                    list.push(f[name]())
                }
            }
        }
        var data = {
            code: 'f.s.0',
            message: 'List of APIs',
            data: list
            /*
            ,actions: [ //instruct to cache output for 60 minutes
                {
                    action: 'add to cache',
                    key_type: 'action', //match by action only
                    expiration: 'obsolute',
                    minutes: 10
                },
            ]
            */
        }
        callback(data)
    },

    'about-->list apis': function (){ // documentation
        return {
            title: 'list apis',
            description: 'List of all APIs.',
            data_in: {
                'action': 'list apis'
            }
        }
    },

    'ping': function (data_in, callback){
        var data = {
            code: 'f.s.1',
            message: 'PONG'
        }
        callback(data)
    },

    'about-->ping': function (){ // documentation
        return {
            title: 'ping',
            description: 'Test function ping-pong.',
            data_in: {
                'action': 'ping'
            }
        }
    },

    'hello world': function (data_in, callback){
        callback({
            code: 'f.s.2',
            message: 'Hi there',
            data: {
                token: data_in.token,
                payload: data_in.payload
            }
        })
    },

    'about-->hello world': function (){ // documentation
        return {
            title: 'hello world',
            description: 'Sample execution of a function.',
            data_in: {
                action: 'hello world',
                payload: {
                    'some-data-in': 'very important data',
                    'big-secret': '42'
                }
            }
        }
    },

}