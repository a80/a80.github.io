$(document).ready(function() {

	var routeFiles = ["resources/downtown.xml", "resources/harvard.xml"];
	var routeVideos = ["resources/gopro_downtown_1.mp4", "resources/gopro_harvard.mp4"];
	var routeTimes = [9.9167, 8.7167]; // min

	var REFRESH_INTERVAL = 100; // millisecond
	var SPEED_URL = "http://localhost:5000/speedometer";
	var TURBOBOOST_URL = "http://localhost:5000/audience"

	var gameOver = false;

	var totalTimeOfVideo; 

	// THE TWO VARIABLES THAT DRIVE EVERYTHING WOOOO
	var selected_route = 0;
	var base_speed = 10;
	var rider_speedup = 1;
	var noise_level = 0;
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
						.style("stroke", "red")
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
				.style("fill", "blue").style("opacity", 1);
			
			map.add(po.compass().pan("none"));

		});
	}

	function animMap() {
		var lengthCovered = 0;
		var rider = d3.selectAll(".rider");

		var path = $("#path")[0];
		var pathLength = path.getTotalLength();

		var timer;
		var unit_speed = pathLength / routeTimes[selected_route] / 60000.0; // px per ms

		timer = setInterval(function() {			
			var distance = REFRESH_INTERVAL * unit_speed * rider_speedup;
			rider.transition().duration(REFRESH_INTERVAL).ease("linear")
				.attrTween("transform", function() {
					return function(t) {
						var d = t * distance;
						lengthCovered += d;
						var point = path.getPointAtLength(lengthCovered);
						return "translate(" + point.x + ", " + point.y + ")";
					}
				});

			if (lengthCovered >= pathLength) {
				clearInterval(timer);
			}

		}, 0);
	}

	function loadVideo() {
		$("#route-video").attr("src", routeVideos[selected_route]);
	}

	function playVideo() {
		var popcorn = Popcorn("#route-video");

		popcorn.play();
		totalTimeOfVideo = popcorn.duration(); 

		console.log("total Time of Video = ", totalTimeOfVideo); 
		var items = ["s_1", "s_2", "s_3", "s_4", "s_5", "s_6", "s_7", "s_8", "s_9", "s_10", "s_11", "s_12", "s_13", "s_14"];
		var percentageToShow = [.06, 0.12, .18, .24, .3, .36, .42, .48, .54, .6, .66, .72, .78, .84]; 
		var isShowing = false; 
		var itemBeingShown = null; 

		var timer;
		timer = setInterval(function() {
			//console.log("SPEEDUP: ", rider_speedup);
			popcorn.playbackRate(rider_speedup);
			
			var elapsed = (popcorn.played().end(0))/totalTimeOfVideo; 
			//console.log("percentage elapsed = ", elapsed);

			var percentageOfNextItemToShow = percentageToShow.shift(); 

			console.log("comparing ", percentageOfNextItemToShow, " to current ", elapsed); 

			if (elapsed >= percentageOfNextItemToShow) {
				var itemToShow = items.shift(); 
				//console.log("in if loop");

				if (isShowing) {
					$("#" + itemBeingShown).fadeOut(200);
					$("#" + itemToShow).delay(250).fadeIn(200).delay(30000).fadeOut(200);
					itemBeingShown = itemToShow; 
				} else {
					isShowing = true; 
					$("#" + itemToShow).fadeIn(200).delay(30000).fadeOut(200);
				}
			} else {
				//console.log("in else loop"); 
				//replace item 
				percentageToShow.unshift(percentageOfNextItemToShow); 
			}

			// loop1:
			// for (var i = 0; i < percentageToShow.length; i++) {
			// 	loop2: 
			// 	if (elapsed > percentageToShow[i]) {
			// 		console.log("show fact at percentage", percentageToShow[i]); 
			// 		percentageToShow.splice(i, 1);
			// 		$("#" + items[i]).delay(delays[i]).fadeIn(200).delay(2000).fadeOut(200);
			// 		items.splice(i, 1);
			// 		console.log(percentageToShow, items); 
			// 		break loop1; 
			// 	}
			// }
		}, REFRESH_INTERVAL);

		// STOP TIMER AFTER VIDEO STOPPED PLAYING
		popcorn.on("ended", function() {
			gameOver = true;
			clearInterval(timer);
			location.href = "end.html"; //transition to end page
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
				noise_level = parseFloat(d);

				//console.log("noise_level is ", noise_level); 

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
		rider_speedup = rider_speedup + 0.5; 

		console.log("original rider speed up is ", original_rider_speedup, ", new speed up = ", rider_speedup); 
		$('#turboBoostMessage').fadeIn().delay(9000).fadeOut();

		setTimeout(function() {
			rider_speedup = original_rider_speedup; 
			$('#turboBoostExpiredMessage').fadeIn().delay(1000).fadeOut(); 
			turboBoosting = false; 
		}, 10000); 
	}

	function displayFacts() {

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