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


// Create channel and all intermediary tables
const createChannel = (channelId, channelName, serverId, userId) => {
  sql.query(`INSERT INTO channels (channel_id, channel_name, server_id) VALUES ('${channelId}', '${channelName}', '${serverId}')`);
  sql.query(`INSERT INTO messages (channel_id) VALUES ('${channelId}')`);
}

module.exports = router;