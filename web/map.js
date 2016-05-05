$(document).ready(function() {

	var routeFiles = ["data/downtown.xml", "data/harvard.xml"];

	function loadMap(file) {

		function getRoutePts(xml) {
			var json = { type: "LineString", coordinates: [] };

			var coordinates = xml.getElementsByTagName("coordinates")[0].innerHTML.split(" ");

			for (var i = 0; i < coordinates.length; i++) {
				var coord = coordinates[i].split(",");
				var lon = parseFloat(coord[0]);
				var lat = parseFloat(coord[1]);
				json.coordinates.push([lon, lat]);
			}

			return { "geometry" : json };
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

		var width = 1200, height = 600;
		var svg = d3.select("#map-svg").attr("width", width).attr("height", height);

		d3.xml(file, "application/xml", function(xml) {
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
			var pathLength = path.getTotalLength();
			var numSegments = route.geometry.coordinates.length;

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

			var lengthCovered = 0;
			var timeInterval = 100; // millisecond
			var speed = 0.05; // bike speed

			var timer;
			timer = setInterval(function() {
				var distance = timeInterval * speed;

				rider.transition().duration(timeInterval).ease("linear")
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

			}, timeInterval);

		});
	}

	loadMap(routeFiles[1]);
}); 

