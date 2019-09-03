import express from 'express';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { connection as sql } from '../db/db';
import { getUniqueId } from '../utils/utils';
import { MysqlError } from 'mysql';

export let router = express.Router();

// Route to get data associated with a specific user
// Expects -> userId
router.get('/user/data', async (req: Request, res: Response) => {
  const { userId } = req.query;
  const data: any = {};
  // Query to get all of the servers + channels + data
  await sql.query(
    `SELECT servers.server_id, servers.server_name, channels.channel_id, channels.channel_name, messages.user_name, messages.msg, messages.date_time 
  FROM messages
  right JOIN channels ON messages.channel_id = channels.channel_id
  JOIN servers ON servers.server_id = channels.server_id
  JOIN userservers ON servers.server_id = userservers.server_id
  JOIN users ON userservers.user_id = users.user_id
  WHERE users.user_id = ${sql.escape(userId)}`,
    (err, result) => {
      if (err) {
        res.status(400).send('Server error');
        throw err;
      } else {
        result.forEach((message: any) => {
          // Build servers / channel names with IDs
          const serverName = message.server_name + '-' + message.server_id;
          const channelName = message.channel_name + '-' + message.channel_id;

          if (data['servers'] === undefined) data['servers'] = {};

          if (data['servers'][serverName] === undefined) data['servers'][serverName] = {};

          if (data['servers'][serverName]['channels'] === undefined) data['servers'][serverName]['channels'] = {};

          if (data['servers'][serverName]['channels'][channelName] === undefined)
            data['servers'][serverName]['channels'][channelName] = [];

          if (message.user_name !== null && message.msg !== null)
            data['servers'][serverName]['channels'][channelName].push({
              from: message.user_name,
              msg: message.msg,
              date: message.date_time
            });
        });
      }

      // Query to get all Private messages for user
      sql.query(
        `SELECT b.user_name as user_from, c.user_name as user_to, msg 
                FROM user_messages a
                JOIN users b ON b.user_id = a.user_from 
                JOIN users c ON c.user_id = a.user_to 
                WHERE a.user_from = ${sql.escape(userId)} 
                OR a.user_to = ${sql.escape(userId)}`,
        async (err: MysqlError, result: []) => {
          if (err) {
            res.status(400).send('Server error');
            throw err;
          } else {
            const userName: any = await sql.query(`SELECT user_name from users where user_id = ${sql.escape(userId)}`);
            result.forEach((privateMessage: any) => {
              // Build privateMessages object
              let user = null;

              // If messages from me, set user to the TO
              if (privateMessage.user_from === userName[0].user_name) user = privateMessage.user_to.toLowerCase();
              else user = privateMessage.user_from.toLowerCase();

              if (data['privateMessages'] === undefined) data['privateMessages'] = {};

              if (data['privateMessages'][user] === undefined) data['privateMessages'][user] = [];

              data['privateMessages'][user].push({
                user: user,
                from: privateMessage.user_from,
                to: privateMessage.user_to,
                msg: privateMessage.msg,
                date_time: privateMessage.date_time
              });
            });

            // If no private messages return data with empty privateMessages array
            if (data['privateMessages'] === undefined) data['privateMessages'] = [];
          }

          // Return our final formatted data
          res.status(200).send(data);
        }
      );
    }
  );
});

// Route to create a new user
// Expects -> userName
// Expects -> userPass
// Returns -> userId
router.post('/user/create', async (req: Request, res: Response) => {
  // Get query data from url
  let { userName, userPass } = req.query;
  let error = null;

  // Check for errors
  if (!userName || !userPass) {
    error = 'Invalid Params';
  } else if (userPass.length < 6) {
    error = 'Passwords need to be minimum 6 chracters';
  }

  // If errors, send them
  if (error !== null) {
    res.status(401).send(error);
  } else {
    let response: any = await sql.query(`SELECT user_id from users where user_name = ${sql.escape(userName)}`);
    // User already exists
    if (response.length > 0) {
      error = 'Username already exists';
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
          sql.query(
            `INSERT INTO users (user_id, user_name, user_pass, user_last_active) VALUES (${sql.escape(
              userId
            )}, ${sql.escape(userName)}, ${sql.escape(userPass)}, ${sql.escape(date)})`
          );
          // Add to default server
          sql.query(`INSERT INTO userservers (server_id, user_id) VALUES ('FANfDprXmt', '${userId}')`);
          res.status(200).send({ userName: userName, userId: userId });
        });
      });
    }
  }
});

// Route to login
// Expects -> userName
// Expects -> userPass
// Returns -> userId
router.get('/user/login', async (req: Request, res: Response) => {
  const { userName, userPass } = req.query;
  let error = {};

  // Check params exist
  if (!userName || !userPass) {
    res.status(400).send('Invalid Params');
  }

  // Check if password matches, if so return userName and userId
  const response: any = await sql.query(`SELECT * FROM users WHERE user_name = '${userName}'`);
  const hashPass = response[0].user_pass;
  const isMatch = await bcrypt.compare(userPass, hashPass);
  if (isMatch) {
    res.status(200).send({ userName: userName, userId: response[0].user_id });
  } else {
    error = 'Username / Password does not match';
    res.status(400).send(error);
  }
});
