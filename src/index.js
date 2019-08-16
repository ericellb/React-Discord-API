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

    // Listens for chat updates
    socket.on('simple-chat-message', async (msg) => {
      // Store messsage in the DB
      let sqlQuery = `INSERT INTO messages (channel_id, user_name, msg) VALUES ('${msg.topic.split('-')[1]}', '${msg.from}', '${msg.msg}')`;
      sql.query(sqlQuery);

      // Emit messages to only users part of specific server
      const serverId = msg.server.split('-')[1];
      sqlQuery = `SELECT user_id from userservers WHERE server_id = '${serverId}'`;
      const users = await sql.query(sqlQuery);
      users.forEach((user) => {
        console.log(user.user_id);
        io.emit(user.user_id, msg);
      });

      // Emit default message only when server_id is default one
      const serverName = msg.server.split('-')[0];
      if (serverName.toLowerCase() === "default")
        io.emit('default', msg);
    });

    // Listens for userId updates
    socket.on('simple-chat-userId', function (msg) {
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