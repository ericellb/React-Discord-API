let express = require('express');
let router = express.Router();
let mysql = require('mysql');
let sql = require('../db');
let bcrypt = require('bcryptjs');
let { userIsAdmin, getUniqueId } = require('../methods');

// Route to get data associated with a specific user
// Expects -> userId
router.get('/user/data', (req, res) => {
  const { userId } = req.query;
  // Query to get all of the servers + channels + data
  sql.query(`SELECT servers.server_id, servers.server_name, channels.channel_id, channels.channel_name, messages.user_name, messages.msg, messages.date FROM messages 
  JOIN channels ON messages.channel_id = channels.channel_id 
  JOIN servers ON channels.server_id = servers.server_id 
  JOIN userservers ON servers.server_id = userservers.server_id 
  JOIN users ON userservers.user_id = users.user_id WHERE users.user_id = ${sql.escape(userId)}`, (err, result) => {
      if (err) {
        res.status(400).send('Server error');
        throw err;
      }
      else {
        const data = {};
        result.forEach((message) => {
          // Build servers / channel names with IDs
          const serverName = message.server_name + '-' + message.server_id;
          const channelName = message.channel_name + '-' + message.channel_id;

          if (data[serverName] === undefined)
            data[serverName] = {};

          if (data[serverName]["activeUsers"] === undefined)
            data[serverName]["activeUsers"] = [];

          if (data[serverName]["channels"] === undefined)
            data[serverName]["channels"] = {};

          if (data[serverName]["channels"][channelName] === undefined)
            data[serverName]["channels"][channelName] = [];

          data[serverName]["channels"][channelName].push({ "from": message.user_name, "msg": message.msg, "date": message.date });
        })
        res.status(200).send(data)
      }
    })
});


// Route to create a new user
// Expects -> userName
// Expects -> userPass
// Returns -> userId
router.post('/user/create', async (req, res) => {
  // Get query data from url
  let { userName, userPass } = req.query;
  let error = null;

  // Check for errors
  if (!userName || !userPass) {
    error = "Invalid Params";
  }
  else if (userPass.length < 6) {
    error = "Passwords need to be minimum 6 chracters";
  }

  // If errors, send them
  if (error !== null) {
    res.status(401).send(error);
  }
  else {
    let response = await sql.query(`SELECT user_id from users where user_name = ${sql.escape(userName)}`);
    // User already exists
    if (response.length > 0) {
      error = "Username already exists";
      res.status(401).send(error);
    }
    // No user exists, lets create it!
    else {
      const userId = await getUniqueId('user');
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(userPass, salt, (err, hash) => {
          if (err) throw err;
          userPass = hash;
          var date = new Date();
          // Create user
          sql.query(`INSERT INTO users (user_id, user_name, user_pass, user_last_active) VALUES (${sql.escape(userId)}, ${sql.escape(userName)}, ${sql.escape(userPass)}, ${sql.escape(date)})`);
          // Add to default server
          sql.query(`INSERT INTO userservers (server_id, user_id) VALUES ('FANfDprXmt', '${userId}')`);
          res.status(200).send({ "userName": userName, "userId": userId });
        })
      })
    }
  }
})

// Route to login
// Expects -> userName
// Expects -> userPass
// Returns -> userId
router.get('/user/login', async (req, res) => {
  const { userName, userPass } = req.query;
  let error = {};

  // Check params exist
  if (!userName || !userPass) {
    res.status(400).send('Invalid Params');
  }

  // Check if password matches, if so return userName and userId
  const response = await sql.query(`SELECT * FROM users WHERE user_name = '${userName}'`);
  const hashPass = response[0].user_pass;
  const isMatch = await bcrypt.compare(userPass, hashPass);
  if (isMatch) {
    res.status(200).send({ "userName": userName, "userId": response[0].user_id });
  }
  else {
    error = 'Username / Password does not match';
    res.status(400).send(error);
  }
});


module.exports = router;