//Client
'use strict';
console.log('0.4');

function setCookie(cname,cvalue,exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookie(function1) {
    var user=getCookie("username");
    var userId=getCookie("userId");
    console.log("checkCookie: " + user + " " + userId)
    function1(user, userId);
}

//function binders
var goToAppBinder;
var previousScreenName;
var currentScreenName;

$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $inputLocation = $('.inputLocation'); //Get Location button
  var $logLocation = $('.logLocation'); //Log Location button
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $positions = $('.positions'); //Positions list
  var $inputMessage = $('.inputMessage'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page
  var $welcomeScreen = $('.welcome.screen'); //
  var $proximityScreen = $('.proximity.screen'); //
  var $userScreen = $('.user.screen'); //
  var $contactScreen = $('.contact.screen'); //
  var $contactProfileScreen = $('.profile.screen'); //

  // Prompt for setting a username
  var username;
  var userId;
  var userGeolocation = {};
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io();

  checkCookie(function (_username, _userId){ 
    //has user cookies
    if (_userId != null && _userId != "" && _userId != "undefined") {
      console.log("Cookies -- username: " + _username);
      socket.emit('check user', _userId);
    }
    //no user cookies
    else {
        goToApp("login");
        console.log("no user cookies");
    }
  });

  function updateCookies(_username, _userId){
    console.log("Cookies updated -- username: " + _username + ", id: " + _userId);
    setCookie("username", _username, 30);
    setCookie("userId", _userId, 30);
  }

  // Navigates (changes app state) to app main page
  goToAppBinder = function goToApp(_screenName){
    console.log('goToApp :' + _screenName);
    $welcomeScreen.hide();
    $proximityScreen.hide();
    $userScreen.hide();
    $contactScreen.hide();
    $contactProfileScreen.hide();
    $chatPage.hide();
    $loginPage.hide();

    switch(_screenName)
    {
      case "main":
        $chatPage.show();
        previousScreenName = currentScreenName;
        currentScreenName = _screenName;
        break;
      case "login":
        $loginPage.show();
        previousScreenName = currentScreenName;
        currentScreenName = _screenName;
        break;
      case "userScreen":
        $userScreen.show();
        previousScreenName = currentScreenName;
        currentScreenName = _screenName;
        break;
      case "welcome":
        $welcomeScreen.show();
        previousScreenName = currentScreenName;
        currentScreenName = _screenName;
        break;
      case "proximityScreen":
        $proximityScreen.show();
        previousScreenName = currentScreenName;
        currentScreenName = _screenName;
        break;
      case "contactScreen":
        $contactScreen.show();
        previousScreenName = currentScreenName;
        currentScreenName = _screenName;
        break;
      case "contactProfileScreen":
        $contactProfileScreen.show();
        previousScreenName = currentScreenName;
        currentScreenName = _screenName;
        break;
      case "back":
        goToApp(previousScreenName);
        break;
    }
  }

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());
    // If the username is valid
    if (username) {
      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  //Geolocation
  function getLocation(action) {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition( action );
      } else {
          console.log("Geolocation is not supported by this browser.");
      }
  }

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  //Displays location log
  function displayLocations(data) {
    $positions.empty();
    for (var i = 0; i < data.table.length; i++) {
      $positions.append("<li>" + 
        data.table[i].username +
        "-- " +
        "dist: " + 
        dist(userGeolocation.coords.longitude,
          userGeolocation.coords.latitude,
          data.table[i].coords.longitude,
          data.table[i].coords.latitude
          ) 
        + "m, " +
        (
        (userGeolocation.timestamp - data.table[i].timestamp)/1000 
        ) + "s ago</li>");
    }
    //console.log(data);
  }

  function dist(lon1, lat1, lon2, lat2){  // generally used geo measurement function
    var R = 6378.137; // Radius of earth in KM
    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000; // meters
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).html();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  //Get Location
  $inputLocation.click(function() {
    getLocation(function (position) {
              userGeolocation = position;
              console.log("Geolocation: " + userGeolocation.coords.latitude + ", " + userGeolocation.coords.longitude);
              console.log(position);
              // Tell the server your location
              socket.emit("add location", {
                username: username,
                position: {
                  coords: {
                    latitude: userGeolocation.coords.latitude,
                    longitude: userGeolocation.coords.longitude
                  },
                  timestamp: userGeolocation.timestamp
                }
              });
          });
  });

  //log Location
  $logLocation.click(function() {
    console.log("Swipe Clicked: " + username);
    getLocation(function (position) {
              userGeolocation = position;
              console.log("Got geolocation");
              socket.emit("log location", {
                  userId: userId,
                  username: username,
                  coords: {
                    latitude: userGeolocation.coords.latitude,
                    longitude: userGeolocation.coords.longitude
                  },
                  timestamp: userGeolocation.timestamp
              });
          });
  });

  // Socket events

  // User confirms with the server they are user
  socket.on('is user', function (data) {
    connected = true
    console.log("is user: " + getCookie("username"));
    username=getCookie("username");
    userId=getCookie("userId");
    goToAppBinder("welcome");
  }) 

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
    log(message, {
      prepend: true
    });
  });
  
  // Whenever the server emits 'update location log', update the chat body
  socket.on('update location log', function (data) {
    console.log('locations recieved' + data);
    displayLocations(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    console.log('message recieved');
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    goToApp("main");
    updateCookies(data.username, data.userId);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  socket.on('disconnect', function () {
    log('you have been disconnected');
  });

  socket.on('reconnect', function () {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', function () {
    log('attempt to reconnect has failed');
  });

});
