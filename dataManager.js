'use strict';

var fs = require('fs');
var exists = require('fs-exists-sync');
var MathUtil = require('./MathUtil.js');

var path = "data/";

var obj = {
	table: []
};

//initializing data base
if(exists(path + 'data.json'))
{
	fs.readFile(path + 'data.json', function(err, data){
		if (err) throw data;
		obj = JSON.parse(data);
		console.log(obj);
	});
}
else
{
	var json = JSON.stringify(obj); //convert it back to json
	fs.writeFile(path + 'data.json', json, 'utf8', function(err){
		if (err) throw err;
		console.log('created');
	});
}

function saveFile(){
    json = JSON.stringify(obj, null, 2); //convert it back to json
    fs.writeFile(path + 'data.json', json, 'utf8', function(err){
		if (err) throw err;
		console.log('saved');
	});
};

function findUserById(_userId){
	var found = obj.table.find(function(el){
		//console.log(el.userId + " " + _userId + " = " + (el.userId == _userId) );
		return el.userId == _userId;
	}) != null;
	console.log("findUserById: " + found);
	return found;
}

function getUserById(_userId){
	return obj.table.find(function(el){
		return el.userId == _userId;
	});
}

function createUser(_username, _userId){
	if(!findUserById(_userId))
	{
		obj.table.push({
			username: _username,
			userId: _userId
		});
		saveFile();
	}
	else
	{
		throw "Random Id Matched!";
	}
}

function updateUserCardInfo(data){
	var user;
	obj.table.find(function(el){
		user = el;
		return el.userId == data.userId;
	})
	if(data.userId == null)
	{
		return null;
	}
	if(findUserById(data.userId))
	{
		user.username = data.username;
		user.card = data.card;
		saveFile();
	}
	else
	{
		console.log('no id found: ' + data.userId);
	}
}

function addLocationToUser(data){
	console.log(data);
	var user;
	var found = obj.table.find(function(el){
		user = el;
		return el.username === data.username;
	});
	if(found)
	{
		user.position = data.position;
		saveFile();
	}
}

exports.findUserById = findUserById;
exports.getUserById = getUserById;
exports.addLocationToUser = addLocationToUser;
exports.createUser = createUser;
exports.updateUserCardInfo = updateUserCardInfo;
exports.obj = obj;