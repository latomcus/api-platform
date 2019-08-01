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
const cache = require('./cache') //to read status of the cache array

module.exports = {

    //"hello world" function :)
    'hello world': function (token, params){
        return {code: 'f.a.01', message: 'Hi there', data:
            {token: token, params: params}
        }
    },

    //returns count of items in cache array and list of objects
    'cache.status': function (){
        //build output object
        var out = {
            code: 'f.a.02',
            message: 'Cache status',
            data: {
                count: cache.count(),
                items: []
            }
        }
        //console.log('function.cache.status', cache.count())
        var items = cache.items()
        for (var i = 0; i < items.length; i++){
            //console.log('function.cache.status.add item')
            out.data.items.push({
                key_type: items[i].key_type,
                key_value: items[i].key_value,
                expiration: items[i].expiration,
                created: items[i].created,
                minutes: items[i].minutes,
            })
        }
        return out
    },

    //test caching by adding new item with
    'cache.add.test1': function (token, params){

        return {code: 'f.t.03', message: 'Cache added, by action name',
            data: {token: token, params: params},
            actions: [ //instruct to cache output for 60 minutes
                {
                    action: 'add to cache',
                    key_type: 'action', //match by action only
                    key_value: 'cache.add.test1', //if type is 'action' then value is 'action' text
                    expiration: 'obsolute',
                    minutes: 1
                },
            ]
        }
    },

    //test caching by adding new item with
    'cache.add.test2': function (token, params){

        return {code: 'f.t.04', message: 'Cache added, by action name',
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
        }
    },

    //test caching by removing the item
    'cache.remove.test1': function (token, params){

        return {code: 'f.a.05', message: 'test cache remove by name',
            data: {token: token, params: params},
            actions: [{
                action: 'remove from cache',
                key_type: 'action',
                key_value: 'cache.add.test1'
            }]
        }
    },

    //test caching by removing the item
    'cache.remove.test2': function (token, params){

        return {code: 'f.a.06', message: 'test cache remove by name',
            data: {token: token, params: params},
            actions: [
                {action: 'remove from cache', key_type: 'action', key_value: 'cache.add.test2'},
            ]
        }
    },

    //test send email
    'email.send.test1': function (token, params){

        return {code: 'f.a.07', message: 'test send email',
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
        }
    }, 

    //add more functions as needed below

}
