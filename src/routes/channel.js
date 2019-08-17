let express = require('express');
let router = express.Router();
let sql = require('../db');
let { userIsAdmin } = require('../methods');
let { getUniqueId } = require('../methods');

// Route to create a channel
// Expects -> Channel Name
// Expects -> Server Id
// Expects -> User Id
router.post('/channel/create', async (req, res) => {
  // Check if params exist
  const { channelName, server, userId } = req.query;
  const serverName = server.split('0')[0];
  const serverId = server.split('-')[1];
  if (!channelName || !server || !userId) {
    res.status(400).send('Invalid params');
  }
  else {
    // Check if user exists
    if (await userIsAdmin(userId, serverId)) {
      const channelId = await getUniqueId('channel');
      createChannel(channelId, channelName, serverId, userId);
      res.status(200).send({ channel: channelName + '-' + channelId, server: server });
    }
    else {
      res.status(401).send("Not authorized, stop that!");
    }
  }
});

// Route to rename a channel
// Expects -> Channel Name
// Expects -> Channel Id
// Expects -> Userid
router.post('/channel/rename', async (req, res) => {
  const { channelName, channelId, serverId, userId } = req.query;
  if (!channelName || !channelId || !userId || !serverId) {
    res.status(400).send('Invalid Params');
  }
  else {
    // Check if user admin
    if (await userIsAdmin(userId, serverId)) {
      renameChannel(channelName, channelId);
      res.status(200).send(`Renamed Channel to ${channelName}`);
    }
    else {
      res.status(401).send("Not authorized, stop that!");
    }
  }
})

// Route to delete a channel
// Expects -> ChannelId
// Expects -> UserId
router.delete('/channel/delete', async (req, res) => {
  const { channelId, serverId, userId } = req.query;
  if (!channelId || !userId) {
    res.status(400).send('Invalid Params');
  }
  else {
    // Check if user admin
    if (await userIsAdmin(userId, serverId)) {
      deleteChannel(channelId);
      res.status(200).send(`Deleted channel`);
    }
    else {
      res.status(401).send("Not authorized, stop that!");
    }
  }
})


// Create channel and all intermediary tables
const createChannel = (channelId, channelName, serverId, userId) => {
  sql.query(`INSERT INTO channels (channel_id, channel_name, server_id) VALUES ('${channelId}', '${channelName}', '${serverId}')`);
  sql.query(`INSERT INTO messages (channel_id) VALUES ('${channelId}')`);
}

// Remane a channel
const renameChannel = (channelName, channelId) => {
  sql.query(`UPDATE channels SET channel_name = '${channelName}' WHERE channel_id = '${channelId}'`);
}

const deleteChannel = (channelId) => {
  sql.query(`DELETE FROM channels WHERE channel_id = '${channelId}'`);
}

module.exports = router;