/*
https://github.com/latomcus/api-platform

Email service to send emails out
*/

"use strict"
const config = require('../config') //importing configuration settings
var nodemailer = require('nodemailer')

module.exports = {
    send: function(action){
        var transporter = nodemailer.createTransport( {
            service: config.email.service,
            auth: {
                user: config.email.user,
                pass: config.email.password
            }
        });
        
        var mailOptions = {
            from: action.from,
            to: action.to,
            subject: action.subject,
            html: action.body,
            generateTextFromHTML: true
        }
        
        transporter.sendMail(mailOptions, function (er, info) {
            if (er) {
                console.log('email.send.error', er)
            }
        })
    }
}


