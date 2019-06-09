/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var INTERSECTION_OBSERVER = window.IntersectionObserver;
  var ICON_CONFIG = {
    "iconUrl": "img/s-marker-icon.png",
    "iconSize": [15,25],
    "iconAnchor": [7,23],
    "popupAnchor": [1,-15]
  };
  var MAP_URL = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png';
  var MAP_CONFIG = {
    "attribution": '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
    "minZoom": 1,
    "maxZoom": 18
  };
  var MARKERS = [];

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

  function observeImage(my_dict, my_image_list) {
    if (!my_dict.observer) {
      return;
    }
    my_image_list.forEach(function (image) {
      my_dict.observer.observe(image);
    });
  }

  function loadImage(entries, observer) {
    entries.forEach(function (entry) {
      var map;
      var icon;

      if (entry.intersectionRatio <= 0) {
        return;
      }

      observer.unobserve(entry.target);
      map = L.map('volt-map').setView([47.86543, 12.79790], 4);
      icon = L.icon(ICON_CONFIG);

      // wikimedia maps
      L.tileLayer(MAP_URL, MAP_CONFIG).addTo(map);

      map.scrollWheelZoom.disable();
      map.on('click', () => { map.scrollWheelZoom.enable(); });
      map.on('mouseout', () => { map.scrollWheelZoom.disable(); });

      MARKERS.forEach(function (marker) {
        var headline = "<strong>" + marker.title + "</strong><br/>"
        var content = marker.content ? marker.content + "<br/>" : ""
        var link = marker.link ? "<a href=\"" + marker.link + "\">" + (marker.linkLabel || "Read more …") + "</a>" : ""
        L.marker(marker.position, { icon: icon })
          .addTo(map)
          .bindPopup(headline + content + link)
      })
   });
  }

  rJS(window)

    /////////////////////////////
    // state
    /////////////////////////////

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.property_dict = {
        "map": getElem(gadget.element, ".volt-map")
      };

    })

    /////////////////////////////
    // published methods
    /////////////////////////////

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      window.componentHandler.upgradeDom();
      mergeDict(dict, my_option_dict || {});
      if (INTERSECTION_OBSERVER !== undefined) {

        // If the image gets within 50px in the Y axis, start the download.
        dict.observer = new INTERSECTION_OBSERVER(loadImage, {
          "rootMargin": '50px 0px',
          "threshold": 0.01
        });
        observeImage(dict, [dict.map]);
      }
    })
    
    /////////////////////////////
    // declared service
    /////////////////////////////

    ;
}(window, rJS, RSVP));
