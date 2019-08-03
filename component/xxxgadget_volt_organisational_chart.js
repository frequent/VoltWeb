/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////

  /////////////////////////////
  // methods
  /////////////////////////////

  rJS(window)

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.property_dict = {};
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
      return this.remoteTranslate(my_option_dict.ui_dict, this.element);
    })

    /////////////////////////////
    // declared service
    /////////////////////////////
    //.declareService(function () {
    //  return this.remoteTranslate(undefined, this.element);
    //})
    
    /////////////////////////////
    // event bindings
    /////////////////////////////    
    ;


}(window, rJS, RSVP));
