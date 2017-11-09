/*global c,$,app*/

var serverNum = '8082';
var sizeX = 32;
var sizeY = 32;
var lastRev = 0;

function start() {
    $.get('http://kaboomen.de:' + serverNum +'/map/', createBackground);
    setInterval(refresh, 50);
}

function refresh() {
	$.get('http://kaboomen.de:8082/extended/' + lastRev, gotData);
}

function gotData(dataIn) {
	if (dataIn == '' || dataIn == null) return;
	var data = JSON.parse(dataIn);
	lastRev = data.rev;
	renderMen(data.men);
}

function renderMen(menIn) {
	if (menIn == '' || menIn == null) return;
	var men = JSON.parse(menIn);
	for (var man in men) {
	    if (men.hasOwnProperty(man)) {
	        
	    }
	}
}

function createBackground(mapIn) {
    if (mapIn == '' || mapIn == null) return;
	var map = JSON.parse(mapIn);
	var s = '';
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
	    }
	}
	$('#map').html(s);
}

$(document).ready(start);