/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP, L */
(function (window, rJS, RSVP, L) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var DICT = {};
  var STR = "";
  var MAP_URL = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png';
  var MAP_CONFIG = {
    "attribution": '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
    "minZoom": 1,
    "maxZoom": 18
  };
  var ICON_CONFIG = {
    "iconUrl": "../../../../img/s-marker-icon.png",
    "iconSize": [15,25],
    "iconAnchor": [7,23],
    "popupAnchor": [1,-15]
  };
  var LOCALISE_CONFIG = {
    "iconUrl": "../../../../img/FR-Graphic.Icon.Localiser.png",
    "iconSize": [15,25],
    "iconAnchor": [7,23],
    "popupAnchor": [1,-15]
  };
  var DEFAULT_ZOOM = 5;

  /////////////////////////////
  // methods
  /////////////////////////////

  function mergeDict(my_return_dict, my_new_dict) {
    return Object.keys(my_new_dict).reduce(function (pass_dict, key) {
      pass_dict[key] = my_new_dict[key];
      return pass_dict;
    }, my_return_dict);
  }

  function getElem(my_element, my_selector) {
    return my_element.querySelector(my_selector);
  }

  /////////////////////////////
  // start
  /////////////////////////////
  rJS(window)

    /////////////////////////////
    // state
    /////////////////////////////
    .setState({
      "key": null,
      "map_set": null,
      "map_id": null
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.property_dict = {
        "map_container": getElem(gadget.element, ".volt-map")
      };
    })

    /////////////////////////////
    // published methods
    /////////////////////////////

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("updateMapState", "updateMapState")
    .declareAcquiredMethod("remoteTranslate", "remoteTranslate")
    .declareAcquiredMethod("setMarkerContent", "setMarkerContent")

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      mergeDict(dict, my_option_dict || {});

      // configure map
      dict.map_container.id = dict.config.map_id || "map";
      
      if (gadget.state.map_set) {
        return;
      }
      return gadget.stateChange({
        "map_id": dict.map_container.id,
        "key": dict.config.key,
      });
    })

    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      if (delta.hasOwnProperty("key")) {
        gadget.state.key = delta.key;
      }
      if (delta.hasOwnProperty("map_set")) {
        gadget.state.map_set = delta.map_set;
      }
      if (delta.hasOwnProperty("map_id")) {
        gadget.state.map_id = delta.map_id;
      }
      return;
    })

    .declareMethod("initialiseMap", function (my_id) {
      var gadget = this;
      var dict = gadget.property_dict;
      var id;
      if (!dict.map) {
        dict.map = L.map(gadget.state.map_id, {"zoomControl": false});
        L.control.zoom({"position": "bottomright"}).addTo(dict.map);
      }
      if (my_id === gadget.state.key) {
        return;
      }
      id = my_id || gadget.state.key;
      return gadget.stateChange({"map_set": true})
        .push(function () {
          return gadget.updateMapState(my_id);
        });
    })

    .declareMethod("redrawMap", function () {
      this.property_dict.map.invalidateSize();
    })

    .declareMethod("localiseUser", function () {
      var gadget = this;
      var dict = gadget.property_dict;
      var getPosition = function () {
        return new RSVP.Promise(function (resolve, reject) {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });  
      };
      return new RSVP.Queue()
        .push(function () {
          return getPosition();
        })
        .push(function (pos) {
          var coordinates = [pos.coords.latitude, pos.coords.longitude]; 
          dict.map.setView(coordinates, dict.config.zoom || DEFAULT_ZOOM);
          dict.user = L.icon(LOCALISE_CONFIG);
          dict.user_layer = L.layerGroup([
            L.marker(coordinates, {"icon": dict.user})
          ]);
          dict.map.addLayer(dict.user_layer);
        });
    })

    .declareMethod("renderMap", function (my_key) {
      var gadget = this;
      var dict = gadget.property_dict;
      var queue = new RSVP.Queue();

      if (my_key) {
        queue.push(function () {
          return gadget.initialiseMap(my_key);
        });
      }

      return queue
        .push(function () {
          return gadget.setMarkerContent("marker_template", my_key);
        })
        .push(function (my_marker_content_dict) {
          if (dict.marker_layer) {
            dict.map.removeLayer(dict.marker_layer);
          }
          dict.map.setView(my_marker_content_dict.position, dict.config.zoom || DEFAULT_ZOOM);
          dict.icon = L.icon(ICON_CONFIG);
          dict.tileLayer = L.tileLayer(MAP_URL, MAP_CONFIG).addTo(dict.map);

          if (my_marker_content_dict) {
            dict.marker_layer = L.layerGroup(my_marker_content_dict.entry_list.map(function (entry) {
              if (entry.content === STR) {
                return L.marker(entry.position, {"icon": dict.icon});
              }
              return L.marker(entry.position, {"icon": dict.icon})
                .bindPopup(entry.content)
                .on('popupopen', function (event) {
                  return gadget.remoteTranslate(event.popup._source._popup._contentNode);
                });
            }));
            dict.map.addLayer(dict.marker_layer);
          }

          // pass back marker dict in case needed
          return dict.marker_dict;
        });
    })
    
    /////////////////////////////
    // declared service
    /////////////////////////////

    /////////////////////////////
    // event bindings
    /////////////////////////////
    //.onEvent("click", function (event) {
    //  var gadget = this;
    //  if (event.target.classList.contains("volt-map")) {
    //    gadget.property_dict.map.scrollWheelZoom.enable();
    //  }
    //}, false, false)

    //.onEvent("mouseout", function (event) {
    //  var gadget = this;
    //  if (event.target.classList.contains("volt-map")) {
    //    gadget.property_dict.map.scrollWheelZoom.disable();
    //  }
    //}, false, false)
    ;

}(window, rJS, RSVP, L));
