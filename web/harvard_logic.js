/* Javascript logic for video playback and overlays */

$(document).ready(function() {
	var items = ["s_1", "s_2", "s_3", "s_4", "s_5", "s_6", "s_7", "s_8", "s_9", "s_10", "s_11", "s_12", "s_13", "s_14"];
	var popcorn = Popcorn("#route-video");
	var totalTime = popcorn.duration(); 
	var currentTime = 0; 

	//var timeToActivate = range(0, totalTime, totalTime/items.length)
	var timeToActivate = [10, 15, 20]; 
	console.log("timeToActivate = ", timeToActivate); 

	//assume video is started - chain this to that. 
	setInterval(function() {
		currentTime += 1; 
		console.log("currentTime = ", currentTime)

		for (var i = 0; i < timeToActivate.length; i++) {
			if (currentTime > timeToActivate[i]) {
				console.log("show fact at ", timeToActivate[i]); 
				timeToActivate.splice(i, 1);
			}
		}
	}, 1000); 

	//range function 
	function range(start, end, step) {
	    var range = [];
	    var typeofStart = typeof start;
	    var typeofEnd = typeof end;

	    if (step === 0) {
	        throw TypeError("Step cannot be zero.");
	    }

	    if (typeofStart == "undefined" || typeofEnd == "undefined") {
	        throw TypeError("Must pass start and end arguments.");
	    } else if (typeofStart != typeofEnd) {
	        throw TypeError("Start and end arguments must be of same type.");
	    }

	    typeof step == "undefined" && (step = 1);

	    if (end < start) {
	        step = -step;
	    }

	    if (typeofStart == "number") {

	        while (step > 0 ? end >= start : end <= start) {
	            range.push(start);
	            start += step;
	        }

	    } else if (typeofStart == "string") {

	        if (start.length != 1 || end.length != 1) {
	            throw TypeError("Only strings with one character are supported.");
	        }

	        start = start.charCodeAt(0);
	        end = end.charCodeAt(0);

	        while (step > 0 ? end >= start : end <= start) {
	            range.push(String.fromCharCode(start));
	            start += step;
	        }

	    } else {
	        throw TypeError("Only string and number types are supported");
	    }

	    return range;
	}
	

}); 