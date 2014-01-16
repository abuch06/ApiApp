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
var rendererOptions = {
  draggable: true
};

$(document).ready(function() {
  $('#myModal').modal('toggle')

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
  for (i = 0; i < markerArray.length; i++) {
    markerArray[i].setMap(null);
  }
  var myRoute = directionResult.routes[0].legs[0];
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
            drawImage(data_now.images.thumbnail, lat, lng);
          }
        }
      }
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      alert("Status: " + textStatus); alert("Error: " + errorThrown); 
    }     
  });
}
function drawImage(picData, lat, lng){
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
    google.maps.event.addListener(marker, 'dblclick', function() {
      map.setZoom(13);
      map.setCenter(marker.getPosition());
    });
    google.maps.event.addListener(marker, 'rightclick', function (){
      map.setCenter(marker.getPosition());
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
  console.log(directions);
  var route = directions.routes[0];
  var leg = route.legs[0];
  $('#startLocation').val(leg.start_address);
  $('#endLocation').val(leg.end_address);
}
