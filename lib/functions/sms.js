"use strict"
const config = require('../../config')
const cluster = require('cluster')

module.exports = {

    'on_start': function (message){
        console.log(`+ ${cluster.worker.id} worker [${cluster.worker.process.pid}] received [on_start] event in [${message.module}] module`)
    },

    'send sms': function (data_in, callback){
        //your business logic here...

        callback( {
            code: 'f.sm.3',
            message: 'test send sms',
            data: {
                token: data_in.token,
                payload: data_in.payload
            },
            actions: [
                {
                    action: 'send sms',
                    to: data_in.payload.to,
                    body: data_in.payload.body
                },
            ]
        })
    },

    'about-->send sms': function (){ // documentation
        return {
            title: 'send sms',
            description: 'Test sending sms.',
            data_in: {
                token: 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
                action: 'send sms',
                payload: {
                    to: '+11234567890',
                    body: 'Test sms'
                }
            }
        }
    },

}