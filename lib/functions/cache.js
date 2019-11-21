"use strict"
const config = require('../../config')
const axios = require('axios')

module.exports = {

    'on_start': function (message){
        console.log(`+ ${message.params.id} worker [${message.params.pid}] received [on_start] event in [${message.module}] module`)
    },
 
    //returns count of items in cache array and list of objects
    'cache.status': function (data_in, callback){
        //build output object
        var out = {
            code: 'f.c.1', //function . cache . #
            message: 'Cache status',
            data: {
                count: 0
            }
        }

        axios.get(config.cache.url + '/count')
        .then(function(response){
            var r = response.data
            out.data.count = r.count
            callback(out)
        })
        .catch(function(error){
            callback({ code: 'f.0.02', message: 'Error', error: error})
        })
    },

    'about-->cache.status': function (){ // documentation
        return {
            title: 'cache.status',
            description: 'Returns in-memory cache status.',
            data_in: {
                action: 'cache.status'
            }
        }
    },

    //test caching by adding new item with
    'cache.add.test.1': function (data_in, callback){
        //your business logic here...

        callback( {
            code: 'f.c.2', //function . cache . #
            message: 'Cache added, by action name',
            data: {token: data_in.token, params: data_in.params},
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

    'about-->cache.add.test.1': function (){ // documentation
        return {
            title: 'cache.add.test.1',
            description: 'Test adding item to cache for 1 minute, with absolute expiration, and cache key is action name.',
            data_in: {
                token: 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
                action: 'cache.add.test.1',
                params: { 'key_value': 'cache.add.test.1'}
            }
        }
    },

    //test caching by adding new item with
    'cache.add.test.2': function (data_in, callback){
        //your business logic here...

        callback( {
            code: 'f.c.3', //function . cache . #
            message: 'Cache added, by action name',
            data: {token: data_in.token, params: data_in.params},
            actions: [ //instruct to cache output for 60 minutes
                {
                    action: 'add to cache',
                    key_type: 'action', //match by action only
                    key_value: 'cache.add.test.2', //if type is 'action' then value is 'action' text
                    expiration: 'sliding',
                    minutes: 1
                },
            ]
        })
    },

    'about-->cache.add.test.2': function (){ // documentation
        return {
            title: 'cache.add.test.2',
            description: 'Test adding item to cache for 1 minute, with sliding expiration, and cache key is action name.',
            data_in: {
                token: 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
                action: 'cache.add.test.2'
            }
        }
    },

    //test caching by removing the item
    'cache.remove.test.1': function (data_in, callback){
        //your business logic here...

        callback ( {
            code: 'f.c.4', //function . cache . #
            message: 'test cache remove by name',
            data: {token: data_in.token, params: data_in.params},
            actions: [{
                action: 'remove from cache',
                key_type: 'action',
                key_value: 'cache.add.test.1'
            }]
        })
    },

    'about-->cache.remove.test.1': function (){ // documentation
        return {
            title: 'cache.remove.test.1',
            description: 'Test removing item from cache by action name.',
            data_in: {
                token: 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
                action: 'cache.remove.test.1'
            }
        }
    },

    //test caching by removing the item
    'cache.remove.test.2': function (data_in, callback){
        //your business logic here...

        callback( {
            code: 'f.c.5', //function . cache . #
            message: 'test cache remove by name',
            data: {token: data_in.token, params: data_in.params},
            actions: [
                {
                    action: 'remove from cache',
                    key_type: 'action',
                    key_value: 'cache.add.test.2'
                },
            ]
        })
    },

    'about-->cache.remove.test.2': function (){ // documentation
        return {
            title: 'cache.remove.test.2',
            description: 'Test removing item from cache by action name.',
            data_in: {
                token: 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
                action: 'cache.remove.test.2'
            }
        }
    },


}

