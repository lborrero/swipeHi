//Server
'use strict';

// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var dataManager = require('./dataManager.js');
var positionLog = require('./positionLog.js');
var MathUtil = require('./MathUtil.js');

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom
var numUsers = 0;

io.on('connection', function (socket) {
  console.log('A client just joined on', socket.id);
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  socket.on('check user', function (userId) {
      console.log("checking user: " + userId);
      if(dataManager.findUserById(userId)){
          console.log("user found in data");
          socket.emit('is user', {
            isUser: true
        })
      }
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    var userId = MathUtil.getRandomInt(1000000);
    dataManager.createUser(username, userId);
    addedUser = true;
    // echo globally (all clients) that a person has connected
    socket.emit('user joined', {
      username: socket.username,
      userId: userId 
    });
  });

  //when the user sends their location, we save it to the live data base
  socket.on('add location', function(data) {
    dataManager.addLocationToUser(data);
    console.log('addedLocation');
    socket.broadcast.emit('new message', {
      username: 'leo',
      message: data.position.coords.longitude + " " + data.position.coords.latitude
    });
  });

  socket.on('log location', function(data) {
    positionLog.logLocation(data);
    console.log('Log this location ' + data);
    console.log(positionLog.topTenLocations());
    socket.emit('update location log', positionLog.topTenLocations());
    socket.broadcast.emit('update location log', positionLog.topTenLocations());
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
