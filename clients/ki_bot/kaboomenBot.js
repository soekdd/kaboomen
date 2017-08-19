/*global ai, c, $, io, connectionType */

var oldGame = 0;
var oldPlayers = 0;
var rev = 0;
var game = null;
var groundMap = null;
var socket = null;
var loginTimer = null;
var lastOrder = null;
var authCode = -1;
var playerID = -1;
var servers = ["http://kaboomen.de:8081/", "http://kaboomen.com:8081/", "http://api.kaboomen.de/", "http://soekcms.de/api/", "http://localhost:8081/", "http://192.168.0.10:8081/"];

function createMap() {
    var s = '';
    for (var i = 0; i < game.height; i++) {
        for (var j = 0; j < game.width; j++) {
            s = s + '<image style="top:' + (i * 33) + 'px;left:' + (j * 33) + 'px;" class="tile" id="cell' + i + '_' + j + '" src="img/game0.png" />';
            s = s + '<div style="top:' + (i * 33) + 'px;left:' + (j * 33) + 'px;" class="tile" id="debug' + i + '_' + j + '"></div>';
        }
    }
    var gameElement = document.getElementById('game');
    gameElement.innerHTML = s;
    gameElement.style.width = 33 * game.width + 'px';
    gameElement.style.height = 33 * game.height + 'px';
    document.getElementById('navbar').style.width = 33 * game.width + 'px';
}

function paintMap() {
    for (var i = 0; i < game.height; i++) {
        for (var j = 0; j < game.width; j++) {
            if (oldGame == 0 || game.map[i][j] != oldGame.map[i][j]) {
                var tile = 'game' + game.map[i][j];
                if ((game.map[i][j] & c.FILTER_BOX) == c.FILTER_BOX) {
                    tile = 'game2';
                }
                if ((game.map[i][j] & c.FILTER_BOMB) == c.FILTER_BOMB) {
                    tile = 'game0';
                }
                else if ((game.map[i][j] & c.FILTER_GOODIE) == c.FILTER_GOODIE) {
                    tile = 'goodie' + (game.map[i][j] & ~c.FILTER_GOODIE);
                }
                else if ((game.map[i][j] & c.FILTER_PLAYER) == c.FILTER_PLAYER) {
                    tile = 'game0';
                }
                document.getElementById('cell' + i + '_' + j).src = 'img/' + tile + '.png';
            }
            var s = '';
            var arrows = ['&uarr;', '&darr;', '&larr;', '&rarr;', '&#x1F4A3;', '&#x23F3;'];
            if (ai.getSteps() != null && ai.getSteps()[i][j] != null && ai.getSteps()[i][j] != 0)
                s = ('<span style="color:#' + ai.getSteps()[i][j] + '' + ai.getSteps()[i][j] + '' + ai.getSteps()[i][j] + '">' + ai.getSteps()[i][j] + '</span>' + arrows[ai.getNextStep()[i][j]] + '<br>' + ai.getQuality()[i][j]);
            document.getElementById('debug' + i + '_' + j).innerHTML = s;
        }
    }
}

function paintPanel() {
    if (playerID in game.men) {
        // show players name and score
        var s = 'Player:&nbsp;' + game.men[playerID].name + '&nbsp;' + ("00000" + game.men[playerID].score).slice(-5) + '00&nbsp;';
        // shows indestructibility
        if (game.men[playerID].indest > 0) {
            s = s + '<img class="award" src="img/goodie7.png"/>&nbsp;UNZERSTÖRBAR!&nbsp;';
        }
        // shows available bombs
        for (var i = 0; i < game.men[playerID].bombs; i++) {
            s = s + '<img class="award" src="img/goodie3.png"/>';
        }
        // got bad speed goodies?
        s = s + "&nbsp;";
        if (game.men[playerID].speed < 2) {
            s = s + '<img class="award" src="img/goodie6.png"/>';
        }
        // got good speed goodies?
        if (game.men[playerID].speed > 2) {
            for (var i = 0; i < game.men[playerID].speed - 2; i++) {
                s = s + '<img class="award" src="img/goodie5.png"/>';
            }
        }
        // got bad radius goodies?
        s = s + "&nbsp;";
        if (game.men[playerID].bombRadius < 3) {
            s = s + '<img class="award" src="img/goodie2.png"/>';
        }
        // got good radius goodies?
        if (game.men[playerID].bombRadius > 3) {
            for (var i = 0; i < game.men[playerID].bombRadius - 3; i++) {
                s = s + '<img class="award" src="img/goodie1.png"/>';
            }
        }
    }
    else {
        // not loged in? login again
        s = "";
        authCode = -1;
        playerID = -1;
        if (loginTimer == null) {
            loginTimer = setTimeout(function() {
                loginTimer = null;
                if (!(playerID in game.men)) newPlayer('JsBot');
            }, 1000);
        }
    }
    document.getElementById('playerPanel').innerHTML = s;
}

function paintHighScore() {
    // order list by scores
    var orderedList = [];
    for (var index in game.men) {
        if (game.men.hasOwnProperty(index)) {
            orderedList.push(game.men[index]);
        }
    }
    orderedList.sort(function(a, b) {
        return b.score - a.score;
    });
    // find the winner
    var s = "";
    orderedList.forEach(function(man, index) {
        // write the score list, mark the own player and the winner
        s = s + '<span class="' + (index == 0 ? 'pWinner' : (man.id == playerID ? 'pMe' : 'pOthers')) + '">' + (index + 1) + '.&nbsp;' + man.name + '&nbsp;' + ("00000" + man.score).slice(-5) + '00</span><br/>';
    });
    document.getElementById('highScore').innerHTML = s;
}

/*
 * cares for players animations
 */
function paintPlayers() {
    Object.keys(game.men).forEach(function(i) {
        var man = game.men[i];
        if (!$('#man' + i).length) {
            $('#game').append('<image class="men" id="man' + i + '" src="img/man' + (man.look % 5) + '.png">' + '<div class="name" id="name' + i + '">' + man.name + '</div>');
        }
        if (man.action == 5) { //dies
            $('#man' + i).css({
                'clip': 'rect(128px,' + (man.anim + 1) * 24 + 'px,' + 5 * 32 + 'px,' + man.anim * 24 + 'px)',
                'top': (man.y * 33 - 131) + 'px',
                'left': (man.x * 33 + 4 - man.anim * 24) + 'px'
            });
        }
        else { //walks
            if (man.direction == 0) man.direction = 1; //waits
            $('#man' + i).css({
                'clip': 'rect(' + (man.direction - 1) * 32 + 'px,' + (man.anim + 1) * 24 + 'px,' + (man.direction) * 32 + 'px,' + man.anim * 24 + 'px)',
                'top': ((1 + man.y) * 33 - man.direction * 32 - 4) + 'px',
                'left': (man.x * 33 + 4 - man.anim * 24) + 'px'
            });
        }
        $('#name' + i).css({
            'top': ((1 + man.y) * 33 - 50) + 'px',
            'left': (man.x * 33 + 20) + 'px'
        });
    });
}

/*
 * cares for bomb animations
 */
function paintBombs() {
    Object.keys(game.bombs).forEach(function(i) {
        var bomb = game.bombs[i];
        if (bomb == null) {
            cleanupBomb(i);
            return;
        }
        if (!$('#count' + i).length) {
            $('#game').append('<div class="count" id="count' + i + '"></div>');
        }
        $('#count' + i).css({
            'top': ((1 + bomb.y) * 33 - 30) + 'px',
            'left': (bomb.x * 33 + 12) + 'px'
        });
        if (bomb.remote)
            $('#count' + i).html('R');
        else
            $('#count' + i).html(Math.round(bomb.countDown));
        if (!bomb.ignition) return;
        if (!$('#bombc' + i).length) { //create new bomb
            $('#game').append('<image style="display:none" class="bombs" id="bombc' + i + '" src="img/explc.png">' +
                '<div class="explh" id="ignr' + i + '"></div>' +
                '<div class="explh" id="ignl' + i + '"></div>' +
                '<div class="explv" id="ignt' + i + '"></div>' +
                '<div class="explv" id="ignb' + i + '"></div>' +
                '<image style="display:none" class="exple" id="ignre' + i + '" src="img/exple.png">' +
                '<image style="display:none" class="exple" id="ignle' + i + '" src="img/exple.png">' +
                '<image style="display:none" class="exple" id="ignte' + i + '" src="img/exple.png">' +
                '<image style="display:none" class="exple" id="ignbe' + i + '" src="img/exple.png">' +
                '<div class="count" id="count' + i + '"></div>');
        }
        if (bomb.ignt == undefined || bomb.ignt < 1) {
            $('#ignte' + i).hide();
        }
        else {
            $('#ignte' + i).css({
                'top': ((bomb.y - bomb.ignt - bomb.anim) * 33) + 'px',
                'left': ((bomb.x) * 33) + 'px',
                'clip': 'rect(' + (bomb.anim) * 33 + 'px,33px,' + (bomb.anim + 1) * 33 + 'px,0px)'
            });
            $('#ignte' + i).show();
        }
        if (bomb.ignb == undefined || bomb.ignb < 1) {
            $('#ignbe' + i).hide();
        }
        else {
            $('#ignbe' + i).css({
                'top': ((bomb.y + bomb.ignb - bomb.anim) * 33) + 'px',
                'left': ((bomb.x - 1) * 33) + 'px',
                'clip': 'rect(' + (bomb.anim) * 33 + 'px,66px,' + (bomb.anim + 1) * 33 + 'px,33px)'
            });
            $('#ignbe' + i).show();
        }
        if (bomb.ignl == undefined || bomb.ignl < 1) {
            $('#ignle' + i).hide();
        }
        else {
            $('#ignle' + i).css({
                'top': ((bomb.y - bomb.anim) * 33) + 'px',
                'left': ((bomb.x - bomb.ignl - 3) * 33) + 'px',
                'clip': 'rect(' + (bomb.anim) * 33 + 'px,132px,' + (bomb.anim + 1) * 33 + 'px,99px)'
            });
            $('#ignle' + i).show();
        }
        if (bomb.ignr == undefined || bomb.ignr < 1) {
            $('#ignre' + i).hide();
        }
        else {
            $('#ignre' + i).css({
                'top': ((bomb.y - bomb.anim) * 33) + 'px',
                'left': ((bomb.x + bomb.ignr - 2) * 33) + 'px',
                'clip': 'rect(' + (bomb.anim) * 33 + 'px,99px,' + (bomb.anim + 1) * 33 + 'px,66px)'
            });
            $('#ignre' + i).show();
        }
        if (bomb.ignt == undefined || bomb.ignt < 2) {
            $('#ignt' + i).hide();
        }
        else {
            $('#ignt' + i).css({
                'height': (bomb.ignt - 1) * 33,
                'top': ((bomb.y - bomb.ignt + 1) * 33) + 'px',
                'left': ((bomb.x) * 33) + 'px',
                'background-position': '-' + (bomb.anim * 33) + 'px 0px'
            });
            $('#ignt' + i).show();
        }
        if (bomb.ignb == undefined || bomb.ignb < 2) {
            $('#ignb' + i).hide();
        }
        else {
            $('#ignb' + i).css({
                'height': (bomb.ignb - 1) * 33,
                'top': ((bomb.y + 1) * 33) + 'px',
                'left': ((bomb.x) * 33) + 'px',
                'background-position': '-' + (bomb.anim * 33) + 'px 0px'
            });
            $('#ignb' + i).show();
        }
        if (bomb.ignl == undefined || bomb.ignl < 2) {
            $('#ignl' + i).hide();
        }
        else {
            $('#ignl' + i).css({
                'width': (bomb.ignl - 1) * 33,
                'top': ((bomb.y) * 33) + 'px',
                'left': ((-bomb.ignl + bomb.x + 1) * 33) + 'px',
                'background-position': '0px -' + (bomb.anim * 33) + 'px'
            });
            $('#ignl' + i).show();
        }
        if (bomb.ignr == undefined || bomb.ignr < 2) {
            $('#ignr' + i).hide();
        }
        else {
            $('#ignr' + i).css({
                'width': (bomb.ignr - 1) * 33,
                'top': ((bomb.y) * 33) + 'px',
                'left': ((bomb.x + 1) * 33) + 'px',
                'background-position': '0px -' + (bomb.anim * 33) + 'px'
            });
            $('#ignr' + i).show();
        }
        $('#bombc' + i).css({
            'top': ((bomb.y - bomb.anim) * 33) + 'px',
            'left': ((bomb.x) * 33) + 'px',
            'display': 'inline',
            'clip': 'rect(' + (bomb.anim * 33) + 'px,33px,' + ((bomb.anim + 1) * 33) + 'px,0px)'
        });
    });
}

function cleanupPlayers() {
    if (Object.keys(game.men).length != oldPlayers) {
        $(".men").each(function() {
            var id = $(this).attr('id').substr(3);
            if (!(id in game.men)) {
                $("#man" + id).remove();
                $("#name" + id).remove();
            }
        });
        oldPlayers = Object.keys(game.men).length;
    }
}

function cleanupBomb(id) {
    $("#bombc" + id).remove();
    $("#ignr" + id).remove();
    $("#ignl" + id).remove();
    $("#ignt" + id).remove();
    $("#ignb" + id).remove();
    $("#ignre" + id).remove();
    $("#ignle" + id).remove();
    $("#ignte" + id).remove();
    $("#ignbe" + id).remove();
    $("#count" + id).remove();
}

function cleanupBombs() {
    $(".bombs").each(function() {
        var id = $(this).attr('id').substr(5);
        if (!(id in game.bombs) || game.bombs[id] == null) {
            cleanupBomb(id);
        }
    });
}

function getGroundMap(callback) {
    //for inital load
    $.ajax({
        url: servers[$('#servers').val()] + 'map',
        headers: {
            'Accept-Language': '',
        },
        timeout: 1000,
        success: callback
    });
}

function getData(result) {
    if (result == '') return;
    game = JSON.parse(result);
    ai.setGame(game);
    rev = game.rev;
    if (oldGame == 0) {
        getGroundMap(function(groundResult) {
            oldGame = 0; //könnte schon wieder überschrieben worden sein.
            groundMap = JSON.parse(groundResult);
            game.map = ai.rebuildStandardAPIMap(game, groundMap);
            createMap();
            updateExtended(game);
        });
    } else  {
        game.map = ai.rebuildStandardAPIMap(game, groundMap);
        updateExtended(game);
    }
}

function updateExtended() {
    paintMap();
    paintPanel();
    paintHighScore();
    paintPlayers();
    paintBombs();
    cleanupBombs();
    cleanupPlayers();
    if (game.men[playerID] != null && game.men[playerID].anim == 0) {
        lastOrder = (new Date).getTime();
        ai.doBot();
    }
    if (ai.isInDanger()) {
        $('#danger').show();
    }
    else {
        $('#danger').hide();
    }
    //	$('#json').html('Player:' + JSON.stringify(game.men) + '<br/>Bombs:' + JSON.stringify(game.bombs));
    oldGame = game;
}

$(document).ready(main);

function main() {
    ai.setC(c);
    var s = '';
    for (var j = 0; j < servers.length; j++) {
        s = s + '<option value="' + j + '"' + (j == $('#servers').val() ? ' selected="selected"' : '') + '>' + servers[j] + '</option>';
    }
    document.getElementById('servers').innerHTML = s;
    setInterval(function() {
        if (((lastOrder + 2000) < (new Date).getTime()) && (game.men[playerID] != null)) {
            ai.doBot();
        }
    }, 5000);
    socket = io('http://kaboomen.de:8081');
    socket.on('extended', getData);
    ai.setSocket(socket);
}

function keyCode(event) {
    var key = event.keyCode;
    var order = -1;
    if (key == 88) {
        ai.doBot();
        return;
    }
    if (key == 37) order = 'left';
    if (key == 39) order = 'right';
    if (key == 38) order = 'up';
    if (key == 40) order = 'down';
    if (key == 32) order = 'bomb';
    if (order != -1) {
        if (connectionType == "sockets") {
            socket.emit('order', {
                'authCode': authCode,
                'order': order
            });
        }
        else {
            $.ajax({
                url: servers[$('#servers').val()] + authCode + "/" + order,
                statusCode: {
                    200: function(result) {},
                    301: function() {
                        authCode = -1;
                        playerID = -1;
                    }
                }
            });
        }
    }
}

function newPlayer(name) {
    $.ajax({
        url: servers[$('#servers').val()] + "create/" + name,
        success: function(result) {
            [authCode, playerID] = result.split(",");
            ai.setPlayerID(playerID);
            ai.setAuthCode(authCode);
        },
        error: function(result) {
            authCode = -1;
            playerID = -1;
        }
    });
    $("#newPlayer").val("");
}
