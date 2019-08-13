let express = require('express');
let router = express.Router();
let sql = require('../db');
let { userExists } = require('../methods');
let { getUniqueId } = require('../methods');


// Route to create a server
// Expects -> Server NAme
// Expects -> User Id
router.post('/servers', async (req, res) => {
  const { serverName, userId } = req.query;
  if (!serverName || !userId) {
    res.status(400).send('Invalid parmas');
  }
  else {
    if (await userExists(userId)) {
      const serverId = await getUniqueId('server');
      const channelId = await getUniqueId('channel');
      createServer(serverId, serverName, channelId, userId);
      res.send(`Server ${serverName} with ID ${serverId} Created`);
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

module.exports = router;