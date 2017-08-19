/**
 * http://usejsdoc.org/
 */
var c = require('../common_lib/js/kaboomen_consts.js');

class Sound {
	constructor(soundType, bomberId) {
		this.timestamp = Date.now();
		this.sound = soundType;
		this.bomberId = bomberId;
	}

	getTimestamp() {
		return this.timestamp;
	}

}

exports.Sound = Sound;