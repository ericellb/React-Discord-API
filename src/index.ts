import { Socket } from 'socket.io';
import { Request, Response, NextFunction } from 'express';

// Dependencies
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connection as sql } from './db/db';
import * as http from 'http';

// Instantiate our app / server / socket io
let app = express();
let server = http.createServer(app);
let io = require('socket.io')(http);
import { SocketAction, SocketClient } from './types/types';

// Routes
import { router as userRouter } from './routes/user';
import { router as serverRouter } from './routes/server';
import { router as channelRouter } from './routes/channel';

async function main() {
  // Config for env variables
  dotenv.config();
  const PORT = process.env.PORT || 3001;
  let clients: SocketClient[] = [];

  // Create socket
  io.on('connection', function(socket: Socket) {
    // Keep track of current socket userId
    let sessionUserId: string = '';
    let action: SocketAction;

    // Listens for new messages
    socket.on('simple-chat-message', async msg => {
      // Store messsage in the DB
      var date = new Date();
      let sqlQuery = `INSERT INTO messages (channel_id, user_name, msg, date_time) VALUES (${sql.escape(
        msg.channel.split('-')[1]
      )}, ${sql.escape(msg.from)}, ${sql.escape(msg.msg)}, ${sql.escape(date)})`;
      sql.query(sqlQuery);
      const serverId = msg.server.split('-')[1];

      // Format our action for client to parse
      action = { type: 'message', payload: msg };

      // Emit the message to everyone that joined that server
      io.to(serverId).emit('update', action);
    });

    // Listens for private messages
    socket.on('simple-chat-private-message', async message => {
      // Find userId for username we are messaging
      const from: any = await sql.query(`SELECT user_id from users WHERE user_name = ${sql.escape(message.from)}`);
      const to: any = await sql.query(`SELECT user_id from users WHERE user_name = ${sql.escape(message.to)}`);
      let date = new Date();
      sql.query(
        `INSERT INTO user_messages (user_from, user_to, msg, date_time) VALUES (${sql.escape(
          from[0].user_id
        )}, ${sql.escape(to[0].user_id)}, ${sql.escape(message.msg)}, ${sql.escape(date)})`
      );

      // Find which socket to send TO
      action = {
        type: 'private-message',
        payload: { from: message.from, to: message.to, msg: message.msg, user: message.from.toLowerCase() }
      };
      clients.find(client => {
        if (client.userId === to[0].user_id) {
          io.to(client.id).emit('update', action);
        }
      });

      // Find which socket to
      action = {
        type: 'private-message',
        payload: { from: message.from, to: message.to, msg: message.msg, user: message.to.toLowerCase() }
      };
      clients.find(client => {
        if (client.userId === from[0].user_id) {
          io.to(client.id).emit('update', action);
        }
      });
    });

    // When user signs in he sends over his userId
    // Add to list of clients userId to identify socket.id
    socket.on('simple-chat-sign-in', userId => {
      // Keep track of session userId to eventually remove from list of clients
      sessionUserId = userId;
      clients.push({ userId: sessionUserId, id: socket.id });
      let date = new Date();
      sql.query(`UPDATE users SET user_last_active = ${sql.escape(date)} WHERE user_id = ${sql.escape(userId)}`);
    });

    // Listens for subscribing to servers (socket io rooms)
    socket.on('subscribe', serverId => {
      socket.join(serverId);
    });

    // On ping update active status (Client sends every 5 minutes)
    socket.on('ping', () => {
      let date = new Date();
      sql.query(`UPDATE users SET user_last_active = ${sql.escape(date)} WHERE user_id = ${sql.escape(sessionUserId)}`);
    });

    // On disconnect remove from client list
    socket.on('disconnect', () => {
      clients.find((client, i) => {
        if (client.userId === sessionUserId) {
          return clients.splice(i, 1);
        }
      });
    });
  });

  // Server listen on Port
  server.listen(PORT, function() {
    console.log(`API Listening on ${PORT}`);
  });

  // Express API Setup
  app.disable('x-powered-by');
  app.use(cors({ origin: 'https://ericellb.github.io' }));

  // Log the routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toString()} => ${req.originalUrl}`);
    next();
  });

  // Middleware for routes
  app.use(userRouter);
  app.use(serverRouter);
  app.use(channelRouter);
}

main();
