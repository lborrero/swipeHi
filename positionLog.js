'use strict';

var fs = require('fs');
var exists = require('fs-exists-sync');

var path = "data/";
var fileName = "positionLog.json";

var obj = {
	table: []
};

//initializing log base
if(exists(path + 'log.json'))
{
	fs.readFile(path + "positionLog.json", function(err, data){
		if (err) throw data;
		obj = JSON.parse(data);
		console.log(obj);
	});
}
else
{
	var json = JSON.stringify(obj); //convert it back to json
	fs.writeFile(path + "positionLog.json", json, 'utf8', function(err){
		if (err) throw err;
		console.log('created');
	});
}

function saveFile(){
    json = JSON.stringify(obj, null, 2); //convert it back to json
    fs.writeFile(path + "positionLog.json", json, 'utf8', function(err){
		if (err) throw err;
		console.log('saved');
	});
};

function logLocation(data){
	obj.table.unshift(data);
	saveFile();
}

function topTenLocations()
{
	var sentObj = {
		table: []
	};
	for (var i = 0; i < Math.min(obj.table.length, 10); i++) {
		sentObj.table.push(obj.table[i]);
	}
	return sentObj;
}

exports.logLocation = logLocation;
exports.topTenLocations = topTenLocations;
exports.obj = obj;