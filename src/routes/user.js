let express = require('express');
let router = express.Router();
let mysql = require('mysql');
let sql = require('../db');

// When user logs in (opens app)
// We will fetch all of the data
// Server list + channels
router.get('/user', (req, res) => {
  const userId = req.query.userId;
  // Query to get all of the servers + channels + data
  sql.query(`SELECT servers.server_id, servers.server_name, channels.channel_id, channels.channel_name, messages.user_name, messages.msg, messages.date FROM messages 
  JOIN channels ON messages.channel_id = channels.channel_id 
  JOIN servers ON channels.server_id = servers.server_id 
  JOIN userservers ON servers.server_id = userservers.server_id 
  JOIN users ON userservers.user_id = users.user_id WHERE users.user_id = ${userId}`, (err, result) => {
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

// When user logs in, insert user info to DB
router.post('/user', async (req, res) => {
  // Get query data from url
  const userName = req.query.userName;
  const userId = req.query.userId;
  if (!userName || !userId) {
    res.status(400).send('Invalid Params');
  }

  // Check if userId exist, insert user into DB if not
  let sqlQuery = `SELECT * FROM users WHERE user_id = ${userId}`;
  let response = sql.query(sqlQuery);
  if (response > 0) {
    res.status(200).send(true);
  }
  else {
    sqlQuery = `INSERT INTO users (user_id, name) VALUES ('${userId}', '${userName}')`;
    response = await sql.query(sqlQuery);
    if (response > 0)
      res.status(200).send(true);
  }
})

module.exports = router;