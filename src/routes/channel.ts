import express from 'express';
import { Request, Response } from 'express';
import { connection as sql } from '../db/db';
import { userIsAdmin, getUniqueId } from '../utils/utils';

export let router = express.Router();

// Route to create a channel
// Expects -> Channel Name
// Expects -> Server Id
// Expects -> User Id
router.post('/channel/create', async (req: Request, res: Response) => {
  // Check if params exist
  const { channelName, server, userId } = req.query;
  const serverName = server.split('0')[0];
  const serverId = server.split('-')[1];
  if (!channelName || !server || !userId) {
    res.status(400).send('Invalid params');
  } else {
    // Check if user exists
    if (await userIsAdmin(userId, serverId)) {
      const channelId = await getUniqueId('channel');
      createChannel(channelId, channelName, serverId, userId);
      res.status(200).send({ channel: channelName + '-' + channelId, server: server });
    } else {
      res.status(401).send('Not authorized, stop that!');
    }
  }
});

// Route to rename a channel
// Expects -> Channel Name
// Expects -> Channel Id
// Expects -> Userid
router.post('/channel/rename', async (req: Request, res: Response) => {
  const { channelName, channelId, serverId, userId } = req.query;
  if (!channelName || !channelId || !userId || !serverId) {
    res.status(400).send('Invalid Params');
  } else {
    // Check if user admin
    if (await userIsAdmin(userId, serverId)) {
      renameChannel(channelName, channelId);
      res.status(200).send(`Renamed Channel to ${channelName}`);
    } else {
      res.status(401).send('Not authorized, stop that!');
    }
  }
});

// Route to delete a channel
// Expects -> ChannelId
// Expects -> UserId
router.delete('/channel/delete', async (req: Request, res: Response) => {
  const { channelId, serverId, userId } = req.query;
  if (!channelId || !userId) {
    res.status(400).send('Invalid Params');
  } else {
    // Check if user admin
    if (await userIsAdmin(userId, serverId)) {
      deleteChannel(channelId);
      res.status(200).send(`Deleted channel`);
    } else {
      res.status(401).send('Not authorized, stop that!');
    }
  }
});

// Create channel and all intermediary tables
const createChannel = (channelId: string, channelName: string, serverId: string, userId: string) => {
  sql.query(
    `INSERT INTO channels (channel_id, channel_name, server_id) VALUES (${sql.escape(channelId)}, ${sql.escape(
      channelName
    )}, ${sql.escape(serverId)})`
  );
};

// Remane a channel
const renameChannel = (channelName: string, channelId: string) => {
  sql.query(
    `UPDATE channels SET channel_name = ${sql.escape(channelName)} WHERE channel_id = ${sql.escape(channelId)}`
  );
};

const deleteChannel = (channelId: string) => {
  sql.query(`DELETE FROM channels WHERE channel_id = ${sql.escape(channelId)}`);
};
