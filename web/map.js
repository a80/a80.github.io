$(document).ready(function() {

	var routeFiles = ["resources/downtown.xml", "resources/harvard.xml"];
	var routeVideos = ["resources/gopro_downtown_1.mp4", "resources/gopro_harvard.mp4"];
	var routeLengths = [1.754790975154058, 1.7034939584209086]; // miles
	var routeTimes = [9.9167, 8.7167]; // min

	var REFRESH_INTERVAL = 100; // millisecond
	var SPEED_URL = "http://localhost:5000/speedometer";
	var TURBOBOOST_URL = "http://localhost:5000/audience"

	var selected_route = 0;
	var gameOver = false;

	// THE TWO VARIABLES THAT DRIVE EVERYTHING WOOOO
	var rider_speed = routeLengths[selected_route] / routeTimes[selected_route] * 60.0;
	var noise_level = 0;

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
				.zoom(15)
				.zoomRange([15, 18])
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
		var routeLength = routeLengths[selected_route];

		var timer;
		timer = setInterval(function() {
			var svg_speed = rider_speed * pathLength / routeLength / 3600000.0;
			var distance = REFRESH_INTERVAL * svg_speed;

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

		}, REFRESH_INTERVAL);
	}

	function loadVideo() {
		$("#route-video").attr("src", routeVideos[selected_route]);
	}

	function playVideo() {
		var popcorn = Popcorn("#route-video");

		popcorn.play();

		var timer;
		timer = setInterval(function() {
			var videoSpeed = routeLengths[selected_route] / routeTimes[selected_route] * 60.0;
			var speedup = rider_speed / videoSpeed;
			popcorn.playbackRate(speedup);

		}, REFRESH_INTERVAL);

		// STOP TIMER AFTER VIDEO STOPPED PLAYING
		popcorn.on("ended", function() {
			gameOver = true;
			clearInterval(timer);
		});
	}

	function startGame() {
		animMap();
		playVideo();

		var timer;
		timer = setInterval(function() {
			$.get(SPEED_URL, function(d) {
				rider_speed = parseFloat(d);
			});

			$.get(TURBOBOOST_URL, function(d) {
				// @Eric: d is the current noise level. what is this supposed to do?
				noise_level = parseFloat(d);
			});

			if (gameOver) {
				clearInterval(timer);
			}

		}, REFRESH_INTERVAL);
	}

	loadMap();
	loadVideo();

	$("#anim-button").click(startGame);
}); 