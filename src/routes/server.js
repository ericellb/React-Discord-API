let express = require('express');
let router = express.Router();
let mysql = require('mysql');
let sql = require('../db');


// Route to create a server
// Expects -> Server NAme
// Expects -> User Id
router.post('/servers', async (req, res) => {
  const serverName = req.query.serverName
  const userId = req.query.userId
  if (!serverName || !userId) {
    res.status(400).send('Invalid parmas');
  }
  else {
    if (await getUserExists(userId)) {
      const serverId = await getUniqueId('server');
      const channelId = await getUniqueId('channel');
      createServer(serverId, serverName, channelId, userId);
      res.send('submitted');
    }
    else {
      res.status(400).send('User submitting request does not exist.');
    }
  }
})

// Creates Server and all intermediary tales
const createServer = (serverId, serverName, channelId, userId) => {
  sql.query(`INSERT INTO servers (server_id, server_name, owner_id) VALUES ('${serverId}', '${serverName}', '${userId}')`);
  sql.query(`INSERT INTO userservers (user_id, server_id) VALUES ('${userId}', '${serverId}')`);
  sql.query(`INSERT INTO channels (channel_id, channel_name) VALUES ('${channelId}', 'general')`);
  sql.query(`INSERT INTO serverchannels (server_id, channel_id) VALUES ('${serverId}', '${channelId}')`);
  sql.query(`INSERT INTO messages (channel_id) VALUES ('${channelId}')`);
}

// Returns true if user exists in DB, false if not
const getUserExists = async (userId) => {
  const sqlQuery = `SELECT * FROM users WHERE user_id = '${userId}'`;
  let response = await sql.query(sqlQuery);
  if (response.length > 0) return true;
  else return false;
}

// Gets a Server Id and checks if it is unique in DB
const getUniqueId = async (type) => {
  const id = generateId();
  let sqlQuery = '';
  if (type === 'server')
    sqlQuery = `SELECT * FROM servers WHERE server_id = '${id}'`;
  else if (type === 'channel')
    sqlQuery = `SELECT * FROM channels WHERE channel_id = '${id}'`;
  let response = await sql.query(sqlQuery);
  if (response.length > 0) {
    return getUniqueId();
  }
  else return id;
}

// Generates a hexdecimal 10 character string
const generateId = () => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result;
}

module.exports = router;