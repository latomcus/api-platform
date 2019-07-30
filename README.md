# api-platform
API Platform is a web framework to easily create and maintain API-first projects with flexibility and quick turn around
* Small code base
* Standardized JSON response makes it easy to prototype and build web applications
* Secure POST communications
* Configurable caching with support for sliding and absolute expiration
* Use of service style approach in MS SQL Server stored procedures, i.e. JSON in, JSON out
* Use of server-less style functions to extend functionality, see /lib/functions.js
* Supports multiple actions, like send email, add or remove cookies, add to cache, remove from cache. More actions can be easily added
* Mobile friendly GUI web interface that serves as testing tool and documentation

## Screenshots
<img src="http://.png" title="Web page to test session.create service">

## Getting Started
Once downloaded, make sure you've configured your database and email server. All settings are in ./config.js

## Prerequisites
* Node.js (v12 or higher) - https://nodejs.org
* Localy installed Microsoft SQL Server 2017 (2017 or higher) - https://www.microsoft.com/en-us/sql-server/sql-server-2017-editions
(or connectivity to existing sql server instance)
* Download repository and open ./sql/sql_server.sql in Microsoft SQL Server Management Studio, execute the script and make sure there are no errors

## Configuration
All configurations are in ./config.js file
* email: tested with Gmail service. Please see steps involved to get app password: https://support.google.com/mail/answer/185833?hl=en
* mssql: update your sql server credentials and settins as needed:

```
user: "api_user",
password: "secret",
server: "COMPUTER2\\SQLEXPRESS",
database: "api_database"
```

## Installing
  $ git clone https://github.com/latomcus/api-platform/api-platform.git
  $ npm start
Open in browser: http://localhost:3000

## Data Format
Outgoing JSON data is structured as follows:
* code - {required} system wide unique value that easily identifies the source, or module, or condition in your code.
Code format: [origin].[function].[condition]
Example: 'd.aa.02' refers to database
Codes are organized as follows:
s.* - generated by app.js module
f.* - generated by functions.js module
d.* - generated by database

* message - {required} readable text describing action performed
* data - [optional] any additional data, could be collection of rows and columns, or text needed to compose web page or for any client application consuming the data
* actions - [optional] one or multiple actions needed to be performed by the server such as setting up cookie, sending email(s), writting to a file, etc.

## Web Interface
./public/index.html is static page that uses static ./js/api.js to load APIs, documentation, and sample data.
Note for ./js/api.js: styles for api[x].style could be one of the following: primary, secondary, success, danger, warning, info, light, dark, link (as described in https://getbootstrap.com/docs/4.3/components/buttons/)

## Build With
* Node v12.6.0 https://nodejs.org
* Microsoft SQL Server 2017 - https://www.microsoft.com/en-us/sql-server/sql-server-2017-editions
* Express https://expressjs.com/
* JQuery https://jquery.com/
* Handlebars https://handlebarsjs.com/
* Bootstrap https://getbootstrap.com/
* Notify https://notifyjs.jpillora.com

## Author
Created by [Samuel Khaykin](mailto:latomcus@gmail.com)
