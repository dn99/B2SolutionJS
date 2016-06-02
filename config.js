function Config() {
	this.ROOM_TYPE_CONF = "room_type_conf";
	this.ROOM_TYPE_EDU = "room_type_edu";
	this.ROOM_TYPE_DEBATE = "room_type_debate";
	this.ROOM_TYPE_COUNSEL = "room_type_counsel";

	this.LABEL_START = "start";
	this.LABEL_PAUSE = "pause";
	this.LABELw_STOP = "stop";
	this.LABEL_NEXT = "next";
	this.LABEL_SKIP = "skip";

	this.DEBATE_PROGRESS_ENABLE = 0;		// 디폴트
	this.DEBATE_PROGRESS_ACTIVE = 1;		// 활성
	this.DEBATE_PROGRESS_DISABLE = 2;	// 비활성

	this.DEBATE_MODE_MC_IN = 0;			// 진행자 유
	this.DEBATE_MODE_MC_OUT = 1;			// 진행자 무

	this.DEBATE_TYPE_USER_MC = 0;
	this.DEBATE_TYPE_USER_SECONDER = 1;
	this.DEBATE_TYPE_USER_DISSENTER = 2;
	this.DEBATE_TYPE_USER_VISITOR = 3;
	
	this.LOG_DIR = 'C:/nodejs/logs/';
	//this.LOG_DIR = '/usr/log/';
	this.LOG_INFOFILENAME = 'B2SolutionJS_Info';
	this.LOG_ERRORFILENAME = 'B2SolutionJS_Error';
	this.LOG_EXCEPTION_FILENAME = 'B2SolutionJSException';
};

module.exports = Config;