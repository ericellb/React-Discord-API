let express = require('express');
let router = express.Router();
let mysql = require('mysql');
let sql = require('../db');
let bcrypt = require('bcryptjs');
let { userExists, getUniqueId } = require('../methods');

// Route to get data associated with a specific user
// Expects -> userId
router.get('/user/data', (req, res) => {
  const { userId } = req.query;
  // Query to get all of the servers + channels + data
  sql.query(`SELECT servers.server_id, servers.server_name, channels.channel_id, channels.channel_name, messages.user_name, messages.msg, messages.date FROM messages 
  JOIN channels ON messages.channel_id = channels.channel_id 
  JOIN servers ON channels.server_id = servers.server_id 
  JOIN userservers ON servers.server_id = userservers.server_id 
  JOIN users ON userservers.user_id = users.user_id WHERE users.user_id = '${userId}'`, (err, result) => {
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

          if (data[serverName][channelName] === undefined)
            data[serverName][channelName] = [];

          data[serverName][channelName].push({ "from": message.user_name, "msg": message.msg, "date": message.date });
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
  let errors = [];

  // Check required fields
  if (!userName || !userPass) {
    errors.push({ msg: 'Invalid parmas' });
  }

  // Check pass length
  if (userPass.length < 6) {
    errors.push({ msg: "Passwords need to be 6 characters" });
  }

  // If errors let user know
  if (errors.length > 0) {
    res.status(401).send(errors);
  }
  // Else lets auth the user
  else {
    let response = await sql.query(`SELECT user_id from users where user_name = '${userName}'`);
    // User already exists
    if (response.length > 0) {
      errors.push({ msg: "Username already exists" });
      res.status(401).send(errors);
    }
    // No user exists, lets create it!
    else {
      const userId = await getUniqueId('user');
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(userPass, salt, (err, hash) => {
          if (err) throw err;
          userPass = hash;
          console.log(userPass);
          // Create user
          sql.query(`INSERT INTO users (user_id, user_name, user_pass) VALUES ('${userId}', '${userName}', '${userPass}')`);
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
  let errors = [];

  // Check params exist
  if (!userName || !userPass) {
    res.status(400).send('Invalid Params');
  }

  const response = await sql.query(`SELECT * FROM users WHERE user_name = '${userName}'`);
  const hashPass = response[0].user_pass;
  const isMatch = await bcrypt.compare(userPass, hashPass);
  if (isMatch) {
    res.status(200).send({ "userName": userName, "userId": response[0].user_id });
  }


});

module.exports = router;