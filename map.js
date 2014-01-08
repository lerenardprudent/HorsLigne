var _zoomMin = 1, _zoomMax = 20; 
getZoomLevels();

// create a map in the "map" div, set the view to a given place and zoom
var map = L.map('map').setView([45.457, -73.628], _zoomMin);
var map_center = map.getCenter();
// add an OpenStreetMap tile layer
var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});//.addTo(map);

var offlineLayer = L.tileLayer('./tiles/{z}/{x}/{y}.png', {minZoom:_zoomMin, maxZoom:_zoomMax}).addTo(map);

var defaultStyle = {
    //"color": "#ff7800",
    "weight": 2,
    "opacity": 0.65,
	"fillColor" : "blue", 
	"fillOpacity":0.3,
	"clickable" : true
};

var clickedStyle = {
	"fillColor" : "lightgreen", 
	"fillOpacity":0.6
};

var arrondsLayer = L.geoJson(
	null,
	{ style: defaultStyle,
	  onEachFeature: function (feature, layer) {
            layer.bindPopup("Quartier: <b>" + feature.properties.NOM + '</b>');
			layer.on('click', function () { layer.setStyle(clickedStyle); });
			layer.on('popupclose', function () { layer.setStyle(defaultStyle); });
		}
	}).addTo(map);

var jsonData = readJSON('http://localhost/hl/sud-ouest.geojson');
arrondsLayer.addData(jsonData);

// LOCATE CONTROL ----------------------------

L.control.locate().addTo(map);

// LAYERS CONTROL ----------------------------

var baseLayers = {"Carte hors-ligne" : offlineLayer, "Carte OpenStreetMap" : osmLayer}
var overlays = {"Arrondissements du Sud-Ouest" : arrondsLayer}

L.control.layers(baseLayers, overlays).addTo(map);

function readJSON(jsonUrl)
{
	var json;
	
	$.ajax({
		type: 'GET',
		async: false,
		beforeSend: function(xhr){
			if (xhr.overrideMimeType) {
				xhr.overrideMimeType("application/json");
			}
		},
		url: jsonUrl,
		dataType: "json",
		success: function(data) {
			json = data;
		}
	});
	
	return json;
}

function getZoomLevels()
{
	$.ajax({
		type: 'GET',
		async: false,
		url: 'zoomlevels.php',
		dataType: "text",
		success: function(data) {
			var zooms = data.split(',');
			_zoomMin = parseInt(zooms[0]);
			_zoomMax = parseInt(zooms[1]);
		}
	});
}

function recenter_map()
{
	map.setView(map_center, _zoomMin);
}