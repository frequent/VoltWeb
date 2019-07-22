/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP, L */
(function (window, rJS, RSVP, L) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  //var INTERSECTION_OBSERVER = window.IntersectionObserver;
  var PINS = "pins";
  var DICT = {};
  var STR = "";
  var EU = "EU";
  var MAP_URL = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png';
  var MARKERS = [];
  var FALLBACK_PATH = "https://raw.githubusercontent.com/VoltEuropa/VoltWeb/master/map/markers.json";
  var LINK_DISABLED = "volt-link__disabled";
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;
  var KLASS = rJS(window);
    var MAP_CONFIG = {
    "attribution": '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
    "minZoom": 1,
    "maxZoom": 18
  };
  var ICON_CONFIG = {
    "iconUrl": "../../img/s-marker-icon.png",
    "iconSize": [15,25],
    "iconAnchor": [7,23],
    "popupAnchor": [1,-15]
  };

  /////////////////////////////
  // methods
  /////////////////////////////
  function getElem(my_element, my_selector) {
    return my_element.querySelector(my_selector);
  }

  function mergeDict(my_return_dict, my_new_dict) {
    return Object.keys(my_new_dict).reduce(function (pass_dict, key) {
      pass_dict[key] = my_new_dict[key];
      return pass_dict;
    }, my_return_dict);
  }

  function getTemplate(my_klass, my_id) {
    return my_klass.__template_element.getElementById(my_id).innerHTML;
  }

  // poor man's templates. thx, http://javascript.crockford.com/remedial.html
  if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
      return this.replace(TEMPLATE_PARSER, function (a, b) {
        var r = o[b];
        return typeof r === "string" || typeof r === "number" ? r : a;
      });
    };
  }

  /////////////////////////////
  // start
  /////////////////////////////
  // rJS(window)
  KLASS

    /////////////////////////////
    // state
    /////////////////////////////
    .setState({
      "scope": null,
      "map_set": null
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.property_dict = {
        "map_container": getElem(gadget.element, ".volt-map__event-container")
      };
    })

    /////////////////////////////
    // published methods
    /////////////////////////////

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("remoteTranslate", "remoteTranslate")

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      mergeDict(dict, my_option_dict || {});
      console.log(my_option_dict)
      if (gadget.state.map_set) {
        return;
      }

      return new RSVP.Queue()
        .push(function () {
          return gadget.stateChange({"scope": dict.scope});
        })
        .push(function () {
          return gadget.initialiseMap(dict.scope);
        });
    })

    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      if (delta.hasOwnProperty("scope")) {
        gadget.state.scope = delta.scope;
      }
      if (delta.hasOwnProperty("map_set")) {
        gadget.state.map_set = delta.map_set;
      }
      return;
    })

    .declareMethod("initialiseMap", function (my_id) {
      var gadget = this;
      var dict = gadget.property_dict;

      if (my_id === gadget.state.scope) {
        return;
      }
      if (!dict.map) {
        dict.map = L.map("volt-map__event", {"zoomControl": false});
        L.control.zoom({"position": "bottomright"}).addTo(dict.map);
      }
      return gadget.stateChange({
        "map_set": true,
        "scope": my_id || gadget.state.scope
      });
    })

    .declareMethod("redrawMap", function () {
      this.property_dict.map.invalidateSize();
    })

    .declareMethod("renderMap", function (my_scope) {
      var gadget = this;
      var dict = gadget.property_dict;
      var queue = new RSVP.Queue();

      if (my_scope) {
        queue.push(function () {
          return gadget.initialiseMap(my_scope);
        });
      }

      // wikimedia maps
      return queue.push(function () {
        var data = gadget.event_to_display;
        if (dict.markerLayer) {
          dict.map.removeLayer(dict.markerLayer);
        }

        dict.map.setView(data["location"].coordinates, 8);
        dict.icon = L.icon(ICON_CONFIG);
        //dict.map.scrollWheelZoom.disable();
        dict.tileLayer = L.tileLayer(MAP_URL, MAP_CONFIG).addTo(dict.map);
        /*
        dict.markerLayer = L.layerGroup(data.city_list.map(function (city) {
          var content = getTemplate(KLASS, "marker_link_template").supplant({
            "city_name": dict.ui_dict[city.i18n],
            "facebook_url": city.facebook_url || STR,
            "facebook_disabled": city.facebook_url === undefined ? LINK_DISABLED : STR,
            "twitter_url": city.twitter_url || STR,
            "twitter_disabled": city.twitter_url === undefined ? LINK_DISABLED : STR,
            "web_url": city.web_url || STR,
            "web_disabled": city.web_url === undefined ? LINK_DISABLED : STR
          });
          return L.marker(city.position, {"icon": dict.icon})
            .bindPopup(content)
            .on('popupopen', function (event) {
              return gadget.remoteTranslate(event.popup._source._popup._contentNode);
            });
        })).addTo(dict.map);
        */

        // pass back marker dict to update/init select element
        //return dict.marker_dict;
        return;
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
