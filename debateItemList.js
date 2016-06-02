function DebateItemList(obj) {
	if (!obj) return;
	this.index = obj.index;			// 토론 순서
	this.state = obj.state;			// 입론 0, 질의 1, 반론 2, 결론 3
	this.speaker = obj.speaker;		// 찬성자 1, 반대자 2
	this.timeMin = obj.timeMin;		// 분
	this.timeSec = obj.timeSec;		// 초
	this.enable = obj.enable;		// 표시 0, 활성 1, 비표시 2
};

module.exports = DebateItemList;
