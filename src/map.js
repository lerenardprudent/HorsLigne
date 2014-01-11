var http_port = 6767;
var _zoomMin = 1, _zoomMax = 20; 
getZoomLevels();

$(document).ready( function() {
  var d = new Date();
  var timestamp = "so_" + d.getDate() + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + "_" + d.getHours() + "h" + d.getMinutes() + "-" + d.getSeconds();
  document.getElementById("filename").setAttribute("placeholder",timestamp);
  
  document.getElementById("save").disabled = true;
  /*
  $('input[type=file]').each(function(){
    $(this).addClass('file').addClass('hidden');
    $(this).parent().append($('<div class="fakefile" />').append($('<input type="text" />').attr('id',$(this).attr('id')+'__fake')).append($('<img src="pix/button_select.gif" alt="" />')));
 
    $(this).bind('change', function() {
      $('#'+$(this).attr('id')+'__fake').val($(this).val());;
    });
    $(this).bind('mouseout', function() {
      $('#'+$(this).attr('id')+'__fake').val($(this).val());;
    });
  });
  */
});

  // create a map in the "map" div, set the view to a given place and zoom
  var map = L.map('map');
  recenter_map();

  // add an OpenStreetMap tile layer
  var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  });

  var offlineLayer = L.tileLayer('tiles/{z}/{x}/{y}.png', {minZoom:_zoomMin, maxZoom:_zoomMax}).addTo(map);

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

  var jsonData = readJSON('geo/sud-ouest.geojson');
  arrondsLayer.addData(jsonData);

  // LOCATE CONTROL ----------------------------

  L.control.locate().addTo(map);

  // LAYERS CONTROL ----------------------------

  var baseLayers = {"Carte hors-ligne" : offlineLayer, "Carte OpenStreetMap" : osmLayer}
  var overlays = {"Arrondissements du Sud-Ouest" : arrondsLayer}

  L.control.layers(baseLayers, overlays).addTo(map);

  var drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  L.drawLocal.draw.toolbar.buttons.polygon = 'Sélectionner pour dessiner la zone perçue.';

      var drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
          circle: false,
          polyline: false,
          rectangle: false,
          polygon: {
            allowIntersection: false,
            showArea: true,
            drawError: {
              color: '#b00b00',
              timeout: 1000
            },
            shapeOptions: {
              color: '#CC0099'
            }
          },
          marker: false
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });
      map.addControl(drawControl);

      map.on('draw:created', function (e) {
        var type = e.layerType,
        layer = e.layer;

        document.getElementById("save").disabled = false;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);
      });

      map.on('draw:edited', function (e) {
        var layers = e.layers;
        var countOfEditedLayers = 0;
        layers.eachLayer(function(layer) {
          countOfEditedLayers++;
        });
        console.log("Edited " + countOfEditedLayers + " layers");
      });
      
      map.on('draw:deleted', function (e) {
        document.getElementById("save").disabled = true;
        console.log("Deleted layer");
      });

function readJSON(file)
{
	var json;
	if (typeof(http_port) === 'undefined')
		url = file;
	else
		url = "http://localhost:" + http_port + "/" + file;
	
	$.ajax({
		type: 'GET',
		async: false,
		beforeSend: function(xhr){
			if (xhr.overrideMimeType) {
				xhr.overrideMimeType("application/json");
			}
		},
		url: url,
		dataType: "json",
		success: function(data) {
			json = data;
		}
	});
	
	return json;
}

function getZoomLevels()
{
	jsonZoomInfo = readJSON('zoomlevels.php');
	_zoomMin = jsonZoomInfo.minZ;
	_zoomMax = jsonZoomInfo.maxZ;
}

function recenter_map()
{
	map.setView([45.4564755,-73.663326], _zoomMin);
}

function saveTextAsFile()
{
  var textToWrite = JSON.stringify(drawnItems.toGeoJSON());
	var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
  var name = document.getElementById("filename");
  var ext = ".json";
	var fileNameToSaveAs = ( name.value.length > 0 ? name.value + ext : name.placeholder + ext );

	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	if (window.webkitURL != null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}

	downloadLink.click();
}

function destroyClickedElement(event)
{
	document.body.removeChild(event.target);
}