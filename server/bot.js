var c = require('./common_lib/js/kaboomen_consts.js');
var ai = require('./common_lib/js/kaboomen_ai.js');
var io = require('socket.io-client');
var request = require('request');
var game = null;
var port = process.env.PORT || 8081;
var name = process.env.NAME || 'NodeBot';
var server = 'http://127.0.0.1:'+port.toString();
var gameGround = null;
var socket = null;
var loginTimer = null;
var lastOrder = null;
var authCode = -1;
var playerID = -1;


function getData(result) {
    if (result == '') return;
    game = JSON.parse(result);
    if (game==null || game.men[playerID] == null) {
        checkForLogin();
        return;
    }
    if (gameGround!=null) {
        game.map=ai.rebuildStandardAPIMap(game,gameGround);
    } else return;
    ai.setGame(game);
    if (game.men[playerID]!= null && game.men[playerID].anim==0) {
        lastOrder = (new Date).getTime();
        ai.doBot();
    }
}

function checkForLogin(){
    if (game==null || !(playerID in game.men)) {
        // not loged in? login again
        authCode = -1;
        playerID = -1;
        if (loginTimer == null) {
            loginTimer = setTimeout(function() {
                loginTimer = null;
                if (game==null || !(playerID in game.men)) newPlayer(name);
            }, 1000);
        }
    }
}

function main() {
    ai.setC(c);
    setInterval(function(){
        if (((lastOrder+2000) < (new Date).getTime())) {
            ai.doBot();
        }
    },5000);
    console.log('connect via '+server);
    socket = io(server);
    socket.on('extended', getData);
    ai.setSocket(socket);
}

function getGroundMap() {
    request(server+'/map',
        function(error, response, result) {
            gameGround = JSON.parse(result);
        });
}


function newPlayer(name) {
    console.log('try to login');
    request(server+'/create/' + name,
        function(error, response, result) {
            console.log('login-result: '+JSON.stringify(result));
            [authCode, playerID] = result.split(",");
            ai.setPlayerID(playerID);
            ai.setAuthCode(authCode);
            getGroundMap();
        }
    );
}


main();
