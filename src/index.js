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

  const servers = await sql.query('SELECT server_name FROM servers');
  io.on('connection', function (socket) {
    console.log('User connected to Server')
    servers.forEach((server) => {
      socket.on(server.server_name, function (msg) {
        console.log(`Message received for server ${server.server_name} and Rebroadcasting message : ` + JSON.stringify(msg));
        io.emit(server.server_name, msg);
      });
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