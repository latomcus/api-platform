# REST API Platform (pre-alpha)
API Platform is a web framework to easily create and maintain API-first projects with flexibility and quick turn around
* Small code base
* Standardized JSON response makes it easy to prototype and build web applications
* Secure POST communications, CORS enabled
* Configurable caching with support for __sliding__ and __absolute__ expiration
* Use of __service style__ approach for all database code, i.e. JSON in, JSON out
* Use of server functions to extend functionality, see **/lib/functions.js**
* Supports multiple actions, like send email, add or remove cookies, add to cache, remove from cache. More actions can be easily added
* Mobile friendly GUI web interface that serves as a testing tool and documentation
* Supported databases: Microsoft SQL Server, Postgres

### Screenshots
<img src="https://raw.githubusercontent.com/latomcus/api-platform/dev/public/images/api-gui.png" title="Web page to test session.create service">

### Getting Started
Once downloaded, make sure you've configured your database and email server. All settings are in **./config.js** file.

### Prerequisites
* Node.js (v12 or higher) - https://nodejs.org
* Locally installed Microsoft SQL Server (2017 or higher) - https://www.microsoft.com/en-us/sql-server/sql-server-2017-editions
(or connectivity to existing SQL Server instance)
* Download repository and open **./sql/sql_server.sql** in Microsoft SQL Server Management Studio, execute the script and make sure there are no errors

### Configuration
All configurations are in **./config.js** file
 * `email`: tested with Gmail service. Please see steps to get your app password: https://support.google.com/mail/answer/185833?hl=en
    ```
    service: 'Gmail',
    user: 'your-email@gmail.com',
    password: 'app-secret-key'
    ```
 * `data_source`: Options: "mssql" or "postgres" or "mysql". Update configuration for a database of your choice.

### Installing
    $ git clone https://github.com/latomcus/api-platform.git
    $ cd api-platform
    $ npm install
    $ npm start
Open in browser: http://localhost:3000

### Data Format
Outgoing JSON data is structured as follows:
 * `code` - {required} system wide unique value that easily identifies the source, or module, or condition in your code.
Code format: [origin].[function].[condition]
Example: 'd.aa.02' refers to database
Codes are organized as follows:
   - s.* - generated by **/app.js** module
   - f.* - generated by **/lib/functions.js** module
   - d.* - generated by SQL database

 * `message` - {required} readable text describing performed action
 * `data` - [optional] any additional data, could be collection of rows and columns, or structured text needed to compose web page or any valid JSON formatted data
 * `actions` - [optional] one or multiple actions needed to be performed by the server such as setting up cookie, sending email(s), writing to a file, etc.

### Web Interface
**./public/index.html** is static page that uses static **./js/api.js** to load APIs, documentation, and sample data.
Note for **./js/api.js**: styles for __api.style__ could be one of the following: primary, secondary, success, danger, warning, info, light, dark, link (https://getbootstrap.com/docs/4.3/components/buttons/)

### Built With
* Node v12.6.0 - https://nodejs.org
* Microsoft SQL Server 2017 - https://www.microsoft.com/en-us/sql-server/sql-server-2017-editions
* PostgreSQL 11.1 - https://www.postgresql.org/
* Express - https://expressjs.com/
* JQuery - https://jquery.com/
* Handlebars - https://handlebarsjs.com/
* Bootstrap - https://getbootstrap.com/
* Notify - https://notifyjs.jpillora.com

### Author
Created by [Samuel Khaykin](mailto:latomcus@yahoo.com) Contributions and feature requests are welcome!

### Future Enhancements
 * Support for MySQL
 * Unit tests
 * API for file upload and download
 * Real-time dynamic reload of custom functions (server-less style)

