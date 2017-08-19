var os = require("os");
require('colors');

function getFormattedDate() {
	var date = new Date();

	var month = date.getMonth() + 1;
	var day = date.getDate();
	var hour = date.getHours();
	var min = date.getMinutes();
	var sec = date.getSeconds();

	month = (month < 10 ? "0" : "") + month;
	day = (day < 10 ? "0" : "") + day;
	hour = (hour < 10 ? "0" : "") + hour;
	min = (min < 10 ? "0" : "") + min;
	sec = (sec < 10 ? "0" : "") + sec;

	var str = date.getFullYear() + "-" + month + "-" + day + " \uD83D\uDD50" + hour + ":" + min + ":" + sec;

	return str;
}

exports.cpuAverage = function() {
	var totalIdle = 0,
		totalTick = 0;
	var cpus = os.cpus();
	for (var i = 0, len = cpus.length; i < len; i++) {
		var cpu = cpus[i];
		for (var type in cpu.times) {
			totalTick += cpu.times[type];
		}
		totalIdle += cpu.times.idle;
	}
	return {
		idle: totalIdle / cpus.length,
		total: totalTick / cpus.length
	};
};

var re = new RegExp("\[+[(a-z,A-Z)]*\]+");

exports.customFileFormatter = function(options) {
	var log = ("\uD83D\uDCC5" + getFormattedDate()).gray + ' ';
	var level = '[' + options.level.toUpperCase() + ']';
	if (options.level == "error")
		log += "\uD83D\uDD25".red + ("[" + options.level.toUpperCase() + "]").red + ' ';
	else if (options.level == "warn")
		log += "\u26A0".bgYellow + ("[" + options.level.toUpperCase() + "]").yellow + ' ';
	else
		log += "\u24D8".blue + ("[" + options.level.toUpperCase() + "]").blue + ' ';
	if (options.message !== undefined) {
		log += options.message.replace(re,
			function(match, contents, offset, s) {
				match = match.toUpperCase();
				if (match == '[HEALTHY]')
					return "\u2764".green + match.green;
				else if (match == '[BOMB]')
					return "\uD83D\uDCA3" + match.red;
				else if (match == '[SERVER]')
					return "\u2601".blue + match.blue;
				else if (match == '[BACKEND]')
					return "\uD83D\uDD50" + match.black;
				else if (match == '[PLAYER]')
					return "\uD83D\uDC68".red + match.red;
				else if (match == '[RESPONSE]')
					return "\u21BB".magenta + match.magenta;
				else
					return match;
			});
	}
	return log;
};

exports.clone = function(o) {
    var out, v, key;
    out = Array.isArray(o) ? [] : {};
    for (key in o) {
        v = o[key];
        out[key] = (typeof v === "object") ? exports.clone(v) : v;
    }
    return out;
};
