var RoomInfoVO = require('./roomInfoVO.js');
var ScreenShare = require('./screenshare.js');

function Room(obj) {
	
	if (!obj) return;
	
	this.roomID = obj.roomID;							// roomID
	this.roomName = obj.roomName;						// room이름
	this.roomType = obj.roomType;						// roomType
	this.roomInfoVO = new RoomInfoVO(obj.roomInfoVO);	// roomInfoVO (토론모드)
	this.roomMainType = obj.roomMainType;
	
	this.roomCreatorUserID = obj.roomCreatorUserID;		// 방개설자 userID
	this.roomCreatorUserName = obj.roomCreatorUserName; // 방개설자 userName
	this.roomCreatorUserIP = obj.roomCreatorUserIP; 	// 방개설자 userName
	this.roomCreateTime	= obj.roomCreateTime;			// 방개설시간
	this.host = obj.host; 								// 방개설자 userName
	
	this.userList = [];									// 해당방의 userList
	this.isLMS = obj.isLMS;								// LMS유무
	this.mode; 											// 개설자 방모드 -> 0 : 일반모드, 1: Observer모드
	this.lobbyID = obj.lobbyID;							// 해당 Room의 소속 lobbyID
	
	this.layout;										// 해당 Room의 Layout정보
	this.docList = [];									// 해당 Room의 문서List
	this.selectedDoc;									// 해당 Room의 선택문서
	
	this.screenshare;									// 화면공유정보
};

// User추가
Room.prototype.addUser = function(user) {
	this.userList.push(user);
};

// User제거
Room.prototype.removeUser = function(user) {
	var userIndex = -1;
	for(var i = 0; i < this.userList.length; i++){
		if(this.userList[i].userID === user.userID){
			userIndex = i;
			break;
		}
	}
	this.userList.splice(userIndex, 1);
};

// UserLevel 변경
Room.prototype.changeUserLevel = function(data) {
	var userIndex = -1;
	for(var i = 0; i < this.userList.length; i++){
		if(this.userList[i].userID === data.userID){
			this.userList[i].userLevel = data.userLevel;
			break;
		}
	}
};

// User권한 변경
Room.prototype.changePower = function(data) {
	var userIndex = -1;
	for(var i = 0; i < this.userList.length; i++){
		if(this.userList[i].userID === data.userID){
			this.userList[i].powerVO.isPowerChat = data.isPowerChat;
			this.userList[i].powerVO.isPowerBoard = data.isPowerBoard;
			this.userList[i].powerVO.isPowerDoc = data.isPowerDoc;
			console.log("2 -----------> changePower : " + this.userList[i].userID + "   " + this.userList[i].powerVO.isPowerChat + "   " + this.userList[i].powerVO.isPowerBoard + "   " + this.userList[i].powerVO.isPowerDoc);
			break;
		}
	}
};

// Cam, Mic on/off 상태 업데이트
Room.prototype.updateMediaState = function(data) {
	var userIndex = -1;
	for(var i = 0; i < this.userList.length; i++){
		if(this.userList[i].userID === data.userID){
			this.userList[i].mediaVO.isSendVideo = data.isSendVideo;
			this.userList[i].mediaVO.isSendAudio = data.isSendAudio;
//			this.userList[i].mediaVO.micNames = data.micNames;
//			this.userList[i].mediaVO.isCamSupport = data.isCamSupport;
			this.userList[i].mediaVO.camIndex = data.camIndex;
			this.userList[i].mediaVO.camWidth = data.camWidth;
			this.userList[i].mediaVO.camHeight = data.camHeight;
//			this.userList[i].mediaVO.camNames = data.camNames;
//			this.userList[i].mediaVO.isMicSupport = data.isMicSupport;
//			this.userList[i].mediaVO.micIndex = data.micIndex;
//			this.userList[i].mediaVO.micNames = data.micNames;
			break;
		}
	}
};


//문서추가
Room.prototype.addDoc = function(doc) {
	this.docList.push(doc);
};

//문서제거
Room.prototype.removeDoc = function(doc) {
	var docIndex = -1;
	for(var i = 0; i < this.docList.length; i++){
		if(this.docList[i].docID === doc.docID){
			docIndex = i;
			break;
		}
	}
	this.docList.splice(docIndex, 1);
	
	// seledtedDoc삭제시 seletectedDoc값을 바꾼다.
	if(this.selectedDoc.docID == doc.docID){
		if(this.docList.length != 0){
			this.selectedDoc = this.docList[0];
		}else{
			this.selectedDoc = null;			
		}
	} 
};



Room.prototype.setScreenShare = function(data) {
	this.screenshare = data;
};

Room.prototype.getScreenShare = function() {
	return this.screenshare;
};


module.exports = Room;
