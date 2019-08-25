/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP, navigator */
(function (window, rJS, RSVP, navigator) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var RESPONSIVE_CLASS = "volt-navbar-list-responsive";
  var ARR = [];
  var ESC = "Esc";
  var ESCAPE = "Escape";
  var CANVAS = "canvas";
  var STR = "";
  var CLICK = "click";
  var ACTION = "data-action";
  var DOT = ".";
  var EU = "eu";
  var DOCUMENT = window.document;
  var LINK_DISABLED = "volt-link__disabled";
  var NAME = "name";
  var LOCALISE = ".volt-dialog__action-localise";
  var LOCATION = window.document.location;
  var DIALOG = ".volt-dialog-";
  var DIALOG_POLYFILL = window.dialogPolyfill;
  var LIST = "volt-navbar-list";
  var LINK = "volt-navbar-link";
  var HIDDEN = "volt-hidden";
  var FULLSCREEN = "volt-dialog-fullscreen";
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;
  var KLASS = rJS(window);
  var MAP_CONFIG = {
    "map_id": "localiser"
  };

  /////////////////////////////
  // methods
  /////////////////////////////
  function getParent(my_element, my_class) {
    if (my_element && my_element.classList.contains(my_class)) {
      return my_element;
    }
    if (my_element.parentElement) {
      return getParent(my_element.parentElement, my_class);
    }
    return null;
  }

  function setMapParameterDict(my_key, my_dict) {
    var key = mapCountry(my_key);
    var country_dict = my_dict[key];
    if (key === EU) {
      country_dict.city_list = getAllCities(my_dict);
    }     
    return country_dict;  
  }

  function getAllCities(my_data) {
    var city_list = [];
    var obj;
    for (obj in my_data) {
      if (my_data.hasOwnProperty(obj)) {
        city_list = city_list.concat(my_data[obj].city_list);
      }
    }
    return city_list;
  }

  // meh
  function mapCountry(my_country) {
    if (my_country === "en") {
      return "uk";
    }
    return my_country;
  }

  function mergeDict(my_return_dict, my_new_dict) {
    return Object.keys(my_new_dict).reduce(function (pass_dict, key) {
      pass_dict[key] = my_new_dict[key];
      return pass_dict;
    }, my_return_dict);
  }

  function getElem(my_element, my_selector) {
    return my_element.querySelector(my_selector);
  }

  function getTemplate(my_klass, my_id) {
    return my_klass.__template_element.getElementById(my_id).innerHTML;
  }

  function compare( a, b ) {
    if ( a.name < b.name ){
      return -1;
    }
    if ( a.name > b.name ){
      return 1;
    }
    return 0;
  }

  function purgeDom(my_node) {
    while (my_node.firstChild) {
      my_node.removeChild(my_node.firstChild);
    }
  }

  function setDom(my_node, my_string, my_purge) {
    var faux_element = DOCUMENT.createElement(CANVAS);
    if (my_purge) {
      purgeDom(my_node);
    }
    faux_element.innerHTML = my_string;
    ARR.slice.call(faux_element.children).forEach(function (element) {
      my_node.appendChild(element);
    });
  }

  function updateSelect(my_dialog, my_json, my_language, my_dict) {
    var response = "";
    var clean_list = [];
    var key;

    for (key in my_json) {
      if (my_json.hasOwnProperty(key)) {
        clean_list.push({
          "id": key,
          "i18n": my_json[key].i18n,
          "name": my_dict[my_json[key].i18n]
        });
      }
    }
    clean_list.sort(compare).map(function (entry) {
      response += getTemplate(KLASS, "country_option_template").supplant({
        "id": entry.id,
        "country_i18n": entry.i18n,
        "country_name": entry.name,
        "selected": my_language === entry.id ? "selected": STR
      });
    });
    setDom(getElem(my_dialog, ".volt-dialog__select-wrapper"), getTemplate(
      KLASS, "country_select_template").supplant({
        "content": response
      }), true
    );
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

  KLASS

    /////////////////////////////
    // state
    /////////////////////////////
    .setState({
      "dialog_pending": null 
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      var el = gadget.element;
      gadget.property_dict = {
        "navbar_list": el.querySelectorAll(".volt-navbar-list"),
        "menu_button_list": getElem(el, ".volt-navbar-menu"),
        "map_wrapper": getElem(el, ".volt-map__wrapper"),
        "dialog": getElem(el, ".volt-dialog-scope"),
        "dialog_full": getElem(el, ".volt-dialog__action-full"),
        "dialog_exit": getElem(el, ".volt-dialog__action-exit"),
        "scm_container": getElem(el, ".volt-dialog__floater"),
        "select": getElem(el, ".volt-select__country")
      };
      return gadget.declareGadget("gadget_map.html", {
        "scope": "map",
        "element": gadget.property_dict.map_wrapper
      });
    })

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("remoteTranslate", "remoteTranslate")

    /////////////////////////////
    // published methods
    /////////////////////////////

    // to keep map gadget generic, content specific parameters are set here
    .allowPublicAcquisition("setMarkerContent", function (my_payload) {
      var gadget = this;
      var dict = gadget.property_dict;
      var url_dict = setMapParameterDict(my_payload[1], dict.marker_dict);
      var response = {};

      response.zoom = url_dict.zoom;
      response.position = url_dict.position;
      response.entry_list = url_dict.city_list.map(function (city) { 
        return {
          "content": getTemplate(KLASS, my_payload[0]).supplant({
            "city_name": dict.ui_dict[city.i18n],
            "facebook_url": city.facebook_url || STR,
            "facebook_disabled": city.facebook_url === undefined ? LINK_DISABLED : STR,
            "facebook_group": city.facebook_group_url ? getTemplate(KLASS, "facebook_group_template").supplant({
              "facebook_group_url": city.facebook_group_url,
              "facebook_group_disabled": city.facebook_group_url ? LINK_DISABLED : STR
            }) : STR,
            "contact_url": city.contact_url ? getTemplate(KLASS, "city_mail_template").supplant({
              "contact_url": city.contact_url
            }) : STR,
            "lead_url": city.lead_url ? getTemplate(KLASS, "lead_mail_template").supplant({
              "lead_url": city.lead_url
            }) : STR,
            "twitter_url": city.twitter_url || STR,
            "twitter_disabled": city.twitter_url === undefined ? LINK_DISABLED : STR,
            "web_url": city.web_url || STR,
            "web_disabled": city.web_url === undefined ? LINK_DISABLED : STR
          }),
          "position": city.position
        };
      });
      return response;
    })

    // bäh...
    .allowPublicAcquisition("updateMapState", function (my_payload) {
      var gadget = this;
      var dict = gadget.property_dict;
      var url_dict = setMapParameterDict(my_payload[0], dict.marker_dict);
      var link_list = dict.scm_container.querySelectorAll(".volt-link");
      var fb_link = link_list[0];
      var tw_link = link_list[1];
      var web_link = link_list[2];

      if (!!url_dict.facebook_url) {
        fb_link.setAttribute("href", url_dict.facebook_url);
        fb_link.classList.remove(LINK_DISABLED);
      } else {
        fb_link.setAttribute("href", STR);
        fb_link.classList.add(LINK_DISABLED);
      }
      if (!!url_dict.twitter_url) {
        tw_link.setAttribute("href", url_dict.twitter_url);
        tw_link.classList.remove(LINK_DISABLED);
      } else {
        tw_link.setAttribute("href", STR);
        tw_link.classList.add(LINK_DISABLED);
      }
      if (!!url_dict.web_url) {
        web_link.setAttribute("href", url_dict.web_url);
        web_link.classList.remove(LINK_DISABLED);
      } else {
        web_link.setAttribute("href", STR);
        web_link.classList.add(LINK_DISABLED);
      }
    })

    /////////////////////////////
    // declared methods
    /////////////////////////////
    .declareMethod("navigatePage", function (my_event) {
      var dict = this.property_dict;
      return LOCATION.assign(
        "../" + dict.selected_language + "/" +
          dict.ui_dict[my_event.target.volt_target.value]
      );
    })

    // ---------------------- StateChange --------------------------------------
    .declareMethod("stateChange", function (delta) {
      var state = this.state;
      if (delta.hasOwnProperty("dialog_pending")) {
        state.dialog_pending = delta.dialog_pending;
      }
      return;
    })

    // -------------------------- Dialogs --------------------------------------
    .declareMethod("expandDialog", function (my_event, my_fullscreen) {
      var gadget = this;
      var dict = gadget.property_dict;
      if (my_fullscreen) {
        dict.dialog.classList.add(FULLSCREEN);
        dict.dialog_full.classList.add(HIDDEN);
        dict.dialog_exit.classList.remove(HIDDEN);
      } else {
        dict.dialog.classList.remove(FULLSCREEN);
        dict.dialog_full.classList.remove(HIDDEN);
        dict.dialog_exit.classList.add(HIDDEN);
      }
      return gadget.getDeclaredGadget("map")
        .push(function (my_declared_gadget) {
          return my_declared_gadget.redrawMap();
        });
    })

    .declareMethod("localiseUser", function (my_event) {
      var gadget = this;
      return gadget.getDeclaredGadget("map")
        .push(function (my_gadget) {
          return my_gadget.localiseUser();
        });
    })

    .declareMethod("openDialog", function (my_event) {
      var gadget = this;
      var dict = gadget.property_dict;
      var dialog = dict.dialog;
      var active_element = DOCUMENT.activeElement;
      if (navigator.geolocation) {
        getElem(dialog, LOCALISE).classList.remove(LINK_DISABLED);
      }
      if (gadget.state.dialog_pending) {
        return;
      }
      return new RSVP.Queue()
        .push(function () {
          return RSVP.all([
            gadget.stateChange({"dialog_pending": true}),
            gadget.remoteTranslate(dict.ui_dict, dialog)
          ]);
        })
        .push(function () {
          if (!dialog.showModal) {
            DIALOG_POLYFILL.registerDialog(dialog);
          }
          return gadget.getDeclaredGadget("map");
        })
        .push(function (my_gadget) {
          dict.map_gadget = my_gadget;
          MAP_CONFIG.key = mapCountry(dict.default_language);
          return RSVP.all([
            dict.map_gadget.render({"config": MAP_CONFIG}),
            gadget.swapMenuClass()
          ]);
        })
        .push(function () {
          dialog.showModal();
          return dict.map_gadget.renderMap(dict.default_language);
        })
        .push(function() {
          updateSelect(dialog, dict.marker_dict, dict.default_language, dict.ui_dict);
          window.componentHandler.upgradeElements(dialog);
        });
    })

    
    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      mergeDict(dict, my_option_dict);
      return gadget.remoteTranslate(dict.ui_dict, gadget.element);
    })

    .declareMethod("swapMenuClass", function (my_list) {
      var dict = this.property_dict;
      if (my_list && my_list.classList.contains(RESPONSIVE_CLASS)) {
        my_list.classList.remove(RESPONSIVE_CLASS);
        return;
      }
      ARR.slice.call(dict.navbar_list).filter(function (el) {
        el.classList.remove(RESPONSIVE_CLASS);
      });
      if (my_list) {
        my_list.classList.add(RESPONSIVE_CLASS);
      }
    })

    /////////////////////////////
    // declared jobs
    /////////////////////////////
    .declareJob("closeDialog", function (my_event) {
      var gadget = this;
      var dict = gadget.property_dict;
      var dialog = dict.dialog;
      dialog.close();
      return gadget.stateChange({"dialog_pending": null});
    })

    /////////////////////////////
    // declared service
    /////////////////////////////

    /////////////////////////////
    // event bindings
    /////////////////////////////
    .onEvent("keydown", function (event) {
      if (event.key === ESCAPE || event.key === ESC) {
        this.closeDialog(event);
      }
    }, false, false)

    .onEvent("click", function (event) {
      var list = getParent(event.target, LIST);
      if (list) {
        return this.swapMenuClass(list);
      }
    }, false, false)

    .onEvent("change", function (event) {
      var el = event.target;
      return this.property_dict.map_gadget.renderMap(
        el.options[el.selectedIndex].value
      );
    }, false, false)

    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
        case "volt-dialog":
          return this.openDialog(event);
        case "volt-dialog-close":
          return this.closeDialog(event);
        case "volt-fullscreen":
          return this.expandDialog(event, true);
        case "volt-minimize":
          return this.expandDialog(event);
        case "volt-localise":
          return this.localiseUser(event);
        case "volt-donate":
        case "volt-join":
          return this.navigatePage(event);
      }
    }, false, true);


}(window, rJS, RSVP, navigator));
