/* Javascript logic for video playback and overlays */

$(document).ready(function() {
	//$('#gameplayDiv').hide()

	$('#harvardButton').click(function() {
		var items = [];
		var delays = []; 

		// $('#mapOverlay').delay(delays[0]).fadeIn().delay(107000).fadeOut();

		startFacts(items, delays); 

	}); 

	$('#commonsButton').click(function() {
		//var items = []; 
		//var delays = [];
		var items = ["s_1", "s_2", "s_3", "s_4", "s_5", "s_6", "s_7", "s_8"];
		var delays = [19000, 32000, 45000, 58000, 71000, 84000, 97000, 110000];

		$('#welcomeScreenDiv').hide(); 
		$('#gameplayDiv').show(); 
		//$('#mapOverlay').delay(delays[0]).fadeIn().delay(107000).fadeOut();

		startFacts(items, delays); 
	})

	//factOverlay 
	function startFacts(items, delays) {
		
		for (var i = 0; i < items.length; i++) {
			$("#" + items[i]).delay(delays[i]).fadeIn(200).delay(12500).fadeOut(200);
		} 
	}

}); 