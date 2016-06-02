var PowerVO = require('./powerVO.js');
var MediaVO = require('./mediaVO.js');

function User(obj) {
	if (!obj) return;
    this.userID = obj.userID;						// userID
    this.userName = obj.userName;					// userName
    this.userLevel = obj.userLevel;					// userLevel
    this.userType = obj.userType;					// userType
    this.mode = obj.mode;							// UI mode
    this.lobbyID = obj.lobbyID;						// lobbyID
    
    this.ip = obj.ip;								// 접속IP
    this.host = obj.host;							// 접속host이름
    this.os = obj.os;								// 접속OS이름
    this.osBit = obj.osBit;							// OS비트
    this.browser = obj.browser;						// 접속 브라우저
    this.browserVersion = obj.browserVersion;		// 접속 브라우저 버전
    this.language = obj.language;					// OS언어
    this.platformVersion = obj.platformVersion;		// FlashPlayer, AIR 버전
    this.startTime = obj.startTime;					// 최초 접속시간
    
    this.lengthUserName = obj.lengthUserName;
    this.powerVO = new PowerVO(obj.powerVO);		// 권한VO
    this.voteYesNo = obj.voteYesNo;					// 찬반여부
    this.mediaVO = new MediaVO(obj.mediaVO);		// 미디어정보
};
	
module.exports = User;
