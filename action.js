var directionsDisplay; 
var directionsService; 
var stepDisplay;
var markerArray = [];
var markerCounter = 0;
var map;
var result;
var picData;
var instagramURLprefix = 'https://api.instagram.com/v1/media/search?';
var instagramURLsuffix = '&access_token=982828376.93a47c0.763a92fd2ac64bdeba593589ff1c8a4c';
var picCount = 1;
var maxImageHeight = 50; //PX tall
var picRadius = 100; //meters
var picZoom;
var maxQuery = 150;
var rendererOptions = {
  draggable: true
};

$(document).ready(function() {
  $('#myModal').modal('toggle')

  var googleMapPosition = $('#googleMap').offset();
  var googleMapWidth = $('#googleMap').width();
  var googleMapHeight = $('#googleMap').height();
  var trashWidth = $('#trash').width();
  var trashHeight = $('#trash').height();
  var trashLocationTop = googleMapPosition.top+googleMapHeight-trashHeight;
  var trashLocationLeft = googleMapPosition.left+googleMapWidth-trashWidth-30;
  $('#trash').css({ top: trashLocationTop, left: trashLocationLeft});

  directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
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

  google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {
    showSteps(directionsDisplay.getDirections());
    updateFields(directionsDisplay.getDirections());
  });

  $(document).on('click','#goButt', function(){

    var start = document.getElementById("startLocation").value;
    var end = document.getElementById("endLocation").value;
    picCount = document.getElementById("numPics").value;
    picRadius = document.getElementById("picRadius").value;
    picZoom = document.getElementById("picZoom").value;
    calcRoute(start, end);
    directionsDisplay.setMap(map);
  });

});

function calcRoute(start, end) {
  var request = {
    origin:start,
    destination:end,
    travelMode: google.maps.TravelMode.DRIVING
  };
  directionsService.route(request, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(result);
      //showSteps(result);
    }
  });
}

function showSteps(directionResult) {
  // Erase all old markers
  for (i = 0; i < markerArray.length; i++) {
    markerArray[i].setMap(null);
  }
  var myRoute = directionResult.routes[0].legs[0];
  // Loop Through Direction Turns -> plot icons at each turn
  for (var i = 0; i < myRoute.steps.length; i++) {
    var positionNow = myRoute.steps[i].start_point;
    var pic = getInstagramPic(positionNow.d, positionNow.e);
  }
}

// function attachInstructionText(marker, text) {
//   google.maps.event.addListener(marker, 'click', function() {
//     stepDisplay.setContent(text);
//     stepDisplay.open(map, marker);
//   });
// }
function getInstagramPic(lat, lng) {
  var urlNow = instagramURLprefix + "lat=" + lat + "&lng=" + lng + "&distance=" + picRadius + instagramURLsuffix + "&count=" + picCount;
  $.ajax({
    method: "GET",
    url: urlNow,
    dataType: "jsonp",
    jsonp : "callback",
    //jsonpCallback: "jsonpcallback",
    success: function(returned) {
      if(returned.hasOwnProperty('data') && returned.data[0] !== undefined) {
        var data_all = returned.data;
        for (i = 0; i < data_all.length; i++) {
          var data_now = data_all[i];
          if(data_now.hasOwnProperty('images')) {
            var cascadeFactor = i*.0005;
            // console.log(i)
            // console.log(lat);
            // console.log(lng);
            lat = lat - cascadeFactor;
            lng = lng + cascadeFactor;
            // console.log(lat);
            // console.log(lng);
            drawImage(data_now.images.standard_resolution, lat, lng, i);
          }
        }
      }
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      alert("Status: " + textStatus); alert("Error: " + errorThrown); 
    }     
  });
}
function drawImage(picData, lat, lng, counter){
    var picAR = picData.width/picData.height;
    var picUrl = imageResize(picData.url, picAR, maxImageHeight)
    var image = {
      url: picUrl,
      size: new google.maps.Size(maxImageHeight, picAR*maxImageHeight),
      origin: new google.maps.Point(0,0),
      anchor: new google.maps.Point(0, maxImageHeight)
    };
    var shape = {
      coord: [1, 1, 1, maxImageHeight, picAR*maxImageHeight, maxImageHeight, picAR*maxImageHeight , 1],
      type: 'poly'
    };
    var positionNow = new google.maps.LatLng(lat, lng);
    var marker = new google.maps.Marker({
      position: positionNow,
      map: map,
      icon: image,
      shape: shape,
      draggable: true,
      animation: google.maps.Animation.DROP
    });
    markerArray[markerCounter] = marker;
    markerCounter++;

    // Doubleclick Action
    google.maps.event.addListener(marker, 'dblclick', function() {
      $('#picModal').modal('toggle');
      var window_height = $( window ).height() ;
      var iconUrl = imageResize2(marker.icon.url, 1, window_height*0.50);
      $('#picModalContent').height(window_height*0.65 );
      $('#picDiv').height(window_height*0.50);
      $('#picDiv').css('background-image', 'url(' + iconUrl + ')');
      map.setZoom(13);
      map.setCenter(marker.getPosition());
    });

    //Drag End Callback
    google.maps.event.addListener(marker, 'dragend', function (event) {
      console.log(map.getBounds());

    });

    // Right click Action
    google.maps.event.addListener(marker, 'rightclick', function (){  
      var magFactor = Math.min(picZoom, 3); 
      var iconUrl = marker.icon.url;
      var newPicUrl = imageResize2(iconUrl, picAR, maxImageHeight*magFactor)

      var image = {
        url: newPicUrl,
        size: new google.maps.Size(maxImageHeight*magFactor, picAR*maxImageHeight*magFactor),
        origin: new google.maps.Point(0,0),
        anchor: new google.maps.Point(0, maxImageHeight*magFactor)
      };
      var shape = {
        coord: [1, 1, 1, maxImageHeight*magFactor, picAR*maxImageHeight*magFactor, maxImageHeight*magFactor, picAR*maxImageHeight*magFactor , 1],
        type: 'poly'
      };
      bigMarker = new google.maps.Marker({
        position: marker.getPosition(),
        map: map,
        icon: image,
        shape: shape,
        draggable: true,
      });



      google.maps.event.addListener(bigMarker, 'dblclick', function() {
        $('#picModal').modal('toggle');
        var window_height = $( window ).height() ;
        var iconUrl = imageResize2(marker.icon.url, 1, window_height*0.50);
        $('#picModalContent').height(window_height*0.65 );
        $('#picDiv').height(window_height*0.50);
        $('#picDiv').css('background-image', 'url(' + iconUrl + ')');
        map.setZoom(13);
        map.setCenter(marker.getPosition());
      });
      markerArray[markerCounter] = bigMarker;
      markerCounter++;
      id = this.__gm_id; 
      delMarker(id);
    });
}


function imageResize(url, AR, height) {
  var fixedUrl1 = replaceAll(':', '%3A', url);
  var fixedUrl  = replaceAll('/', '%2F', fixedUrl1);
  // console.log(fixedUrl)

  var key = '&key=05c06234975f4738a46d913535c9fdb9';
  var newPic = 'http://i.embed.ly/1/display/resize?height=' + height + '&width=' + height*AR + '&url=' + fixedUrl + key;
  // console.log(newPic);
  return newPic;
}
function imageResize2(url, AR, height) {
  var start = url.indexOf("height=") + 7;
  var end = url.indexOf("&width=");
  var newUrl1 = url.substr(0, start) + height + url.substr(end, url.length);

  var start = newUrl1.indexOf("width=") + 6;
  var end = newUrl1.indexOf("&url=");
  var newUrl2 = newUrl1.substr(0, start) + height*AR + newUrl1.substr(end, newUrl1.length);
  return newUrl2;
}


function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}
var delMarker = function (id) {
  for  (i = 0; i < markerCounter; i++) {
    markerNow = markerArray[i];
    if (markerNow.__gm_id == id) {
      markerNow.setMap(null);
    }
  }
}

function updateFields(directions) {
  //console.log(directions);
  var route = directions.routes[0];
  var leg = route.legs[0];
  $('#startLocation').val(leg.start_address);
  $('#endLocation').val(leg.end_address);
}
$( window ).resize(function() {
  var googleMapPosition = $('#googleMap').offset();
  var googleMapWidth = $('#googleMap').width();
  var googleMapHeight = $('#googleMap').height();
  var trashWidth = $('#trash').width();
  var trashHeight = $('#trash').height();
  var trashLocationTop = googleMapPosition.top+googleMapHeight-trashHeight;
  var trashLocationLeft = googleMapPosition.left+googleMapWidth-trashWidth-30;
  $('#trash').css({ top: trashLocationTop, left: trashLocationLeft});
});