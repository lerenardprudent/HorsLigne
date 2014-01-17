//=============================== VARIABLES GLOBALES ==========================

var http_port = 6767;
var _zoomMin = 1, _zoomMax = 20; 
var polyStyle = { color: '#FF0000',
                  fillOpacity: 0.8,
                  opacity: 0.5
                };
var map = L.map('map', {zoomControl: false});
var tooltipEdit = 'Éditer la zone que vous avez dessinée';
var tooltipDelete = 'Effacer une zone de la carte';
var LANGUE = {
  Français : { ind: 0, val: "fr" },
	Anglais : { ind: 1, val: "en" }
};
var engTextTag = 'textang';
var urlParams = parseUrl();
var urlBase = window.location.href.split('?')[0];
var langParamKey = 'lang';
var langue;
if ( typeof(urlParams[langParamKey]) !== 'undefined' && urlParams[langParamKey] == LANGUE.Anglais.val ) {
  langue = LANGUE.Anglais;
}
else {
  langue = LANGUE.Français;
}

//========================= CALQUES DE LA CARTE ===============================

var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});

defineZoomLevels();
recenter_map();
var offlineLayer = L.tileLayer('tiles/{z}/{x}/{y}.png',
                               {attribution: '&copy; <a href="http://http://mapnik.org/">Mapnik</a>',
                               minZoom:_zoomMin, maxZoom:_zoomMax}).addTo(map);

var defaultStyle = { "weight": 2,
                     "opacity": 0.65,
                     "fillColor" : "blue", 
                     "fillOpacity": 0.3,
                     "clickable" : true
                   };

var clickedStyle = { "fillColor" : "lightgreen",
                     "fillOpacity": 0.6
                   };

var arrondsLayer = L.geoJson(
    null,
    { style: defaultStyle,
      onEachFeature: function (feature, layer) {
              layer.bindPopup(chooseLang("Arrondissement", "Neighborhood") + ": <b>" + feature.properties.NOM + '</b>');
        layer.on('click', function () { layer.setStyle(clickedStyle); });
        layer.on('popupclose', function () { layer.setStyle(defaultStyle); });
      }
    }).addTo(map);

var jsonData = readJSON('ext/sud-ouest.geojson');
arrondsLayer.addData(jsonData);

//============================= CONTROLS ======================================

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
initControls();

map.on('draw:drawstart', function (e) {
  if ( true /*langue == LANGUE.Anglais*/ ) {
    $('li a').each(function() {
      if ( langue == LANGUE.Français ) {
        if ( $(this).attr('title').toLowerCase().indexOf('cancel') >= 0 ) {
          $(this).text('Annuler').attr('title', 'Annuler le dessin de la zone');
        }
        else if ( $(this).attr('title').toLowerCase().indexOf('delete') >= 0 ) {
          $(this).text('Effacer le dernier point').attr('title', 'Effacer le dernier point de dessiné');
        }
      }
    });
  }
});

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
  if ( langue == LANGUE.Français ) {
    var noZoneYetMsg = ' (aucune zone n\'a encore été dessinée)';
    $('.leaflet-draw-edit-edit').attr('title', tooltipEdit + noZoneYetMsg );
    $('.leaflet-draw-edit-remove').attr('title', tooltipDelete + noZoneYetMsg );
  }
});

function initControls()
{
  // Control calques - en bas à gauche
  
  if ( langue == LANGUE.Français ) {
    var baseLayers = {"Carte hors-ligne" : offlineLayer, "Carte en-ligne" : osmLayer};
    var overlays = { "Arrondissements du Sud-Ouest" : arrondsLayer};
  }
  else {
    var baseLayers = {"Off-line map" : offlineLayer, "On-line map" : osmLayer};
    var overlays = { "Sud-Ouest neighborhoods" : arrondsLayer};
  }

  L.control.layers(baseLayers, overlays, {position: 'bottomleft'}).addTo(map);

  // Controls zoom - en bas à droite
  var zoomControlOptions = { position: 'bottomright' };
  if ( langue == LANGUE.Français ) {
    zoomControlOptions.zoomInTitle = 'Zoomer avant';
    zoomControlOptions.zoomOutTitle = 'Zoomer arrière';
  }
  L.control.zoom(zoomControlOptions).addTo(map);

  // Controls dessin - en haut à droite
  L.drawLocal.draw.toolbar.buttons.polygon = chooseLang('Mode DESSIN', 'DRAW mode');
  if ( langue == LANGUE.Français ) {
    L.drawLocal.edit.toolbar.buttons.edit = tooltipEdit;
    L.drawLocal.edit.toolbar.buttons.remove = tooltipDelete;
    L.drawLocal.draw.handlers.polygon.tooltip = { start: 'Cliquer pour entamer le dessin.',
                                                  cont: 'Cliquer pour poursuivre le dessin.',
                                                  end: 'Cliquer le point initial pour achever le dessin.' };
  }
                                                
      var drawControl = new L.Control.Draw({
        position: 'topleft',
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
            shapeOptions: polyStyle
          },
          marker: false
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });
      map.addControl(drawControl);
}

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

function defineZoomLevels()
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
  var textToWrite = JSON.stringify(drawnItems.getLayers()[0].getLatLngs());
	var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
  var name = document.getElementById("nomsess");
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

function loadSession()
{
  var fileToLoad = document.getElementById("fileToLoad").files[0];
	var fileReader = new FileReader();
  
	fileReader.onload = function(fileLoadedEvent) 
	{
		var textFromFileLoaded = fileLoadedEvent.target.result;
    var latlngs = JSON.parse(textFromFileLoaded);
    drawnItems.clearLayers();
    var polyLayer = new L.Polygon(latlngs);
    polyLayer.setStyle(polyStyle);
    drawnItems.addLayer(polyLayer);
	};
	fileReader.readAsText(fileToLoad, "UTF-8");
  var nomDeSess = fileToLoad.name;
  var suffix = ".json";
  if ( nomDeSess.toLowerCase().endsWith(suffix) )
    nomDeSess = nomDeSess.substring(0, nomDeSess.length-suffix.length);
  document.getElementById("nomsess").value = nomDeSess;
  document.getElementById("save").disabled = false;
}

function getCurrTimestamp()
{
  var d = new Date();
  var timestamp = leftPad(d.getDate()) + leftPad(d.getMonth()+1) + (d.getYear()-100) + "-" + leftPad(d.getHours()) + leftPad(d.getMinutes()) + leftPad(d.getSeconds());
  return timestamp;
}

function leftPad(x, padChar)
{
  if (typeof(padChar) === 'undefined')
    padChar = '0';
  var strX = x.toString();
  if (x < 10)
    strX = padChar + strX;
  return strX;
}

function parseUrl()
{
  var urlParams = {};
	var query = window.location.search.substring(1).split("&");
	for (var i = 0, max = query.length; i < max; i++)
	{
		if (query[i] === "") // check for trailing & with no param
			continue;

    var param = query[i].split("=");
    urlParams[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
	}
  return urlParams;
}

function renderSiteInEnglish()
{
  $('p[' + engTextTag + ']').each(function() { $(this).text($(this).attr(engTextTag)); });
  $('button[' + engTextTag + ']').each(function() {
    var oldHtml = $(this).html();
    var engTokens = $(this).attr(engTextTag).split(',');
    $(this).html(oldHtml.substring(0, oldHtml.lastIndexOf(';')) + engTokens[0]);
    if ( engTokens.length > 1 )
      $(this).attr('title', engTokens[1]);
  });
  $('input[' + engTextTag + ']').each(function() { $(this).attr('title', $(this).attr(engTextTag)); });
  $('div[' + engTextTag + ']').each(function() { 
    $(this).attr('title', $(this).attr(engTextTag)); 
  });
  $('button[data-target]').each(function() { $(this).attr('data-target', $(this).attr('data-target') + engTextTag); });
//  $('#douglas-link').attr('href', 'http://www.douglas.qc.ca/?locale=en');
}

function chooseLang(fr, en)
{
  return ( langue == LANGUE.Français ? fr : en );
}

function startTour()
{
  var windowWidth = 250;
  
  positions = [
    { container: '#tour', x: -40, y: -180, width: windowWidth, arrow: 'bc' },
    { container: '.leaflet-control-zoom-in', x: -(windowWidth+12), y: -140, width: windowWidth, arrow: 'rb' },
    { container: '.leaflet-draw-draw-polygon', x: 38, y: -10, width: windowWidth, arrow: 'lt' },
    { container: '.leaflet-draw-edit-edit', x: 38, y: -10, width: windowWidth, arrow: 'lt' },
    { container: '.leaflet-draw-edit-remove', x: 38, y: -10, width: windowWidth, arrow: 'lt' },
    { container: '.leaflet-draw-draw-polygon', x: 38, y: -10, width: windowWidth, arrow: 'lt' },
    { container: '#recenter', x: -(windowWidth+12), y:0, width: windowWidth, arrow: 'rt' },
    { container: '#save', x: -(windowWidth+12), y:0, width: windowWidth, arrow: 'rt' },
    { container: '.bootstrap-filestyle', x: -(windowWidth+12), y:-5, width: windowWidth, arrow: 'rt' }
  ];
      
  function getStartButtons() {
    if ( langue == LANGUE.Français ) {
      return { Commencer: 1, Terminer: 2 };
    }
    return { Begin: 1, Exit: 2 };
  }
  
  function getContinueButtons() {
    if ( langue == LANGUE.Français ) {
      return { Précédent: -1, Suivant: 1 };
    }
    return { Previous: -1, Next: 1 };
  }
  
  function getEndButton() {
    if ( langue == LANGUE.Français ) {
      return { Fin: 2 };
    }
    return { Done: 2 };
  }
  
var tourSubmitFunc = function(e,v,m,f){
			if(v === -1){
				$.prompt.prevState();
				return false;
			}
			else if(v === 1){
				$.prompt.nextState();
				return false;
			}
},
tourStates = [
	{
		title: chooseLang('Bienvenue', 'Welcome'),
		html: 'Ready to take a quick tour of jQuery Impromptu?',
		buttons: getStartButtons(),
		focus: 0,
		position: positions[0],
		submit: tourSubmitFunc
	},
  {
		title: chooseLang('Zoomer', 'Zoom'),
		html: 'Ready to take a quick tour of jQuery Impromptu?',
		buttons: getContinueButtons(),
		focus: 1,
		position: positions[1],
		submit: tourSubmitFunc
	},
  {
		title: 'Draw',
		html: 'Ready to take a quick tour of jQuery Impromptu?',
		buttons: getContinueButtons(),
		focus: 1,
		position: positions[2],
		submit: tourSubmitFunc
	},
  {
		title: 'Edit',
		html: 'Ready to take a quick tour of jQuery Impromptu?',
		buttons: getContinueButtons(),
		focus: 1,
		position: positions[3],
		submit: tourSubmitFunc
	},
  {
		title: 'Delete',
		html: 'Ready to take a quick tour of jQuery Impromptu?',
		buttons: getContinueButtons(),
		focus: 1,
		position: positions[4],
		submit: tourSubmitFunc
	},
  {
		title: 'Start again',
		html: 'Ready to take a quick tour of jQuery Impromptu?',
		buttons: getContinueButtons(),
		focus: 1,
		position: positions[5],
		submit: tourSubmitFunc
	},
  {
		title: 'Show the map extent',
		html: 'Ready to take a quick tour of jQuery Impromptu?',
		buttons: getContinueButtons(),
		focus: 1,
		position: positions[6],
		submit: tourSubmitFunc
	},
  {
		title: 'Save your session',
		html: 'Ready to take a quick tour of jQuery Impromptu?',
		buttons: getContinueButtons(),
		focus: 1,
		position: positions[7],
		submit: tourSubmitFunc
	},
    {
		title: 'Load a previous session',
		html: 'Ready to take a quick tour of jQuery Impromptu?',
		buttons: getEndButton(),
		focus: 0,
		position: positions[8],
		submit: tourSubmitFunc
	},
];
  var tour = $.prompt(tourStates);
  tour.on('impromptu:loaded', function(e){
				$('button.jqidefaultbutton[id^="jqi_0"]').focus();
        $('.jqiclose').attr('title', chooseLang('Abandonner ce tour', 'Quit')).css('font-size','20px').css('top','0px').css('right', '5px').css('color', 'grey');
  });
}