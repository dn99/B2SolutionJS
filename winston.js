var winston = require('winston');
var moment = require('moment');

var Config = require('./config.js');
var config = new Config();

/**
 * -----------------------------------------------------------------
 * Logger객체생성
 * -----------------------------------------------------------------
 * 사용법
 * logger.log('silly', "127.0.0.1 - there's no place like home");
 * logger.log('debug', "127.0.0.1 - there's no place like home");
 * logger.log('verbose', "127.0.0.1 - there's no place like home");
 * logger.log('info', "127.0.0.1 - there's no place like home");
 * logger.log('warn', "127.0.0.1 - there's no place like home");
 * logger.log('error', "127.0.0.1 - there's no place like home");
 * logger.info("127.0.0.1 - there's no place like home");
 * logger.warn("127.0.0.1 - there's no place like home");
 * logger.error("127.0.0.1 - there's no place like home"); 
 */

/**
 * nodejs 시간이 맞지 않아, moment모듈 활용하여 현재시각을 구한다.
 *  
 */
function timeStamp() {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ'); // '2014-07-03 20:14:28.500 +0900'
};


var logger = new (winston.Logger)({
	transports: [
	             
	   // 로그 콘솔 출력
	   new (winston.transports.Console)({ 
		   json: false, 
		   timestamp: timeStamp 
	   }),
	   
	   // INFO 로그 파일 출력
	   new (winston.transports.DailyRotateFile)({
		   name: 'info-file',
		   filename: config.LOG_INFOFILENAME, 
		   dirname: config.LOG_DIR,  
		   timestamp: timeStamp,
		   datePattern: '.yyyy-MM-dd.log',
		   level: 'info'
	   }),

	   // ERROR 로그 파일 출력
	   new (winston.transports.DailyRotateFile)({
		   name: 'error-file',
		   filename: config.LOG_ERRORFILENAME, 
		   dirname: config.LOG_DIR,  
		   timestamp: timeStamp,
		   datePattern: '.yyyy-MM-dd.log',
		   level: 'error'
	   })       
	],
	
    exceptionHandlers: [
       new (winston.transports.Console)({
    	   json: false,
    	   timestamp: timeStamp 
       }),
	   new (winston.transports.DailyRotateFile)({ 
		   filename: config.LOG_EXCEPTION_FILENAME, 
		   dirname: config.LOG_DIR, 
		   datePattern: '.yyyy-MM-dd.log', 
		   timestamp: timeStamp  
	   })
	],
	exitOnError: false 
});


module.exports = logger;