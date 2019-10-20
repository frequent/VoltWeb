/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP, Object */
(function (window, rJS, RSVP, Object) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var ARR = [];
  var CANVAS = "canvas";
  var DOCUMENT = window.document;
  var NAME ="name";
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;
  var KLASS = rJS(window);
  var HREF = "href";
  var URL = "_url";
  var STR = "";

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

  function getTemplate(my_klass, my_id) {
    return my_klass.__template_element.getElementById(my_id).innerHTML;
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
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      var el = gadget.element;
      gadget.property_dict = {
        "language_select": getElem(el, ".volt-select__language"),
        "scm_dict": {
          "facebook": getElem(el, ".volt-scm__facebook"),
          "twitter": getElem(el, ".volt-scm__twitter"),
          "instagram": getElem(el, ".volt-scm__instagram")
        }
      };
    })

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("remoteTranslate", "remoteTranslate")
    .declareAcquiredMethod("changeLanguage", "changeLanguage")
    .declareAcquiredMethod("getSocialMediaSource", "getSocialMediaSource")

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
      mergeDict(dict, my_option_dict);
      return gadget.getDestinationDict(dict.scope)
        .push(function (my_dict) {
          var social_media_element_dict = dict.scm_dict;
          Object.keys(social_media_element_dict).map(function (key) {
            social_media_element_dict[key].setAttribute(HREF, my_dict[key+URL] || STR);
          });
          setDom(dict.language_select, dict.available_language_list
            .map(function (lang) {
              return getTemplate(KLASS, "language_select_template").supplant({
                "language": lang.id,
                "language_i18n": "footer-" + lang.i18n,
                "default_text": lang.text
              });
            }).join(""), true
          );
          dict.language_select.value = dict.selected_language;
          return gadget.remoteTranslate(dict.ui_dict, gadget.element);
        });
    })

    .declareMethod("getDestinationDict", function (my_scope) {
      var gadget = this;
      return gadget.getSocialMediaSource(my_scope)
        .push(function (my_dict) {
          if (my_dict === undefined) {
            return gadget.getDestinationDict(crop(my_scope));
          }
          return my_dict;
        });
    })

    /////////////////////////////
    // declared service
    /////////////////////////////
    
    /////////////////////////////
    // event bindings
    /////////////////////////////    
    .onEvent("change", function (event) {
      return this.changeLanguage(event);
    }, false, false)

    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
        case "volt-language":
          return this.changeLanguage(event.target[0]);
      }
    }, false, true);


}(window, rJS, RSVP, Object));
