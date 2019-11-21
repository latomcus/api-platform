"use strict"

module.exports = {

    'on_start': function (message){
        console.log(`+ ${message.params.id} worker [${message.params.pid}] received [on_start] event in [${message.module}] module`)
    },

    'apis.list': function (data_in, callback){
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

    'about-->apis.list': function (){ // documentation
        return {
            title: 'apis.list',
            description: 'List of all APIs.',
            data_in: {
                'action': 'apis.list'
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
                params: data_in.params
            }
        })
    },

    'about-->hello world': function (){ // documentation
        return {
            title: 'hello world',
            description: 'Sample execution of a function.',
            data_in: {
                action: 'hello world',
                params: {
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
                params: data_in.params
            },
            actions: [
                {
                    action: 'send sms',
                    to: data_in.params.to,
                    body: data_in.params.body
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
                params: {
                    to: '+11234567890',
                    body: 'Test sms'
                }
            }
        }
    },

    'email.send.test': function (data_in, callback){
        //your business logic here...

        callback( {
            code: 'f.s.4',
            message: 'test send email',
            data: {
                token: data_in.token,
                params: data_in.params
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

}



			

