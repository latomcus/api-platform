/*
https://github.com/latomcus/api-platform

Handles in memory caching.
Max number of objects in cache is determined by value in config.cache.max_size.

*/

"use strict"
const config = require('../config') //importing configuration settings
var cache_array = [] //main cache array

module.exports = {

    //return number of cached objects
    count: function(){
        //console.log('cache.count', cache_array.length)
        return (cache_array.length == 0) ? 0 : cache_array.length
    },

    //return array of cashed items
    items: function(){
        //console.log('cache.items')
        return cache_array
    },

    //add object to cache
    add: function(data_in, data_out, key_type, key_value, expiration, minutes){
        //console.log('cache.add')

        if (cache_array.length < config.cache.max_size){ //check cache overall size
            //console.log(`cache.add.find`)
            //console.log(data_in)
            var found_data_out = this.find(data_in)
            if (found_data_out) return //object found, no need to add it to cache

            data_out.cached = 'true' //flag object that it's cached

            //validate and populate expiration type
            var exp = config.cache.default_expiration
            if (expiration){
                exp = (expiration === 'sliding') ? 'sliding' : 'absolute'
            }

            //validate and set duration
            var mins = config.cache.default_duration
            if (minutes){
                mins = minutes
            }

            cache_array.push({
                data_in: data_in,
                data_out: data_out,
                key_type: key_type, //Options: 'action', or 'token,action', or 'token,action,params', or 'action,params'
                key_value: key_value, //stores data based on key_type

                expiration: exp, //expiration type: "absolute" or "sliding"
                created: new Date(), //date and time when cache object is created
                minutes: mins, //how long object should be kept
            })

            //console.log(`cache.add.length ${cache_array.length}`)
        }
    },

    remove_expired: function(){
        cache_array = cache_array.filter((item) => new Date(item.created.getTime() + item.minutes * 60000) > new Date() )
    },

    remove: function(key_type, key_value){
        //console.log('cache.remove', cache_array.length)

        if (key_type === 'action'){
            cache_array = cache_array.filter((item) => item.data_in.action !== key_value)
        }
            
        if (key_type === 'token,action'){
            cache_array = cache_array.filter((item) =>
                item.data_in.token + item.data_in.action !== key_value)
        }
        
        if (key_type === 'token,action,params'){
            cache_array = cache_array.filter((item) =>
                item.data_in.token + item.data_in.action + JSON.stringify(item.data_in.params) !== key_value)
        }
        
        if (key_type === 'action,params'){
            cache_array = cache_array.filter((item) =>
                item.data_in.action + JSON.stringify(item.data_in.params) !== key_value)
        }
    },

    find: function(data_in){
        //console.log('cache.find')
        var now = new Date()

        if (now.getMilliseconds() % 50 === 0) /*
            No need to run it every time
            Clear expired objects leasurely, 50/1000 or 1/20 chance. Lower the value of 50 to 30, or 20 for more agressive clean up */
            this.remove_expired() //clear expired objects

        for (var i = 0; i < cache_array.length; i++){
            var c = cache_array[i]
            var expires = new Date(c.created.getTime() + c.minutes * 60000)
            //console.log(`cache.find minutes=${c.minutes}, expires=${expires}, now=${now}`)

            if (expires > now){
                if (c.key_type === 'action') {
                    if (c.key_value === data_in.action) {
                        return this.update_expiration(c)
                    }
                }

                if (c.key_type === 'token,action') {
                    if (c.key_value === data_in.action &&
                        c.key_value === data_in.token + data_in.action) {
                        return this.update_expiration(c)
                    }
                }

                if (c.key_type === 'token,action,params') {
                    if (c.key_value === data_in.action &&
                        c.key_value === data_in.token + data_in.action + JSON.stringify(data_in.params)) {
                        return this.update_expiration(c)
                    }
                }

                if (c.key_type === 'action,params') {
                    if (c.key_value === data_in.action &&
                        c.key_value === data_in.action + JSON.stringify(data_in.params)) {
                        return this.update_expiration(c)
                    }
                }
            }
        }
        return null
    },

    update_expiration: function(cache_item){
        if (cache_item.expiration === 'sliding'){
            cache_item.created = new Date() //reset created date to keep it in memory, i.e. sliding expiration
        }
        return cache_item.data_out
    },
}