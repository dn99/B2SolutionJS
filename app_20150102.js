//모듈 dependencies 2
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var pf = require('policyfile').createServer();
var io = require('socket.io').listen(server);
var uuid = require('node-uuid');
var Room = require('./room.js');
var User = require('./user.js');
var Document = require('./document.js');
var Config = require('./config.js');
var _ = require('underscore')._;
var b2MongoDB = require('./b2MongoDB');
var b2Redis = require('./b2Redis');
var fs = require('fs');

//Socket.IO 설정
io.set('transports', ['websocket', 
                      'flashsocket', 
                      'htmlfile', 
                      'xhr-polling', 
                      'jsonp-polling',
                      'polling']);

//개발버전 서버세팅
if ('development' == app.get('env')) {
	app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 1899);
	app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || process.env.OPENSHIFT_INTERNAL_IP);
	app.set('lobbyID', '6fa459ea-ee8a-3ca4-894e-db77e160355e');
}

//서비스버전 서버세팅 
if ('production' == app.get('env')) {
	app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 1788);
	app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');
}

//서버시작
server.listen(app.get('port'), app.get('ipaddr'), function() {
	console.log('Express server listening on  IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));
});


//Socket.IO 연결성공시
io.on('connection', function () {
	console.log('Socket is connected.');
});

////FlashPolicyFileServer 시작
pf.listen(843, function(){
console.log('Flash Policy Server has been started.');
});

//변수정의
var rooms = {};
var users = {};
var sockets = {};
var lobbyID = app.get('lobbyID');
var chatHistory = {};

//Config설정파일 생성
var config = new Config();

//Lobby 생성
var room = new Room({roomID: lobbyID, roomName: 'Lobby'});
rooms[lobbyID] = room;


/**
 * User등록
 */
function registerUser(socket, connectInfo, callback) {

	console.log("----------- connectInfo.userLevel : " + connectInfo.userLevel);
	console.log("----------- connectInfo.userName : " + connectInfo.userName);
	var userID = 'user_' + uuid.v4();															// 01) userID생성
	var user = new User(connectInfo);															// 02) user객체생성
	user.userID = userID;																		// 03) user객체에 userID 세팅
	user.ip = socket.handshake.address;															// 04) user객체에 ip 세팅
	user.startTime = currentTime();																// 05) user객체에 접속시간 세팅
	users[socket.id] = user;																	// 06) users배열에 socket.id를 키로 user객체 맵핑
	sockets[userID] = socket.id;
	socket.user = user;																			// 07) socket객체에 user객체 대입
	callback(userID);																			// 08) userID를 접속User에게 콜백
	console.log("----------- user.userLevel : " + user.userLevel);
	console.log('registerUser user : ' + JSON.stringify(user));
	//console.log('registerUser - userID: ' + user.userID + ', userName: ' + user.userName + ', ip: ' + user.ip + ', device: ' + user.device + ', startTime: ' + user.startTime + ', userLevel: ' + user.userLevel + ', userType: ' + user.userType + ', mode: ' + user.mode);
}


///**
// * User삭제 
// */
//function unregisterUser(socket) {
//	var roomID = socket.roomID;																						// 01) 퇴장한 user의 roomID 대입
//	var user = socket.user;																							// 02) 퇴장한 user의 user객체 대입
//	rooms[roomID].removeUser(user);																					// 03) rooms배열의 해당room의 user삭제
//	delete sockets[socket.user.userID];
//	if(roomID == lobbyID){
//		socket.broadcast.to(roomID).emit('updateLobbyUserlist', rooms[roomID].userList);							// 04) 해당방의 UserList를 업데이트	
//	}else{
//		socket.broadcast.to(roomID).emit('updateUserlist', rooms[roomID].userList);		
//	}
//	checkRoom(socket);																								// 05) user가 해당방에 존재하지 않으면 room 삭제
//	socket.broadcast.to(roomID).emit('isTyping', {isTyping: false, userID: user.userID, userName: user.userName});	// 06) 방 퇴장시 Typing이 아님을 알림(타임핑중 갑자기 퇴장했을경우)
//	//console.log('unregisterUser - userID : ' + socket.user.userID + ', userName : ' + socket.user.userName);
//}


/**
 * room에 user가 존재하지 않을경우 room삭제 
 */
function checkRoom(socket) {
	if(socket.roomID == lobbyID) return;													// 01) lobby는 항상 존재해야 함
	var clients = io.sockets.adapter.rooms[socket.roomID]; 									// 02) 해당Room의 user정보들을 담은 객체생성
	var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;	// 03) userLength를 구함
	if(numClients == 0){	
		delete rooms[socket.roomID];														// 04) userLength가 0이면 해당room 삭제
		delete chatHistory[socket.roomID];													// 05) userLength가 0이면 해당room chatHistory 삭제
	}
	socket.broadcast.to(lobbyID).emit('updateRoomList', rooms);								// 06) Lobby사용자들에게 RoomList업데이트	
}


/**
 * 현재시간을 구한다. 
 */
var currentTime = function() {
	var date = new Date(); 
	var datetime =  date.getDate() + '/' + (date.getMonth()+1)  + '/' + date.getFullYear() + ' @ ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
	return datetime;
}

/**
 * 문자열 모든문자열에 대해 치환 
 */
String.prototype.replaceAll = function(rgExp, replaceText){
	var strOriginal = this;  
	
	while(strOriginal.indexOf(rgExp) > -1){
		strOriginal = strOriginal.replace(rgExp,replaceText);
	}
	return strOriginal;
}

/**
 * 방 생성
 */
function createRoom(socket, roomInfo, callback) {

	console.log('roomInfo : ' + JSON.stringify(roomInfo));

	var roomID = 'room_' + uuid.v4();															// 01) roomID를 생성
	var roomName = roomInfo.roomName;															// 02) roomName 초기화
	var roomType = roomInfo.roomType;															// 03) roomType 초기화
	rooms[lobbyID].removeUser(socket.user);														// 04) rooms배열의 Lobby방의 user객체 제거 
	socket.broadcast.to(socket.roomID).emit('updateLobbyUserlist', rooms[lobbyID].userList);	// 05) Lobby의 User들에게 UserList공유 
	socket.leave(lobbyID);																		// 06) Lobby 퇴장
	socket.join(roomID);																		// 07) 새로운 Room에 입장
	socket.roomID = roomID;																		// 08) 새로운 RoomID를 socket객체에 대입	
	roomInfo.roomID = roomID;																	// 09) room객체생성
	var room = new Room(roomInfo);																
	rooms[roomID] = room;																		// 10) rooms배열에 room객체 맵핑
	socket.user.userLevel = 0;																	// 11) 방생성자 UserLevel을 0으로 세팅
	console.log('roomInfo.roomInfoVO : ' + JSON.stringify(roomInfo.roomInfoVO));
	if( roomInfo.roomInfoVO != null ) socket.user.userType = roomInfo.roomInfoVO.userType;
	rooms[roomID].addUser(socket.user);															// 12) rooms배열의 해당room에 user객체추가
	callback(room);																				// 13) 방생성자에게 room정보객체 콜백 
	io.sockets.in(roomID).emit('updateUserlist', rooms[roomID].userList);						// 14) 해당방의 UserList를 업데이트 시킨다.
	socket.broadcast.to(lobbyID).emit('updateRoomList', rooms);									// 15) Lobby의 User들에게 rooms정보 공유
	chatHistory[roomID] = [];																	// 16) 채팅정보를 담는객체 초기화
	console.log('room : ' + JSON.stringify(room));
}


/**
 * 최초 로그인
 */
function joinLobby(socket, roomID) {
	console.log("로비입장");
	socket.join(roomID);														// 01) Lobby에 입장
	socket.roomID = roomID;														// 02) socket객체에 roomID 대입
	rooms[roomID].addUser(socket.user);											// 03) rooms배열의 해당방에 user객체 추가
	io.sockets.in(lobbyID).emit('updateLobbyUserlist', rooms[roomID].userList);	// 04) Lobby의 User들에게 UserList공유 
	socket.emit('updateRoomList', rooms);										// 05) 입장하는 User의 RoomList를 업데이트 
	console.log('RoomList : ' + JSON.stringify(rooms));
}


/**
 * Room <-> Lobby 
 */
function joinRoom(socket, joinInfo) {
	var roomID = joinInfo.roomID;
	var userType = joinInfo.userType;
	console.log('!!!!!!!!!!! roomID : ' + joinInfo.roomID + "    userType : " + userType);
	// Room -> Lobby
	if(roomID == lobbyID){
		console.log('Room -> Lobby');
		rooms[socket.roomID].removeUser(socket.user);												// 01) 기존Room의 UserList에 해당 User객체 제거
		socket.broadcast.to(socket.roomID).emit('updateUserlist', rooms[socket.roomID].userList);	// 02) 제거된 UserList를 기존Room의 User들에게 공유
		socket.leave(socket.roomID);																// 03) 기존Room에 퇴장 
		socket.join(roomID);																		// 04) Lobby Room에 접속
		socket.roomID = roomID;																		// 05) socket객체에 roomID 대입
		socket.user.userType = userType;
		rooms[roomID].addUser(socket.user);															// 06) rooms배열의 해당방에 user객체 추가 
		io.sockets.in(roomID).emit('updateLobbyUserlist', rooms[roomID].userList);					// 07) 해당방의 User들에게 UserList공유
		socket.broadcast.to(lobbyID).emit('updateRoomList', rooms);									// 08) Lobby의 User들에게 rooms정보 공유 
		// Lobby -> Room
	}else{
		console.log('Lobby -> Room');
		rooms[socket.roomID].removeUser(socket.user);												// 01) Lobby의 UserList에 해당 User객체 제거
		io.sockets.in(socket.roomID).emit('updateLobbyUserlist', rooms[socket.roomID].userList);	// 02) 제거된 UserList를 Lobby의 User들에게 공유
		socket.leave(socket.roomID);																// 03) LobbyRoom에 퇴장 
		socket.join(roomID);																		// 04) 새로운 Room에 접속
		socket.roomID = roomID;																		// 05) socket객체에 roomID 대입
		socket.user.userType = userType;
		console.log('socket.user : ' + JSON.stringify(socket.user));
		rooms[roomID].addUser(socket.user);															// 06) rooms배열의 해당방에 user객체 추가 
		socket.broadcast.to(roomID).emit('updateUserlist', rooms[roomID].userList);					// 07) 해당방의 User들에게 UserList공유
		socket.broadcast.to(lobbyID).emit('updateRoomList', rooms);									// 08) Lobby의 User들에게 rooms정보 공유 
		socket.emit('receiveChatHistory', chatHistory[socket.roomID]);								// 09) 새로 Room에 입장하는 User에게 채팅내역을 공유
	}
}


/**
 * Client 접속을 기다림 (이벤트호출 모니터링)
 */
io.sockets.on('connection', function (socket) {

	// 클라이언트가 접속에 성공하면 자동으로 호출되어야 하는데 자동으로 호출 안됨. 임시방편으로 Flex단에서 강제로 호출해줌
	socket.on('connect', function () {
		console.log('-> Client has been connected to Socket.IO, Total : ' + io.sockets.sockets.length);
	});

	// 클라이언트 접속이 끊기면 자동 호출됨.
	socket.on('disconnect', function () {
		console.log('<- Client ' + socket.id + ' has been disConnected to Socket.IO, Total : ' + io.sockets.sockets.length);
		unregisterUser(socket);
	});

	// 예상치 못한 접속이 끊길경우 세션이 안끊어지는 현상이 있는데, 이를 강제로 끊어준다. (모바일에서 3G <-> Wifi 전환시)
	socket.on('disConnectUnexpectedSession', function (unexpectedCloseSessionID) {
		if (io.sockets.connected[unexpectedCloseSessionID]){
			io.sockets.connected[unexpectedCloseSessionID].disconnect();
		}
	});

	// MongoDB에 접속한다.
	socket.on('connectToMongoDB', function (data, callback) {
		b2MongoDB.connectToMongoDB(data, socket, callback);

	});

	// Redis서버에 접속한다.
	socket.on('connectToRedis', function (data, callback) {
		b2Redis.connectToRedis(data, callback);		// Redis Server에 연결한다.
	});

	// 최초로그인시 User를 등록한다.
	socket.on('register', function(connectInfo, callback) {
		registerUser(socket, connectInfo, callback);
	});

	// 방에 로비에 접속한다.
	socket.on('joinLobby', function (roomID) {
		joinLobby(socket, roomID);
	});

	// 방에 접속한다.
	socket.on('joinRoom', function (roomID) {
		joinRoom(socket, roomID);
	});

	// 방을 생성한다.
	socket.on('createRoom', function (roomInfo, callback) {
		createRoom(socket, roomInfo, callback);
	});

	// Layout상태를 저장한다.
	socket.on('setLayout', function (layoutInfo) {
		rooms[socket.roomID].layout = layoutInfo;
		console.log('setLayout - ' + socket.roomID + ' - layoutMode : ' + rooms[socket.roomID].layout.layoutMode + ', layoutName: ' + rooms[socket.roomID].layout.layoutName + ', layoutIndex: ' + rooms[socket.roomID].layout.layoutIndex);
		io.sockets.in(socket.roomID).emit('layoutUpdate', layoutInfo);
	});

	// Layout상태를 가져온다.
	socket.on('getLayout', function (data, callback) {
		console.log('getLayout - ' + socket.roomID + ' - layoutMode : ' + rooms[socket.roomID].layout.layoutMode + ', layoutName: ' + rooms[socket.roomID].layout.layoutName + ', layoutIndex: ' + rooms[socket.roomID].layout.layoutIndex);
		callback(rooms[socket.roomID].layout);
	});

	// UserLevel을 업데이트 한다.
	socket.on('setSharedUserLevel', function (data) {
		rooms[socket.roomID].changeUserLevel(data);						// 서버에 UserLevel을 저장 (추후 입장 User에게 알리기위함)
		io.sockets.in(socket.roomID).emit('sharedUserLevel', data);		// UserLevel을 공유
	});

	// User권한을 업데이트 한다.
	socket.on('setSharedPower', function (data) {
		rooms[socket.roomID].changePower(data);
		io.sockets.in(socket.roomID).emit('sharedPower', data);
	});

	// 메시지를 보낸다.
	socket.on('sendMessage', function(messageObj){
		messageObj.roomID = socket.roomID;									// 01) 메세지객체에 정보세팅		
		messageObj.userID = socket.user.userID;								
		messageObj.userName = socket.user.userName;							
		messageObj.sendTime = currentTime();								
		messageObj.isNotification = false;								
		chatHistory[socket.roomID].push(messageObj);						// 02) 채팅내용저장	
		io.sockets.in(socket.roomID).emit('receiveMessage', messageObj);	// 03) 채팅내용공유
	});
	
	// 타이핑중임을 알린다.
	socket.on('isTyping', function(data){
		socket.broadcast.to(socket.roomID).emit('isTyping', {isTyping: data, userID: socket.user.userID, userName: socket.user.userName});			
	});
	
	// 미디어 on/off상태를 공유한다.
	socket.on('sendMediaState', function(data){
		data.userID = socket.user.userID;
		rooms[socket.roomID].updateMediaState(data); 
		io.sockets.in(socket.roomID).emit('updateMediaState', data);
	});
	
	// userlist를 가져온다.
	socket.on('getUserList', function(){
		socket.emit('updateUserlist', rooms[socket.roomID].userList);				
	});
	
	// 번역토글상태 공유
	socket.on('callViewTrans', function(data){
		var userID = socket.user.userID;
		var isSelected = data;
		var userInfo = {};
		userInfo.userID = userID;
		userInfo.isSelected = isSelected;
		socket.broadcast.to(socket.roomID).emit('callClientViewTrans', userInfo);
	});
	
	// 문서변환 완료 후, 업로드한 문서목록을 공유시킨다.
	socket.on('updateDoc', function(data){
		var doc = new Document();
		doc.docID = 'doc_' + uuid.v4();	
		doc.fileName = data.selectedDoc.toString();
		doc.fileType = data.selectedDoc.toString().substr(data.selectedDoc.toString().lastIndexOf('.')+1, data.selectedDoc.toString().length);
		doc.swfFileName = data.selectedDoc.toString().substr(0,data.selectedDoc.toString().lastIndexOf('.')).toString().replaceAll(' ', '_') + '.swf';
		doc.uploaderUserID = socket.user.userID;
		doc.uploaderUserName = socket.user.userName;
		doc.uploadTime = currentTime();
		doc.totalPage = data.totalPage;
		rooms[socket.roomID].addDoc(new Document(doc));
		rooms[socket.roomID].selectedDoc = new Document(doc);
		io.sockets.in(socket.roomID).emit('updateDocList', {docList: rooms[socket.roomID].docList, selectedDoc: rooms[socket.roomID].selectedDoc});
	});
	
	socket.on('getDocList', function(data){
		if(fs.existsSync(data + socket.roomID)){
			socket.emit('updateDocList', {docList: rooms[socket.roomID].docList, selectedDoc: rooms[socket.roomID].selectedDoc});
			console.log("doclist2 : " + fs.readdirSync(data + socket.roomID));
		}
	});
	
	/******************************** 토론타입 전용 통신 시작 ***************************************************/
	
	// socket.broadcast.to(socket.roomID).emit 	: 자신을 제외한 해당방 전체 공유
	// io.sockets.in(socket.roomID).emit 		: 자신을 포함한 해당방 전체 공유
	// socket.emit								: 자신에게만 공유
	// io.to(socketID).emit						: 특정 유저만 호출
	
	
	// 토론 설정 항목 아이템 공유.
	socket.on('callDebateItemList', function(data){
		console.log('debateItemList : ' + JSON.stringify(data));
		var debateItemList = data.list;
		rooms[socket.roomID].roomInfoVO.debateItemList = debateItemList;
		io.sockets.in(socket.roomID).emit('callClientDebateItemList', data.list);
	});
	
	// 토론 진행 프로세스 공유.
	socket.on('callControlDebateItemList', function(data){
		console.log('controlDebate : ' + JSON.stringify(data));
		var controlDebate = data;
		var roomID = socket.roomID;
		controlDebateItemList(roomID, controlDebate);
	});
	
	// 찬반투표 프로세스 공유.
	socket.on('callDebateVoteRequest', function(data){
		console.log('callDebateVoteRequest : ' + data);
		var voteType = data;
		io.sockets.in(socket.roomID).emit('callClientDebateVoteRequest', voteType);
	});
	
	// 찬반투표 결과 공유.
	socket.on('callDebateVoteResult', function(data){
		console.log('callDebateVoteResult : ' + data);
		var roomID = socket.roomID;
		var userID = socket.user.userID;
		var voteYesNo = data;
		var debateVoteUserList = getDebateVoteUserList(roomID, userID, voteYesNo);
		var debateVoteUserInfo = {};
		debateVoteUserInfo.userID = socket.user.userID;
		debateVoteUserInfo.debateVoteUserList = debateVoteUserList;
		io.sockets.in(socket.roomID).emit('callClientDebateVoteResult', debateVoteUserInfo);
	});
	
	// 발언권 요청 - TO 권한자.
	socket.on('callDebateSpeakRequest', function(data){
		console.log('callDebateSpeakRequest : ' + JSON.stringify(data));
		var roomID = socket.roomID;
		var requestUserID = data.userID;
		var userType = data.userType;
		var responseUserID = getPowerDebateUserID(roomID, userType);
		var socketID = sockets[responseUserID];
		console.log('responseUserID : ' + responseUserID + '   socketID : ' + socketID);
		io.to(socketID).emit('callClientDebateSpeakRequest', requestUserID);
	});
	
	// 발언권 요청 승인 - TO 요청자.
	socket.on('callDebateSpeakAllow', function(data){
		console.log('callDebateSpeakRequest : ' + JSON.stringify(data));
		var roomID = socket.roomID;
		var requestUserID = data;
		var socketID = sockets[requestUserID];
		console.log('requestUserID : ' + requestUserID + '   socketID : ' + socketID);
		io.to(socketID).emit('callClientDebateSpeakAllow');
	});

	// 토론 진행
	// 1. 클라이언트 호출 - 토론 시작 이벤트를 받아 낸다.
	// 2. debateItemList의 해당 인덱스에 enable 속성값을 설정한다. ( enable 표시상태 0, 활성상태 1, 비표시상태 2 )
	// 3. 변경된 debateItemList 데이타를 해당방 클라이언트에 내려준다.
	// 4. 해당방 클라이언트에서는 설정된 값으로 타이머 스타트를 걸어준다.
	// 4. 해당방 서버에서는 설정된 값으로 타이머 스타트를 걸어준다.
	// 5. 해당방 서버에서 타이머가 완료 되었다면 debateItemList의 다음 인덱스에 enable 속성값을 설정한다.
	// 5. 다음 인덱스가 마지막 인덱스 인지 체크하여 
	// 5. 마지막 인덱스라면 해당방 클라이언트에 enable 속성값을 초기화 하여 debateItemList 데이타를 해당방 클라이언트에 내려준다.
	// 5. 마지막 인덱스가 아니라면 2 -> 3 -> 4 -> 5 를 반복한다. 
	function controlDebateItemList(roomID, controlDebate)
	{
		// 타이머맵에 존재 여부 판단 후 해당 타이머를 정지 및 제거 시켜준다 - 타이머가 복수 존재 하여 여려 쓰레드 동작 방지
		clearDebateTime(roomID);
		
		// 해당방 debateItemList를 받아온다.
		var debateItemList = rooms[roomID].roomInfoVO.debateItemList;
		console.log('::: debateItemList : ' + JSON.stringify(debateItemList));
		
		// 활성화 시킬 항목 인덱스를 받아 온다.
		var enableIndex = getDebateItemEnableIndex( debateItemList );
		console.log("::: enableIndex : " + enableIndex);
		
		// 토론아이템 리스트에 enable 속성을 설정하고 마지막 항목인지 여부를 반환한다.
		var isDebateEnd = setDebateItemEnableIndex(debateItemList, enableIndex);
		console.log("::: isDebateEnd : " + isDebateEnd);
		
		console.log(':::>>> debateItemList : ' + JSON.stringify(debateItemList));
		
		var date = new Date();
		console.log(date.getFullYear() + "   " + date.getMonth() + "   " + date.getDate() + "    " + date.getHours() + "   " + date.getMinutes());
		
		var debateDate = {};
		debateDate.year = date.getFullYear();
		debateDate.month = date.getMonth() + 1;
		debateDate.date = date.getDate();
		debateDate.hours = date.getHours();
		debateDate.minutes = date.getMinutes();
		
		var debateItemListInfo = {};
		debateItemListInfo.controlDebate = controlDebate;
		debateItemListInfo.debateItemList = debateItemList;
		debateItemListInfo.isDebateEnd = isDebateEnd;
		debateItemListInfo.debateDate = debateDate;
		console.log(':::>>> controlDebate : ' + controlDebate);
		
		io.sockets.in(socket.roomID).emit("callClientControlDebateItemList", debateItemListInfo);

		if (isDebateEnd) return;
		
		var debateItemVO = debateItemList[enableIndex];
		console.log(':::>>> debateItemVO : ' + JSON.stringify(debateItemVO));
		
		setDebateTime("progress", debateItemVO);
	}
	
	// 토론 아이템 항목별 타이머 설정
	function setDebateTime(controlDebate, debateItemVO)
	{
		var roomID = socket.roomID;
		var period = ( debateItemVO.timeMin * 60 + debateItemVO.timeSec ) * 1000 + 1000;
		console.log("===================== period : " + period);

		// 타이머 생성 이후 roomID를 키로 하여 타이머맵에 담아둔다
		var timer = setTimeout(function() {
			controlDebateItemList(roomID, controlDebate);
		}, period);
		timerMap[roomID] = timer;
	}

	// 해당 토론방 타이머 제거
	function clearDebateTime(roomID)
	{
		console.log("============> timerMap.hasOwnProperty(roomID) : " + timerMap.hasOwnProperty(roomID));
		if ( timerMap.hasOwnProperty(roomID) ) 
		{
			var timer = timerMap[roomID];
			console.log("============> timer : " + timer);
			clearTimeout(timer);
			timer = null;
			delete timerMap[roomID];
		}
	}
	
	/******************************** 토론타입 전용 통신 끝 ***************************************************/
}); 

const USER_LEVEL_SUPER = 0;
const USER_LEVEL_NORMAL = 1;

/**
 * User삭제 
 */
function unregisterUser(socket) {
	if (socket === null) return;
	console.log('<- unregisterUser ' + socket.id);
	var roomID = socket.roomID;																						// 01) 퇴장한 user의 roomID 대입
	var user = socket.user;																							// 02) 퇴장한 user의 user객체 대입
	
	console.log('::::::: rooms[roomID] : ' + rooms[roomID] );
	if (rooms[roomID] === null) return;
	
	rooms[roomID].removeUser(user);																					// 03) rooms배열의 해당room의 user삭제
	delete sockets[socket.user.userID];
	
	setSuperLevel(socket);
	
	if(roomID == lobbyID){
		socket.broadcast.to(roomID).emit('updateLobbyUserlist', rooms[roomID].userList);							// 04) 해당방의 UserList를 업데이트	
	}else{
		socket.broadcast.to(roomID).emit('updateUserlist', rooms[roomID].userList);		
	}
	checkRoom(socket);																								// 05) user가 해당방에 존재하지 않으면 room 삭제
	socket.broadcast.to(roomID).emit('isTyping', {isTyping: false, userID: user.userID, userName: user.userName});	// 06) 방 퇴장시 Typing이 아님을 알림(타임핑중 갑자기 퇴장했을경우)
	//console.log('unregisterUser - userID : ' + socket.user.userID + ', userName : ' + socket.user.userName);
}

function setSuperLevel(socket) 
{
	var userLevel = socket.user.userLevel;
	
	if ( userLevel != USER_LEVEL_SUPER ) return;
	if ( hasExistSuperLevel(socket) ) return;
	
	var userList = rooms[socket.roomID].userList;
	userList[0].userLevel = USER_LEVEL_SUPER;
	console.log("userList[0].userName : " + userList[0].userName + "  " + userList[0].userLevel);
	
	var userLevelObj = {};
	userLevelObj.userID = userList[0].userID;
	userLevelObj.userLevel = userList[0].userLevel
	io.sockets.in(socket.roomID).emit('sharedUserLevel', userLevelObj);	
}

function hasExistSuperLevel(socket)
{
	var isExistSuperLevel = false;
	var userList = rooms[socket.roomID].userList;
	var len = userList.length;
	for (var i=0; i<len; i++)
	{
		if ( userList[i].userLevel === USER_LEVEL_SUPER )
		{
			isExistSuperLevel = true;
			break;
		}
	}
	console.log("isExistSuperLevel : " + isExistSuperLevel);
	return isExistSuperLevel;
}

/******************************** 토론타입 전용 시작 ***************************************************/

const LABEL_START = "start";
const LABEL_PAUSE = "pause";
const LABELw_STOP = "stop";
const LABEL_NEXT = "next";
const LABEL_SKIP = "skip";

const DEBATE_PROGRESS_ENABLE = 0;		// 디폴트
const DEBATE_PROGRESS_ACTIVE = 1;		// 활성
const DEBATE_PROGRESS_DISABLE = 2;		// 비활성

const DEBATE_MODE_MC_IN = 0;			// 진행자 유
const DEBATE_MODE_MC_OUT = 1;			// 진행자 무

const DEBATE_TYPE_USER_MC = 0;
const DEBATE_TYPE_USER_SECONDER = 1;
const DEBATE_TYPE_USER_DISSENTER = 2;
const DEBATE_TYPE_USER_VISITOR = 3;

var timerMap = {};

// 토론 아이템 항목 활성화 시킬 인덱스 리턴
function getDebateItemEnableIndex(debateItemList)
{
	var enableIndex = 0;
	var isFirst = true;
	var len = debateItemList.length;
	for (var i=0; i<len; i++) 
	{
		enableIndex++;
		if ( debateItemList[i].enable === DEBATE_PROGRESS_ACTIVE ) 
		{
			isFirst = false;
			break;
		}
	}
	if ( isFirst === true ) enableIndex = 0;
	console.log("debateItemList.size() : " + debateItemList.length + "   index : " + enableIndex + "   isFirst : " + isFirst);

	return enableIndex;
}

// 토론 아이템 항목 활성화시키고 마지막 항목인지 여부를 반환
function setDebateItemEnableIndex(debateItemList, enableIndex)
{
	var isDebateEnd = false; 
	console.log("::::::::::::: debateItemList.length : " + debateItemList.length + "    enableIndex : " + enableIndex);
	// 토론활성화가 마지막 항목이라면 전체 초기화
	if ( enableIndex === debateItemList.length ) 
	{
		initDebateItemEnableIndex(debateItemList);
		isDebateEnd = true;
		return isDebateEnd;
	}

	// 해당 인덱스 항목을 토론 활성화
	var debateItemVO = debateItemList[enableIndex];
	debateItemVO.enable = DEBATE_PROGRESS_ACTIVE;

	if (enableIndex>0) 
	{
		// 해당 인덱스 전 항목을 토론 비활성화
		debateItemVO = debateItemList[enableIndex-1];
		debateItemVO.enable = DEBATE_PROGRESS_DISABLE;
	}

	return isDebateEnd;
}

// 토론 아이템 전체 항목 초기화
function initDebateItemEnableIndex(debateItemList)
{
	var len = debateItemList.length;
	for (var i=0; i<len; i++)
	{
		debateItemList[i].enable = DEBATE_PROGRESS_ENABLE;
	}
}

// 찬반투표 결과 반영하고 반영된 유저리스트 반환
function getDebateVoteUserList(roomID, userID, voteYesNo)
{
	var userList = rooms[roomID].userList;

	if (voteYesNo == -1) return userList;

	var len = userList.length;
	for (var i=0; i<len; i++) 
	{
		if (userList[i].userID === userID)
		{
			userList[i].voteYesNo = voteYesNo;
			break;
		}
	}

	return userList;
}

function getPowerDebateUserID(roomID, userType, roomInfoVO)
{
	var powerDebateUserID = "";
	var roomInfoVO = rooms[roomID].roomInfoVO;
	if (roomInfoVO.mode == DEBATE_MODE_MC_IN)
	{
		powerDebateUserID = getDebateUserID(roomID, DEBATE_TYPE_USER_MC);
	}
	else
	{
		// 진행자가 없는 경우로 토론자가 컨트롤을 가진 경우 토론 컨트롤 권한 가진 아이디에게 요청시 경우에 따라 요청과 요청 수락이 한 클라이언트에서 발생
		// 토론 컨트롤 권한 가진 아이디를 무시하고 비발언자는 발언자에게 요청하는 경우로 처리
		if ( userType == DEBATE_TYPE_USER_SECONDER )
			powerDebateUserID = getDebateUserID(roomID, DEBATE_TYPE_USER_DISSENTER);
		else
			powerDebateUserID = getDebateUserID(roomID, DEBATE_TYPE_USER_SECONDER);

//			powerDebateUserID = getDebateUserID(roomID);	// 토론 컨트롤 권한 가진 아이디 추출
	}
	return powerDebateUserID;
}

function getDebateUserID(roomID, userType)
{
	var userID = null;
	var userList = rooms[roomID].userList;
	var len = userList.length;
	for (var i=0; i<len; i++) 
	{
		if (userList[i].userType === userType)
		{
			userID = userList[i].userID;
			break;
		}
	}
	return userID;
}

/******************************** 토론타입 전용 끝 ***************************************************/