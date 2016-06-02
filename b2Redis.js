var redis = require('redis');
var redisClient;

/**
 * Redis 접속 
 */
function connectToRedis(data, callback){

	var server = data.server;
	var port = data.port;

	redisClient = redis.createClient(port, server);

	redisClient.on('error', function (err) {
		callback(false);
		console.log('Error ' + err);
	});

	redisClient.on('connect', function () {
		console.log("Client has been connected to Redis Server");
		callback(true);
	});
}

/**
 * Redis서버의 모든 Key값들을 가져온다. 
 */
function getAllKeys(callback){
	redisClient.keys('*', function (err, keys) {
		if (err){
			return console.log(err);
		}
		callback(keys);
		for(var i = 0, len = keys.length; i < len; i++) {
			console.log(keys[i]);
		}
	});
}

/**
 * Redis서버의 해당Key값의 Value들을 가져온다. 
 */
function getValue(key, callback){
	redisClient.get(key, function(err, reply){
		callback(reply);
	});
}

/**
 * Redis서버에 Key, Value 데이터 삽입
 */
function insertData(insertDataObj, callback){
	var key = insertDataObj.key;
	var value = insertDataObj.value;
	
	redisClient.set(key, value, function(err, reply){
		console.log(reply);
		callback(reply);
	});
}

//b2Redis.js
module.exports = {
		// Redis서버의 모든 Key값들을 가져온다. 
		connectToRedis: function (data, callback) {
			connectToRedis(data, callback);
		},
		// Redis서버의 모든 Key값들을 가져온다. 
		getAllKeys: function (callback) {
			getAllKeys(callback);
		}, 
		// Redis서버의 모든 Key값들을 가져온다. 
		getValue: function (key, callback) {
			getValue(key, callback);
		},
		// Redis서버에 Key, Value 데이터 삽입
		insertData: function (insertDataObj, callback) {
			insertData(insertDataObj, callback);
		}
};


