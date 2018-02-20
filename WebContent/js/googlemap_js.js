var map;
var polygonArray = [];
var drawingManager;
var currgeocoder;
var markers=[];
var dropdownlatitude=[];//variable used in distance measurement
var dropdownlongitude=[];
var dropdownname = [];
var currentPlace;
var directionsService;
var directionsDisplay;

	//function to calculate the current position
	//start the map with the current location
	function onStart(){
		map = new google.maps.Map(document.getElementById('map'), {
			zoom: 10,
			center: {lat: 222.72, lng: 232.56},
			mapTypeId: google.maps.MapTypeId.ROADMAP,
		});

		//used to calculate the address from the derived location(latitude and longitude).This variable
		//is used in various parts of the js 
		currgeocoder = new google.maps.Geocoder();
		var infoWindow = new google.maps.InfoWindow;
		directionsService = new google.maps.DirectionsService();
		    directionsDisplay = new google.maps.DirectionsRenderer({ 'draggable': true });
			//str to store the current latitude and longitude
			var str="";

	        // geolocation helps in determining the current location
	        if (navigator.geolocation) {
		        navigator.geolocation.getCurrentPosition(function(position) {
			           
			           //setting the window to current position
			            var pos = {
				            lat: position.coords.latitude,
				            lng: position.coords.longitude
			            };
			            infoWindow.setPosition(pos);

			            //setting content to the current location
			            infoWindow.setContent('current location ');
				       
				      	//latitude and longitude should be in the format of new google.maps.LatLng(lat,lng)
				        var latlng = new google.maps.LatLng(parseFloat(pos.lat), parseFloat(pos.lng));

				        //function call to print the current address and location
				        //it will be used to pass the pass the current latitude and longitude
				        getCurrentAddress(latlng);
			            infoWindow.open(map);
			            map.setCenter(pos);
			            //calls the search box
			            onclickSearchBox();
			            //calls the drawing manager
			            displayDrawManager();
			          }, 
		          function() {
		            	handleLocationError(true, infoWindow, map.getCenter());
		          });
	        } 
	        else{

	          // Browser doesn't support Geolocation
	          //function call to handle the error if the geolocation doesn't occurs
	          	handleLocationError(false, infoWindow, map.getCenter());
	        }    
	}

	//function to handle error if current location doesn't calculate
	function handleLocationError(browserHasGeolocation, infoWindow, pos) {
		infoWindow.setPosition(pos);
		infoWindow.setContent(browserHasGeolocation ?
		    'Error: The Geolocation service failed.' :
		                              'Error: Your browser doesn\'t support geolocation.');
		infoWindow.open(map);
	}

	//function which works when the search button is clicked
	function onclickSearchBox(){
		//get the input from the user
		//searchBox will contain nothing 
		var mapsearchplace = document.getElementById('mapsearchbox');
		
		//Place Change Event On the Search Box .It will be entered by the user.map will contain the structure
		//map.controls[google.maps.ControlPosition.TOP_LEFT].push(mapsearchplace);
		var searchBox = new google.maps.places.SearchBox(mapsearchplace);
				
        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
          searchBox.setBounds(map.getBounds());
        });
		
        // Listen for the event fired when the user selects a prediction and retrieve more details for that place.
        searchBox.addListener('places_changed', function() {
			var i=0,j=0,k=0;
			dropdownlatitude = [];
			dropdownlongitude = [];
			dropdownname = [];
			//to empty the distance in kms formed
			$("#distancemeasured").empty();

			//to empty the drop down list every search button is clicked
			$("#distancecalculate").empty();

			//In searching we need to delete the previously formed polygon points
			clearOverlays();

			//setting the before placed details to empty it
			$("#placeDetails").empty();

			//places will contain all the places from the user details
			places = searchBox.getPlaces();
			if (places.length == 0) {
				return;
			}
			console.log("places:"+typeof places);
			// Clear out the old markers.
			markers.forEach(function(marker) {
				console.log("searching");
				marker.setMap(null);
			});
			markers = [];

			// For each place, get the icon, name and location.
			var bounds = new google.maps.LatLngBounds();
			var placeNameAndAddress = "";
			places.forEach( function(place) {
				if (!place.geometry) {
					console.log("Returned place contains no geometry");
					return;
				}
				//console.log(JSON.stringify(place));
				//places.push(place);
				currentPlace = place;
				insertPlacesAjax();
				
				//it is hard to retrieve place.geometry.location.lat
				//so we are parsing place.geometry.location
				var latlnglist = (JSON.stringify(place.geometry.location));
				var parsedlatlnglist = (JSON.parse(latlnglist));

				//storing the derived places latitude and longitude in dropdownlatitude and dropdownlongitude array
				dropdownlatitude[i++] = parsedlatlnglist.lat;
				dropdownlongitude[j++] = parsedlatlnglist.lng;
				dropdownname[k++]=place.name;

				// Create New Option.
				var newOption = $('<option>');
				newOption.attr('value',i+" "+place.name).text(i+" "+place.name);

				// Append that to the DropDownList.
				$('#distancecalculate').append(newOption);
				
				placeNameAndAddress += "<section class='postPlaceDetails' id = 'places'>\
								<div> <b><i>"+place.name+"</b></i> <br>"+place.formatted_address+"</div> <br>\
								</section>";
									
				//for selecting the icon for marker through online
				var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';

				//for customising google markers in different ways
				// Create a marker for each place.
				markers.push(new google.maps.Marker({
					map: map,
					icon: iconBase +  'info-i_maps.png',
					title: place.name,
					position: place.geometry.location
				}));

				if (place.geometry.viewport) {
					// Only geocodes have viewport
					/*
							Viewport contains the recommended viewport for displaying the returned result, 
						specified as two latitude, longitude values defining the southwest and northeast corner 
						of the viewport bounding box. Generally the viewport is used to frame a result when displaying it to a user.

							Bounds stores the bounding box which can fully contain the returned result. 
						Note that these bounds may not match the recommended viewport. 
						(For example, San Francisco includes the Farallon islands, which are technically part of the city, 
						but probably should not be returned in the viewport)
					*/
					
					bounds.union(place.geometry.viewport);
				} 
				else{ 
					  bounds.extend(place.geometry.location);
				}
			});


			//to clear the text field after locations are found
			 document.getElementById("mapsearchbox").value = "";

			//adding the contents to the HTML page
			$('#placeDetails').html( placeNameAndAddress );

			//set the map to the current user places
			map.fitBounds(bounds);
		});
	}

	//displaying drawManager
	function displayDrawManager(){
		//options for drawing manager that helps in drawing the polygon on the map
		drawingManager = new google.maps.drawing.DrawingManager({
		    drawingMode: google.maps.drawing.OverlayType.POLYGON,
		    drawingControl: true,
		    drawingControlOptions: {
		    	position: google.maps.ControlPosition.TOP_CENTER,
			    drawingModes: [google.maps.drawing.OverlayType.POLYGON]
			},
			polygonOptions:{
				fillColor: '#BCDCF9',
			    fillOpacity: 0.5,
			    strokeWeight: 2,
			    strokeColor: '#57ACF9',
			    clickable: false,
			    editable: false,
			    zIndex: 1
			}
		});
		//setting the drawing manager to the map 
		drawingManager.setMap(map);
		drawPolygon();
	}
	//function to draw the polygon on the maps
	function drawPolygon() {
		 //adding the polygon shape to the map
		  google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {

		  		//for deleting the previously formed polygon points and their address
		  		$("#info").empty();
			    document.getElementById('info').innerHTML += "polygon points:" + "<br>";
			    //for clearing all the markers in the map before the drawing
				markers.forEach(function(marker) {
					marker.setMap(null);
				});
				markers = [];

				//function call to remove the previous polygons formed
				clearOverlays();
			    for (var i = 0; i < polygon.getPath().getLength(); i++) {
			      	document.getElementById('info').innerHTML += polygon.getPath().getAt(i).toUrlValue(6) + "<br>";
			    }

			    for(var i=0;i<polygon.getPath().getLength();i++){

			    	//polstr is the variable to store latitude and longitude form the polygon points formed
			    	var polygonStr=polygon.getPath().getAt(i).toUrlValue(6);
			    	
			        //spliting the longitude and latitude from the string
				    var polygonlatlngstr = polygonStr.split(',',2);

				    //latitude and longitude should be in the format of new google.maps.LatLng(lat,lng)
				    var polygonlatlng = new google.maps.LatLng(parseFloat(polygonlatlngstr[0]), parseFloat(polygonlatlngstr[1]));

				    //to print the address from the formed polygon points
				    currgeocoder.geocode({
			       		'location': polygonlatlng
			        },  
			        function(results, status) {
			            if (status == google.maps.GeocoderStatus.OK) {
			            	 document.getElementById('info').innerHTML += results[0].formatted_address + "<br>";
			            }
			            else{
			                alert('Geocode was not successful for the following reason: ' + status +"/Connect to the Internet Properly");
			            }
			        });
			    }
			    polygonArray.push(polygon);
		  });
	}

	//function to clear the before formed polygons
	function clearOverlays() {
		 while(polygonArray.length) {
		  		polygonArray.pop().setMap(null);
		  }
		  polygonArray.length = 0;
	}
	//function to print the current address from latitude and longitude
	function getCurrentAddress(location) {
        currgeocoder.geocode({
       		'location': location
        },  
        function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                $("#currentaddress").html(results[0].formatted_address);
            }
            else{
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }

    //function to calculate the distance in kilometeres
    function distanceCalculation(){

    	//emptying the before formed kms snippet
    	$("#distancemeasured").empty();
    	var selectedname = document.getElementById('distancecalculate');
    	var selectednamevalue = selectedname.options[selectedname.selectedIndex].value;
    	
    	//splits the value (string of numbers and characters) into numbers
    	var splits = selectednamevalue.split(/(\d{1,})/);
		var indexofvalue = splits[1];
		indexofvalue=indexofvalue-1;
		var nameofvalue=dropdownname[indexofvalue];
		for(var i=0;i<dropdownlongitude.length;i++){
			if(i==indexofvalue) continue;
			//document.getElementById('distancemeasured').innerHTML +=nameofvalue+"-->"+dropdownname[i]+"  is "+ "<br>";
			calcDistance(dropdownlatitude[indexofvalue],dropdownlongitude[indexofvalue],dropdownlatitude[i],dropdownlongitude[i],nameofvalue,dropdownname[i]);
		}
		
    }

    //function which returns the distance in kms
    function calcDistance(lat1, lon1, lat2, lon2, source_name,destination_name) {
    	console.log("entering");
        var source = new google.maps.LatLng(lat1,lon1);
        var destination = new google.maps.LatLng(lat2,lon2);
        var request = {
	        origin: source,
	        destination: destination,
	        travelMode: google.maps.TravelMode.DRIVING
    	};
	    directionsService.route(request, function (response, status) {
	        if (status == google.maps.DirectionsStatus.OK) {
	            directionsDisplay.setDirections(response);
	        }
	    });
 
	    var service = new google.maps.DistanceMatrixService();
	    service.getDistanceMatrix({
	        origins: [source],
	        destinations: [destination],
	        travelMode: google.maps.TravelMode.DRIVING,
	        unitSystem: google.maps.UnitSystem.METRIC,
	        avoidHighways: false,
	        avoidTolls: false
	    }, function (response, status) {
	        if (status == google.maps.DistanceMatrixStatus.OK && response.rows[0].elements[0].status != "ZERO_RESULTS") {
	            var distance = response.rows[0].elements[0].distance.text;
	            var duration = response.rows[0].elements[0].duration.text;
	            document.getElementById("distancemeasured").innerHTML  +=source_name+" ----> "+destination_name+"<br>" 
	            + "Distance "+distance+"   "+"Duration "+duration+"<br>";     
	        } else {
	            alert("Unable to find the distance via road.");
	        }
	    });
    	
    }
    function insertPlacesAjax(){
    	console.log("in insertPlacesAjax()");
    	$.ajax({
		url : 'insertPlacesService',
		headers : { "Content-Type":"application/json"},
		type : 'POST',
		data : JSON.stringify(currentPlace),
		success : function(){
		console.log("return to ajax call success");//JSON.stringify(userdata)
			//location.reload();
		},
		error:function(){
			console.log("return to ajax call failure");//JSON.stringify(userdata)
		}
	});
}

