"use strict"
const config = require('../../config')

module.exports = {

    'on_start': function (message){
        console.log(`+ ${message.payload.id} worker [${message.payload.pid}] received [on_start] event in [${message.module}] module`)
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

    'sms.send.test': function (data_in, callback){
        //your business logic here...

        callback( {
            code: 'f.s.3',
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

    'about-->sms.send.test': function (){ // documentation
        return {
            title: 'sms.send.test',
            description: 'Test sending sms.',
            data_in: {
                token: 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
                action: 'sms.send.test',
                payload: {
                    to: '+11234567890',
                    body: 'Test sms'
                }
            }
        }
    },

    'send email': function (data_in, callback){
        if (config.email.enabled){
            return callback( {
                code: 'f.s.5',
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
                code: 'f.s.6',
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

    /*
    'email.send.test': function (data_in, callback){
        //your business logic here...

        callback( {
            code: 'f.s.6',
            message: 'test send email',
            data: {
                token: data_in.token,
                payload: data_in.payload
            },
            actions: [
                {
                    action: 'send email',
                    from: 'latomcus@yahoo.com',
                    to: 'latomcus@yahoo.com',
                    subject: 'API test email',
                    body: '<b>Test Email</b>'
                },
            ]
        })
    },

    'about-->email.send.test': function (){ // documentation
        return {
            title: 'email.send.test',
            description: 'Test sending email.',
            data_in: {
                token: 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
                action: 'email.send.test'
            }
        }
    },
    */

   'upload files': function (data_in, callback){
       //your business logic here...
       //files are stored in /upload folder. data_in contains list of files uploaded and details

        callback({
            code: 'f.s.7',
            message: 'Uploaded files have been processed'
        })
    },

    'about-->upload files': function (){ // documentation
        return {
            title: 'upload files',
            description: 'Sample execution for uploaded files.',
            data_in: {
                action: 'upload files',
                payload: [
                    {
                        fieldname: 'file',
                        originalname: '1.jpg',
                        encoding: '7bit',
                        mimetype: 'image/jpeg',
                        filename: 'IIYQNlyr62UxZp1ukxAFQIZD31Fdksta'
                    }
                ]
            }
        }
    },


}