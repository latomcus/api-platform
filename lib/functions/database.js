"use strict"
const config = require('../../config')

module.exports = {

    'on_start': function (message){
        console.log(`+ ${message.payload.id} worker [${message.payload.pid}] received [on_start] event in [${message.module}] module`)
    },

    'about-->user.create': function(){ //implemented in database
        return {
            title: 'user.create',
            description: 'Create new user.',
            data_in: {
                action: 'user.create',
                payload: {
                    email: 'some_user@company.com',
                    password: '1234567'
                }
            }
        }
    },

    'about-->user.delete': function(){ //implemented in database
        return {
            title: 'user.delete',
            description: 'Delete existing user.',
            data_in: {
                'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF',
                'action': 'user.delete',
                'payload': {
                    'email': 'some_user@company.com'
                }
            }
        }
    },

    'about-->user.reset_password': function(){ //implemented in database
        return {
            title: 'user.reset_password',
            description: 'Reset user password.',
            data_in: {
                'action': 'user.reset_password',
                'payload': {
                    'email': 'some_user@company.com'
                }
            }
        }
    },

    'about-->session.create': function(){ //implemented in database
        return {
            title: 'session.create',
            description: 'Creates session and sets cookie.',
            data_in: {
                'action': 'session.create',
                'payload': {
                    'email': 'some_user@company.com',
                    'password': '1234567'
                }
            }
        }
    },

    'about-->session.is_valid': function(){ //implemented in database
        return {
            title: 'session.is_valid',
            description: 'Validate token.',
            data_in: {
                'action': 'session.is_valid',
                'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF'
            }
        }
    },

    'about-->session.delete': function(){ //implemented in database
        return {
            title: 'session.delete',
            description: 'Delete token.',
            data_in: {
                'action': 'session.delete',
                'token': 'FFC9B676-44E9-4A1D-9DAB-24280601FDBF'
            }
        }
    },

}
