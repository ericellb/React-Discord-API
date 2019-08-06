var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('simple-chat', function (msg) {
    console.log("Message Received and Broadcasting : " + JSON.stringify(msg));
    io.emit('simple-chat', msg);
  });
});

http.listen(3001, function () {
  console.log('listening on :3001');
});