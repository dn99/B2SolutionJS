function PowerVO(obj) {
	if (!obj) return;
	this.isPowerChat = obj.isPowerChat;				// 채팅권한
	this.isPowerBoard = obj.isPowerBoard;			// 화이트보드권한
	this.isPowerDoc = obj.isPowerDoc;				// 문서/ebook권한
		
};
	
module.exports = PowerVO;
