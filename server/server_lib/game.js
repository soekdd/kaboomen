/**
 * http://usejsdoc.org/
 */
var winston = require('winston');
var c = require('../common_lib/js/kaboomen_consts.js');
var KaboomenMan = require('./man.js').Man;
var KaboomenBomb = require('./bomb.js').Bomb;
var KaboomenMap = require('./map.js').Map;
var KaboomenSound = require('./sound.js').Sound;
var sockets;

class Game {
	constructor(level) {
		this.auth = {};
		this.level = level;
		this.boxesCached = null;
		this.goodiesCached = null;
		this.chat = function(text) {};
		this.rev = 1;
		this.groundMap = new KaboomenMap(level);
		this.gameMap = new KaboomenMap(this.groundMap);
		this.width = this.groundMap.getWidth();
		this.height = this.groundMap.getHeight();
		this.men = {};
		this.bombs = {};
		this.sounds = {};
		this.soundId = 0;
		this.commit();
		this.lastSocketTime = 0;
		this.socketTimeOut = null;
		setInterval(this.mapMaintenance.bind(this), c.TIME_MAINTENANCE * 1000);
		setInterval(this.soundMaintenance.bind(this), c.SOUND_MAINTENANCE * 1000);
	}

	/*
	 * increments the revision number and send websocket broadcast
	 */
	commit(clearCache) {
		this.rev++;
		if (sockets !== null && sockets !== undefined) {
			var now = Date.now();
			if (this.socketTimeOut != null) {
				// avoid cascade of time outs
				clearTimeout(this.socketTimeOut);
			}
			this.socketTimeOut = null;
			if (now > this.lastSocketTime + c.SOCKET_MIN_TIME) {
				this.lastSocketTime = Date.now();
				for(var i=0;i<sockets.length;i++) {
					sockets[i].emit('extended', this.getGameStringifiedExtended());
				}
			}
			else {
				// too many commit per secound, wait till min_time is over
				this.socketTimeOut = setTimeout(this.commit.bind(this), c.TIME_FACTOR * (c.SOCKET_MIN_TIME - (now - this.lastSocketTime)));
			}
		}
		if (clearCache) { 
			this.boxesCached = null;
			this.goodiesCached = null;
		}
	}

	setSockets(globalSockets) {
		sockets = globalSockets;
	}

	/*
	 * checks if a player id exists
	 */
	checkForPlayer(authCode) {
		if (authCode in this.auth)
			return this.auth[authCode];
		else
			return false;
	}

	setChat(inChat) {
		this.chat = inChat;
	}

	/*
	 * create new boxes if there is more floor than boxes
	 */
	mapMaintenance() {
		//sometimes players tiles keep in the map. this lines cleans up the map of unused players tiles
		for (var y = 0; y < c.SET_HEIGHT; y++) {
			for (var x = 0; x < c.SET_WIDTH; x++) {
				if (this.gameMap.isAnyPlayerAtPosition(x, y) && !this.isBombAtPosition(x, y)) {
					this.gameMap.setTile(x, y, c.MAP_FLOOR);
				}
			}
		}
		for (var i in this.men) {
			if (!this.men[i].isDying())
				this.gameMap.setPlayerAtPosition(Math.round(this.men[i].getXPosition()), Math.round(this.men[i].getYPosition()), i);
		}
		if (this.gameMap.maintenance()) {
			winston.info("[backend] map maintenanced");
			this.commit(true);
		}
	}

	/*
	 * check if sounds getting old
	 */
	soundMaintenance() {
		for (var soundId in this.sounds) {
			if ((c.KEEP_SOUND * 1000) + this.sounds[soundId].getTimestamp() < Date.now()) {
				delete this.sounds[soundId];
			}
		}
	}

	/*
	 * slow is over
	 */
	speedGoodieIsOver(man) {
		if (man !== undefined) {
			winston.info("[player] %s speed regenerated", man.getName()); //.getName()
			man.resetSpeed();
			this.commit();
		}
	}

	/*
	 * slow is over
	 */
	bombGoodieIsOver(man) {
		if (man !== undefined) {
			let before = man.getMaxBombs()+'/'+man.getBombs();
			man.resetBombs();
			let now = man.getMaxBombs()+'/'+man.getBombs();
			winston.info("[player] %s bomb number regenerated %s => %s", man.getName(),before,now); //.getName()
			this.commit();
		}
	}

	/*
	 * count down indestructibility
	 */
	indestructibleGoodieCountDown(man) {
		if (man !== undefined) {
			man.decIndestructible();
			if (!man.isIndestructible()) {
				this.indestructibleGoodieIsOver(man);
			}
			else {
				setTimeout(this.indestructibleGoodieCountDown.bind(this), c.TIME_FACTOR * 1000, man);
			}
			this.commit();
		}
	}

	/*
	 * indestructible is over
	 */
	indestructibleGoodieIsOver(man) {
		if (man !== undefined) {
			winston.info("[player] %s not longer indestructible", man.getName()); //.getName()
			man.disableIndestructible();
			this.commit();
		}
	}

	/*
	 * count down stronger bomb 
	 */
	strongerBombsGoodieCountDown(man) {
		if (man !== undefined) {
			man.decStrongBomb();
			if (!man.hasStrongBomb()) {
				this.strongerBombsGoodieIsOver(man);
			}
			else {
				setTimeout(this.strongerBombsGoodieCountDown.bind(this), c.TIME_FACTOR * 1000, man);
			}
			this.commit();
		}
	}

	/*
	 * stronger bomb is over
	 */
	strongerBombsGoodieIsOver(man) {
		if (man !== undefined) {
			winston.info("[player] %s has longer stronger bombs", man.getName()); //.getName()
			man.disableStrongBomb();
			this.commit();
		}
	}

	/*
	 * count down stronger bomb 
	 */
	remoteBombsGoodieCountDown(man) {
		if (man !== undefined) {
			man.decRemoteBomb();
			if (!man.hasRemoteBomb()) {
				this.remoteBombsGoodieIsOver(man);
			}
			else {
				setTimeout(this.remoteBombsGoodieCountDown.bind(this), c.TIME_FACTOR * 1000, man);
			}
			this.commit();
		}
	}

	/*
	 * stronger bomb is over
	 */
	remoteBombsGoodieIsOver(man) {
		if (man !== undefined) {
			winston.info("[player] %s has longer remote bombs", man.getName()); //.getName()
			man.disableRemoteBomb();
			this.commit();
		}
	}

	/*
	 * small is over
	 */
	sizeGoodieIsOver(man) {
		if (man !== undefined) {
			winston.info("[player] %s bomb radius regenerated", man.getName());
			man.resetBombRadius();
			this.commit();
		}
	}

	/*
	 * creates a new player
	 */
	createNewMan(name) {
		name = encodeURI(name);
		var manId = this.findSmallId(this.men);
		var newAuth = Math.abs(Math.random() * 0xffffffff | 0);
		this.auth[newAuth] = manId;
		if (name.length>10) {
			name = name.substr(0,7)+'...';
		}
		var man = new KaboomenMan(manId, name);
		var pos = this.gameMap.getFloor();
		man.setPosition(pos.x, pos.y);
		this.gameMap.createLandingField(pos.x, pos.y, manId);
		this.men[manId] = man;
		this.commit(true);
		this.chat(man.getName() + ", enjoy the game!");
		winston.info("[player] '%s' created ID=%s", man.getName(), manId);
		//wouldnt it better to send a json?
		return newAuth + ',' + manId;
	}

	/*
	 * do a single animation step
	 */
	manStep(man, x, y, anim, action) {
		if (man.isDying()) return;
		man.setPosition(x, y);
		man.setAnim(anim);
		man.setAction(action);
		this.commit();
	}

	/*
	 * replace the tile on simple map for a mans step
	 */
	manReplace(man, oldX, oldY, newX, newY) {
		if (man.isDying()) return;
		if (this.gameMap.isPlayerAtPosition(oldX, oldY, man.getId()) && !this.isBombAtPosition(oldX, oldY)) {
			this.gameMap.setTile(oldX, oldY, c.MAP_FLOOR);
		}
		if (this.gameMap.isGoodieAtPosition(newX, newY)) {
			if (this.gameMap.isGoodieAtPosition(newX, newY, c.GOODIE_MORE_EXPL)) {
				man.incBombRadius();
				this.makeNoise(c.SOUND_KEY_GOOD, man.getId());
				setTimeout(this.sizeGoodieIsOver.bind(this), c.TIME_FACTOR * c.TIME_REGENERATE_DOWN * 1000, man);
				winston.info("[player] %s bomb radius increased", man.getName());
			}
			else if (this.gameMap.isGoodieAtPosition(newX, newY, c.GOODIE_INDESTRUCTIBLE)) {
				man.enableIndestructible(c.TIME_REGENERATE_EXTENDED);
				this.makeNoise(c.SOUND_KEY_GOOD, man.getId());
				setTimeout(this.indestructibleGoodieCountDown.bind(this), c.TIME_FACTOR * 1000, man);
				winston.info("[player] %s is indestructible now", man.getName());
			}
			else if (this.gameMap.isGoodieAtPosition(newX, newY, c.GOODIE_STRONGBOMB)) {
				man.enableStrongBomb(c.TIME_REGENERATE_EXTENDED);
				this.makeNoise(c.SOUND_KEY_GOOD, man.getId());
				setTimeout(this.strongerBombsGoodieCountDown.bind(this), c.TIME_FACTOR * 1000, man);
				winston.info("[player] %s has stronger bombs now", man.getName());
			}
			else if (this.gameMap.isGoodieAtPosition(newX, newY, c.GOODIE_REMOTEBOMB)) {
				man.enableRemoteBomb(c.TIME_REGENERATE_EXTENDED);
				this.makeNoise(c.SOUND_KEY_GOOD, man.getId());
				setTimeout(this.remoteBombsGoodieCountDown.bind(this), c.TIME_FACTOR * 1000, man);
				winston.info("[player] %s has remote bombs now", man.getName());
			}
			else if (this.gameMap.isGoodieAtPosition(newX, newY, c.GOODIE_LESS_EXPL)) {
				man.decBombRadius();
				this.makeNoise(c.SOUND_KEY_BAD, man.getId());
				setTimeout(this.sizeGoodieIsOver.bind(this), c.TIME_FACTOR * c.TIME_REGENERATE_UP * 1000, man);
				winston.info("[player] %s bomb radius decreased", man.getName());
			}
			else if (this.gameMap.isGoodieAtPosition(newX, newY, c.GOODIE_MORE_BOMB)) {
				man.incMaxBombs();
				this.makeNoise(c.SOUND_KEY_GOOD, man.getId());
				setTimeout(this.bombGoodieIsOver.bind(this), c.TIME_FACTOR * c.TIME_REGENERATE_DOWN * 1000, man);
				winston.info("[player] %s number of bombs increased", man.getName());
			}
			else if (this.gameMap.isGoodieAtPosition(newX, newY, c.GOODIE_LESS_BOMB)) {
				man.decMaxBombs();
				this.makeNoise(c.SOUND_KEY_BAD, man.getId());
				setTimeout(this.bombGoodieIsOver.bind(this), c.TIME_FACTOR * c.TIME_REGENERATE_UP * 1000, man);
				winston.info("[player] %s number of bombs decreased", man.getName());
			}
			else if (this.gameMap.isGoodieAtPosition(newX, newY, c.GOODIE_MORE_SPEED)) {
				man.incSpeed();
				this.makeNoise(c.SOUND_KEY_GOOD, man.getId());
				setTimeout(this.speedGoodieIsOver.bind(this), c.TIME_FACTOR * c.TIME_REGENERATE_DOWN * 1000, man);
				winston.info("[player] %s speed increased", man.getName());
			}
			else if (this.gameMap.isGoodieAtPosition(newX, newY, c.GOODIE_LESS_SPEED)) {
				man.decSpeed();
				this.makeNoise(c.SOUND_KEY_BAD, man.getId());
				setTimeout(this.speedGoodieIsOver.bind(this), c.TIME_FACTOR * c.TIME_REGENERATE_UP * 1000, man);
				winston.info("[player] %s speed decreased", man.getName());
			}
		}
		this.gameMap.setPlayerAtPosition(newX, newY, man.getId());
		this.commit(true);
	}

	/*
	 * walk from one tile to another
	 */
	manWalk(manId, direction, isBot) {
		if (!(manId in this.men)) {
			winston.error("[player] ID=%s nicht gefunden", manId);
			return {
				code: 301,
				message: "unknown player"
			};
		}
		var man = this.men[manId];
		var divX = 0;
		var divY = 0;
		if (!(man.isWaiting())) {
			if (!isBot) man.setNext(direction);
			return {
				code: 200,
				message: man.name + " wait!"
			};
		}
		if (direction == c.MOVE_UP)
			divY = -1;
		else if (direction == c.MOVE_DOWN)
			divY = 1;
		else if (direction == c.MOVE_LEFT)
			divX = -1;
		else if (direction == c.MOVE_RIGHT)
			divX = 1;
		if (this.gameMap.isWalkable(Math.round(man.getXPosition() + divX), Math.round(man.getYPosition() + divY))) {
			man.direction = direction;
			setTimeout(this.manReplace.bind(this), Math.round(c.TIME_FACTOR * (100 / man.speed) * 3.5), man, man.getXPosition(), man.getYPosition(), man.getXPosition() + divX, man.getYPosition() + divY);
			for (var i = 0; i < 8; i++) {
				setTimeout(this.manStep.bind(this), c.TIME_FACTOR * (100 / man.getSpeed()) * i, man, man.getXPosition() + divX * (i + 1) * 0.125, man.getYPosition() + divY * (i + 1) * 0.125, (i + 1) % 8, i == 7 ? c.WAITS : c.MOVES);
			}
			setTimeout(this.nextStep.bind(this), c.TIME_FACTOR * (100 / man.getSpeed()) * 8, man);
			this.commit();
			return {
				code: 200,
				message: ""
			};
		}
		else if (man.isWaiting()) {
			this.makeNoise(c.SOUND_KEY_WALL, man.getId());
			return {
				code: 409,
				message: man.getName() + " can't walk there!"
			};
		}
		else {
			return {
				code: 200,
				message: ""
			};
		}
	}

	nextStep(man) {
		if (man.isDying()) return;
		if (man.getNext() !== 0) {
			this.manWalk(man.getId(), man.getNext());
			man.setNext('');
		}
		man.setNext(0);
	}

	/*
	 * checks if a bomb kills a player
	 */
	checkForKill(x, y, bomb) {
		// Vorfilterung um nicht jedes Mal die Liste durch zu iterieren
		if (!(this.gameMap.isPlayerAtPosition(x, y)) && !(this.gameMap.isBombAtPosition(x, y))) {
			return;
		}
		for (var manId in this.men) {
			var man = this.men[manId];
			if (man.indest == false && Math.abs(man.getXPosition() - x) < 0.7 && Math.abs(man.getYPosition() - y) < 0.7) {
				if (bomb.getBomberId() in this.men)
					this.men[bomb.getBomberId()].addScore((Object.keys(this.men).length - 1) * (c.SCORE_KILL + Math.round((man.getScore() * c.SCORE_KILLP) / 100)));
				man.setAction(c.DIES);
				this.makeNoise(c.SOUND_KEY_DIES, -1);
				man.setDirection(c.MOVE_DOWN);
				this.gameMap.cleansPlayerFromMap(man.getId());
				for (var i = 1; i < 6; i++) {
					setTimeout(this.setAnim.bind(this), c.TIME_FACTOR * (500 + i * 200), i, man);
				}
				setTimeout(this.deletePlayer.bind(this), c.TIME_FACTOR * 1700, manId);
				if (this.men.hasOwnProperty(bomb.getBomberId())) {
					this.chat(man.getName() + " killed by " + (this.men[bomb.getBomberId()].name == man.getName() ? "him/herself" : this.men[bomb.getBomberId()].name) + "!");
				}
				else {
					this.chat(man.getName() + " killed by unknown!");
				}
				winston.info("[player] '%s' killed", man.getName());
				this.commit();
			}
		}
	}

	/*
	 * set animation and commit
	 */
	setAnim(j, man) {
		man.setAnim(j);
		this.commit();
	}

	/*
	 * deletes a player totally
	 */
	deletePlayer(manId) {
		if (!(manId in this.men)) {
			return;
		}
		delete this.men[manId];
		this.commit();
		// reverse search for auth and delete entry
		for (var element in this.auth) {
			if (this.auth.hasOwnProperty(element)) {
				if (this.auth[element] === manId) {
					delete this[element];
				}
				return;
			}
		}
	}

	/*
	 * checks if a bomb ignite another bomb
	 */
	checkForBomb(x, y) {
		// Vorfilterung um nicht jedes Mal die Liste durchzuiterieren
		if (!this.gameMap.isBombAtPosition(x, y)) {
			return;
		}
		for (var index in this.bombs) {
			// ist notwendig, aber warum? Trotzdem kann this.bombs[index] noch null sein.
			if (this.bombs.hasOwnProperty(index)) {
				var bomb = this.bombs[index];
				if ((bomb != null) && (bomb.getXPosition() == x) && (bomb.getYPosition()) == y) {
					winston.info("[backend] bome sparked by another bomb!");
					this.bombIgnition(bomb);
				}
			}
		}
	}

	/*
	 * let the bomb cool down
	 */
	coolDownBomb(bomb, anim) {
		bomb.setAnim(anim);
		this.commit();
	}

	/*
	 * let the bomb explode
	 */
	explodeBomb(bomb, r) {
		var x = bomb.getXPosition();
		var y = bomb.getYPosition();
		bomb.setAnim(3);
		this.makeNoise(c.SOUND_KEY_EXPL, -1);
		this.checkForKill(x, y, bomb);
		this.gameMap.setTile(x, y, c.FILTER_BOMB | c.MAP_BOMB_CENTER);
		var i = 1;
		if (r == 0) {
			this.commit();
			return;
		}
		// explode right
		// stop if next tile is already unbreakable
		if (this.gameMap.isDestroyable(x + 1, y)) {
			while ((i < (r + 1)) && (this.gameMap.isDestroyable(x + i, y)) && (x + i < this.width) && bomb.compareMax('r', i)) {
				if (bomb.isNotStrong() && this.gameMap.isRemoveable(x + i, y)) bomb.setMax('r', i);
				if (i == r) this.destroys(x + i, y, c.MAP_BOMB_HORI, bomb);
				i++;
			}
			//this.destroys(x + i - 1, y, c.MAP_BOMB_ENDR, bomb);
			if (this.gameMap.isExplostionAtPosition(x + i - 1, y))
				this.gameMap.setTile(x + i - 1, y, c.FILTER_BOMB | c.MAP_BOMB_ENDR);
		}
		bomb.setIgn('r', i - 1);
		i = 1;
		// explode left
		if (this.gameMap.isDestroyable(x - 1, y)) {
			while (i < (r + 1) && (this.gameMap.isDestroyable(x - i, y)) && (x - i > 0) && bomb.compareMax('l', i)) {
				if (bomb.isNotStrong() && this.gameMap.isRemoveable(x - i, y)) bomb.setMax('l', i);
				if (i == r) this.destroys(x - i, y, c.MAP_BOMB_HORI, bomb);
				i++;
			}
			//this.destroys(x - i + 1, y, c.MAP_BOMB_ENDL, bomb);
			if (this.gameMap.isExplostionAtPosition(x - i + 1, y))
				this.gameMap.setTile(x - i + 1, y, c.FILTER_BOMB | c.MAP_BOMB_ENDL);
		}
		bomb.setIgn('l', i - 1);
		i = 1;
		// explode top
		if (this.gameMap.isDestroyable(x, y + 1)) {
			while (i < (r + 1) && (this.gameMap.isDestroyable(x, y + i)) && (y + i < this.height) && bomb.compareMax('b', i)) {
				if (bomb.isNotStrong() && this.gameMap.isRemoveable(x, y + i)) bomb.setMax('b', i);
				if (i == r) this.destroys(x, y + i, c.MAP_BOMB_VERT, bomb);
				i++;
			}
			//this.destroys(x, y + i - 1, c.MAP_BOMB_ENDB, bomb);
			if (this.gameMap.isExplostionAtPosition(x, y + i - 1))
				this.gameMap.setTile(x, y + i - 1, c.FILTER_BOMB | c.MAP_BOMB_ENDB);
		}
		bomb.setIgn('b', i - 1);
		i = 1;
		// explode bottom
		if (this.gameMap.isDestroyable(x, y - 1)) {
			while (i < (r + 1) && (this.gameMap.isDestroyable(x, y - i)) && (y - i > 0) && bomb.compareMax('t', i)) {
				if (bomb.isNotStrong() && this.gameMap.isRemoveable(x, y - i)) bomb.setMax('t', i);
				if (i == r) this.destroys(x, y - i, c.MAP_BOMB_VERT, bomb);
				i++;
			}
			//this.destroys(x, y - i + 1, c.MAP_BOMB_ENDT, bomb);
			if (this.gameMap.isExplostionAtPosition(x, y - i + 1))
				this.gameMap.setTile(x, y - i + 1, c.FILTER_BOMB | c.MAP_BOMB_ENDT);
		}
		bomb.setIgn('t', i - 1);
		this.commit(true);
	}

	/*
	 * Destroys an element and check if a goodie is created
	 */
	destroys(x, y, element, bomb) {
		var cleanTile = true;
		this.checkForKill(x, y, bomb);
		this.checkForBomb(x, y);
		if ((this.gameMap.isGoodieAtPosition(x, y)) && (bomb.getBomberId() in this.men)) {
			this.men[bomb.getBomberId()].addScore((Object.keys(this.men).length - 1) * c.SCORE_GOODIE);
		}
		if (this.gameMap.isBoxAtPosition(x, y)) {
			if (this.gameMap.countDownBoxAtPosition(x, y)) {
				if (bomb.getBomberId() in this.men)
					this.men[bomb.getBomberId()].addScore((Object.keys(this.men).length - 1) * c.SCORE_BOX);
				if (Math.random() * 100 < c.CHANCE_OF_GOODIES) {
					bomb.addGoodie({
						'x': x,
						'y': y
					});
				}
			}
			else {
				cleanTile = false;
			}
		}
		if (cleanTile && this.gameMap.isRemoveable(x, y)) {
			this.gameMap.setTile(x, y, c.FILTER_BOMB | element);
		}
	}

	/*
	 * Find small IDs for key reuse
	 */
	findSmallId(obj) {
		var i = 1;
		while (i in obj) {
			i++;
		}
		return i;
	}

	/*
	 * remove the explosion
	 */
	cleanUp(bomb, r) {
		var x = bomb.getXPosition();
		var y = bomb.getYPosition();
		this.gameMap.setTile(x, y, c.MAP_FLOOR);
		var i = 1;
		while (i < (r + 1) && !this.gameMap.isWallAtPosition(x + i, y) && x + i < this.width) {
			if (this.gameMap.isExplostionAtPosition(x + i, y))
				this.gameMap.setTile(x + i, y, c.MAP_FLOOR);
			i++;
		}
		i = 1;
		while (i < (r + 1) && !this.gameMap.isWallAtPosition(x - i, y) && x - i > 0) {
			if (this.gameMap.isExplostionAtPosition(x - i, y))
				this.gameMap.setTile(x - i, y, c.MAP_FLOOR);
			i++;
		}
		i = 1;
		while (i < (r + 1) && !this.gameMap.isWallAtPosition(x, y + i) && y + i < this.height) {
			if (this.gameMap.isExplostionAtPosition(x, y + i))
				this.gameMap.setTile(x, y + i, c.MAP_FLOOR);
			i++;
		}
		i = 1;
		while (i < (r + 1) && !this.gameMap.isWallAtPosition(x, y - i) && y - i > 0) {
			if (this.gameMap.isExplostionAtPosition(x, y - i))
				this.gameMap.setTile(x, y - i, c.MAP_FLOOR);
			i++;
		}
		if (bomb.hasGoodies()) bomb.getGoodies().forEach(function(element) {
			this.gameMap.setTile(element.x, element.y, c.FILTER_GOODIE | (1 + (Math.round(Math.random() * 1000) % c.MAX_GOODIES)));
		}.bind(this));
		this.bombs[bomb.getId()] = null;
		//dont free id too fast
		setTimeout(function(id) {
			delete this.bombs[id];
		}.bind(this), c.TIME_FACTOR * 5000, bomb.getId());
		this.commit(true);
	}

	/*
	 * Ignite the bomb
	 */
	bombIgnition(bomb) {
		if (bomb.isIgnited()) return;
		bomb.ignite();
		if (bomb.getBomberId() in this.men) {
			this.men[bomb.getBomberId()].incBombs();
		}
		bomb.setCountDown(0);
		this.explodeBomb(bomb, 0);
		for (var i = 1; i < bomb.getRadius(); i++) {
			setTimeout(this.explodeBomb.bind(this), c.TIME_FACTOR * 100 * i, bomb, i);
		}
		for (i = 0; i < 3; i++) {
			setTimeout(this.coolDownBomb.bind(this), c.TIME_FACTOR * 50 * (2 * bomb.getRadius() + 2 * i), bomb, 3 - i);
		}
		setTimeout(this.cleanUp.bind(this), c.TIME_FACTOR * 50 * (2 * bomb.getRadius() + 7), bomb, bomb.getRadius() - 1);
		this.commit();
	}

	/*
	 * Count down the bomb timer
	 */
	bombCountDown(bomb) {
		if (bomb.isIgnited()) return; //already ignited
		bomb.decCountDown(0.5);
		this.gameMap.setTile(bomb.x, bomb.y, c.ITEM_BOMB);
		this.makeNoise(c.SOUND_KEY_TICK);
		if (bomb.getCountDown() > 0) {
			setTimeout(this.bombCountDown.bind(this), c.TIME_FACTOR * 500, bomb);
		}
		this.commit();
	}

	makeNoise(soundType, manId) {
		this.soundId++;
		var sound = new KaboomenSound(soundType, manId);
		this.sounds[this.soundId] = sound;
		this.commit();
	}

	isBombAtPosition(x, y) {
		if (this.gameMap.isBombAtPosition(x, y))
			return true;
		for (var bombId in this.bombs)
			if (this.bombs[bombId] != null && (this.bombs[bombId].x == x) && (this.bombs[bombId].y == y))
				return true;
		return false;
	}

	/*
	 * Place a bomb
	 */
	placeBomb(manId) {
		if (!(manId in this.men)) {
			return {
				code: 401,
				message: "unknown player"
			};
		}
		var man = this.men[manId];
		if (man.hasRemoteBomb()) {
			winston.log('man has remote bombs');
			var found = false;
			for (var key in this.bombs) {
				let bomb = this.bombs[key];
				if (bomb != null && bomb.isRemote() && bomb.getBomberId() == manId) {
					found = true;
					this.bombIgnition(bomb);
					winston.log('bomb found for remote');
				}
			}
			if (found) {
				return {
					code: 200,
					message: "bomb ignite remote"
				};
			}
			else {
				if (man.getBombs() < 1) return {
					code: 409,
					message: man.getName() + " has no more bombs!"
				};
				winston.log('bomb placed for remote');
				let x = Math.round(man.getXPosition());
				let y = Math.round(man.getYPosition());
				if (this.isBombAtPosition(x, y)) {
					return {
						code: 409,
						message: "there is a bomb already!"
					};
				}
				let bombId = this.findSmallId(this.bombs);
				man.decBombs();
				let bomb = new KaboomenBomb(bombId, man, x, y);
				bomb.setStrong(man.hasSBomb > 0);
				bomb.setRemote(true);
				this.gameMap.setTile(x, y, c.ITEM_BOMB);
				this.bombs[bombId] = bomb;
				this.makeNoise(c.SOUND_KEY_BOMB, manId);
				setTimeout(this.bombIgnition.bind(this), c.TIME_FACTOR * c.TIME_REGENERATE_EXTENDED * 1000, bomb);
				this.commit();
				return {
					code: 200,
					message: "bomb placed"
				};
			}
		}
		else {
			if (man.getBombs() < 1) return {
				code: 409,
				message: man.getName() + " has no more bombs!"
			};
			let x = Math.round(man.getXPosition());
			let y = Math.round(man.getYPosition());
			if (this.isBombAtPosition(x, y)) {
				return {
					code: 409,
					message: "there is a bomb already!"
				};
			}
			let bombId = this.findSmallId(this.bombs);
			man.decBombs();
			let bomb = new KaboomenBomb(bombId, man, x, y);
			bomb.setStrong(man.hasSBomb > 0);
			this.gameMap.setTile(x, y, c.ITEM_BOMB);
			this.bombs[bombId] = bomb;
			setTimeout(this.bombCountDown.bind(this), c.TIME_FACTOR * 500, bomb);
			setTimeout(this.bombIgnition.bind(this), c.TIME_FACTOR * bomb.getCountDown() * 1000, bomb);
			this.makeNoise(c.SOUND_KEY_BOMB, manId);
			this.commit();
			return {
				code: 200,
				message: "bomb placed"
			};
		}
	}

	/*
	 * Create stringified this.data for simple api
	 */
	getGameStringifiedSimple() {
		return JSON.stringify(this.gameMap.getMap());
	}

	/*
	 * Create stringified this.data for extended api
	 */
	getGameStringifiedExtended() {
		if (this.boxesCached == null) {
			this.boxesCached = [];
			this.goodiesCached = [];
			for (var y = 0; y < this.height; y++) {
				this.boxesCached[y] = '';
				var d = 0;
				var box = 0;
				for (var x = 0; x < this.width; x++) {
					d = (d + 1) % 2;
					if (d == 0) box = 0;
					if (this.gameMap.isBoxAtPosition(x, y))
						box += (this.gameMap.getTile(x, y) - c.FILTER_BOX) << (2 * d);
					else if (this.gameMap.isGoodieAtPosition(x, y))
						this.goodiesCached.push({
							"x": x,
							"y": y,
							"g": (this.gameMap.getTile(x, y) - c.FILTER_GOODIE)
						});
					if ((d == 1) || (x == (this.width - 1)))
						this.boxesCached[y] += box.toString(16);
				}
			}
		}
		return JSON.stringify({
			"boxes": this.boxesCached,
			"men": this.men,
			"sounds": this.sounds,
			"bombs": this.bombs,
			"goodies": this.goodiesCached,
			"width": this.width,
			"height": this.height,
			"rev": this.rev,
			"stime": Date.now()
		});
	}

	/*
	 * Create stringified this.data for bot api
	 */
	getGameStringifiedStandard() {
		return JSON.stringify({
			"map": this.gameMap.getMap(),
			"men": this.men,
			"sounds": this.sounds,
			"bombs": this.bombs,
			"width": this.width,
			"height": this.height,
			"rev": this.rev,
			"stime": Date.now()
		});
	}

	getGroundMapStringified() {
		return JSON.stringify({
			"map": this.groundMap.map,
			"width": this.width,
			"height": this.height
		});
	}

	/*
	 * get rev
	 */
	getRev() {
		return this.rev;
	}
}

exports.Game = Game;