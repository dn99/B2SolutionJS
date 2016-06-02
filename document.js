function Document(obj) {
	if (!obj) return;
	this.docID = obj.docID;							// 문서ID
	this.fileName = obj.fileName;					// 파일명
	this.fileType = obj.fileType;					// 파일확장자
	this.swfFileName = obj.swfFileName				// 변환된 swf파일명
	this.uploaderUserID = obj.uploaderUserID;		// 업로더 userID
	this.uploaderUserName = obj.uploaderUserName;	// 업로더 userName
	this.uploadTime = obj.uploadTime;
	this.totalPage = obj.totalPage;					// TotalPage
};
	
module.exports = Document;