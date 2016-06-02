function screenshare(obj) {
	if (!obj) return;
	this.isScreenSharing = obj.isScreenSharing;		// 화면공유중인지 여부
	this.isRDC = obj.isRDC;							// 원격제어모드인지 여부(원격제어모드이면 요청자&요청받는자 두명만 활성화됨)
	this.userID = obj.userID;						// 화면공유자 PublishID
	this.userName = obj.userName;					// 화면공유자 이름
};
	
module.exports = screenshare;
