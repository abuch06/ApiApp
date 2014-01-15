var directionsDisplay; 
var directionsService; 
var stepDisplay;
var markerArray = [];
var map;
var result;

$(document).ready(function() {

 directionsDisplay = new google.maps.DirectionsRenderer();
  directionsService = new google.maps.DirectionsService();
  function initialize()
  {   
    var mapProp = {
      center:new google.maps.LatLng(38.889468, -77.03524),
      zoom: 11,
      mapTypeId:google.maps.MapTypeId.ROADMAP
    };
    map=new google.maps.Map(document.getElementById("googleMap"), mapProp);
      
  }
  google.maps.event.addDomListener(window, 'load', initialize);    

  $(document).on('click','#goButt', function(){
    calcRoute();
    directionsDisplay.setMap(map);
  });
});

function calcRoute() {
  // First, clear out any existing markerArray
  // from previous calculations.
  for (i = 0; i < markerArray.length; i++) {
    markerArray[i].setMap(null);
  }

  var start = document.getElementById("startLocation").value;
  var end = document.getElementById("endLocation").value;
  var request = {
    origin:start,
    destination:end,
    travelMode: google.maps.TravelMode.DRIVING
  };
  directionsService.route(request, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(result);
      showSteps(result);
    }
  });
}

function showSteps(directionResult) {
  // For each step, place a marker, and add the text to the marker's
  // info window. Also attach the marker to an array so we
  // can keep track of it and remove it when calculating new
  // routes.
  var myRoute = directionResult.routes[0].legs[0];

  for (var i = 0; i < myRoute.steps.length; i++) {
      var marker = new google.maps.Marker({
        position: myRoute.steps[i].start_point,
        map: map
      });
      console.log(marker.position);
      attachInstructionText(marker, myRoute.steps[i].instructions);
      markerArray[i] = marker;
  }
}

function attachInstructionText(marker, text) {
  google.maps.event.addListener(marker, 'click', function() {
    stepDisplay.setContent(text);
    stepDisplay.open(map, marker);
  });
}
