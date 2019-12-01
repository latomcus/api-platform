"use strict"
const config = require('../../config')

module.exports = {

    'on_start': function (message){
        console.log(`+ ${message.payload.id} worker [${message.payload.pid}] received [on_start] event in [${message.module}] module`)
    },

   'upload files': function (data_in, callback){
       //your business logic here...
       //files are stored in /upload folder. data_in contains list of files uploaded and details

        callback({
            code: 'f.f.1', // f - functions, f - files.js, #1
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