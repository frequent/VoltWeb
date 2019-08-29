/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var ARR = [];
  var DICT = {};
  var NAME ="name";
  var KLASS = rJS(window);
  var CANVAS = "canvas";
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;
  var DOCUMENT = window.document;
  var PLACEHOLDER_TEMPLATE = "panini_placeholer_template";
  var PERSON_TEMPLATE = "panini_person_template";
  var LINK_DISABLED = "volt-link__disabled";
  var PANINI_DIALOG = "panini_dialog_template";
  var IMG = "IMG";
  var HIDDEN = "volt-hidden";
  var FULLSCREEN = "volt-dialog-fullscreen";
  var LAZY = "volt-lazy";
  var BLANK = "_blank";
  var STR = "";
  var INTERSECTION_OBSERVER = window.IntersectionObserver;
  var FALLBACK_IMG_URL = "../../../../img/volt.purple.min.png";

  /////////////////////////////
  // methods
  /////////////////////////////
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
      var img = entry.target;
      if (img.classList.contains(LAZY)) {
        img.setAttribute("src", img.getAttribute("data-src"));
        img.classList.remove(LAZY);
        observer.unobserve(img);
      }
    });
  }

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

  KLASS

    /////////////////////////////
    // state
    /////////////////////////////
    .setState({
      "dialog_pending": null,
      "grid": null
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      var el = gadget.element;
      gadget.property_dict = {
        "item_container": getElem(el, ".volt-item__container"),
        "dialog": getElem(el, ".volt-dialog-event"),
        "loader": getElem(el, ".dot-flashing"),
        "dialog_full": getElem(el, ".volt-dialog__action-full"),
        "dialog_exit": getElem(el, ".volt-dialog__action-exit"),
        "nill": getElem(el, ".volt-grid__no-records"),

        // lazy, fetch from indexeddb
        "event_dict": {}
      };
    })

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("remoteTranslate", "remoteTranslate")
    .declareAcquiredMethod("buildDataLookupDict", "buildDataLookupDict")

    /////////////////////////////
    // published methods
    /////////////////////////////
    // to keep map gadget generic, content specific parameters are set here
    .allowPublicAcquisition("setMarkerContent", function (my_payload) {
      var gadget = this;
      var dict = gadget.property_dict;
      var response = {};

      response.zoom = 15;
      response.position = gadget.state.current_position;
      response.entry_list = [{
        "position": gadget.state.current_position,
        "content": ""
      }];
      return response;
    })

    // not used
    .allowPublicAcquisition("updateMapState", function (my_payload) {
      return;
    })

    /////////////////////////////
    // declared methods
    /////////////////////////////
    .declareMethod("handleFailedImageError", function (my_image) {
      my_image.classList.add(LAZY);
      my_image.src = FALLBACK_IMG_URL;
    })

    .declareMethod("updateSearchResults", function (my_config) {
      var gadget = this;
      var dict = gadget.property_dict;
      var lang = dict.selected_language;
      var config = my_config;
      var item_list;
      var len = config.limit[1];
      var max;
      var i;

      dict.loader.classList.remove(HIDDEN);
      return gadget.buildDataLookupDict(config)
        .push(function (response) {
          dict.loader.classList.add(HIDDEN);
          item_list = response.data.rows.sort(function (a, b) {
              return new Date(b.title) - new Date(a.title); 
            }).map(function (item) {
              var portal_type = item.event_type.toLowerCase();
              var content = item.content_dict[lang];
              var title = content.title;
              var position = content.position;
              dict.event_dict[item.reference] = item;
              return getTemplate(KLASS, PERSON_TEMPLATE).supplant({
                "portal_type": portal_type,
                "event_handler": "volt-event__" + portal_type, 
                "reference": item.reference,
                "position": position ? (position + ", ") : STR,
                "age": content.age,
                "profession": content.profession,
                "title": content.title,
                "thumbnail_url": item.thumb_url
              });
            });

          for (i = 0, max = item_list.length; i < (len - max); i += 1) {
            item_list.push(getTemplate(KLASS, PLACEHOLDER_TEMPLATE));
          }
          setDom(
            dict.item_container,
            item_list,
            true
          );
          if (response.data.total_rows === 0) {
            dict.nill.classList.remove(HIDDEN);
          } else {
            dict.nill.classList.add(HIDDEN);
          }
          observeImage(dict, dict.item_container.querySelectorAll("img"));
          return RSVP.all([
            gadget.remoteTranslate(dict.ui_dict, gadget.element),
            gadget.changeState({"grid": config})
          ]);
        });
    })

    // -------------------------- Dialogs --------------------------------------
    .declareMethod("openDialog", function (my_target) {
      var gadget = this;
      var dict;
      var dialog;
      var profile;
      var active_element;
      
      if (gadget.state.dialog_pending) {
        return;
      }

      dict = gadget.property_dict;
      dialog = dict.dialog;
      profile = dict.event_dict[my_target.event_reference.value];
      active_element = DOCUMENT.activeElement;

      if (!dialog.showModal) {
        DIALOG_POLYFILL.registerDialog(dialog);
      }
      
      return gadget.stateChange({"dialog_pending": true})
        .push(function () {
          var lang = dict.selected_language;
          var content = profile.content_dict[lang];
          var links = profile.attachment_dict.social_media_url_dict || DICT;
          setDom(dict.dialog, getTemplate(KLASS, PANINI_DIALOG).supplant({
            "title": content.title,
            "img_url": profile.img_url,
            "fallback_url": FALLBACK_IMG_URL,
            "text_content": content.text_content,
            "profession": content.profession,
            "nationality": content.nationality,
            "age": content.age,
            "party": content.political_party,
            "suburb": content.suburb,
            "mandate": content.mandate || STR,
            "facebook_url": links.facebook_url || STR,
            "facebook_disabled": links.facebook_url || LINK_DISABLED, 
            "twitter_url": links.twitter_url || STR,
            "twitter_disabled": links.twitter_url || LINK_DISABLED,
            "instagram_url": links.instagram_url || STR,
            "instagram_disabled": links.instagram_url || LINK_DISABLED,
          }), true);
          dialog.showModal();
          observeImage(dict, dialog.querySelectorAll(".volt-lazy"));
          window.componentHandler.upgradeElements(dialog);
        });
    })

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
      return gadget.getDeclaredGadget("event")
        .push(function (my_declared_gadget) {
          return my_declared_gadget.redrawMap();
        });
    })

    // ---------------------- StateChange --------------------------------------
    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      var state = gadget.state;
      if (delta.hasOwnProperty("dialog_pending")) {
        state.dialog_pending = delta.dialog_pening;
      }
      if (delta.hasOwnProperty("grid")) {
        state.grid = delta.grid;
      }
      if (delta.hasOwnProperty("current_position")) {
        state.current_position = delta.current_position;
      }
      return;
    })


    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      mergeDict(dict, my_option_dict);
      if (INTERSECTION_OBSERVER !== undefined) {
        dict.observer = new INTERSECTION_OBSERVER(loadImage, {"threshold": 0.5});
      }
      return RSVP.all([
        gadget.updateSearchResults(dict.grid_config),
        gadget.changeState({"grid": dict.grid_config})
      ]);
    })

    /////////////////////////////
    // declared service
    /////////////////////////////

    /////////////////////////////
    // declared jobs
    /////////////////////////////
    .declareJob("closeDialog", function () {
      var gadget = this;
      var dict = gadget.property_dict;
      var dialog = dict.dialog;
      dialog.close();
      return gadget.stateChange({"dialog_pending": null});
    })

    /////////////////////////////
    // event bindings
    /////////////////////////////    
    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
        case "volt-dialog":
          return this.openDialog(event.target);
        case "volt-dialog-close":
          return this.closeDialog();
        case "volt-fullscreen":
          return this.expandDialog(event, true);
        case "volt-minimize":
          return this.expandDialog(event);
      }
    })

    .onEvent("error", function (event) {
      switch (event.target.tagName) {
        case IMG:
          return this.handleFailedImageError(event.target);
      }
    }, true);


}(window, rJS, RSVP));
