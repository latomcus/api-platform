/*
To send out sms with https://www.twilio.com service 

*/

"use strict"
const config = require('../config')
var twilio = require('twilio')
var client = new twilio(config.sms.account_sid, config.sms.auth_token)

module.exports = {
    send: function(action){
        client.messages.create({
            body: action.body,
            to: action.to,
            from: config.sms.phone_number
        })
        .then((message) => {
            //console.log(message)
            if (message.errorCode){
                console.log(message.errorCode, message.errorMessage)
            }

            //write to database, file, etc. as needed
        })
    }
}
