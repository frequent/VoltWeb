/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var RESPONSIVE_CLASS = "volt-navbar-list-responsive";
  var ARR = [];
  var CLICK = "click";
  var DOT = ".";
  var LIST = "volt-navbar-list";

  /////////////////////////////
  // methods
  /////////////////////////////
  function getParent(my_element, my_class) {
    if (my_element.classList.contains(my_class)) {
      return my_element;
    }
    return getParent(my_element.parentElement, my_class);
  }

  rJS(window)

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      var el = gadget.element;
      gadget.property_dict = {
        "navbar_list": el.querySelectorAll(DOT + LIST),
        "menu_button_list": el.querySelectorAll(".volt-navbar-menu"),
        "header": gadget.element.querySelector(".volt-header")
      };
    })

    /////////////////////////////
    // acquired methods
    /////////////////////////////
    .declareAcquiredMethod("remoteTranslate", "remoteTranslate")

    /////////////////////////////
    // published methods
    /////////////////////////////

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var header = gadget.property_dict.header;
      window.componentHandler.upgradeElements(header);
      return RSVP.all([
        gadget.remoteTranslate(my_option_dict.ui_dict, header),
        gadget.setupFrownedUponClickListenerList()
      ]);
    })

    .declareMethod("swapMenuClass", function (my_hash, my_event) {
      var props = this.property_dict;
      var list_to_activate = getParent(my_event.target, LIST);

      if (list_to_activate.classList.contains(RESPONSIVE_CLASS)) {
        list_to_activate.classList.remove(RESPONSIVE_CLASS);
      } else {
        ARR.slice.call(props.navbar_list).filter(function (el) {
          el.classList.remove(RESPONSIVE_CLASS);
        });
        list_to_activate.classList.add(RESPONSIVE_CLASS);
      }
    })

    // we don't like click handlers. Really.
    .declareMethod("setupFrownedUponClickListenerList", function () {
      var gadget = this;
      var props = this.property_dict;
      var listener = window.loopEventListener;
      if (props.click_set) {
        return;
      }
      props.click_set = true;
      function handleClick(my_event) {
        return gadget.swapMenuClass(null, my_event);
      }
      return RSVP.all(
        ARR.slice.call(props.menu_button_list).map(function (menu_button) {
          return listener(menu_button, CLICK, false, handleClick);  
        })
      );
    })

    /////////////////////////////
    // declared jobs
    /////////////////////////////

    /////////////////////////////
    // declared service
    /////////////////////////////
    // BACKUP in case render doesn't trigger
    .declareService(function () {
      return this.setupFrownedUponClickListenerList();
    });

    /////////////////////////////
    // on Event
    /////////////////////////////

}(window, rJS, RSVP));
