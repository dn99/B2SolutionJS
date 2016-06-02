function mediaVO(obj) {
	if (!obj) return;
	this.isVideoView = obj.isVideoView;
	this.isVideoControl = obj.isVideoControl;
	this.isSendVideo = obj.isSendVideo;				// 비디오 송출여부
	this.isSendAudio = obj.isSendAudio;				// 오디오 송출여부
	
	this.isCamSupport = obj.isCamSupport;			// 카메라 장비여부
	this.camIndex = obj.camIndex;					// 선택캠인덱스
	this.camWidth = obj.camWidth;					// 선택해상도가로
	this.camHeight = obj.camHeight;					// 선택해상도세로
	this.camNames = obj.camNames;					// 카메라목록
	
	this.isMicSupport = obj.isMicSupport;			// 마이크 장비여부
	this.micIndex = obj.micIndex;					// 선택마이크인덱스
	this.micNames = obj.micNames;					// 마이크목록
	
	this.screenResolutionX = obj.screenResolutionX; // 가로해상도
	this.screenResolutionY = obj.screenResolutionY; // 세로해상도
};
	
module.exports = mediaVO;
