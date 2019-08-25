// Dependencies
let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let dotenv = require('dotenv');
let cors = require('cors');
let sql = require('./db');

// Routes
let userRouter = require('./routes/user');
let serverRouter = require('./routes/server');
let channelRouter = require('./routes/channel');

async function main() {
  // Config for env variables
  dotenv.config();
  const PORT = process.env.PORT || 3001;
  let clients = [];

  // Create socket
  io.on('connection', function (socket) {

    // Keep track of current socket userId
    let sessionUserId = null;

    // If user is connected to socket and established connection with his userId
    // We will update his user_last_active every 5 minutes
    setInterval(async () => {
      if (socket.userId !== null) {
        var date = new Date();
        sql.query(`UPDATE users SET user_last_active = ${sql.escape(date)} WHERE user_id = ${sql.escape(socket.userId)}`);
      }
    }, 5 * 60000)

    // Listens for new messages
    socket.on('simple-chat-message', async (msg) => {
      // Store messsage in the DB
      var date = new Date();
      let sqlQuery = `INSERT INTO messages (channel_id, user_name, msg, date_time) VALUES (${sql.escape(msg.channel.split('-')[1])}, ${sql.escape(msg.from)}, ${sql.escape(msg.msg)}, ${sql.escape(date)})`;
      sql.query(sqlQuery);
      const serverId = msg.server.split('-')[1];

      // Emit messages to only users part of specific server
      // Will only return list of users part of server and active in last 10 minutes
      sqlQuery = `SELECT userservers.user_id FROM userservers 
                  JOIN users ON users.user_id = userservers.user_id AND users.user_last_active > (NOW() - INTERVAL 10 minute)
                  WHERE server_id = ${sql.escape(serverId)}`;
      const users = await sql.query(sqlQuery);
      action = { type: "message", payload: msg };

      // Iterate over users, and find them in clients list
      // Emit over socket only to that user
      users.forEach((user) => {
        clients.find((client) => {
          if (client.userId === user.user_id) {
            return io.to(client.id).emit(user.user_id, action);
          }
        })
      });

      // Emit default message only when server_id is default one
      const serverName = msg.server.split('-')[0];
      if (serverName.toLowerCase() === "default")
        io.emit('default', msg);
    });

    // Listens for private messages
    socket.on('simple-chat-private-message', async (message) => {

      // Find userId for username we are messaging
      const from = await sql.query(`SELECT user_id from users WHERE user_name = ${sql.escape(message.from)}`);
      const to = await sql.query(`SELECT user_id from users WHERE user_name = ${sql.escape(message.to)}`);
      sql.query(`INSERT INTO user_messages (user_from, user_to, msg) VALUES (${sql.escape(from[0].user_id)}, ${sql.escape(to[0].user_id)}, ${sql.escape(message.msg)})`);

      // Emit message to the recipient
      let action = { type: "private-message", payload: { from: message.from, to: message.to, msg: message.msg, user: message.from } };
      // Find socket ID with our userId
      clients.find((client) => {
        if (client.userId === to[0].user_id) {
          io.to(client.id).emit(to[0].user_id, action);
        }
      })

      // Emit message back to sender
      action = { type: "private-message", payload: { from: message.from, to: message.to, msg: message.msg, user: message.to } };
      clients.find((client) => {
        if (client.userId === from[0].user_id) {
          io.to(client.id).emit(from[0].user_id, action);
        }
      })
    });


    // When user signs in he sends over his userId
    // Add to list of clients userId to identify socket.id
    socket.on('simple-chat-sign-in', function (userId) {
      // Keep track of session userId to eventually remove from list of clients
      sessionUserId = userId;
      let clientInfo = new Object();
      clientInfo.userId = sessionUserId;
      clientInfo.id = socket.id;
      clients.push(clientInfo);
      var date = new Date();
      sql.query(`UPDATE users SET user_last_active = ${sql.escape(date)} WHERE user_id = ${sql.escape(userId)}`);
    })

    // On disconnect remove from client list
    socket.on('disconnect', function () {
      clients.find((client, i) => {
        if (client.userId === sessionUserId) {
          return clients.splice(i, 1);
        }
      })
    })


  });


  // Server listen on Port
  http.listen(PORT, function () {
    console.log(`API Listening on ${PORT}`);
  });

  // Express API Setup
  app.disable('x-powered-by');
  app.use(cors());

  // Log the routes
  app.use((req, res, next) => {
    console.log(`${new Date().toString()} => ${req.originalUrl}`);
    next();
  });

  // Middleware for routes
  app.use(userRouter);
  app.use(serverRouter);
  app.use(channelRouter);
}

main();