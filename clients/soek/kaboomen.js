/*global c, localStorage, $, io, connectionType, navigator */
/*exported newPlayer(), keyCode(event) */

var oldGame = 0;
var oldPlayers = 0;
var start = 0;
var rev = 0;
var updateRequest = null;
var socket = null;
var authCode = -1;
var playerID = -1;
var playersName = "unknown";
var soundsPlayed = [];
var variations = [];
var servers = ["http://kaboomen.de:8081/", "http://kaboomen.de:8082/", "http://kaboomen.de:8083/", "https://www.kaboomen.com:7081/", "https://www.kaboomen.com:7082/", "https://www.kaboomen.com:7083/", "http://api.kaboomen.de/", "http://localhost:8081/", "http://192.168.0.10:8081/"];
var choosenServer = null;
var soundControl = true;
var sounds = {
    good: new Audio('sounds/good.mp3'),
    bad: new Audio('sounds/bad.mp3'),
    bomb: new Audio('sounds/good.mp3'),
    wall: new Audio('sounds/wall.mp3'),
    dies: new Audio('sounds/dies.mp3'),
    tick: new Audio('sounds/tick.mp3'),
    expl: new Audio('sounds/bomb.mp3')
};
/* // not IE compatible...
    sounds = {
        [c.SOUND_KEY_GOOD]: new Audio('sounds/good.mp3'),
        [c.SOUND_KEY_BAD]: new Audio('sounds/bad.mp3'),
        [c.SOUND_KEY_BOMB]: new Audio('sounds/good.mp3'),
        [c.SOUND_KEY_WALL]: new Audio('sounds/wall.mp3'),
        [c.SOUND_KEY_DIES]: new Audio('sounds/dies.mp3'),
        [c.SOUND_KEY_TICK]: new Audio('sounds/tick.mp3'),
        [c.SOUND_KEY_EXPL]: new Audio('sounds/bomb.mp3')
    };
}*/

function sendUpdateOrder(){
    //in case of inactivity, websocket doesnt send updates.
    sendOrder('update'); 
}

function changeServer() {
    choosenServer = servers[$('#servers').val()];
    if (connectionType == "sockets" && socket != null)
        socket.close();
    oldGame = 0;
    cleanupBombs({
        bombs: []
    });
    cleanupPlayers({
        men: []
    });
    main();
    if (connectionType == "sockets") {
        sendUpdateOrder();
        if (updateRequest!=null)
            clearInterval(updateRequest);
        updateRequest = setInterval(sendUpdateOrder, 5000);
    }
}

function createMap(ground) {
    var height = ground.height;
    var width = ground.width;
    var s = '';
    for (var i = 0; i < height; i++) {
        variations[i] = [];
        for (var j = 0; j < width; j++) {
            var tile = 'wall';
            variations[i][j] = Math.floor(Math.random() * 5) + 1;
            if (ground.map[i][j] < c.EXTMAP_WALL_GROUND) tile = 'ground';
            var tileVersion = ((ground.map[i][j] & c.EXTMAP_FILTER_TILETYPE) >> 2) + 1;
            s = s + '<div style="top:' + (i * 33) + 'px;left:' + (j * 33) + 'px;" class="tile ' + tile + ' bV' + tileVersion + '" id="cell' + i + '_' + j + '"></div>';
        }
    }
    var game = document.getElementById('game');
    game.innerHTML = s;
    game.style.width = 33 * width + 'px';
    game.style.height = 33 * height + 'px';
    document.getElementById('navbar').style.width = 33 * width + 'px';
}

function paintMap(game) {
    for (var i = 0; i < game.height; i++)
        if (oldGame == 0 || game.boxes[i] != oldGame.boxes[i])
            for (var j = 0; j < game.boxes[i].length; j++) {
                var compressed = parseInt(game.boxes[i][j], 16);
                for (var k = 0; k < 2; k++)
                    if (j * 2 + k < game.width) {
                        var vanJSElement = document.getElementById('cell' + i + '_' + (j * 2 + (k) - 1));
                        var tile = ((compressed >> (2 * k)) & 0x03);
                        if (tile > 0) {
                            $(vanJSElement).html('<div class="box bV' + variations[i][j] + ' bS' + tile + '"></div>');
                        }
                        else {
                            $(vanJSElement).html('');
                        }
                    }
            }
}

function paintGoodies(game) {
    var goodieIds = {};
    game.goodies.forEach(function(g) {
        goodieIds['g' + g.x + '_' + g.y] = g;
    });
    $('.goodies').each(function(index, element) {
        if ($(element).id in goodieIds) {
            goodieIds[$(element).id] = null;
        }
        else {
            $(element).remove();
        }
    });
    for (var key in goodieIds) {
        var g = goodieIds[key];
        if (g != null) {
            var vanJSElement = document.getElementById('cell' + g.y + '_' + g.x);
            $(vanJSElement).html('<div id="' + key + '" class="goodies bV' + g.g + '"></div>');
        }
    }
}

function createPlayerString(game, anyPlayerID) {
    var s = game.men[anyPlayerID].name + '&nbsp;' + ("00000" + game.men[anyPlayerID].score).slice(-5) + '00&nbsp;';
    // shows indestructibility
    if (game.men[anyPlayerID].indest > 0) {
        s += '<div class="award bV7"></div>(' + game.men[anyPlayerID].indest + ')&nbsp;';
    }
    if (game.men[anyPlayerID].hasRBomb > 0) {
        s += '<div class="award bV9"></div>(' + game.men[anyPlayerID].hasRBomb + ')&nbsp;';
    }
    if (game.men[anyPlayerID].hasSBomb > 0) {
        s += '<div class="award bV8"></div>(' + game.men[anyPlayerID].hasSBomb + ')&nbsp;';
    }
    // shows available bombs
    for (var i = 0; i < game.men[anyPlayerID].bombs; i++) {
        s += '<div class="award bV3"></div>';
    }
    // got bad speed goodies?
    s += "&nbsp;";
    if (game.men[anyPlayerID].speed < 2) {
        s += '<div class="award bV6"></div>';
    }
    // got good speed goodies?
    if (game.men[anyPlayerID].speed > 2) {
        for (var i = 0; i < game.men[anyPlayerID].speed - 2; i++) {
            s += '<div class="award bV5"></div>';
        }
    }
    // got bad radius goodies?
    s += "&nbsp;";
    if (game.men[anyPlayerID].bombRadius < 3) {
        s += '<div class="award bV2"></div>';
    }
    // got good radius goodies?
    if (game.men[anyPlayerID].bombRadius > 3) {
        for (var i = 0; i < game.men[anyPlayerID].bombRadius - 3; i++) {
            s += '<div class="award bV1"></div>';
        }
    }
    return s;
}

function paintPanel(game) {
    if (playerID in game.men) {
        var s = 'Player:&nbsp;' + createPlayerString(game, playerID) // show players name and score
    }
    else {
        // not loged in? show loginscreen
        s = "";
        authCode = -1;
        playerID = -1;
        document.getElementById('playerPanel').style.display = "none";
        document.getElementById('login').style.display = "inline";
    }
    document.getElementById('playerPanel').innerHTML = s;
    //$('#playerPanel').html(s);
}

function paintHighScore(game) {
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
    var s = "";
    orderedList.forEach(function(man, index) {
        // write the score list, mark the own player and the winner
        s = s + '<span class="' + (index == 0 ? 'pWinner' : (man.id == playerID ? 'pMe' : 'pOthers')) + '">' + (index + 1) + '.&nbsp;' + createPlayerString(game, man.id) + '</span><br/>';
    });
    document.getElementById('highScore').innerHTML = s;
}

/*
 * cares for players animations
 */
function paintPlayers(game) {
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
        if (man.indest > 0 && !$('#man' + i).hasClass('indest')) {
            $('#man' + i).addClass('indest');
        }
        if (man.indest == 0 && $('#man' + i).hasClass('indest')) {
            $('#man' + i).removeClass('indest');
        }
    });
}

/*
 * cares for bomb animations
 */
function paintBombs(game) {
    Object.keys(game.bombs).forEach(function(i) {
        var bomb = game.bombs[i];
        if (bomb == null) {
            cleanupBomb(i);
            return;
        }
        if (!$('#count' + i).length && (bomb.countDown == null || bomb.countDown > 0)) {
            $('#game').append('<div class="bombs bomb b' + (bomb.remote ? 'Remote' : (bomb.strong ? 'Strong' : 'Normal')) + '" id="bombs' + i + '"></div>' +
                '<div class="count" id="count' + i + '"></div>');
        }
        $('#bombs' + i).css({
            'top': (bomb.y * 33) + 'px',
            'left': (bomb.x * 33) + 'px'
        });
        $('#count' + i).css({
            'top': (bomb.y * 33 - 10) + 'px',
            'left': (bomb.x * 33 + 10) + 'px'
        });
        if (bomb.countDown != null) {
            $('#count' + i).html(Math.round(2 * bomb.countDown));
        }
        if (bomb.countDown == null != bomb.countDown <= 0) {
            $('#count' + i).remove();
            $('#bombs' + i).remove();
        }
        if (!bomb.ignition) return;
        if (!$('#bombc' + i).length) { //create new bomb
            var prefix = (bomb.strong ? 'blue' : 'expl');
            $('#game').append('<image style="display:none" class="bombs" id="bombc' + i + '" src="img/' + prefix + 'c.png">' +
                '<div class="' + prefix + 'h" id="ignr' + i + '"></div>' +
                '<div class="' + prefix + 'h" id="ignl' + i + '"></div>' +
                '<div class="' + prefix + 'v" id="ignt' + i + '"></div>' +
                '<div class="' + prefix + 'v" id="ignb' + i + '"></div>' +
                '<image style="display:none" class="exple" id="ignre' + i + '" src="img/' + prefix + 'e.png">' +
                '<image style="display:none" class="exple" id="ignle' + i + '" src="img/' + prefix + 'e.png">' +
                '<image style="display:none" class="exple" id="ignte' + i + '" src="img/' + prefix + 'e.png">' +
                '<image style="display:none" class="exple" id="ignbe' + i + '" src="img/' + prefix + 'e.png">');
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

function cleanupBomb(id) {
    ['bombs', 'bombc', 'ignr', 'ignl', 'ignt', 'ignb', 'ignre', 'ignle', 'ignte', 'ignbe', 'count'].forEach(function(element) {
        $("#" + element + id).remove();
    });
}

function cleanupBombs(game) {
    $(".bombs").each(function() {
        var id = $(this).attr('id').substr(5);
        if (!(id in game.bombs) || game.bombs[id] == null) {
            cleanupBomb(id);
        }
    });
}

function checkForSound(game) {
    Object.keys(game.sounds).forEach(function(i) {
        var sound = game.sounds[i];
        if ((soundsPlayed.indexOf(i) == -1) && (sound.timestamp > game.stime - 1000)) {
            if (soundControl)
                sounds[sound.sound].play();
            soundsPlayed.push(i);
        }
    });
}

function cleanupPlayers(game) {
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

function updateMap() {
    //for inital load
    $.ajax({
        url: choosenServer + 'extended/' + rev,
        headers: {
            'Accept-Language': '',
        },
        timeout: 1000,
        error: function(result) {
            rev = 0;
            start = 0;
        },
        success: getData
    });

}

function getGroundMap(callback) {
    //for inital load
    $.ajax({
        url: choosenServer + 'map',
        headers: {
            'Accept-Language': '',
        },
        timeout: 1000,
        success: callback
    });
}

function getData(result) {
    start = new Date().getTime();
    if (result == '') return;
    var game = JSON.parse(result);
    rev = game.rev;
    if (oldGame == 0) {
        getGroundMap(function(groundResult) {
            oldGame = 0; //könnte schon wieder überschrieben worden sein.
            createMap(JSON.parse(groundResult));
            updateExtended(game);
        });
    }
    else
        updateExtended(game);
}

function updateExtended(game) {
    paintMap(game);
    paintPanel(game);
    paintHighScore(game);
    paintPlayers(game);
    paintBombs(game);
    paintGoodies(game);
    checkForSound(game);
    cleanupBombs(game);
    cleanupPlayers(game);
    if (game.men[playerID] != null) {
        playersName = game.men[playerID].name;
    }
    $('#json').html('Player:' + JSON.stringify(game.men) + '<br/>Bombs:' + JSON.stringify(game.bombs));
    oldGame = game;
    $('#resptime').html((new Date().getTime() - start) + "ms");

}

$(document).ready(main);

function loginscreen(enabled) {
    if (!enabled) {
        $('#login').hide();
        $('#playerPanel').show();
    }
    else {
        authCode = -1;
        playerID = -1;
        localStorage.removeItem("kaboomen.login.authCode");
        localStorage.removeItem("kaboomen.login.playerID");
        $('#login').show();
        $('#playerPanel').hide();
    }

}

function main() {
    var protocol = window.location.href.split('/')[0];
    authCode = localStorage.getItem("kaboomen.login.authCode");
    playerID = localStorage.getItem("kaboomen.login.playerID");
    loginscreen(authCode == null);
    var s = '';

    for (var j = 0; j < servers.length; j++) {
        if (protocol=='http:' || servers[j].indexOf(protocol)>-1) {
            s = s + '<option value="' + j + '"' + (j == $('#servers').val() ? ' selected="selected"' : '') + '>' + servers[j] + '</option>';
            if (choosenServer == null)
                choosenServer = servers[j];
        }
    }
    document.getElementById('servers').innerHTML = s;
    $('#newPlayer').keypress(function(e) {
        // Enter pressed?
        if (e.which == 10 || e.which == 13) {
            newPlayer();
        }
    });
    updateMap();
    if (connectionType == "sockets") {
        socket = io(choosenServer);
        socket.on('order', function(result) {
            console.log('Auth failure! ', result);
            loginscreen(result == authCode);
        });
        socket.on('extended', getData);
        socket.on('chat', gotChat);
        $('#chat').html('<div id="chatHistory"></div>chat:<input id="newChat" type="text">');
        $('#newChat').keypress(function(e) {
            if (e.which == 10 || e.which == 13) {
                socket.emit('chat', {
                    name: playersName,
                    text: $("#newChat").val()
                });
                $("#newChat").val("");
            }
        });

    }
    else {
        setInterval(updateMap, 50);
    }
}

function gotChat(result) {
    start = new Date().getTime();
    if (result == '') return;
    $("#chatHistory").html('<span class="chatName">[' + result.name + ']</span>&nbsp;<span class="chatText">' + result.text + "</span><br/>" + $("#chatHistory").html().substring(0, 500) + "</span>");
}

function toggleSound() {
    soundControl = !soundControl;
    $('.audioControl').toggleClass('audioOn');
    $('.audioControl').toggleClass('audioOff');
}

function sendOrder(order) {
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
                    loginscreen(true);
                }
            }
        });
    }

}

/* unused keyCode*/
function keyCode(event) {
    var key = event.keyCode;
    var order = -1;
    if (key == 88) {
        console.log(JSON.stringify(oldGame));
        return;
    }
    if (key == 37) order = 'left';
    if (key == 39) order = 'right';
    if (key == 38) order = 'up';
    if (key == 40) order = 'down';
    if (key == 32) order = 'bomb';
    if (order != -1) {
        sendOrder(order);
    }
}

function newPlayer() {
    $.ajax({
        url: servers[$('#servers').val()] + "create/" + $("#newPlayer").val(),
        success: function(result) {
            var t = result.split(",");
            authCode = t[0];
            playerID = t[1];
            localStorage.setItem("kaboomen.login.authCode", authCode);
            localStorage.setItem("kaboomen.login.playerID", playerID);
            loginscreen(false);
        },
        error: function(result) {
            loginscreen(true);
        }
    });
    $("#newPlayer").val("");
}
