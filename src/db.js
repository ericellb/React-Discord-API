
let mysql = require('mysql');
let dotenv = require('dotenv');
let util = require('util');

// Env vars
dotenv.config();
const host = process.env.MYSQL_URL;
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASS;
const database = process.env.MYSQL_DB;


// Setup Mysql
var connection = mysql.createPool({ host, user, password, database });
connection.query = util.promisify(connection.query);

module.exports = connection;