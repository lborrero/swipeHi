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
		//console.log(el.userName + " " + _userName + " = " + (el.userName === _userName));
		return el._userId === _userId;
	});
	return found;
}

function createUser(_userName, _userId){
	var found = obj.table.find(function(el){
		//console.log(el.userName + " " + _userName + " = " + (el.userName === _userName));
		return el._userId === _userId;
	});
	if(!found)
	{
		obj.table.push({
			userName: _userName,
			userId: _userId
		});
		saveFile();
	}
	else
	{
		throw "Random Id Matched!";
	}
}

function addLocationToUser(data){
	console.log(data);
	var user;
	var found = obj.table.find(function(el){
		user = el;
		return el.userName === data.username;
	});
	if(found)
	{
		user.position = data.position;
		saveFile();
	}
}

exports.findUserById = findUserById;
exports.addLocationToUser = addLocationToUser;
exports.createUser = createUser;
exports.obj = obj;