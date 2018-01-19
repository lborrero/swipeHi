var obj = {
   table: []
};

//obj.table.push({id: 1, square:2});

var json = JSON.stringify(obj);

var fs = require('fs');

fs.open('myjsonfile.json', 'w', function (err, file) {
  if (err) throw err;
  console.log('Saved!');
});

function saveFile(){
	fs.readFile('myjsonfile.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        console.log(err);
	    } else {
	    obj = JSON.parse(data); //now it an object
	     //add some data
	    json = JSON.stringify(obj); //convert it back to json
	    fs.writeFile('myjsonfile.json', json, 'utf8', function(err){
		if (err) throw err;
			console.log('saved');
		});
	}});
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
	else
		throw 'createUser -- user exists';
}

exports.createUser = createUser;
exports.obj = obj;