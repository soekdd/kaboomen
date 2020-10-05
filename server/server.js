let ini = require('ini');
let events = require('events');
events.EventEmitter.prototype._maxListeners = 100;
let winston = require('winston');
let util = require('util');
let os = require('os');
require('colors');
const fs = require('fs');
let http = require('http');
let https = require('https');
let socketIO = require('socket.io');
let c = require('./common_lib/js/kaboomen_consts.js');
let Game = require('./server_lib/game').Game;
let misc = require('./server_lib/misc');
let express = require('express');
let serverKonrad = require('./serverKonrad.js');

let startMeasure = misc.cpuAverage();
let httpServer = null;
let httpsServer = null;
let httpIO = null;
let httpsIO = null;
let defaultPort = 8081;
let port = process.env.PORT || defaultPort;
let level = process.env.LEVEL || 'manos';
let iniFile = process.env.INIFILE || './config.ini';
let game = null;
let socket = null;
let healthData = {};
let lastLog = "";
let test = "";
let config = {
	ports:{
		http:null,
		https:null
	},
	ssl:{
		key:null,
		cert:null
	}
};
let myCustomLevelsColors = {
	info: 'blue',
	warn: 'green',
	error: 'yellow',
};
let expressapp = express();

function enableLog() {
	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, {
		formatter: misc.customFileFormatter
	});
	winston.addColors(myCustomLevelsColors);
	for (var i = 3; i >= 0; i--) {
		console.log("\t\t\t\t\t   💣" + ('""""""').substring(0, i) + "\x1b[31m*");
	}
	for (i = 1; i < 4; i++) {
		console.log("\t\t\t\t\t\x1b[33m" + ("   ").substr(0, 3 - i) + ("(((\x1b[31m💥\x1b[33m)))").substr(3 - i, 12 + 2 * i));
	}
	console.log(' __  __     ______     ______     ______     ______     __    __     ______     __   __   ' + "\n" 
			 + '/\\ \\/ /    /\\  __ \\   /\\  == \\   /\\  __ \\   /\\  __ \\   /\\ "-./  \\   /\\  ___\\   /\\ "-.\\ \\  '.gray + "\n" 
			 + '\\ \\  _"-.  \\ \\  __ \\  \\ \\  __<   \\ \\ \\/\\ \\  \\ \\ \\/\\ \\  \\ \\ \\-./\\ \\  \\ \\  __\\   \\ \\ \\-.  \\ '.red + "\n" 
			 + ' \\ \\_\\ \\_\\  \\ \\_\\ \\_\\  \\ \\_____\\  \\ \\_____\\  \\ \\_____\\  \\ \\_\\ \\ \\_\\  \\ \\_____\\  \\ \\_\\\\"\\_\\'.magenta + "\n" 
			 + '  \\/_/\\/_/   \\/_/\\/_/   \\/_____/   \\/_____/   \\/_____/   \\/_/  \\/_/   \\/_____/   \\/_/ \\/_/'.blue);
	console.log('node-version: %s, V8-version: %s, %s: %s, %s CPUs', process.versions.node, process.versions.v8, os.platform(), os.release(), os.cpus().length);
}

function main() {
	enableLog();
	if (fs.existsSync(iniFile)) {
		config = ini.parse(fs.readFileSync(iniFile, 'utf-8'));
		winston.info("[server] config %s loaded", iniFile);
	}
	else
		winston.warn("[server] no config loaded, run with default values");
	httpServer = require('http').createServer(handleRequest);
	httpIO = socketIO.listen(httpServer);
	winston.info("[server] http server loaded");
	let keyFile = config.ssl.key || '/etc/apache2/ssl/key.pem';
	let certFile = config.ssl.cert || '/etc/apache2/ssl/cert.pem';

	if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
		const options = {
			key: fs.readFileSync(keyFile),
			cert: fs.readFileSync(certFile)
		};
		httpsServer = require('https').createServer(options, handleRequest);
		httpsIO = socketIO.listen(httpsServer);
		winston.info("[server] https server loaded");
	}
	else
		winston.warn("[server] didnt load http server");
	healthData = {
		startTime: process.hrtime(),
		avgTime: 0,
		requestCount: 0
	};
	game = new Game(level);
	winston.info("[server] game level %s loaded", level);

	game.setChat(function(inText) {
		httpIO.sockets.emit('chat', {
			name: 'boss',
			text: inText
		});
	});

	//****************************//
	// START HTTP SERVER
	//****************************//

	let httpPort = config.ports.http || port;
	if ((httpPort < 1) || (httpPort > 65535)) {
		winston.warn("%s is not a Port Number! Using %s for http instead!", httpPort, defaultPort);
		httpPort = defaultPort;
	}
	httpServer.listen(httpPort, function() {
		winston.info("[server] listening on: http://localhost:%s", httpPort);
	});
	httpIO.sockets.on('connection', handleSocket, httpIO);
	winston.info("[server] http websocket enabled: http://localhost:%s", httpPort);

	//****************************//
	// START HTTPS SERVER
	//****************************//

	if (httpsServer != null) {
		let httpsPort = config.ports.https || (port - 1000);
		if ((httpsPort < 1) || (httpsPort > 65535)) {
			winston.warn("%s is not a Port Number! Using %s for https instead!", httpsPort, (defaultPort - 1000));
			httpsPort = (defaultPort - 1000);
		}
		httpsServer.listen(httpsPort, function() {
			winston.info("[server] listening on: https://localhost:%s", httpsPort);
		});
		httpsIO.sockets.on('connection', handleSocket, httpsIO);
		winston.info("[server] https websocket enabled: http://localhost:%s", httpsPort);
	}

	//****************************//
	// LEGACY CONSOLE CONTROL
	//****************************//

	process.openStdin().on('data', handleConsole);

	setInterval(checkSystemHealthy, 10000);
}

function checkSystemHealthy() {
	//Grab second Measure
	var endMeasure = misc.cpuAverage();
	//Calculate the difference in idle and total time between the measures
	var idleDifference = endMeasure.idle - startMeasure.idle;
	var totalDifference = endMeasure.total - startMeasure.total;
	var percentageCPU = Math.floor(200000 - 200000 * idleDifference / totalDifference) / 100;
	startMeasure = endMeasure;
	winston.info('[healthy] ' + percentageCPU + '% cpu load; ' + (Math.floor(process.memoryUsage().heapUsed / 10485, 76) / 100) + '/' + (Math.floor(process.memoryUsage().heapTotal / 10485, 76) / 100) + '㎆ heap used; ' + (Math.floor(os.freemem() / 10485, 76) / 100) + '㎆ free sys mem; ' + healthData.requestCount / 10 + ' reqs/s' + (healthData.requestCount === 0 ? '' : '; avg ' + Math.floor(10 * healthData.avgTime / healthData.requestCount) / 10 + 'ms/req') + '; ' + Object.keys(game.men).length + ' player(s)');
	healthData = {
		startTime: process.hrtime(),
		avgTime: 0,
		requestCount: 0
	};
}

function jsonResponse(response, err, data) {
	response.setHeader('content-type', 'application/json');
	myResponse(response, err, data)
}

function myResponse(response, err, data) {
	response.statusCode = err.code;
	response.statusMessage = err.message;
	if (err.message !== "" && lastLog !== err.message) {
		lastLog = err.message;
		if (err.code != 200) {
			winston.warn("[response] " + err.message);
		}
		else {
			winston.info("[response] " + err.message);
		}
	}
	err = {
		code: 200,
		message: ""
	};
	response.end(data);
	healthData.avgTime += process.hrtime()[1] / 1e9;
}

function handleSocket(newSocket) {
	test = util.inspect(newSocket.request.connection, {
		showHidden: true,
		colors: true
	});
	socket = newSocket;
	// der Client ist verbunden
	socket.emit('chat', {
		name: 'boss',
		text: 'welcome to kaboomen chat!'
	});
	// wenn ein Benutzer einen Text senden
	socket.on('chat', function(data) {
		// so wird dieser Text an alle anderen Benutzer gesendet
		httpIO.sockets.emit('chat', {
			name: data.name || 'Anonym',
			text: data.text
		});
		httpsIO.sockets.emit('chat', {
			name: data.name || 'Anonym',
			text: data.text
		});
	});
	test = socket.on('order', function(data) {
		if (proceedOrder(data.authCode, data.order).code == 301) {
			winston.warn('got order with wrong authcode!');
			socket.emit('order', data.authCode);
		}
	});
	game.setSockets([httpIO.sockets, httpsIO.sockets]);
}

function handleRequest(request, response) {
	healthData.requestCount++;
	healthData.startTime = process.hrtime();
	var params = [];
	var err = {
		code: 200,
		message: ""
	};
	if (request.url == "/favicon.ico") {
		myResponse(response, err);
		return;
	}
	response.setHeader("Access-Control-Allow-Origin", "*"); //"http://dev.kaboomen.de");
	response.setHeader("Access-Control-Allow-Credentials", "true");
	response.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
	response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
	response.setHeader("Pragma", "no-cache");
	response.setHeader("Expires", "0");
	params = request.url.split("/");
	if (params.length > 1 && params[1] !== "") {
		if (params[1] == "create") {
			if (params.length < 3 || params[2] === "") {
				err = {
					code: 501,
					message: "Name player!"
				};
				myResponse(response, err);
				return;
			}
			myResponse(response, err, game.createNewMan(params[2]));
			return;
		}
		if (params[1] == c.ADMIN_PASS) {
			response.end();
			handleConsole(params[2] + 'xx');
			return;
		}
		if (params[1] == 'debug') {
			myResponse(response, {
				code: 200,
				message: "This is a test"
			}, test);
			return;
		}
		if (params[1] == 'map') {
			jsonResponse(response, err, game.getGroundMapStringified());
			return;
		}
		if (params[1] == 'simple') {
			jsonResponse(response, err, game.getGameStringifiedSimple());
			return;
		}
		if (params[1] == 'extended') {
			if (params[2] < game.getRev()) {
				jsonResponse(response, err, game.getGameStringifiedExtended());
			}
			else {
				jsonResponse(response, err);
			}
			return;
		}
		if (params[1] == 'standard') {
			if (params[2] < game.getRev()) {
				jsonResponse(response, err, game.getGameStringifiedStandard());
			}
			else {
				myResponse(response, err);
			}
			return;
		}
		if (params.length > 2) {
			err = proceedOrder(params[1], params[2]);
			if (err.code == 301) winston.warn('got order with wrong authcode!');
			myResponse(response, err);
			return;
		}
	}
	myResponse(response, err, game.getGameStringifiedSimple());
}

function proceedOrder(authCode, order) {
	var isBot = false;
	if (order == 'update') {
		game.commit();
		winston.info('got request for update');
		return {
			code: 200,
			message: "As you wish!"
		};
	}
	if (order[0] == 'i') {
		isBot = true;
		order = order.substring(1);
	}
	var playerID = game.checkForPlayer(authCode);
	if (!playerID) {
		return {
			code: 301,
			message: "Unknown player!"
		};
	}
	if (order == 'up')
		return game.manWalk(playerID, c.MOVE_UP, isBot);
	else if (order == 'down')
		return game.manWalk(playerID, c.MOVE_DOWN, isBot);
	else if (order == 'left')
		return game.manWalk(playerID, c.MOVE_LEFT, isBot);
	else if (order == 'right')
		return game.manWalk(playerID, c.MOVE_RIGHT, isBot);
	else if (order == 'bomb')
		return game.placeBomb(playerID);
	return {
		code: 501,
		message: "Unknown order!"
	};
}

function handleConsole(chunk) {
	chunk = (">" + chunk).substr(1, chunk.length - 2);
	if (chunk == "halt" || chunk == "h" || chunk == "r") {
		winston.info("[console] [server] stoping ");
		process.exit();
	}
	if (chunk == "new" || chunk == "n") {
		winston.info("[console] reset map");
		game.createNewMap();
		return;
	}
	winston.error("[console] unknown order: " + chunk);
}

main();

expressapp.use('**', serverKonrad);

expressapp.listen(2608);