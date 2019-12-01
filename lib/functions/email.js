"use strict"
const config = require('../../config')

module.exports = {

    'on_start': function (message){
        console.log(`+ ${message.payload.id} worker [${message.payload.pid}] received [on_start] event in [${message.module}] module`)
    },

    'send email': function (data_in, callback){
        if (config.email.enabled){
            return callback( {
                code: 'f.e.1',
                message: 'Send email',
                actions: [
                    {
                        action: 'send email',
                        from: data_in.data.from,
                        to: data_in.data.to,
                        subject: data_in.data.sudbject,
                        body: data_in.data.body
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
                data: {
                    "from": "support@company.com",
                    "to": "some_user@company.com",
                    "subject": "Account created",
                    "body": "Account created."
                }
            }
        }
    },

}