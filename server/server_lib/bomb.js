/**
 * http://usejsdoc.org/
 */
 
class Bomb {
	constructor(bombId, man, x, y) {
		this.ignition = false;
		this.radius = man.getBombRadius();
		this.countDown = man.getCountDown();
		this.bomberId = man.getId();
		this.anim = 0;
		this.strong = man.hasStrongBomb();
		this.remote = man.hasRemoteBomb();
		if (this.remote) this.countDown = null;
		this.id = bombId;
		this.goodies = [];
		this.max = {};
		this.ign = {};
		this.x = x;
		this.y = y;
	}
	
	isNotStrong(){
		return !this.strong;
	}

	setStrong(inStrong){
		return this.strong=inStrong;
	}
	
	isNotRemote(){
		return !this.remote;
	}

	isRemote(){
		return this.remote;
	}

	setRemote(inRemote){
		return this.remote=inRemote;
	}

	setMax(key, value) {
		this.max[key] = value;
	}

	getMax(key) {
		this.max[key];
	}

	compareMax(key, value) {
		return (!(key in this.max)) || this.max[key] >= value;
	}

	setIgn(key, value) {
		this.ign[key] = value;
		if (key == 'b') { //while migration
			this.ignb = value;
		}
		if (key == 't') {
			this.ignt = value;
		}
		if (key == 'l') {
			this.ignl = value;
		}
		if (key == 'r') {
			this.ignr = value;
		}
	}

	getIgn(key) {
		this.ign[key];
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

	getCountDown() {
		return this.countDown;
	}

	setCountDown(countDown) {
		this.countDown = countDown;
	}

	decCountDown(reduce) {
		this.countDown -= reduce;
	}

	getRadius() {
		return this.radius;
	}

	incRadius(radius) {
		this.radius++;
	}

	hasGoodies() {
		return this.goodies.length > 0;
	}

	getGoodies() {
		return this.goodies;
	}

	addGoodie(goodie) {
		this.goodies.push(goodie);
	}

	decRadius(radius) {
		if (this.radius > 0)
			this.radius--;
	}

	setRadius(radius) {
		this.radius = radius;
	}

	isIgnited() {
		return this.ignition;
	}

	ignite() {
		this.ignition = true;
	}

	setAnim(anim) {
		this.anim = anim;
	}

	getAnim() {
		return this.anim;
	}

	getId() {
		return this.id;
	}

	getBomberId() {
		return this.bomberId;
	}

}

exports.Bomb = Bomb;