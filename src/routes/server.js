let express = require('express');
let router = express.Router();
let sql = require('../db');
let { userExists, getUniqueId, userIsAdmin } = require('../methods');


// Route to create a server
// Expects -> Server NAme
// Expects -> User Id
router.post('/server/create', async (req, res) => {
  const { serverName, userId } = req.query;
  if (!serverName || !userId) {
    res.status(400).send('Invalid parmas');
  }
  else {
    if (await userExists(userId)) {
      const serverId = await getUniqueId('server');
      const channelId = await getUniqueId('channel');
      createServer(serverId, serverName, channelId, userId);
      res.send({ server: serverName + '-' + serverId, channel: "general" + '-' + channelId });
    }
    else {
      res.status(401).send('Not authorized, stop that!"');
    }
  }
})


// Route to join a server
// Expects -> Server Id
// Expects -> User Id
router.post('/server/join', async (req, res) => {
  const { serverId, userId } = req.query;
  if (!serverId || !userId) {
    res.status(400).send('Invalid parmas');
  }
  else {
    if (await userExists(userId)) {
      const response = await joinServer(serverId, userId);
      res.send(`Server ${response[0].server_name} with ID ${serverId} Joined`);
    }
    else {
      res.status(401).send('Not authorized, stop that!"');
    }
  }
})

// Route to rename a server
// Expects -> ServerName
// Expects -> ServerId
// Expects -> UserId
router.post('/server/rename', async (req, res) => {
  const { serverName, serverId, userId } = req.query;
  if (!serverName || !serverId || !userId) {
    res.status(400).send('Invalid Params');
  }
  else {
    if (await userIsAdmin(userId, serverId)) {
      const response = await renameServer(serverName, serverId);
      res.status(200).send(`Server with ID : ${serverId} Renamed to ${serverName}`);
    }
    else {
      res.status(401).send("You're not an admin. Stop that!");
    }
  }
})


// Route to get if user is admin
// Expects -> userId
// Expects -> serverId
// Returns true or false
router.get('/server/admin', async (req, res) => {

  const { userId, serverId } = req.query;

  // Check params
  if (!userId || !serverId) {
    res.status(400).send('Invalid params');
  }

  const response = await userIsAdmin(userId, serverId);
  res.send(response);

})

// Creates Server and all intermediary join tables
const createServer = (serverId, serverName, channelId, userId) => {
  sql.query(`INSERT INTO servers (server_id, server_name, owner_id) VALUES (${sql.escape(serverId)}, ${sql.escape(serverName)}, ${sql.escape(userId)})`);
  sql.query(`INSERT INTO serveradmins (server_id, user_id) VALUES (${sql.escape(serverId)}, ${sql.escape(userId)})`);
  sql.query(`INSERT INTO userservers (user_id, server_id) VALUES (${sql.escape(userId)}, ${sql.escape(serverId)})`);
  sql.query(`INSERT INTO channels (channel_id, channel_name, server_id) VALUES (${sql.escape(channelId)}, 'general', ${sql.escape(serverId)})`);
  sql.query(`INSERT INTO messages (channel_id) VALUES (${sql.escape(channelId)})`);
}

// Joins server and returns the server name
const joinServer = (serverId, userId) => {
  sql.query(`INSERT INTO userservers (server_id, user_id) VALUES (${sql.escape(serverId)}, ${sql.escape(userId)})`);
  return sql.query(`SELECT server_name FROM servers WHERE server_id = ${sql.escape(serverId)}`);
}

const renameServer = (serverName, serverId) => {
  return sql.query(`UPDATE servers SET server_name = ${sql.escape(serverName)} WHERE server_id = ${sql.escape(serverId)}`);
}

module.exports = router;