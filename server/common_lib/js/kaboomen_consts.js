(function(exports) {

	exports.TIME_FACTOR = 1; // for slow motion
	// Not part od consts anymore, you will find it in api
	exports.SET_WIDTH = 29; // map width
	exports.SET_HEIGHT = 19; // map hight
	exports.MAX_GOODIES = 9; // number of known goodies
	exports.MAX_LOOKS = 5; // number of known player styles -> needless! 
	exports.MAX_SPEED = 4;
	exports.MIN_BOMBRADIUS = 2;
	exports.START_RADIUS = 3;
	exports.START_SPEED = 2;
	exports.START_BOMBS = 2;
	exports.START_COUNTDOWN = 3; // in seconds

	exports.CHANCE_OF_GOODIES = 20; // in percent
	exports.SOUND_MAINTENANCE = 0.5; // in seconds
	exports.SOUND_KEY_GOOD = 'good';
	exports.SOUND_KEY_BAD = 'bad';
	exports.SOUND_KEY_BOMB = 'bomb';
	exports.SOUND_KEY_WALL = 'wall';
	exports.SOUND_KEY_DIES = 'dies';
	exports.SOUND_KEY_TICK = 'tick';
	exports.SOUND_KEY_EXPL = 'expl';

	exports.SOCKET_MIN_TIME = 40; // how many time a least between two socket emits

	exports.KEEP_SOUND = 2; // in seconds
	exports.TIME_MAINTENANCE = 2; // in seconds
	exports.TIME_REGENERATE_UP = 30; // in seconds
	exports.TIME_REGENERATE_DOWN = 90; // in seconds
	exports.TIME_REGENERATE_EXTENDED = 15;

	exports.SCORE_KILL = 100; // points for a kill
	exports.SCORE_KILLP = 50; // percent of the score of the killed player
	exports.SCORE_BOX = 1; // points for a destroyed box
	exports.SCORE_GOODIE = 10; // points for a destroyed goodie

	exports.MAP_FLOOR = 0x00;
	exports.MAP_WALL = 0x01;
	exports.MAP_BOX = 0x41;

	exports.ITEM_BOMB = 0x03;
	exports.FILTER_PLAYER = 0x0100;
	exports.FILTER_BOMB = 0x0020;
	exports.FILTER_BOX  = 0x0040;
	exports.FILTER_GOODIE = 0x0010;
	
	exports.GOODIE_MORE_EXPL = 0x01;
	exports.GOODIE_LESS_EXPL = 0x02;
	exports.GOODIE_MORE_BOMB = 0x03;
	exports.GOODIE_LESS_BOMB = 0x04;
	exports.GOODIE_MORE_SPEED = 0x05;
	exports.GOODIE_LESS_SPEED = 0x06;
	exports.GOODIE_INDESTRUCTIBLE = 0x07;
	exports.GOODIE_STRONGBOMB = 0x08;
	exports.GOODIE_REMOTEBOMB = 0x09;

	exports.MAP_BOMB_CENTER = 0x01;
	exports.MAP_BOMB_HORI   = 0x02;
	exports.MAP_BOMB_VERT   = 0x03;
	exports.MAP_BOMB_ENDL   = 0x04;
	exports.MAP_BOMB_ENDR   = 0x05;
	exports.MAP_BOMB_ENDT   = 0x06;
	exports.MAP_BOMB_ENDB   = 0x07;

	exports.MOVE_DOWN = 0x01;
	exports.MOVE_UP = 0x02;
	exports.MOVE_LEFT = 0x03;
	exports.MOVE_RIGHT = 0x04;
	exports.WAITS = 0x00;
	exports.DIES = 0x05;
	exports.MOVES = 0x06;
	exports.ADMIN_PASS = 0x12345;
	
	exports.EXTMAP_FILTER_BOX = 0x03;       //00000011
	exports.EXTMAP_FILTER_GROUND = 0xFC;    //11111100
	exports.EXTMAP_WALL_GROUND = 0x80;      //01000000
	exports.EXTMAP_FILTER_TILETYPE = 0x3C;  //00111100

	exports.FOLDER_LEVEL = 'level';

	exports.GOOD_GOODIES = [exports.FILTER_GOODIE | exports.GOODIE_REMOTEBOMB, exports.FILTER_GOODIE | exports.GOODIE_STRONGBOMB, exports.FILTER_GOODIE | exports.GOODIE_INDESTRUCTIBLE, exports.FILTER_GOODIE | exports.GOODIE_MORE_EXPL, exports.FILTER_GOODIE | exports.GOODIE_MORE_BOMB, exports.FILTER_GOODIE | exports.GOODIE_MORE_SPEED];
	exports.BAD_GOODIES = [exports.FILTER_GOODIE | exports.GOODIE_LESS_EXPL, exports.FILTER_GOODIE | exports.GOODIE_LESS_BOMB, exports.FILTER_GOODIE | exports.GOODIE_LESS_SPEED];
	//exports.DESTROYABLE = [exports.FILTER_GOODIE | exports.GOODIE_REMOTEBOMB, exports.FILTER_GOODIE | exports.GOODIE_STRONGBOMB, exports.MAP_BOX, exports.FILTER_GOODIE | exports.GOODIE_INDESTRUCTIBLE, exports.FILTER_GOODIE | exports.GOODIE_MORE_EXPL, exports.FILTER_GOODIE | exports.GOODIE_LESS_EXPL, exports.FILTER_GOODIE | exports.GOODIE_MORE_BOMB, exports.FILTER_GOODIE | exports.GOODIE_LESS_BOMB, exports.FILTER_GOODIE | exports.GOODIE_MORE_SPEED, exports.FILTER_GOODIE | exports.GOODIE_LESS_SPEED];
	//exports.REMOVEABLE = [exports.FILTER_GOODIE | exports.GOODIE_REMOTEBOMB, exports.FILTER_GOODIE | exports.GOODIE_STRONGBOMB, exports.MAP_FLOOR, exports.MAP_BOX, exports.FILTER_BOMB | exports.MAP_BOMB_ENDR, exports.FILTER_BOMB | exports.MAP_BOMB_ENDL, exports.FILTER_BOMB | exports.MAP_BOMB_ENDT, exports.FILTER_BOMB | exports.MAP_BOMB_ENDB, exports.FILTER_GOODIE | exports.GOODIE_MORE_EXPL, exports.FILTER_GOODIE | exports.GOODIE_LESS_EXPL, exports.FILTER_GOODIE | exports.GOODIE_MORE_BOMB, exports.FILTER_GOODIE | exports.GOODIE_LESS_BOMB, exports.FILTER_GOODIE | exports.GOODIE_MORE_SPEED, exports.FILTER_GOODIE | exports.GOODIE_LESS_SPEED, exports.FILTER_GOODIE | exports.GOODIE_INDESTRUCTIBLE];

	exports.isGoodGoodie = function(e) {
		return exports.GOOD_GOODIES.indexOf(e) > -1;
	};
	exports.isBadGoodie = function(e) {
		return exports.BAD_GOODIES.indexOf(e) > -1;
	};
	exports.isGoodie = function(e) {
		return (e & exports.FILTER_GOODIE) == exports.FILTER_GOODIE;
	};
	exports.isBox = function(e) {
		return (e & exports.FILTER_BOX) == exports.FILTER_BOX;
	};
	exports.isPlayer = function(e) {
		return (e & exports.FILTER_PLAYER) == exports.FILTER_PLAYER;
	};
	exports.isWalkable = function(e) {
		return (e == exports.MAP_FLOOR) || exports.isGoodie(e) || ((e & exports.FILTER_BOMB) == exports.FILTER_BOMB);
	};
	exports.isWalkable4Bot = function(e) {
		return (e == exports.MAP_FLOOR) || exports.isGoodGoodie(e);
	};
	exports.isBombable = function(e) {
		return (e == exports.MAP_FLOOR) || (e == exports.ITEM_BOMB) || exports.isGoodie(e) || exports.isPlayer(e);
	};
	exports.isDestroyable = function(e) {
		return e != exports.MAP_WALL;
	};
	exports.isRemoveable = function(e) {
		return ((e & exports.FILTER_BOX) == exports.FILTER_BOX) || (e == exports.ITEM_BOMB) || exports.isGoodie(e) || exports.isPlayer(e);
	};
	exports.isUndestroyable = function(e) {
		return e == exports.MAP_WALL;
	};

})(typeof exports === 'undefined' ? this['c'] = {} : exports);