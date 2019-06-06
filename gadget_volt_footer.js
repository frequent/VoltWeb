/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var DOCUMENT = window.document;

  /////////////////////////////
  // methods
  /////////////////////////////

  rJS(window)

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.property_dict = {
        "footer": gadget.element.querySelector(".volt-footer")
      };
    })

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("remoteTranslate", "remoteTranslate")

    /////////////////////////////
    // published methods
    /////////////////////////////

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var footer = this.property_dict.footer;
      window.componentHandler.upgradeElements(footer);
      return this.remoteTranslate(my_option_dict.ui_dict, footer);
    })

    /////////////////////////////
    // declared service
    /////////////////////////////
    ;

}(window, rJS, RSVP));
