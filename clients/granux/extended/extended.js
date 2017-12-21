/*global c,$,app*/

//remove men, create new men and fed them with attributes
//remove destroyed boxes

var serverNum = '8082';
var sizeX = 32;
var sizeY = 32;
var playerSizeX = 64;
var PlayerSizeY = 64;
var lastRev = 0;
var menNum = 0;
var oldMenNum = 0;
var playerIDs = new Array(0);
var oldPlayerIDs = new Array(0);

function start() {
    $.get('http://kaboomen.de:' + serverNum +'/map/', createBackground);
    setInterval(refresh, 50);
}

function refresh() {
	$.get('http://kaboomen.de:' + serverNum + '/extended/' + lastRev, gotData);
}

function gotData(dataIn) {
	if (dataIn == '' || dataIn == null) return;
	var data = dataIn;
	lastRev = data.rev;
	getBoxes(data.boxes);
	renderMen(data.men);
}

function getBoxes(boxesIn) {
	if (boxesIn == '' || boxesIn == null) return;
	var boxes = boxesIn;
	for (var y = 0; y < c.SET_HEIGHT; y++) {
		for (var x = 0; x < boxes[y].length; x++) {
			var line = parseInt(boxes[y][x], 16);
			for (var i = 0; i < 2; i++) {
				if (x * 2 + i < c.SET_WIDTH) {
					var lives = ((line >> (2 * i)) & 0x03);
					renderBox(lives, x * 2 + i - 1, y);
				}
			}
		}
	}
}

function renderBox(lives, x , y) {
	if (lives > 0) {
		$('#tile_' + x + '_' + y).attr('class', 'box');
		$('#tile_' + x + '_' + y).css('background-position-x', '-' + ((lives - 1) * 100) + '%');
	}
}

function renderMen(menIn) {
	if (menIn == '' || menIn == null) return;
	var men = JSON.parse(menIn);
	oldMenNum = menNum;
	menNum = men.length;
	oldPlayerIDs = playerIDs;
	playerIDs = new Array(0);
	for (var man in men) {
	    if (men.hasOwnProperty(man)) {
	        playerIDs.push(man.id);
	    }
	}
	if (oldPlayerIDs != playerIDs) {
		
	}
}

function createBackground(mapIn) {
    if (mapIn == '' || mapIn == null) return;
	var map = mapIn;
	var s = '';
	var tile = '';
	for (var y = 0; y < c.SET_HEIGHT; y++) {
	    for (var x = 0; x < c.SET_WIDTH; x++) {
    	    s += '<div id="bgtile_' + x + '_' + y + '" class="';
    	    var classname = 'bg ';
    	    if (map.map[y][x] >= 512) {
        	    switch(map.map[y][x] - 512) {
        	    case 4:
        	        classname += 'wall';
        	        break;
        	    case 8:
        	    	classname += 'wall rotate_90';
					break;
				case 24:
					classname += 'wall_edge';
					break;
				case 16:
					classname += 'wall_edge rotate_-90';
					break;
				case 12:
					classname += 'wall_edge rotate_90';
					break;
				case 20:
					classname += 'wall_edge rotate_180';
					break;
				case 0:
					classname += 'wall_middle_gray';
					break;
				case 36:
					classname += 'wall_end rotate_180';
					break;
				case 40:
					classname += 'wall_end';
					break;
				case 32:
					classname += 'wall_end rotate_-90';
					break;
				case 28:
					classname += 'wall_end rotate_90';
					break;
				case 44:
					classname += 'wall_middle_red';
					break;
				case 48:
					classname += 'wall_middle_green';
					break;
			    }
    		}else {
    	        switch(map.map[y][x]) {
    	            case 8:
    	                classname += 'green';
    	                break;
    	            case 16:
    	                classname += 'yellow';
    	                break;
    	            case 4:
    	                classname += 'red';
    	                break;
    	            case 24:
    	                classname += 'gray';
    	                break;
    	            case 20:
    	                classname += 'white';
    	                break;
    	            case 28:
    	                classname += 'blue';
    	                break;
    	            case 32:
    	                classname += 'purple';
    	                break;
    	        }
    	    }
    	    s += classname + '" style="top:' + (y * sizeY) + 'px;left:' + (x * sizeX) + 'px;width:' + sizeX + 'px;height:' + sizeY + 'px;position:absolute;"></div>';
    	    tile += '<div id="tile_' + x + '_' + y + '" class="none" style="top:' + (y * sizeY) + 'px;left:' + (x * sizeX) + 'px;width:' + sizeX + 'px;height:' + sizeY + 'px;position:absolute;"></div>';
	    }
	}
	$('#map').html(s);
	$('#map').append(tile);
}

$(document).ready(start);