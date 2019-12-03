"use strict"
const config = require('../../config')
const fs = require('fs')
var path = require('path')
var unzip = require('unzip')
var Redshift = require('node-redshift')
const cluster = require('cluster')

module.exports = {

    'on_start': function (message){
        console.log(`+ ${cluster.worker.id} worker [${cluster.worker.process.pid}] received [on_start] event in [${message.module}] module`)
    },

   'upload files': function (data_in, callback){
       // your business logic here...
       // files are stored in /upload folder. data_in contains list of files uploaded and details
       //console.log(data_in.payload.files)

        //uncompress files
        const fls = data_in.payload.files
        for (var i = 0; i < fls.length; i ++){
            var from_file = path.resolve(config.files + '/' + fls[i].filename)

            //create working folder
            const working_folder = (path.basename(fls[i].filename, path.extname(fls[i].filename)))
            const working_folder_path = path.resolve(config.files + '/' + working_folder + '/')
            //console.log(working_folder_path)
            if (!fs.existsSync(working_folder_path)){
                fs.mkdirSync(working_folder_path)
            }
            unzip_file(from_file, working_folder_path, process_files)
        }

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
                payload: {
                    files: [
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
        }
    },


}

function unzip_file(from_file, to_folder, callback){
    //fs.createReadStream(from_file).pipe(unzip.Extract({ path: to_folder }))
    
    var unzipStream = unzip.Extract({ path: to_folder })
    unzipStream.on('error', function () { console.log('Error') })
    unzipStream.on('close', function () {
        //console.log('Close')
        callback(to_folder)
    })
    unzipStream.on('end', function () { console.log('End') })

    var readStream = fs.createReadStream(from_file)
    readStream.pipe(unzipStream)
}

function process_files(working_folder_path){
    const array_of_files = fs.readdirSync(working_folder_path)
    for (var i = 0; i < array_of_files.length; i++){
        const fl = array_of_files[i]
        console.log(fl)


    }
    //todo: clean up all files
    
}

function PushData(){
    var redshift = new Redshift(config.redshift)

    redshift.query('SELECT * FROM "Tags"', {raw: true}, function(err, data){
      if(err) throw err;
      else{
        console.log(data)
    
      }
    })

}

/*
// using promises
redshift.query('SELECT * FROM "Tags"', {raw: true})
    .then(function(data){
    console.log(data);

    // if you want to close client pool, uncomment redshift.close() line
    // but you won't be able to make subsequent calls because connection is terminated
    // redshift.close();
    }, function(err){
    throw err;
});
*/