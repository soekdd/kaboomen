var events = require('events');
events.EventEmitter.prototype._maxListeners = 100;
var winston = require('winston');
var util=require('util');
var os = require('os');
require('colors');
const fs = require('fs');
const options = {
  key: fs.readFileSync('/etc/apache2/ssl/key.pem'),
  cert: fs.readFileSync('/etc/apache2/ssl/cert.pem')
};
var httpServer = require('http').createServer(handleRequest);
var httpsServer = require('https').createServer(options,handleRequest);
var httpIO = require('socket.io').listen(httpServer);
var httpsIO = require('socket.io').listen(httpsServer);
var c = require('./common_lib/js/kaboomen_consts.js');
var Game = require('./server_lib/game').Game;
var misc = require('./server_lib/misc');
var port = process.env.PORT || 8081;
var level = process.env.LEVEL || 'manos';
var game = null;
var socket = null;
var healthData = {};
var lastLog = "";
var test = "";
var myCustomLevelsColors = {
	info: 'blue',
	warn: 'green',
	error: 'yellow',
}; 

function main() {
	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, {
		formatter: misc.customFileFormatter
	});
	winston.addColors(myCustomLevelsColors);
	healthData = {
		startTime: process.hrtime(),
		avgTime: 0,
		requestCount: 0
	};
	for (var i = 3; i >= 0; i--) {
		console.log("\t\t\t\t\t   \uD83D\uDCA3" + ('""""""').substring(0, i) + "\x1b[31m*");
	}
	for (i = 1; i < 4; i++) {
		console.log("\t\t\t\t\t\x1b[33m" + ("   ").substr(0, 3 - i) + ("(((\x1b[31m\uD83D\uDCA5\x1b[33m)))").substr(3 - i, 12 + 2 * i));
	}
	console.log(' __  __     ______     ______     ______     ______     __    __     ______     __   __   ' + "\n" + '/\\ \\/ /    /\\  __ \\   /\\  == \\   /\\  __ \\   /\\  __ \\   /\\ "-./  \\   /\\  ___\\   /\\ "-.\\ \\  '.gray + "\n" + '\\ \\  _"-.  \\ \\  __ \\  \\ \\  __<   \\ \\ \\/\\ \\  \\ \\ \\/\\ \\  \\ \\ \\-./\\ \\  \\ \\  __\\   \\ \\ \\-.  \\ '.red + "\n" + ' \\ \\_\\ \\_\\  \\ \\_\\ \\_\\  \\ \\_____\\  \\ \\_____\\  \\ \\_____\\  \\ \\_\\ \\ \\_\\  \\ \\_____\\  \\ \\_\\\\"\\_\\'.magenta + "\n" + '  \\/_/\\/_/   \\/_/\\/_/   \\/_____/   \\/_____/   \\/_____/   \\/_/  \\/_/   \\/_____/   \\/_/ \\/_/'.blue);
	console.log('node-version: %s, V8-version: %s, %s: %s, %s CPUs',process.versions.node,process.versions.v8,os.platform(),os.release(),os.cpus().length);

	game = new Game(level);
	game.setChat(function(inText) {httpIO.sockets.emit('chat', { name: 'boss', text: inText });});

	if (process.argv.length > 2) {
		if ((!isNaN(parseFloat(process.argv[2]))) && (process.argv[2] > 0) && (process.argv[2] < 65536))
			port = process.argv[2];
		else
			winston.warn(process.argv[2] + " is not a Port Number! Using " + port + " instead!");
	}
	
	httpServer.listen(port, function() {
		winston.info("[server] listening on: http://localhost:%s", port);
	});
	httpsServer.listen((port-1000), function() {
		winston.info("[server] listening on: https://localhost:%s", (port-1000));
	});
	var stdin = process.openStdin();
	stdin.on('data', handleConsole);

	httpIO.sockets.on('connection', handleSocket, httpIO);
	httpsIO.sockets.on('connection', handleSocket, httpsIO);

	var startMeasure = misc.cpuAverage();

	setInterval(function() {
		//Grab second Measure
		var endMeasure = misc.cpuAverage();
		//Calculate the difference in idle and total time between the measures
		var idleDifference = endMeasure.idle - startMeasure.idle;
		var totalDifference = endMeasure.total - startMeasure.total;
		var percentageCPU = Math.floor(200000 - 200000 * idleDifference / totalDifference) / 100;
		startMeasure = endMeasure;
		winston.info('[healthy] ' + percentageCPU + '% cpu load; ' + (Math.floor(process.memoryUsage().heapUsed / 10485, 76) / 100) + '/' + (Math.floor(process.memoryUsage().heapTotal / 10485, 76) / 100) + '\u3386 heap used; ' + (Math.floor(os.freemem() / 10485, 76) / 100) + '\u3386 free sys mem; ' + healthData.requestCount / 10 + ' reqs/s' + (healthData.requestCount === 0 ? '' : '; avg ' + Math.floor(10 * healthData.avgTime / healthData.requestCount) / 10 + 'ms/req') + '; ' + Object.keys(game.men).length + ' player(s)');
		healthData = {
			startTime: process.hrtime(),
			avgTime: 0,
			requestCount: 0
		};
	}, 10000);
}

function myResponse(response, err, data) {
	response.statusCode = err.code;
	response.statusMessage = err.message;
	if (err.message !== "" && lastLog !== err.message) {
		lastLog = err.message;
		if (err.code != 200) {
			winston.warn("[response] " + err.message);
		} else {
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

function handleSocket (newSocket) {
	test=util.inspect(newSocket.request.connection, {showHidden: true, colors: true});
	socket = newSocket;
		// der Client ist verbunden
		socket.emit('chat', { name: 'boss', text: 'welcome to kaboomen chat!' });
		// wenn ein Benutzer einen Text senden
		socket.on('chat', function (data) {
		// so wird dieser Text an alle anderen Benutzer gesendet
			httpIO.sockets.emit('chat', {name: data.name || 'Anonym', text: data.text });
			httpsIO.sockets.emit('chat', {name: data.name || 'Anonym', text: data.text });
		});
		test = socket.on('order', function (data) {
			if (proceedOrder(data.authCode,data.order).code == 301) {
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
	response.setHeader("Access-Control-Allow-Origin", "*");//"http://dev.kaboomen.de");
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
				myResponse(response, {code:200,message:"This is a test"}, test);
				return;
		}	
		if (params[1] == 'map') {
				myResponse(response, err, game.getGroundMapStringified());
				return;
		}	
		if (params[1] == 'simple') {
				myResponse(response, err, game.getGameStringifiedSimple());
				return;
		}	
		if (params[1] == 'extended') {
			if (params[2] < game.getRev()) {
				myResponse(response, err, game.getGameStringifiedExtended());
			}
			else {
				myResponse(response, err);
			}
			return;
		}
		if (params[1] == 'standard') {
			if (params[2] < game.getRev()) {
				myResponse(response, err, game.getGameStringifiedStandard());
			}
			else {
				myResponse(response, err);
			}
			return;
		}
		if (params.length > 2) {
			err = proceedOrder(params[1],params[2]);
			if (err.code==301) winston.warn('got order with wrong authcode!');
			myResponse(response, err);
			return;
		}
	}
	myResponse(response, err, game.getGameStringifiedSimple());
}
 
function proceedOrder(authCode,order){
	var isBot = false;
	if (order == 'update') {
		game.commit();
		winston.info('got request for update');
		return {
			code: 200,
			message: "As you wish!"
		};
	}
	if (order[0]=='i') {
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
		return  game.manWalk(playerID, c.MOVE_DOWN, isBot);
	else if (order == 'left')
		return  game.manWalk(playerID, c.MOVE_LEFT, isBot);
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