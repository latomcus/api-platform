/*
https://github.com/latomcus/api-platform
*/

module.exports = {

    worker_count: null, //Default: null (not set). Minimum value: 1, Maximum: number of CPUs

    port: 3000, //port on which API is listening. http://localhost:3000/

    ssl: {
        enabled: false,
        cert: './server.cert', //self-signed certificate file name
        key: './server.key', //private key of the certificate file name
    },
    
    not_authorized_message: 'Not authorized. Contact support@company.com or call 000-000-0000',

    files: 'files', //folder where uploded files are stored

    data_source: 'mssql', //Options: 'mssql' or 'postgres' or 'mysql'

    security: [
        {
            app_key: 'Hk3v7xjLBtkPrMh45EPDGEm26FD2k64MJA2pPvStvN', //A-Za-z0-9
            permissions: [
                'user.create','session.create','session.delete','session.is_valid','user.delete','user.reset_password',
                'list apis', 'ping', 'hello world', 'upload files', 'send email',
                'cache.status', 'cache.add', 'cache.remove', 'synch data'
            ]
        },
        {
            app_key: 'ICprYKkB9u8iJPzcLefGuFRkypcUJQanY0LowHGsq1', //A-Za-z0-9
            permissions: ['list apis', 'synch data']
        },

    ],

    cache: {
        enabled: true,
        url: 'http://localhost:3001/cache', //port number for in-memory cache service
        max_size: 10000, //max number of object to keep in memory cache
        default_expiration: 'absolute', //Options: 'absolute' or 'sliding'
        default_duration: 60, //in minutes
    },

    email: {
        enabled: false,
        //for other email server configuratins, please adopt code as per specificaitons in https://community.nodemailer.com/
        service: 'Gmail',
        user: 'your-email@gmail.com',
        password: 'app-secret-key', //to setup, see https://support.google.com/mail/answer/185833
    },

    sms: {
        enabled: false,
        //Integration with https://www.twilio.com
        phone_number: '1234567890', //phone number linked in your account
        account_sid: 'AC account number', //provided by twilio
        auth_token: 'authorization token', //provided by twilio
    },

    mongodb: {
        url: 'mongodb://api_user:secret@127.0.0.1:27017'
    },

    redshift: {
        user: 'user',
        database: 'database',
        password: 'password',
        port: 'port',
        host: 'host',
    },

    mssql: {
        user: 'api_user',
        password: 'secret!SECRET',
        server: 'localhost',
        database: 'api_database',
        parseJSON: true,
    },

    postgres: {
        connectionString: 'postgres://api_user:secret@localhost:5433/api_database',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },

    mysql: {
        host: 'localhost',
        user: 'api_user',
        password: 'secret',
        database: 'api_database',
    },

}
