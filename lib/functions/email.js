"use strict"
const config = require('../../config')
const cluster = require('cluster')

module.exports = {

    'on_start': function (message){
        console.log(`+ ${cluster.worker.id} worker [${cluster.worker.process.pid}] received [on_start] event in [${message.module}] module`)
    },

    'send email': function (data_in, callback){
        if (config.email.enabled){
            return callback( {
                code: 'f.e.1',
                message: 'Email sent',
                actions: [
                    {
                        action: 'send email',
                        from: data_in.payload.from,
                        to: data_in.payload.to,
                        subject: data_in.payload.subject,
                        body: data_in.payload.body
                    },
                ]
            })
        }
        else {
            return callback( {
                code: 'f.e.2',
                message: 'Send email feature is not enabled'
            } )
        }
    },

    'about-->send email': function (){ // documentation
        return {
            title: 'send email',
            description: 'Sends email',
            data_in: {
                token: '[secret token]',
                action: 'send email',
                payload: {
                    "from": "latomcus@gmail.com",
                    "to": "latomcus@gmail.com",
                    "subject": "Subject text",
                    "body": "Body html text."
                }
            }
        }
    },

}