/**
 * http://usejsdoc.org/
 */
var c = require('../common_lib/js/kaboomen_consts.js');

class Man {
	constructor(manId, name) {
		this.name = name;
		this.speed = c.START_SPEED;
		this.anim = 0;
		this.look = manId % c.MAX_LOOKS;
		this.bombs = c.START_BOMBS;
		this.maxBombs = c.START_BOMBS;
		this.score = 0;
		this.next = '';
		this.action = c.WAITS;
		this.direction = 0;
		this.id = manId;
		this.indest = 0;
		this.hasSBomb = 0;
		this.hasRBomb = 0;
		this.bombRadius = c.START_RADIUS;
		this.countDown = c.START_COUNTDOWN;
		this.x = 0;
		this.y = 0;
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;
	}

	getXPosition() {
		return this.x;
	}

	getYPosition() {
		return this.y;
	}

	setAnim(anim) {
		this.anim = anim;
	}

	getAnim() {
		return this.anim;
	}

	setSpeed(speed) {
		this.speed = speed;
	}

	decSpeed() {
		if (this.speed > 0)
			this.speed--;
	}

	incSpeed(speed) {
		if (this.speed < c.MAX_SPEED)
			this.speed++;
	}

	resetSpeed() {
		if (this.speed < c.START_SPEED)
			this.speed = c.START_SPEED;
		if (this.speed > c.START_SPEED)
			this.speed --;
	}
	
	disableIndestructible(){
		this.indest=0;
	}

	enableIndestructible(time){
		this.indest+=time;
	}
	
	decIndestructible() {
		if (this.indest>0)
			this.indest--;
	}

	isIndestructible(){
		return this.indest>0;
	}

	decStrongBomb() {
		if (this.hasSBomb>0)
			this.hasSBomb--;
	}

	disableStrongBomb(){
		this.hasSBomb=0;
	}

	enableStrongBomb(time){
		this.hasSBomb+=time;
	}
	
	hasStrongBomb(){
		return this.hasSBomb>0;
	}

	decRemoteBomb() {
		if (this.hasRBomb>0)
			this.hasRBomb--;
	}

	disableRemoteBomb(){
		this.hasRBomb=0;
	}

	enableRemoteBomb(time){
		this.hasRBomb+=time;
	}

	hasRemoteBomb(){
		return this.hasRBomb>0;
	}
	
	getSpeed() {
		return this.speed;
	}

	addScore(score) {
		this.score += score;
	}

	setScore(score) {
		this.score = score;
	}

	getScore() {
		return this.score;
	}

	setBombs(bombs) {
		this.bombs = bombs;
	}

	incBombs() {
		this.bombs++;
		if (this.bombs > this.maxBombs)
			this.bombs = this.maxBombs
	}

	decBombs() {
		if (this.bombs > 0)
			this.bombs--;
	}

	getBombs() {
		return this.bombs;
	}

	incMaxBombs() {
		this.maxBombs++;
		this.incBombs();
	}

	decMaxBombs() {
		if (this.maxBombs > 1)
			this.maxBombs--;
		this.decBombs();
		if (this.bombs > this.maxBombs)
			this.bombs = this.maxBombs
	}

	getMaxBombs() {
		return this.maxBombs;
	}

	resetBombs() {
		if (this.maxBombs < c.START_BOMBS)
			this.maxBombs = c.START_BOMBS;
		if (this.maxBombs > c.START_BOMBS)
			this.maxBombs --;
		if (this.bombs > this.maxBombs)
			this.bombs = this.maxBombs
	}

	getCountDown() {
		return this.countDown;
	}

	setCountDown(countDown) {
		this.countDown = countDown;
	}

	getBombRadius() {
		return this.bombRadius;
	}

	incBombRadius(bombRadius) {
		this.bombRadius++;
	}

	decBombRadius(bombRadius) {
		if (this.bombRadius > c.MIN_BOMBRADIUS)
			this.bombRadius--;
	}

	resetBombRadius() {
		if (this.bombRadius < c.START_RADIUS)
			this.bombRadius = c.START_RADIUS;
		if (this.bombRadius > c.START_RADIUS)
			this.bombRadius --;
	}

	setBombRadius(bombRadius) {
		this.bombRadius = bombRadius;
	}

	getAction() {
		return this.action;
	}

	setAction(action) {
		this.action = action;
	}

	getDirection() {
		return this.direction;
	}

	setDirection(direction) {
		this.direction = direction;
	}

	isDying() {
		return this.action == c.DIES;
	}

	isWaiting() {
		return this.action == c.WAITS;
	}

	isWalking() {
		return [c.MOVES,c.MOVE_DOWN,c.MOVE_LEFT,c.MOVE_RIGHT,c.MOVE_UP].indexOf(this.action) > -1;
	}

	getNext() {
		return this.next;
	}

	setNext(next) {
		this.next = next;
	}

	getId() {
		return this.id;
	}

	getName() {
		return this.name;
	}

	getLook() {
		return this.look;
	}
}

exports.Man = Man;