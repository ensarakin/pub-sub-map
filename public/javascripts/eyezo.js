var markers = new Array();
var bubble = null;
var bubbleLoc = null;

var socket = io.connect();
socket.event = new Object();
socket.event.subs = new Object();
socket.event.data = new Object();

socket.on('info', function (data) {
  if (socket.event.info && typeof socket.event.info == 'function')
    socket.event.info();
});

socket.on('subs', function (data) {
  if (socket.event.subs.begin && typeof socket.event.subs.begin == 'function')
    socket.event.subs.begin();
  if (socket.event.subs.each && typeof socket.event.subs.each == 'function')
    for (var x in data)
      socket.event.subs.each(data[x]);
  if (socket.event.subs.end && typeof socket.event.subs.end == 'function')
    socket.event.subs.end();
});

socket.on('data', function (data) {
  if (socket.event.data.begin && typeof socket.event.data.begin == 'function')
    socket.event.data.begin();
  for (var x in data) {
    var d = data[x];
    if (d.key && d.points) {
      var key = d.key;
      for (var y in d.points) {
        var p = d.points[y];
        var timeAgo = p[0];
        var lat = p[1];
        var lng = p[2];
        if (rational(lat) && rational(lng)) {
          var marker = null;
          var polyline = null;
          var info = null;
          var pos = new google.maps.LatLng(lat, lng);

          for (i=0; i<markers.length && marker == null; i++)
            if (markers[i].key == key) {
              marker = markers[i].marker;
              polyline = markers[i].polyline;
              info = markers[i].info;
            }

          if ( marker == null ) {
            var markerImage = new google.maps.MarkerImage(
              "/images/life-preserver-icon-36x36.png",
              new google.maps.Size(36, 36),
              new google.maps.Point(0, 0),
              new google.maps.Point(9, 9),
              new google.maps.Size(18, 18)
	    );
            marker = new google.maps.Marker({
              map: map,
              position: pos,
              icon: markerImage,
              clickable: true,
              animation: google.maps.Animation.DROP
            });

            var color = "#"+((1<<24)*Math.random()|0).toString(16);
            var polyOpts = {strokeColor:color, strokeOpacity:1.0, strokeWeight:2, map:map};
            polyline = new google.maps.Polyline(polyOpts);
            info = new google.maps.InfoWindow();

            var m = new Object( );
            m.key = key;
            m.marker = marker;
            m.polyline = polyline;
            m.info = info;
            markers.push(m);

          }

          google.maps.event.addListener(marker, 'click', function() {
              info.open(map, marker);
            });

          marker.setPosition(pos);
          polyline.getPath().push(pos);
          info.setContent('<h1>'+key+'</h1>'+lat+', '+lng);
          info.setPosition(pos);

          if (socket.event.data.each && typeof socket.event.data.each == 'function')
	      socket.event.data.each(key,marker,polyline,info);

        } // if (rational(lat) && rational(lng))
      } // for (var y in d.points)
    } // if (d.key && d.points)
  } // for (var x in data)
  if (socket.event.data.end && typeof socket.event.data.end == 'function')
    socket.event.data.end();
}); // socket.on

function rational(d){
  if(d!=null && d>-180 && d<180)
    return true;
  else
    return false;
}
