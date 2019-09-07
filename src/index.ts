import { Socket } from 'socket.io';
import { Request, Response, NextFunction } from 'express';
import { SocketAction, Message, PrivateMessage, SocketClientList } from './types/types';

// Dependencies
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connection as sql } from './db/db';
import * as http from 'http';

// Instantiate our app / server / socket io
let app = express();
let server = http.createServer(app);

let io: SocketIO.Server = require('socket.io')(server);

// Routes
import { router as userRouter } from './routes/user';
import { router as serverRouter } from './routes/server';
import { router as channelRouter } from './routes/channel';

async function main() {
  // Config for env variables
  dotenv.config();
  const PORT = process.env.PORT || 3001;
  let clients: SocketClientList[] = [];

  // Create socket Server listener
  io.on('connection', function(socket: Socket) {
    // Keep track of current socket userId
    let sessionUserId: string = '';
    let action: SocketAction;

    // Listens for new messages
    socket.on('simple-chat-message', async (msg: Message) => {
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
    socket.on('simple-chat-private-message', async (message: PrivateMessage) => {
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
    socket.on('simple-chat-sign-in', (data: { userId: string; userName: string }) => {
      // Keep track of session userId to eventually remove from list of clients
      sessionUserId = data.userId;
      clients.push({ userId: sessionUserId, id: socket.id, userName: data.userName });
      let date = new Date();
      sql.query(`UPDATE users SET user_last_active = ${sql.escape(date)} WHERE user_id = ${sql.escape(sessionUserId)}`);
    });

    // Listens for subscribing to servers (socket io rooms)
    socket.on('subscribe', (serverId: string) => {
      socket.join(serverId);
    });

    // On ping update active status of current user (Client sends every 5 minutes)
    socket.on('update-active', () => {
      let date = new Date();
      sql.query(`UPDATE users SET user_last_active = ${sql.escape(date)} WHERE user_id = ${sql.escape(sessionUserId)}`);
    });

    // Voice Listners

    // Signaling for WebrTC
    socket.on('voice-signal', (data: any) => {
      const toId = data.userId;
      data.userId = sessionUserId;
      let action = { type: 'voice-signal', payload: data };
      clients.find(client => {
        if (client.userId === toId) {
          io.to(client.id).emit('update', action);
        }
      });
    });

    // Emit list of connections when user joins voice on specific channel
    socket.on('user-join-voice', (data: { userId: string; userName: string; channelId: string }) => {
      // Join room with channel id
      socket.join(data.channelId);
      // Get socket ids for users in that channel
      const socketIdsInChannel = Object.keys(io.sockets.in(data.channelId).sockets);
      const userIdsInChannel: {}[] = [];
      // Find user ids in channel
      clients.forEach(client => {
        socketIdsInChannel.forEach(socketId => {
          if (client.id === socketId) userIdsInChannel.push({ userId: client.userId, userName: client.userName });
        });
      });

      // Emit to everyone on this channel, the socketid of new user, and list of clients in room
      let action = { type: 'user-join-voice', payload: { userId: data.userId, clients: userIdsInChannel } };
      io.to(data.channelId).emit('update', action);
    });

    socket.on('user-leave-voice', (data: { userId: string; userName: string; channelId: string }) => {
      // Leave channel
      socket.leave(data.channelId);
      const userIdsInChannel: {}[] = [];
      // Emit to everyone in that room that user left voice
      io.in(data.channelId).clients((error: any, socketClients: any) => {
        socketClients.forEach((socketClientId: any) => {
          // Find user ids in channel
          clients.forEach(client => {
            if (client.id === socketClientId) {
              userIdsInChannel.push({ userId: client.userId, userName: client.userName });
            }
          });
        });

        let action = { type: 'user-leave-voice', payload: { userId: data.userId, clients: userIdsInChannel } };
        io.to(data.channelId).emit('update', action);
      });
    });

    // On disconnect remove from client list
    socket.on('disconnect', () => {
      clients.find((client, i) => {
        if (client.userId === sessionUserId) {
          // Emit to all connected users that this user left (disconnects all voice peering calls with him)
          let action = { type: 'user-leave-voice', payload: { userId: client.userId } };
          socket.emit('update', action);
          // Remove from global socket client list
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
  app.use(cors());

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
