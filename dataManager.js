'use strict';

var fs = require('fs');
var exists = require('fs-exists-sync');

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

function createUser(_userName){
	var found = obj.table.find(function(el){
		//console.log(el.userName + " " + _userName + " = " + (el.userName === _userName));
		return el.userName === _userName;
	});
	if(!found)
	{
		obj.table.push({userName: _userName});
		saveFile();
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

exports.addLocationToUser = addLocationToUser;
exports.createUser = createUser;
exports.obj = obj;