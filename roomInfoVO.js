var DebateItemList = require('./debateItemList.js');

function RoomInfoVO(obj) {
	if (!obj) return;
	this.subject = obj.subject;					// 토론 주제
	this.type = obj.type;						// 자유토론 0, 링컨-더글러스식 토론 1, 의회식 토론 2, CEDA식 토론 3, 칼포퍼식 토론 4
	this.mode = obj.mode;						// 진행자 유 0, 무 1
	this.userType = obj.userType;				// 진행자 0, 찬성자 1, 반대자 2, 참관자 3
//	this.debateItemList = new DebateItemList(obj.debateItemList);	
	this.debateItemList = [];
	var debateItem = null;
	var len = obj.debateItemList.length;
	for (var i=0; i<len; i++) {
		debateItem = new DebateItemList(obj.debateItemList[i]);
		this.debateItemList.push(debateItem);
	}
		
};
	
module.exports = RoomInfoVO;
