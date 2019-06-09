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
  var ACTION = "data-action";
  var DOT = ".";
  var DOCUMENT = window.document;
  var NAME = "name";
  var DIALOG = ".volt-dialog-";
  var DIALOG_POLYFILL = window.dialogPolyfill;
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

  function mergeDict(my_return_dict, my_new_dict) {
    return Object.keys(my_new_dict).reduce(function (pass_dict, key) {
      pass_dict[key] = my_new_dict[key];
      return pass_dict;
    }, my_return_dict);
  }

  function getElem(my_element, my_selector) {
    return my_element.querySelector(my_selector);
  }

  rJS(window)

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      var el = gadget.element;
      gadget.property_dict = {
        "navbar_list": getElem(el, DOT + LIST),
        "menu_button_list": getElem(el, ".volt-navbar-menu"),
        "header": getElem(el,".volt-header"),
        "map_wrapper": getElem(el, ".volt-map__wrapper")
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

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // -------------------------- Dialogs --------------------------------------
    .declareMethod("handleDialog", function (my_event, my_action) {
      var gadget = this;
      var action = my_action || my_event.target.getAttribute(ACTION);
      var dialog = getElem(gadget.element, (DIALOG + action));
      var active_element = DOCUMENT.activeElement;
      var clear;
      
      if (active_element && active_element.classList.contains("volt-dialog-close")) {
        dialog.close();
        return;
      }
      if (!dialog.open) {
        if (!dialog.showModal) {
          DIALOG_POLYFILL.registerDialog(dialog);
        }
        
        return gadget.getDeclaredGadget("map")
          .push(function (my_declared_gadget) {
            return my_declared_gadget.render();
          })
          .push(function () {
            window.componentHandler.upgradeElements(dialog);
            dialog.showModal();
          })
      }
      dialog.close();
      return;
    })
    
    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      var header = dict.header;
      mergeDict(dict, my_option_dict);
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
    })

    /////////////////////////////
    // event bindings
    /////////////////////////////
    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
       case "volt-dialog":
        return this.handleDialog(event);
      }
    }, false, true);

}(window, rJS, RSVP));
