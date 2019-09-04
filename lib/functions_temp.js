/*
https://github.com/latomcus/api-platform

Specifies functions
Allows to quickly prototype new functions, dynamically add new functionality

Sample:
'[action name]': function (token, params){
    //add your own logic

    //return final output as JSON object. 'data' and 'actions' are optional
    return {
        code: [some code],
        message: 'Hello World',
        data: {
            token: [some token],
            params: [more data]
        },
        actions: []
    }
}

Todo: reload module on file change
*/
"use strict"
//const cache = require('./cache') //to read status of the cache array
const config = require('../config')
const axios = require('axios')

module.exports = {

    //"hello world" function :)
    'hello world': function (token, params, cb){
        cb({code: 'f.a.01', message: 'Hi there', data:
            {token: token, params: params}
        })
    },

    //returns count of items in cache array and list of objects
    'cache.status': function (token, params, cb){
        //build output object
        var out = {
            code: 'f.a.02',
            message: 'Cache status',
            data: {
                count: 0
            }
        }

        axios.get(config.cache.url + '/count')
        .then(function(response){
            var r = response.data
            out.data.count = r.count
            cb(out)
        })
        .catch(function(error){
            cb({ code: 'f.0.02', message: 'Error', error: error})
        })
    },

    //test caching by adding new item with
    'cache.add.test1': function (token, params, cb){
        //your business logic here...

        cb( {code: 'f.t.03', message: 'Cache added, by action name',
            data: {token: token, params: params},
            actions: [ //instruct to cache output for 60 minutes
                {
                    action: 'add to cache',
                    key_type: 'action', //match by action only
                    expiration: 'obsolute',
                    minutes: 10
                },
            ]
        })
    },

    //test caching by adding new item with
    'cache.add.test2': function (token, params, cb){
        //your business logic here...

        cb( {code: 'f.t.04', message: 'Cache added, by action name',
            data: {token: token, params: params},
            actions: [ //instruct to cache output for 60 minutes
                {
                    action: 'add to cache',
                    key_type: 'action', //match by action only
                    key_value: 'cache.add.test2', //if type is 'action' then value is 'action' text
                    expiration: 'sliding',
                    minutes: 1
                },
            ]
        })
    },

    //test caching by removing the item
    'cache.remove.test1': function (token, params, cb){
        //your business logic here...

        cb ( {code: 'f.a.05', message: 'test cache remove by name',
            data: {token: token, params: params},
            actions: [{
                action: 'remove from cache',
                key_type: 'action',
                key_value: 'cache.add.test1'
            }]
        })
    },

    //test caching by removing the item
    'cache.remove.test2': function (token, params, cb){
        //your business logic here...

        cb( {code: 'f.a.06', message: 'test cache remove by name',
            data: {token: token, params: params},
            actions: [
                {action: 'remove from cache', key_type: 'action', key_value: 'cache.add.test2'},
            ]
        })
    },

    //test send email
    'email.send.test1': function (token, params, cb){
        //your business logic here...

        cb( {code: 'f.a.07', message: 'test send email',
            data: {token: token, params: params},
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

     //test send sms
     'sms.send.test1': function (token, params, cb){
        //your business logic here...

        cb ( {code: 'f.a.08', message: 'test send sms',
            data: {token: token, params: params},
            actions: [
                {
                    action: 'send sms',
                    to: params.to,
                    body: params.body
                },
            ]
        })
    },  

    //add more functions as needed below

}
