var mongodb = require('mongodb');
var dbServer; 
var db;

/**
 * MongoDB 서버에 연결한다. 
 */
function connectToMongoDB(serverInfo, socket, callback){
	dbServer = new mongodb.Server(serverInfo.server, serverInfo.port, {auto_reconnect: true});
	db = new mongodb.Db('B2MAX', dbServer);
	db.open(function(err, db) {
		if(!err) {
			console.log("-> Client has been connected to MongoDB!");
			callback(true);
		}else{
			console.log("Client failed to connect MongoDB!");
			callback(false);
		}
	});
}

//b2MongoDB.js
module.exports = {
		// MongoDB 서버에 연결한다. 
		connectToMongoDB: function (serverInfo, socket, callback) {
			connectToMongoDB(serverInfo, socket, callback);
		} 
};


