'use strict';

var fs = require('fs');
var exists = require('fs-exists-sync');

var obj = {
	table: []
};

//initializing data base
if(exists('data.json'))
{
	fs.readFile('data.json', function(err, data){
		if (err) throw data;
		obj = JSON.parse(data);
		console.log(obj);
	});
}
else
{
    var json = JSON.stringify(obj); //convert it back to json
	fs.writeFile('data.json', json, 'utf8', function(err){
		if (err) throw err;
		console.log('created');
	});
}

function saveFile(){
    json = JSON.stringify(obj, null, 2); //convert it back to json
    fs.writeFile('data.json', json, 'utf8', function(err){
		if (err) throw err;
		console.log('saved');
	});
};

function createUser(_userName){
	var found = obj.table.find(function(el){
		return el === _userName;
	});
	if(!found)
	{
		obj.table.push({userName: _userName});
		saveFile();
	}
}

exports.createUser = createUser;
exports.obj = obj;