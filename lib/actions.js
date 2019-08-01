/*
https://github.com/latomcus/api-platform

Actions module to handle various post request processing actions

Accepts array of 'actions' and performs one or multiple actions as requested.
Also needed parameter 'res' - Response object when working with cookies

Sample:
const actions = require('./actions')
var ac = [
    {
        "action":"send email",
        "to_email":"some_email@company.com",
        "from_email":"support@company.com",
        "subject":"Password reset",
        "body":"Your new password: 8EC4988B"
    },
    //add more objects with proper instructions
]
actions.process(ac)

*/

"use strict"
const cache = require('./cache')
const email = require('./email')

module.exports = {
    process: function(data_in, data_out, res){
        
        if (data_out.actions){
            for (var i = 0; i < data_out.actions.length; i++){
                var a = data_out.actions[i]

                if (a.action === 'send email'){
                    email.send(a)
                }

                if (a.action === 'set cookie'){
                    res.cookie(a.name, a.value)
                }

                if (a.action === 'delete cookie'){
                    res.cookie(a.name, '')
                }

                if (a.action === 'add to cache'){
                    cache.add(data_in, data_out, a.key_type, a.key_value, a.expiration, a.minutes)
                }

                if (a.action === 'remove from cache'){
                    cache.remove(a.key_type, a.key_value)
                }

                if (a.action === 'write file'){
                    //code implementation to write to a file
                    console.log('todo: write file')
                }

                if (a.action === 'create report'){
                    //code implementation to generate report, write to disk, return link to the file in response
                    console.log('todo: create report')
                }               

                //add more action as needed

            }
        }
    }
}