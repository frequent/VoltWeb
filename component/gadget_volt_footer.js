/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
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

  /////////////////////////////
  // methods
  /////////////////////////////
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
      gadget.property_dict = {
        "language_select": getElem(gadget.element, ".volt-select__language")
      };
    })

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("remoteTranslate", "remoteTranslate")
    .declareAcquiredMethod("changeLanguage", "changeLanguage")

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

      setDom(dict.language_select, dict.available_language_list
        .map(function (lang) {
          return getTemplate(KLASS, "language_select_template").supplant({
            "language": lang.id,
            "language_i18n": "footer-" + lang.i18n
          });
        }).join(""), true
      );
      dict.language_select.value = my_option_dict.selected_language;
      return gadget.remoteTranslate(dict.ui_dict, gadget.element);
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


}(window, rJS, RSVP));
