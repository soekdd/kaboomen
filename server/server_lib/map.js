/**
 * http://usejsdoc.org/
 */
var winston = require('winston');
var c = require('../common_lib/js/kaboomen_consts.js');
var fs = require('fs');
class Map {
	constructor(inMap) {
		if (inMap === undefined || inMap === null || (typeof inMap == 'string'))
			this.createNewWalls(inMap);
		else {
			this.width = inMap.getWidth();
			this.height = inMap.getHeight();
			this.map = [];
			for (var y = 0; y < this.height; y++) {
				this.map[y] = [];
				for (var x = 0; x < this.width; x++) {
					this.map[y][x] = c.MAP_FLOOR;
					if (inMap.isExtWallAtPosition(x,y)) {
						this.map[y][x] = c.MAP_WALL;
					} else if (Math.random()>0.5) this.placeBox(x,y);
				}
			}
		}
	}
	getWidth() {
		return this.width;
	}
	
	getHeight() {
		return this.height;
	}
	
	placeBox(x,y) {
		var random = Math.random();
		if (random > 0.3) 
			this.map[y][x] = (c.FILTER_BOX | 1);
		else if (random > 0.05) 
			this.map[y][x] = (c.FILTER_BOX | 2);
		else this.map[y][x] = (c.FILTER_BOX | 3);
	}
	
	getMap() {
		return this.map;
	}

	/*
	 * gets coordinates of an empty field (floor)
	 */
	getFloor() {
		var y, x;
		do {
			y = 1 + Math.trunc(Math.random() * c.SET_HEIGHT - 1);
			x = Math.trunc(Math.random() * (c.SET_WIDTH));
		} while (this.map[y][x] != c.MAP_FLOOR);
		return {
			'x': x,
			'y': y
		};
	}

	setTile(x, y, tile) {
		if ((x >= 0) && (x < c.SET_WIDTH) && (y >= 0) && (y < c.SET_HEIGHT)) {
			this.map[y][x] = tile;
		}
		else {
			winston.warn('tired to write outside the map');
		}
	}

	getTile(x, y) {
		if ((x >= 0) && (x < c.SET_WIDTH) && (y >= 0) && (y < c.SET_HEIGHT)) {
			return this.map[y][x];
		}
		return null;
	}

	setPlayerAtPosition(x, y, manId) {
		this.map[y][x] = (c.FILTER_PLAYER | manId);
	}

	createLandingField(posx, posy, manId) {
		for (var x = posx - 1; x < posx + 2; x++) {
			for (var y = posy - 1; y < posy + 2; y++) {
				if (this.isBoxAtPosition(x,y)) this.map[y][x] = c.MAP_FLOOR;
			}
		}
		this.setPlayerAtPosition(posx, posy, manId);
	}

	isWalkable(x, y) {
		return (x >= 0) && (x < c.SET_WIDTH) && (y >= 0) && (y < c.SET_HEIGHT) && c.isWalkable(this.map[y][x]);
	}

	isRemoveable(x, y) {
		return c.isRemoveable(this.map[y][x]);
	}

	isDestroyable(x, y) {
		return c.isDestroyable(this.map[y][x]);
	}

	isUndestroyable(x, y) {
		return c.isUndestroyable(this.map[y][x]);
	}

	isPlayerAtPosition(x, y, manId) {
		if (typeof manId === 'undefined')
			return (this.map[y][x] & c.FILTER_PLAYER) == c.FILTER_PLAYER;
		else
			return this.map[y][x] == (c.FILTER_PLAYER | manId);
	}

	isAnyPlayerAtPosition(x, y) {
		return (c.FILTER_PLAYER & this.map[y][x]) == c.FILTER_PLAYER;
	}

	isGoodieAtPosition(x, y, goodie) {
		if (typeof goodie === 'undefined')
			return (this.map[y][x] & c.FILTER_GOODIE) == c.FILTER_GOODIE;
		else
			return this.map[y][x] == (c.FILTER_GOODIE | goodie);
	}

	isExplostionAtPosition(x, y) {
		return (this.map[y][x] & c.FILTER_BOMB) == c.FILTER_BOMB;
	}

	isBombAtPosition(x, y) {
		return this.map[y][x] == c.ITEM_BOMB;
	}

	isBoxAtPosition(x, y) {
		return (this.map[y][x] & c.FILTER_BOX) == c.FILTER_BOX;
	}

	isBoxCountAtPosition(x, y) {
		return this.isBoxAtPosition(x, y)?this.map[y][x]-c.FILTER_BOX:0;
	}

	countDownBoxAtPosition(x, y) {
		if (this.isBoxAtPosition(x, y) && (this.map[y][x]-c.FILTER_BOX>0)) {
			this.map[y][x]--;
		}
		return this.map[y][x]-c.FILTER_BOX==0;
	}

	isWallAtPosition(x, y) {
		return this.map[y][x] == c.MAP_WALL;
	}

	isExtWallAtPosition(x, y) {
		return this.map[y][x] >= c.EXTMAP_WALL_GROUND;
	}

	isFloorAtPosition(x, y) {
		return this.map[y][x] == c.MAP_FLOOR;
	}

	cleansPlayerFromMap(manId) {
		for (var iy = 0; iy < this.height; iy++) {
			for (var ix = 0; ix < this.height; ix++) {
				if (this.isPlayerAtPosition(ix, iy, manId))
					this.setTile(ix, iy, c.MAP_FLOOR);
			}
		}
	}

	/*
	 * create new boxes if there is more floor than boxes
	 */
	maintenance() {
		var floor = 0;
		var box = 0;
		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				if (this.map[y][x] == c.MAP_BOX) box++;
				if (this.map[y][x] == c.MAP_FLOOR) floor++;
			}
		}
		if (box < floor) {
			var coords = this.getFloor();
			this.placeBox(coords.x,coords.y);
			return true;
		}
		return false;
	}

	/*
	 * creates a new map
	 */
	createNewWalls(level) {
		let file = c.FOLDER_LEVEL+'/'+level+'.json';
		let stats = null;
		winston.info('[backend] level '+file+' requested');
		try{
			 stats = fs.lstatSync(file);
		}
		catch (e) {}
	    if (stats !==null && stats.isFile()) {
	    	let dummy = JSON.parse(fs.readFileSync(file)); 
	    	this.map = dummy.map;
			this.height = dummy.height;
			this.width = dummy.width;
			winston.info('[backend] level '+file+' loaded');
		} else {
			this.map = [];
			this.height = c.SET_HEIGHT;
			this.width = c.SET_WIDTH;
			for (var y = 0; y < this.height; y++) {
				this.map[y] = [];
				for (var x = 0; x < this.width; x++) {
					if ((x === 0) && (y === 0)) 
						this.map[y][x] = c.EXTMAP_WALL_GROUND + (4<<2);
					else if ((x === 0) && (y == this.height - 1)) 
						this.map[y][x] = c.EXTMAP_WALL_GROUND + (5<<2);
					else if ((x == this.width - 1) && (y == this.height - 1)) 
						this.map[y][x] = c.EXTMAP_WALL_GROUND + (3<<2);
					else if ((x == this.width - 1) && (y === 0)) 
						this.map[y][x] = c.EXTMAP_WALL_GROUND + (6<<2);
					else if ((x == this.width - 1) || (x === 0)) 
						this.map[y][x] = c.EXTMAP_WALL_GROUND + (2<<2);
					else if ((x == this.width - 1) && (y === 0)) 
						this.map[y][x] = c.EXTMAP_WALL_GROUND + (6<<2);
					else if ((x == this.width - 1) || (x === 0)) 
						this.map[y][x] = c.EXTMAP_WALL_GROUND + (2<<2);
					else if ((y == this.height - 1) || (y === 0))
						this.map[y][x] = c.EXTMAP_WALL_GROUND + (1<<2);
					else if (((x % 2 === 0) && (y % 2 === 0)))
						this.map[y][x] = c.EXTMAP_WALL_GROUND;
					else 
						this.map[y][x] = (2+2*((x+y) % 2))<<2;
				}
			}
			winston.info('[backend] map generated');
		}
	}

}

exports.Map = Map;