/*
https://github.com/latomcus/api-platform
*/

module.exports = {

    port: 3000, //port on which API is listening

    ssl: {
        enabled: false,
        cert: './server.cert', //self-signed certificate file name
        key: './server.key', //private key of the certificate file name
    },
    
    not_authorized_message: 'Not authorized. Contact system admin support@company.com or call 000-000-0000',

    files: 'files', //folder where uploded files are stored

    data_source: 'mssql', //Options: 'mssql' or 'postgres' or 'mysql'

    security: [
        {
            app_key: 'Hk3v7xjLBtkPrMh45EPDGEm26FD2k64MJA2pPvStvN', //A-Zz-z0-9
            permissions: ['list apis', 'ping', 'hello world', 'upload files', 'send email','session.create']

        },
        {
            app_key: 'ICprYKkB9u8iJPzcLefGuFRkypcUJQanY0LowHGsq1', //A-Zz-z0-9
            permissions: ['send email']
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

    mssql: {
        user: 'api_user',
        password: 'secret',
        server: 'COMPUTER2\\SQLEXPRESS',
        database: 'api_database',
        parseJSON: true,
    },

    postgres: {
        connectionString: 'postgres://api_user:secret@localhost:5432/api_database',
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
