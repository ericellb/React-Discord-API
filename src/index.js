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

  // Create socket
  io.on('connection', function (socket) {
    var userId = null;

    // If user is connected to socket and established connection with his userId
    // We will update his user_last_active every 5 minutes
    setInterval(async () => {
      if (userId !== null) {
        var date = new Date();
        sql.query(`UPDATE users SET user_last_active = ${sql.escape(date)} WHERE user_id = ${sql.escape(userId)}`);
      }
    }, 5 * 60000)

    // Listens for new messages
    socket.on('simple-chat-new-message', async (msg) => {
      // Store messsage in the DB
      let sqlQuery = `INSERT INTO messages (channel_id, user_name, msg) VALUES (${sql.escape(msg.channel.split('-')[1])}, ${sql.escape(msg.from)}, ${sql.escape(msg.msg)})`;
      sql.query(sqlQuery);
      const serverId = msg.server.split('-')[1];

      // Emit messages to only users part of specific server
      // Will only return list of users part of server and active in last 10 minutes
      sqlQuery = `SELECT userservers.user_id FROM userservers 
                  JOIN users ON users.user_id = userservers.user_id AND users.user_last_active > (NOW() - INTERVAL 10 minute)
                  WHERE server_id = ${sql.escape(serverId)}`;
      const users = await sql.query(sqlQuery);
      users.forEach((user) => {
        action = { type: "message", payload: msg };
        io.emit(user.user_id, action);
      });

      // Emit default message only when server_id is default one
      const serverName = msg.server.split('-')[0];
      if (serverName.toLowerCase() === "default")
        io.emit('default', msg);
    });

    // Listens for private messages
    socket.on('simple-chat-new-private-message', async (msg) => {
      // Find userId for username we are messaging
      const from = await sql.query(`SELECT user_id from users WHERE user_name = ${sql.escape(msg.from)}`);
      const to = await sql.query(`SELECT user_id from users WHERE user_name = ${sql.escape(msg.to)}`);
      sql.query(`INSERT INTO user_messages (user_from, user_to, msg) VALUES (${sql.escape(from[0].user_id)}, ${sql.escape(to[0].user_id)}, ${sql.escape(msg.text)})`);

      // Emit message to user (if hes online will receive it )
      // Otherwise he will fetch it upon login with rest of data
      const action = { type: "private-message", payload: msg };
      io.emit(to[0].user_id, action);
    });


    // When users Logs in, he sends us his userId
    // We can use this to know a user is now Active and properly connected
    // Update his user with current date
    socket.on('simple-chat-userId', function (msg) {
      console.log(msg);
      var date = new Date();
      sql.query(`UPDATE users SET user_last_active = ${sql.escape(date)} WHERE user_id = ${sql.escape(msg)}`);
      userId = msg;
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