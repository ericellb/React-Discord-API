// Dependencies
let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let dotenv = require('dotenv');
let cors = require('cors');

// Routes
let userRouter = require('./routes/user');
let serverRouter = require('./routes/server');

// Config for env variables
dotenv.config();
const PORT = process.env.PORT || 3001;

// Socket server listen and rebrodcast
io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('simple-chat', function (msg) {
    console.log("Message Received and Broadcasting : " + JSON.stringify(msg));
    io.emit('simple-chat', msg);
  });
});

// Server listen on Port
http.listen(PORT, function () {
  console.log(`API Listening on ${PORT}`);
});

// Setup express router
app.disable('x-powered-by');
app.use(cors());

// log routes requested
app.use((req, res, next) => {
  console.log(`${new Date().toString()} => ${req.originalUrl}`);
  next();
});

// Use routes
app.use(userRouter);
app.use(serverRouter);