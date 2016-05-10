$(document).ready(function() {

	var routeFiles = ["resources/downtown.xml", "resources/harvard.xml"];
	var routeVideos = ["resources/gopro_downtown_1.mp4", "resources/gopro_harvard.mp4"];
	var routeLengths = [1.754790975154058, 1.7034939584209086]; // miles
	var routeTimes = [9.9167, 8.7167]; // min

	var REFRESH_INTERVAL = 100; // millisecond
	var SPEED_URL = "http://localhost:5000/speedometer";
	var TURBOBOOST_URL = "http://localhost:5000/audience"

	var gameOver = false;

	// THE VARIABLES THAT DRIVE EVERYTHING WOOOO
	var selected_route = 0;
	var base_speed = 15;
	var rider_speedup = 2;
	var popcorn; // video player
	var popcorn_startTime;
	var totalTimeOfVideo;

	var turboBoosting = false; 

	function loadMap() {

		function getRoutePts(xml) {
			var json = { type: "LineString", coordinates: [] };

			var coordinates = xml.getElementsByTagName("coordinates")[0].innerHTML.split(" ");

			for (var i = 0; i < coordinates.length; i++) {
				var coord = coordinates[i].split(",");
				var lon = parseFloat(coord[0]);
				var lat = parseFloat(coord[1]);
				json.coordinates.push([lon, lat]);
			}

			return { type: "Feature", geometry : json };
		}

		function mapParams(route) {
			var coordinates = route.geometry.coordinates;
			
			var lonSum = 0, latSum = 0;
			var maxLat = -200, minLat = 200, maxLon = -200, minLon = 200;
			var delta = 0.005;

			for (var i = 0; i < coordinates.length; i++) {
				var lat = coordinates[i][1];
				var lon = coordinates[i][0];

				latSum += lat;
				lonSum += lon;

				if (lat > maxLat) {
					maxLat = lat;
				}

				if (lat < minLat) {
					minLat = lat;
				}

				if (lon > maxLon) {
					maxLon = lon;
				}

				if (lon < minLon) {
					minLon = lon;
				}

			}
			return [ lonSum / coordinates.length, latSum / coordinates.length, 
				maxLon + delta, minLat - delta, 
				minLon - delta, maxLat + delta ];
		}

		//var width = 1200, height = 600;
		var width = 425, height = 325;
		var svg = d3.select("#map-svg").attr("width", width).attr("height", height);

		d3.xml(routeFiles[selected_route], "application/xml", function(xml) {
			var route = getRoutePts(xml);
			var params = mapParams(route);
			console.log(route);

			// INITIALIZE MAP
			var po = org.polymaps;
			var map = po.map()
				.container(document.getElementById("map-svg"))
				.center({lon: params[0], lat: params[1]})
				.zoom(14)
				.zoomRange([14, 18])
				.add(po.interact());

			map.add(po.image()
				.url(po.url("http://{S}tile.openstreetmap.org/{Z}/{X}/{Y}.png")
				.hosts(["a.", "b.", "c.", ""])));

			// ADD MARATHON ROUTE
			var routeLayer = po.geoJson().features([route])
				.clip(false)
				.on("load", 
					po.stylist()
						.style("stroke", "#282828")
						.style("fill", "none")
						.style("stroke-width", 5)
						.attr("id", "path"));
			map.add(routeLayer);

			// INITIALIZE RIDER
			var path = $("#path")[0];

			var rider = d3.select(path.parentElement)
				.append("g")
				.attr("class", "rider")
				.attr("transform", function() {
					var point = path.getPointAtLength(0);
					return "translate(" + point.x + ", " + point.y + ")";
				});

			rider.append("circle")
				.attr("r", 15)
				.style("fill", "#66FF33").style("opacity", 1).style("stroke", "#282828").style("stroke-width", 5);
			
			map.add(po.compass().pan("none"));

		});
	}

	function animMap() {
		var lengthCovered = 0;
		var rider = d3.selectAll(".rider");

		var path = $("#path")[0];
		var pathLength = path.getTotalLength();

		var timer;
		var pctTravelled = 0.0;
		
		timer = setInterval(function() {			

			rider.transition().duration(REFRESH_INTERVAL).ease("linear")
				.attrTween("transform", function() {
					return function(t) {
						pctTravelled = popcorn.currentTime() / totalTimeOfVideo;
						var point = path.getPointAtLength(pathLength * pctTravelled);
						return "translate(" + point.x + ", " + point.y + ")";
					}
				});

			if (pctTravelled >= 1.0) {
				clearInterval(timer);
			}

		}, 0);
	}

	function loadVideo() {
		$("#route-video").attr("src", routeVideos[selected_route]);
		popcorn = Popcorn("#route-video");
	}

	function playVideo() {
		popcorn.play();
		popcorn_startTime = Date.now();
		totalTimeOfVideo = popcorn.duration();

		console.log("total Time of Video = ", totalTimeOfVideo); 
		var items = ["s_1", "s_2", "s_3", "s_4", "s_5", "s_6", "s_7", "s_8", "s_9", "s_10", "s_11", "s_12", "s_13", "s_14"];
		var percentageToShow = [.06, 0.12, .18, .24, .3, .36, .42, .48, .54, .6, .66, .72, .78, .84]; 
		var isShowing = false; 
		var itemBeingShown = null; 

		var timer;
		timer = setInterval(function() {
			popcorn.playbackRate(rider_speedup);
			
			var elapsed = (popcorn.played().end(0))/totalTimeOfVideo; 
			var percentageOfNextItemToShow = percentageToShow.shift(); 

			if (elapsed >= percentageOfNextItemToShow) {
				var itemToShow = items.shift(); 

				if (isShowing) {
					$("#" + itemBeingShown).fadeOut(200);
					$("#" + itemToShow).delay(250).fadeIn(200).delay(30000).fadeOut(200);
					itemBeingShown = itemToShow; 
				} else {
					isShowing = true; 
					$("#" + itemToShow).fadeIn(200).delay(30000).fadeOut(200);
				}
			} else {
				//replace item 
				percentageToShow.unshift(percentageOfNextItemToShow); 
			}

		}, REFRESH_INTERVAL);

		// STOP TIMER AFTER VIDEO STOPPED PLAYING
		popcorn.on("ended", function() {
			gameOver = true;
			clearInterval(timer);
			var endTime = Date.now();
			var dist = routeLengths[selected_route]; // miles
			var dur = (endTime - popcorn_startTime) / 1000.0 / 60.0; // minutes

			location.href = "end.html?distance=" + dist + "&duration=" + dur; //transition to end page
		});
	}

	function startGame() {
		animMap();
		playVideo();

		var timer;
		var supportLevel = 0; 
		timer = setInterval(function() {
			$.get(SPEED_URL, function(d) {
				console.log("GOT SPEED: ", d);
				rider_speedup = Math.min(2, parseFloat(d) / base_speed);
			});

			$.get(TURBOBOOST_URL, function(d) {
				// @Eric: d is the current noise level. what is this supposed to do?
				var noise_level = parseFloat(d);

				//audience support level 
				if ((noise_level > 100) && (!turboBoosting)) {
					supportLevel += 1; 
					console.log(supportLevel); 

					if (supportLevel > 50) {
						console.log("TURBO BOOST!");
						triggerTurboBoost();  
						supportLevel = 0; 
					}
				}
			});

			if (gameOver) {
				clearInterval(timer);
			}

		}, REFRESH_INTERVAL);
	}

	function triggerTurboBoost() {
		turboBoosting = true; 
		console.log("triggering Turbo Boost");
		var original_rider_speedup = rider_speedup;
		rider_speedup = Math.min(2, rider_speedup + 0.2); 

		console.log("original rider speed up is ", original_rider_speedup, ", new speed up = ", rider_speedup); 
		$('#turboBoostMessage').fadeIn().delay(9000).fadeOut();

		setTimeout(function() {
			rider_speedup = original_rider_speedup; 
			$('#turboBoostExpiredMessage').fadeIn().delay(1000).fadeOut(); 
			turboBoosting = false; 
		}, 10000); 
	}

	//helper functions for user input email 
	$('#enterEmailBox').focusin(function() {
		console.log("gain focus"); 
		$(this).text(""); 
	}); 

	function inputFocus(i){
	    if(i.value==i.defaultValue){ i.value=""; i.style.color="#000"; }
	}
	function inputBlur(i){
	    if(i.value==""){ i.value=i.defaultValue; i.style.color="#888"; }
	}

	//Get appropriate route 
	var fileName = location.href.split("/").slice(-1); 

	//console.log("Page is ", fileName[0]); 

	if (fileName == "commons.html") {
		selected_route = 0; 
	} else if (fileName == "harvard.html") {
		selected_route = 1; 
	} 

	loadMap();
	loadVideo();

	$("#anim-button").click(startGame);
}); 