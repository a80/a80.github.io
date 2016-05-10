(function() {
	var args = location.href.split("?")[1].split("&");
	var distance = parseFloat(args[0].split("=")[1]); // miles
	var duration = parseFloat(args[1].split("=")[1]); // minutes

	console.log(distance, duration);

	var durationInHours = duration / 60.0;
	var speed = distance / durationInHours; // miles per hour
	var calories = 650.0 * durationInHours; // calories / hour * hour

	console.log(speed, calories);

	$("#stat-distance").text("Distance Covered: " + distance.toFixed(2) + " miles");
	$("#stat-duration").text("Biking Duration: " + duration.toFixed(2) + " minutes");
	$("#stat-speed").text("Average Speed: " + speed.toFixed(2) + " mph");
	$("#stat-calories").text("Calories Burned: " + calories.toFixed(2) + " cal");

})();