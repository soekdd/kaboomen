(function(exports) {
var c;
var start = 0;
var maxrec = 10;
var game = null;
var socket = null;
var authCode = -1;
var playerID = -1;
var steps = null;
var quality = null;
var nextStep = null;
var lastAction = null;
var inDanger = false;
var direction = [{
    is: 'up',
    x: 0,
    y: -1
}, {
    is: 'down',
    x: 0,
    y: 1
}, {
    is: 'left',
    x: -1,
    y: 0
}, {
    is: 'right',
    x: 1,
    y: 0
}];

var disorder = [[0,1,2,3], [0,1,3,2], [0,2,1,3], [0,2,3,1], [0,3,1,2], [0,3,2,1], [1,0,2,3], [1,0,3,2], [1,2,0,3], [1,2,3,0], [1,3,0,2], [1,3,2,0], [2,0,1,3], [2,0,3,1], [2,1,0,3], [2,1,3,0], [2,3,0,1], [2,3,1,0], [3,0,1,2], [3,0,2,1], [3,1,0,2], [3,1,2,0], [3,2,0,1], [3,2,1,0]];

exports.isInDanger=function(){
    return inDanger;
}
//work around of different kind of js lib loading in node.js and browser
exports.setC=function(inC){
    c=inC;
};

exports.setGame=function(inGame){
    game = inGame;
};

exports.setSocket=function(inSocket){
    socket = inSocket;
};

exports.setPlayerID=function(inPlayerID){
    playerID = inPlayerID;
};

exports.setAuthCode=function(inAuthCode){
    authCode = inAuthCode;
};

exports.getQuality=function(){
    return quality;
};

exports.getSteps=function(){
    return steps;
};

exports.getNextStep=function(){
    return nextStep;
};

function resetHelper(height, width) {
    steps = [];
    nextStep = [];
    quality = [];
    for (var i = 0; i < height; i++) {
        steps[i] = [];
        nextStep[i] = [];
        quality[i] = [];
        for (var j = 0; j < width; j++) {
            steps[i][j] = 0;
            nextStep[i][j] = 0;
            quality[i][j] = 0;
        }
    }
}

function getTile(x,y) {
	if ((x >= 0) && (x < game.width) && (y >= 0) && (y < game.height)) {
		return game.map[y][x];
	}
	return null;
}

function isBombable(x, y) {
    if (y < 0 || x < 0 || x >= game.width || y >= game.height) {
        return false;
    }
    if ((getTile(x,y) & c.FILTER_PLAYER) == c.FILTER_PLAYER) {
        return true;
    }
    if ((getTile(x,y) & c.FILTER_GOODIE) == c.FILTER_GOODIE) {
        return true;
    }
    if ((getTile(x,y) & c.FILTER_BOMB) == c.FILTER_BOMB) {
        return true;
    }
    return (getTile(x,y) == c.MAP_FLOOR) || (getTile(x,y) == c.ITEM_BOMB);
}

function isWalkable(x, y) {
    return (getTile(x,y) == c.MAP_FLOOR) || c.isGoodGoodie(getTile(x,y));
}

function isWalkableInDanger(x, y) {
    return isWalkable(x, y) || c.isBadGoodie(getTile(x,y));
}

/*
 * checks if a field is walkable
 */
function checkForWalk(deep, x, y, direction, danger) {
    if (danger) {
        return ((steps[y + direction.y][x + direction.x] == 0 || steps[y + direction.y][x + direction.x] >= deep) && isWalkableInDanger(x + direction.x, y + direction.y));
    }
    return (steps[y + direction.y][x + direction.x] == 0 || steps[y + direction.y][x + direction.x] >= deep) 
        && isWalkable(x + direction.x, y + direction.y) 
        && !checkIfDangerDirect(x + direction.x, y + direction.y);
}

function checkIfEscape(x, y) {
    if (game.men[playerID].indest>game.men[playerID].countDown) return true; //I did no escape!
    var mx, my;
    var escape = false;
    for (var i = 0; i < 4; i++) {
        mx = x + direction[i].x;
        my = y + direction[i].y;
        if (isWalkable(mx, my) && !checkIfDangerDirect(mx, my))
            escape = true;
    }
    //the first step already failed
    if (!escape) {
        return false;
    }
    for (var i = 0; i < 4; i++) {
        var step = 1;
        while (isWalkable(x + step * direction[i].x, y + step * direction[i].y)) {
            for (var j = -1; j < 2; j = j + 2) {
                if (direction[i].x == 0) {
                    mx = x + j; //up down
                    my = y + step * direction[i].y;
                }
                else {
                    mx = x + step * direction[i].x;
                    my = y + j; //left right
                }
                if (isWalkable(mx, my) && !checkIfDangerDirect(mx, my))
                    return true;
            }
            step++;
        }
    }
    return false;
}

function checkIfBombExtended(x,y) {
    return (getTile(x,y)==c.ITEM_BOMB) || ((getTile(x,y) & c.FILTER_BOMB)==c.FILTER_BOMB); 
}

function checkIfBombOnly(x,y) {
    return (getTile(x,y)==c.ITEM_BOMB) || (getTile(x,y)==(c.FILTER_BOMB|c.MAP_BOMB_CENTER));
}


function checkIfBomb(x,y) {
    for (var i=0;i<Object.keys(game.bombs).length;i++) {
        var bomb = game.bombs[Object.keys(game.bombs)[i]];
        if (bomb.x==x && bomb.y==y) return true;
    }
    return false;
}

/*
 * check if the current position is in danger
 */
function checkIfDangerDirect(x, y) {
    if (game.men[playerID].indest>>game.men[playerID].countDown) return false; //I have no fear!
    var danger = checkIfBombExtended(x,y);
    for (var i = 0; i < 4; i++) {
        var step = 0;
        while (isBombable(x + step * direction[i].x, y + step * direction[i].y)) {
            if (checkIfBombExtended(x + step * direction[i].x,y + step * direction[i].y)) {
                return true;
            }
            step++;
        }
    }
    return danger;
}

function checkIfDanger(x, y) {
    if (game.men[playerID].indest>game.men[playerID].countDown) return false; //I have no fear!
    var danger = checkIfBombOnly(x,y);
    for (var i = 0; i < 4; i++) {
        var step = 0;
        while (isBombable(x + step * direction[i].x, y + step * direction[i].y)) {
            if (checkIfBombOnly(x + step * direction[i].x,y + step * direction[i].y)) {
                return true;
            }
            step++;
        }
    }
    return danger;
}


function planNextStep(deep, x, y, dir) {
    if (deep > maxrec || y < 0 || y >= game.height || x < 0 || x >= game.with) return;
    deep++;
    steps[y][x] = deep;
    if (dir == null) {
        nextStep[y][x] = 5;
    }
    else {
        nextStep[y][x] = dir;
    }
    var danger = checkIfDanger(x, y);
    if (deep==2) {
        inDanger=danger;
    }
    //console.log(danger?'in danger':'peace');
    for (var i = 0; i < 4; i++) {
        if (checkForWalk(deep, x, y, direction[i], danger)) {
            var newdir = i;
            if (dir != null) {
                newdir = dir;
            }
            planNextStep(deep, x + direction[i].x, y + direction[i].y, newdir);
        }
    }
}

function checkForQuality() {
    var height = game.height;
    var width = game.width;
    var highest = -999;
    var hDirection = -1;
    var hx, hy;
    var x = Math.round(game.men[playerID].x);
    var y = Math.round(game.men[playerID].y);
    var mx = 0;
    var my = 0;
    var i = 0;
    var j = 0;
    var bombRadius = game.men[playerID].bombRadius;
    var thisDisorder = Math.floor(Math.random()*24);
    if (checkIfDanger(x, y)) {
        for (var o = 0; o < 4; o++) {
            i = disorder[thisDisorder][o];
            mx = x + direction[i].x;
            my = y + direction[i].y;
            if (isWalkable(mx, my) && !checkIfDanger(mx, my)) {
                q = 100;
                quality[my][mx] = q;
                if (highest < q) {
                    highest = q;
                    hx = mx;
                    hy = my;
                    hDirection = nextStep[my][mx];
                }
            }
        }
        //look for save place fare away
        for (var o = 0; o < 4; o++) {
            i = disorder[thisDisorder][o];
            var step = 1;
            while ((steps[y + step * direction[i].y][x + step * direction[i].x] != 0) && isWalkable(x + step * direction[i].x, y + step * direction[i].y)) {
                for (var j = -1; j < 2; j = j + 2) {
                    if (direction[i].x == 0) {
                        mx = x + j; //up down
                        my = y + step * direction[i].y;
                    }
                    else {
                        mx = x + step * direction[i].x;
                        my = y + j; //left right
                    }
                    if ((steps[my][mx] != 0) && isWalkable(mx, my) && !checkIfDanger(mx, my)) {
                        q = 99 - steps[my][mx];
                        quality[my][mx] = q;
                        if (highest < q) {
                            highest = q;
                            hx = mx;
                            hy = my;
                            hDirection = nextStep[my][mx];
                        }
                    }
                }
                step++;
            }
        }
    }
    else {
        for (var oi = 0; oi < height; oi++) {
            if (disorder<13) {
                i = height - oi - 1;
            } else i = oi;
            for (var oj = 0; oj < width; oj++) {
                if ((disorder % 2) ==0) {
                    j = width - oj - 1;
                } else j = oj;
                if (steps[i][j] > 0) {
                    if (checkIfDanger(j, i)) {
                        quality[i][j] = -99;
                    }
                    else {
                        var q = 0;
                        if (c.isGoodGoodie(getTile(j,i))) {
                            q = q + 50;
                        }
                        if (getTile(j,i) == (c.FILTER_GOODIE | c.GOODIE_INDESTRUCTIBLE) || getTile(j,i) == (c.FILTER_GOODIE | c.GOODIE_STRONGBOMB)) {
                            q = q + 200;
                        }
                        if (getTile(j,i) == (c.FILTER_GOODIE | c.GOODIE_REMOTEBOMB)) {
                            q = q - 200;
                        }
                        if (getTile(j,i) == (c.ITEM_BOMB)) {
                            q = q - 200; // needed for indestructibles
                        }
                        if (checkIfBombExtended(j,i)) {
                            q = q - 200;
                        }
                        q = q - steps[i][j];
                        for (var d = 0; d < 4; d++) {
                            step=1;
                            while (/*isBombable(j+step*direction[d].x, i+step*direction[d].y) &&*/ step<bombRadius) {
                                if (getTile(j + direction[d].x, i + direction[d].y) == c.MAP_BOX) {
                                    q = q + 10;
                                    step = 99;
                                    break;
                                }
                                if (((getTile(j + step*direction[d].x, i + step*direction[d].y) & c.FILTER_PLAYER) == c.FILTER_PLAYER) && (getTile(j + step*direction[d].x,i + step*direction[d].y) != (c.FILTER_PLAYER | playerID))) {
                                    q = q + 100;
                                    step = 99;
                                    break;
                                }
                                if (getTile(j + step*direction[d].x,i + step*direction[d].y) == c.MAP_WALL) {
                                    q = q - 2;
                                    step = 99;
                                    break;
                                }
                                if (c.isBadGoodie(getTile(j + step*direction[d].x,i + step*direction[d].y))) {
                                    q = q + 25;
                                    step = 99;
                                    break;
                                }
                                if (c.isGoodGoodie(getTile(j + step*direction[d].x,i + step*direction[d].y))) {
                                    q = q - 30;
                                    step = 99;
                                    break;
                                }
                                step++;
                            }
                        }
                        if (highest < q) {
                            highest = q;
                            hDirection = nextStep[i][j];
                            hx = j;
                            hy = i;
                            if ((x == j) && (y == i))
                                if (checkIfEscape(x, y)) {
                                    hDirection = 4;
                                }
                        }
                        quality[i][j] = q;
                    }
                }
            }
        }
    }
    if (hy!==undefined && hx!==undefined) {
        quality[hy][hx] = quality[hy][hx] + '<span style="color:red">X</span>';
        return hDirection;
    }
    return -1;
}

exports.doBot = function() {
    var orderMap = {0:'iup',1:'idown',2:'ileft',3:'iright',4:'bomb'};
    start = (new Date()).getTime();
    if (game==null || game.men[playerID] == null) {
        return;
    }
    resetHelper(game.height, game.width);
    planNextStep(1, Math.round(game.men[playerID].x), Math.round(game.men[playerID].y), null);
    var order = checkForQuality();
    if (order in orderMap) {
            lastAction = (new Date).getTime();
            socket.emit('order', {
                'authCode': authCode,
                'order': orderMap[order]
            });
    } else {
        if (lastAction!=null && (lastAction + 5000) < (new Date).getTime()) {
            //suicide squad
            lastAction = (new Date).getTime();
            socket.emit('order', {
                'authCode': authCode,
                'order': 'bomb'
            });
        }
    }
    //console.log((new Date()).getTime()-start+' ms');
};

exports.rebuildStandardAPIMap = function(game,ground) {
    var map = [];
    for (var i = 0; i < game.height; i++) {
        map[i] = [];
        for (var j = 0; j < game.width; j++) {
            if (ground.map[i][j]<c.EXTMAP_WALL_GROUND) 
                map[i][j]=c.MAP_FLOOR 
            else 
                map[i][j]=c.MAP_WALL; 
        }
        for (var j = 0; j < game.boxes[i].length; j++) {
            var compressed = parseInt(game.boxes[i][j],16);
            for (var k=0;k<2;k++) {
                if (j*2+k<game.width) {
                    var tile = ((compressed >> (2*k)) & 0x03);
                    if (tile>0)
                        map[i][j*2+k-1] = (c.FILTER_BOX | tile);
                }
            }
        }
    }
    for (var j = 0; j < game.goodies.length; j++) {
        var g = game.goodies[j];
        map[g.y][g.x] = (c.FILTER_GOODIE | g.g);
    }
    for (var key in game.men) {
        var p = game.men[key];
        if (p!=null)
            map[Math.round(p.y)][Math.round(p.x)] = (c.FILTER_PLAYER | key);
    }
    for (var key in game.bombs) {
        var b = game.bombs[key];
        if (b!=null)
            map[Math.round(b.y)][Math.round(b.x)] = c.ITEM_BOMB;
    }
    return map;
};

})(typeof exports === 'undefined' ? this['ai'] = {} : exports);