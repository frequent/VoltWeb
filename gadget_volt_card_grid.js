/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var ARR = [];
  var KLASS = rJS(window);
  var CANVAS = "canvas";
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;
  var DOCUMENT = window.document;
  var EVENT = "event_card_template";
  var IMG = "event_card_template_image";
  var IMG_FALLBACK = "event_card_template_fallback";

  /////////////////////////////
  // methods
  /////////////////////////////
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
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.property_dict = {
        "item_container": getElem(gadget.element, ".volt-item__container")
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

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      return new RSVP.Queue()
        .push(function () {
          return gadget.buildDataLookupDict();
        })
        .push(function (response) {
          setDom(
            gadget.property_dict.item_container,
            response.data.rows.map(function (item) {
              var locale = my_option_dict.locale;
              var title = item.content_dict[locale].title;
              var image = getTemplate(KLASS, item.img_url ? IMG : IMG_FALLBACK)
                .supplant({
                  "title": title,
                  "img_url": item.img_url
                });

              return getTemplate(KLASS, EVENT).supplant({
                "title": title,
                "type": item.event_type,
                "image": image,
                "description": item.content_dict[locale]["description"]
              });
            })
          );
          return gadget.remoteTranslate(my_option_dict.ui_dict, gadget.element);
        });
    })

    /////////////////////////////
    // declared service
    /////////////////////////////
    
    /////////////////////////////
    // event bindings
    /////////////////////////////    
    ;


}(window, rJS, RSVP));
