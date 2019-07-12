/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var DOCUMENT = window.document;
  var NAME ="name";

  /////////////////////////////
  // methods
  /////////////////////////////
  function getElem(my_element, my_selector) {
    return my_element.querySelector(my_selector);
  }

  //function setLanguage(my_element, my_language) {
  //  my_element.value = my_language;
  //}

  rJS(window)

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
    //.declareMethod("updateLanguage", function (my_select) {
    //  var gadget = this;
    //  var lang = my_select.options[my_select.selectedIndex].value;
    //  setLanguage(my_select, lang);
    //})

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      this.property_dict.language_select.value = my_option_dict.country_id;
      return this.remoteTranslate(my_option_dict.ui_dict, this.element);
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
