/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var BLANK = "_blank";
  var BREAK = "\r\n";
  var STR = "";
  var SPACE = " ";
  var SLASH = "/";
  var NAME = "name";
  var ON = "on";
  var DOCUMENT = window.document;
  var LOCATION = DOCUMENT.location;
  var THX = "url-site-thanks";

  /////////////////////////////
  // methods
  /////////////////////////////
  function getBody(my_dict, my_target) {
    var ui_dict = my_dict.ui_dict;
    var dot = ui_dict["contact-colon"];
    var yes = ui_dict["contact-Yes"];
    var no = ui_dict["contact-No"];

    // mh
    return window.encodeURIComponent(
      ui_dict["contact-Last Name"] + dot + my_target.contact_last_name.value.toUpperCase() + BREAK +
      ui_dict["contact-First Name"] + dot + my_target.contact_first_name.value + BREAK +
      ui_dict["contact-City"] + dot + (my_target.contact_city ? my_target.contact_city.value : STR) + BREAK +
      ui_dict["contact-Zip Code"] + dot + (my_target.contact_zip_code ? my_target.contact_zip_code.value : STR) + BREAK +
      ui_dict["contact-Subscribe to our Newsletter"] + dot + (my_target.contact_newsletter === ON ? yes : no) + BREAK +
      ui_dict["contact-Data Privacy Notice"] + dot + (my_target.contact_privacy === ON ? yes : no) + BREAK,
      ui_dict["contact-Subject"] + dot + my_target.contact_subject + BREAK +
      ui_dict["contact-Your Message"] + dot +  my_target.contact_message
    );
  }

  function getSubject(my_dict, my_target) {
    var ui_dict = my_dict.ui_dict;
    return window.encodeURIComponent(
      "[" + my_dict.scope + "]" + ui_dict["contact-Contact"] + " : " + 
        my_target.contact_first_name.value + SPACE +
          my_target.contact_last_name.value.toUpperCase() + SPACE +
            my_target.contact_subject.value
    );
  }

  function crop(my_scope) {
    var arr = my_scope.split(SLASH);
    return arr.splice(0, arr.length - 1).join(SLASH);
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

  /////////////////////////////
  // start
  /////////////////////////////
  rJS(window)

    /////////////////////////////
    // state
    /////////////////////////////

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.property_dict = {
        "form_container": getElem(gadget.element, ".volt-form")
      };
    })

    /////////////////////////////
    // published methods
    /////////////////////////////

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("remoteTranslate", "remoteTranslate")
    .declareAcquiredMethod("getSocialMediaSource", "getSocialMediaSource")

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      mergeDict(dict, my_option_dict || {});
      window.componentHandler.upgradeElements(dict.form_container);
      gadget.remoteTranslate(dict.ui_dict, dict.form_container);
    })

    .declareMethod("getDestinationDict", function (my_scope) {
      var gadget = this;
      return gadget.getSocialMediaSource(my_scope)
        .push(function (my_dict) {
          var destination = my_dict.lead_url || my_dict.contact_url;
          if (destination === undefined) {
            return gadget.getDestinationDict(crop(my_scope));
          }
          return destination;
        });
    })

    .declareMethod("submitContactForm", function (my_target) {
      var gadget = this;
      var dict = gadget.property_dict;
      var scope = dict.scope;
      var language = dict.selected_language;
      return gadget.getDestinationDict(scope)
        .push(function (my_source) {
          window.open(my_source + "?subject=" + getSubject(dict, my_target) +
            "&body=" + getBody(dict, my_target), "_blank"
          );
          return LOCATION.assign("../" + language + "/" + dict.ui_dict[THX]);
        });
    })
    
    /////////////////////////////
    // declared service
    /////////////////////////////

    /////////////////////////////
    // event bindings
    /////////////////////////////
    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
        case "volt-form__contact":
          return this.submitContactForm(event.target);
      }
    });

}(window, rJS, RSVP));
