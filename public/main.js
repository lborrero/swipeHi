//Client
'use strict';
console.log('0.4');

  var username;
  var userId;
  var userContactList = [];

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
    $("#statusMessage").text("checking cookies");
    var user=getCookie("username");
    var userId=getCookie("userId");
    console.log("checkCookie: " + user + " " + userId)
    function1(user, userId);
}

function saveToServer(savePlace, value){
  switch(savePlace)
    {
      case "userScreen":
        $("#statusMessage").text("checking cookies");
        console.log("saveToServer: " + savePlace);
        console.log("saveToServer: " + value.elements.length);
        var userInfo = {
          userId: userId,
          username: value.elements[0].value,
          card: {
            mobile: value.elements[1].value,
            email: value.elements[2].value,
          }
        };
        socket.emit('update user card data', userInfo);
        break;
      case "proximityScreen":
        $("#statusMessage").text("adding contact to user contact list");
        $('.contactItem:checked').each(function( index ) {
          console.log( index + ": " + $( this ).val() );
          if($( this ).val() != null)
          {
            socket.emit('add to user contacts list', {
              userId: userId,
              contactId: $( this ).val()
            });
          }
        });
        break;
    }
}


var socket = io();

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
  
  var $loginPage = $('.login.screen'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page
  var $welcomeScreen = $('.welcome.screen'); //
  var $proximityScreen = $('.proximity.screen'); //
  var $userScreen = $('.user.screen'); //
  var $contactScreen = $('.contact.screen'); //
  var $contactProfileScreen = $('.profile.screen'); //

  // Prompt for setting a username
  var userGeolocation = {
        coords: {
          latitude: 0,
          longitude: 0
        },
        timestamp: 0
      };
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

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
        break;
      case "login":
        $loginPage.show();
        break;
      case "userScreen":
        $userScreen.show();
        socket.emit('get user card info', userId);
        break;
      case "welcome":
        $welcomeScreen.show();
        $('.welcome.screen .usernameLabel').text(username);
        break;
      case "proximityScreen":
        $proximityScreen.show();
        socket.emit('get user card info', userId);
        break;
      case "contactScreen":
        $contactScreen.show();
        $("#statusMessage").text("getting contacts");
        socket.emit('get user contacts', userId);
        break;
      case "contactProfileScreen":
        $contactProfileScreen.show();
        break;
      case "back":
        goToApp(previousScreenName);
        break;
    }
    if( 
      _screenName != previousScreenName)
    {
      previousScreenName = currentScreenName;
      currentScreenName = _screenName;
    }
  }

  checkCookie(function (_username, _userId){ 
    //has user cookies
    if (_userId != null && _userId != "" && _userId != "undefined") {
      console.log("Cookies -- username: " + _username);
      $("#statusMessage").text("cookies found. checking user info with server");
      socket.emit('check user', _userId);
    }
    //no user cookies
    else {
        goToAppBinder("login");
        console.log("no user cookies");
    }
  });

  function updateCookies(_username, _userId){
    console.log("Cookies updated -- username: " + _username + ", id: " + _userId);
    setCookie("username", _username, 30);
    setCookie("userId", _userId, 30);
  }

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());
    console.log("setUsername: " + $usernameInput.val());
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
          $("#statusMessage").text("Geolocation is not supported by this device");
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
    $("#statusMessage").text("displaying nearby");
    console.log(data.table[0].coords);
    $positions.empty();
    for (var i = 0; i < data.table.length; i++) {
      var _geoData;
      var _timeData;
      if (userGeolocation.coords != null &&
          userGeolocation.timestamp != null) {
        _geoData = dist(userGeolocation.coords.longitude,
            userGeolocation.coords.latitude,
            data.table[i].coords.longitude,
            data.table[i].coords.latitude
            );
        _timeData = (userGeolocation.timestamp - data.table[i].timestamp)/1000;
      }
      if(data.table[i].userId != userId)
      {
        $positions.append("<li><label>" + 
          data.table[i].username +
          /*"-- " +
          "dist: " + 
          _geoData + 
          "m, " +
          _timeData + "s ago" + */
          "<input class='contactItem' type='checkbox' value='" + data.table[i].userId + "' name='" + data.table[i].username + "'>" + 
          "</label></li>");
      }
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
      console.log('ENTER Pressed');
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

  //log Location
  $logLocation.click(function() {
    console.log("Swipe Clicked: " + username);
    if(userGeolocation != null){
      console.log('already have geolocation');
      var d = new Date();
      var n = d.getTime();
      userGeolocation.timestamp = n;
      socket.emit("log location", {
          userId: userId,
          username: username,
          coords: {
            latitude: userGeolocation.coords.latitude,
            longitude: userGeolocation.coords.longitude
          },
          timestamp: userGeolocation.timestamp
      });
    }else{
      $("#statusMessage").text("getting your geolocation from device");
      userGeolocation = {};
      getLocation(function (position) {
        userGeolocation.coords = position.coords;
        userGeolocation.timestamp = position.timestamp;
        console.log("Got geolocation: " + userGeolocation.coords.latitude);
        $("#statusMessage").text("getting others geolocation");
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
    }
  });

  // Socket events

  // User confirms with the server they are user
  socket.on('is user', function (data) {
    connected = true
    $("#statusMessage").text("welcome");
    console.log("is user: " + data.username);
    setCookie(data.username, data.userId);
    username=data.username;
    userId=data.userId;
    $('.welcome.screen .usernameLabel').text(username);
    goToAppBinder('welcome');
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

  socket.on('recieve user card info', function (value) {
    $("#statusMessage").text("card info update");
    console.log('recieved card info');
    username = value.username;
    $(".user.screen #usernameValue").val(value.username);
    updateCookies(value.username, value.userId);
    if(value.card != null)
    {
      $(".user.screen .card input[name='mobile']").val(value.card.mobile);
      $(".user.screen .card input[name='email']").val(value.card.email);
      $(".proximity.screen .card .cardTitle").text(value.username + "'s card");
      $(".proximity.screen .card .mobile").text(value.card.mobile);
      $(".proximity.screen .card .email").text(value.card.mobile);
    }
  });

  socket.on('contact added to user list', function(value){
    $("#statusMessage").text("userId " + value.userId + value.username + " added to contact list");
    /*.contactItem  input[value='" + _userId + "']*/
    $("input.contactItem:checked").parent("label").addClass("isMyContact");
  });

  socket.on('here are user contact', function(data){
    $("#statusMessage").text("recieved contacts");
    $(".contact.screen .contactList").empty();
    for (var i = 0; i < data.length; i++) {
      $(".contact.screen .contactList").append(
        "<li class='contactListItem' value='" + 
        data.userId + 
        "'>" + 
        data[i].username +
        "</li>");
    }
  });
  
  // Whenever the server emits 'update location log', update the chat body
  socket.on('update location log', function (data) {
    console.log('locations recieved: ' + data.table);
    displayLocations(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    console.log('message recieved');
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    updateCookies(data.username, data.userId);
    goToAppBinder('welcome');
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
