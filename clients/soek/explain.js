/*global c, localStorage, $, io, connectionType, navigator */
/*exported newPlayer(), keyCode(event) */

var socket = null;
var start = null;
var tab = function(content) {
    return '<span class="tab">' + content + '</span>'
};

function paintMap(game) {
    var s = "";
    for (var i = 0; i < game.height; i++) {
        s += tab((i == 0 ? 'map:[' : '')) + '[';
        for (var j = 0; j < game.width; j++) {
            var tile = game.map[i][j];
            var clss = "mapElement";
            if ([0, 1, 2, 3, 33, 34, 35, 36, 37, 38, 39].indexOf(tile)!=-1) {
                tile = 'game' + tile;
            }
            else if ((tile & c.FILTER_PLAYER) == c.FILTER_PLAYER) {
                tile = 'man' + (tile - c.FILTER_PLAYER);
                clss = "menElement";
            }
            else if ((tile & c.FILTER_GOODIE) == c.FILTER_GOODIE) {
                tile = 'goodie' + (tile - c.FILTER_GOODIE);
            }
            else {
                tile = 'back';
            }
            s += '<span class="' + clss + '" style="background-image:url(img/explain/' + tile + '.png)">' + game.map[i][j] +
                (j < game.width - 1 ? ',' : '') + '&nbsp;</span>';
        }
        if (i < game.height - 1)
            s += '],<br/>';
    }
    s += ']<br>],';
    document.getElementById('map').innerHTML = s;
}

function comment(key, commenLines) {
    if (key in commenLines)
        return '<span class="comment">//' + commenLines[key]+'</span>';
    else
        return '';
}

function showTyped(input) {
    return JSON.stringify(input); 
}

/*
 * cares for players animations
 */

var menComment = {
    "name": "Name des Spieler",
    "speed": "Geschwindigkeit: 1=langsam, 2=normal, 3..5=schnell",
    "anim": "Animationsschritt 0..7",
    "look": "Aussehen/Farbe",
    "bombs": "noch verfügbare Bomben",
    "score": "Punkte",
    "next": "gepufferte Nutzeraktion (nur für Backend)",
    "action": "Aktion: 0=warten, 5=sterben, 6=laufen",
    "direction": "Richtung: 0=hoch, 1=runter, 2=links, 3=rechts",
    "id": "Identifier des Spielers",
    "bombRadius": "Explosionsradius",
    "countDown": "Bombencountdown",
    "x": "Position: X oder Spalte",
    "y": "Position: Y oder Zeile",
};

function paintMen(game) {
    var s = '';
    var k1 = 0;
    var l1 = Object.keys(game.men).length;
    if (l1==0) {s = 'men:{'}
    for (var i in game.men) {
        s += tab(k1==0?'men:{':'') + '<div class="inline">';
        var man = game.men[i];
        var k2 = 0;
        var l2 = Object.keys(man).length;
        for (var j in man) {
            s += tab(k2 == 0 ? i + ': {' : '') + tab(j + ': ') + tab(showTyped(man[j]) + (k2==l2-1?'':','));
            s += comment(j, menComment) + '<br>';
            k2++;
        }
        s += '<image class="men" id="man' + i + '" src="img/man' + (man.look % 5) + '.png" style="width:384px;height:320px;';
        var x = 0;
        var y = 70;
        var c = 2;
        if (man.action == 5) { //dies
            s += 'clip: rect(' + 4 * c * 32 + 'px,' + (man.anim + 1) * c * 24 + 'px,' + 5 * c * 32 + 'px,' + man.anim * c * 24 + 'px);';
            s += 'top: ' + (y - 4 * 32 * c) + 'px;';
            s += 'left: ' + (x - man.anim * c * 24) + 'px';
        }
        else { //walks
            s += 'clip: rect(' + (man.direction - 1) * c * 32 + 'px,' + (man.anim + 1) * c * 24 + 'px,' + (man.direction) * c * 32 + 'px,' + man.anim * c * 24 + 'px);';
            s += 'top: ' + (y + c * 32 - man.direction * c * 32) + 'px;';
            s += 'left: ' + (x - man.anim * c * 24) + 'px';
        }
        s += '">}'+(k1==l1-1?'':',')+'</div><br>';
        k1++;
    }
    s += '},'
    document.getElementById('men').innerHTML = s;
}

/*
 * cares for bomb animations
 */
 
var bombsComment = {
    "ignition":"Zündung?",
    "radius":"Bombenradius",
    "countDown":"Aktueller Countdown",
    "bomberId":"PlayerID des Bombenlegers",
    "anim":"Cooldown Animation 0..3",
    "id":"Identifier der Bomber",
    "goodies":"Goodies die durch die Bombe frei werden",
    "max":"Maximale Ausdehung",
    "ign":"Aktuelle Ausdehung",
    "x": "Position: X oder Spalte",
    "y": "Position: Y oder Zeile",
};

function paintBombs(game) {
    var s = '';
    var k1 = 0;
    var l1 = Object.keys(game.bombs).length;
    if (l1==0) {s = 'bombs:{'}
    for (var i in game.men) {
        s += tab(k1==0?'bombs:{':'') + '<div class="inline">';
        var bomb = game.bombs[i];
        if (bomb == null) {
            s += i + ': "null"';
        } else {
            var k2 = 0;
            var l2 = Object.keys(bomb).length;
            for (var j in bomb) {
                s += tab(k2 == 0 ? i + ': {' : '') + tab(j + ': ') + tab(showTyped(bomb[j]) + (k2==l2-1?'':','));
                s += comment(j, bombsComment) + '<br>';
                k2++;
            }
            s +='"}'; 
        }
        s += (k1==l1-1?'':',')+'</div><br>';
        k1++;
    }
    s += '},'
    document.getElementById('bombs').innerHTML = s;
}

 
function paintBombsXYZ(game) {
    Object.keys(game.bombs).forEach(function(i) {
        var bomb = game.bombs[i];
        if (!$('#count' + i).length) {
            $('#game').append('<div class="count" id="count' + i + '"></div>');
        }
        $('#count' + i).css({
            'top': ((1 + bomb.y) * 33 - 30) + 'px',
            'left': (bomb.x * 33 + 12) + 'px'
        });
        $('#count' + i).html(Math.round(bomb.countDown / 1000));
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

function updateMap() {
    //for inital load
    $.ajax({
        url: 'http://kaboomen.de:8081/extview/0',
        headers: {
            'Accept-Language': '',
        },
        timeout: 1000,
        error: function(result) {
            start = 0;
        },
        success: getData
    });

}

function getData(result) {
    start = new Date().getTime();
    var scroll = $(document).scrollTop();
    if (result == '') return;
    var game = JSON.parse(result);
    paintMap(game);
    paintMen(game);
    paintBombs(game);
    //    paintPanel(game);
    // paintPlayers(game);
    //    paintBombs(game);
    $(document).scrollTop(scroll);
}

$(document).ready(main);

function main() {
    setInterval(updateMap, 500);
}
