/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP */
(function (window, rJS, RSVP) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var OPTION_DICT = {};
  var ATTR = "data-attr";
  var I18N = "data-i18n";
  var LB = "[";
  var RB = "]";
  var VOLT = "volt_jio";
  var DOCUMENT = window.document;
  var FALLBACK_PATH = "https://raw.githubusercontent.com/VoltEuropa/VoltWeb/master/lang/";
  var FALLBACK_LANGUAGE = "en";
  //var NAME = "name";

  /////////////////////////////
  // methods
  /////////////////////////////
  function getLang(nav) {
    return (nav.languages ? nav.languages[0] : (nav.language || nav.userLanguage));
  }

  // this could be passed in default option-dict
  function getConfig(my_language) {
    return {
      "type": "volt_storage",
      "repo": "VoltWeb",
      "path": "lang/" + my_language
      //"__debug": "https://softinst103163.host.vifib.net/site/lang/" + my_language + "/debug.json"
    };
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

  function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
  }

  rJS(window)

    /////////////////////////////
    // state
    /////////////////////////////
    .setState({
      "locale": getLang(window.navigator).substring(0, 2) || "en"
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {

      // yaya, should be localstorage caling repair to sync
      gadget.property_dict = {
        "url_dict": {},
        "content_dict": {},
        "ui_dict": {}
      };

      return gadget.declareGadget("gadget_jio.html", {
        "scope": "volt_jio"
      });
    })

    /////////////////////////////
    // published methods
    /////////////////////////////

    // poor man's i18n translations
    .allowPublicAcquisition("remoteTranslate", function (my_payload) {
      return this.translateDom(my_payload);
    })

    /////////////////////////////
    // declared methods
    /////////////////////////////
    .declareMethod("translateDom", function (my_payload) {
      var dictionary = my_payload[0];
      var dom = my_payload[1];

      if (dom && !isString(dom)) {

        // translate texts
        dom.querySelectorAll(LB + I18N + RB).forEach(function (el) {
          el.textContent = dictionary[el.getAttribute(I18N)];
        });

        // set attributes
        dom.querySelectorAll(LB + ATTR + RB).forEach(function (el) {
          var attr_list = el.getAttribute(ATTR).split(";");
          attr_list.forEach(function (attr_value_pair) {
            var attr_pair = attr_value_pair.split(":");
            el.setAttribute(attr_pair[0], attr_pair[1]);
          });
        });
      }
    })

    // ---------------------- JIO bridge ---------------------------------------
    // this is the JIO storage connectiong to the backend for content, in this
    // case we fetch everything from Github, but it might be plucked to any
    // other backend, implementing the same methods below
    .declareMethod("route", function (my_scope, my_call, my_p1, my_p2, my_p3) {
      var gadget = this;
      return gadget.getDeclaredGadget(my_scope)
      .push(function (my_gadget) {
        return my_gadget[my_call](my_p1, my_p2, my_p3);
      });
    })

    // (re-)initialise storage
    .declareMethod("volt_create", function (my_option_dict) {
      return this.route(VOLT, "createJIO", my_option_dict);
    })

    // get content of a specific page/template
    .declareMethod("volt_get", function (my_id) {
      return this.route(VOLT, "get", my_id);
    })

    // get a dictionary of all available pages on the storage in a specific 
    // folder and language
    // NOTE: in theory this would allow customising the whole site, eg making
    // the footer/header menus dependent on the pages listed
    .declareMethod("volt_allDocs", function () {
      return this.route(VOLT, "allDocs");
    })

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      var locale = gadget.state.locale;

      return new RSVP.Queue()
        .push(function () {
          return gadget.volt_create(getConfig(locale));
        })
        .push(function (gadget_list) {
          return gadget.buildContentLookupDict();
        })
        .push(function () {
          return RSVP.all([
            gadget.getDeclaredGadget("header"),
            gadget.getDeclaredGadget("footer"),
            gadget.fetchTranslationAndUpdateDom(locale)
          ]);
        })
        .push(function (gadget_list) {
          my_option_dict.ui_dict = dict.ui_dict;
          return RSVP.all([
            gadget_list[0].render(my_option_dict),
            gadget_list[1].render(my_option_dict)
          ]);
        })
        .push(function () {
          window.componentHandler.upgradeDom();
          return;
        });
    })

    // ---------------------- StateChange --------------------------------------
    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      var state = gadget.state;
  
      if (delta.hasOwnProperty("locale")) {
        state.locale = delta.locale;
      }
      if (delta.hasOwnProperty("online")) {
        state.online = delta.online;
        if (state.online) {
          gadget.element.classList.remove("volt-offline");
        } else {
          gadget.element.classList.add("volt-offline");
        }
      }
      return;
    })

    .declareMethod("buildContentLookupDict", function () {
      var gadget = this;
      var dict = gadget.property_dict;

      return gadget.volt_allDocs()
        .push(function (my_file_list) {
          if (my_file_list.data.total_rows === 0) {
            return gadget.updateStorage(FALLBACK_LANGUAGE);
          }
          my_file_list.data.rows.map(function (row) {
            dict.url_dict[row.id.split("/").pop().replace(".json", "")] = row.id;
          });
        })

        // we only need a language to build the dict, so in case of errors like
        // on OS X/Safari 9, which cannot handle Github APIv3 redirect, we just
        // build the thing by hand... and fail somewhere else
        .push(undefined, function(whatever) {
          // var i;
          //for (i = 1; i < 32; i += 1) {
          //  dict.url_dict[i] = FALLBACK + gadget.state.locale + "/" + i + ".json";
          //}
          dict.url_dict["ui"] = FALLBACK_PATH + gadget.state.locale + "/ui.json";

          // jump back into the promise success chain
          return;
        });
    })

    .declareMethod("fetchTranslationAndUpdateDom", function (my_language) {
      var gadget = this;
      var dict = gadget.property_dict;
      var url_dict = dict.url_dict;
      return new RSVP.Queue()
        .push(function () {
          return gadget.volt_get(url_dict.ui);
        })
        .push(function (data) {
          dict.ui_dict = data;
          return gadget.translateDom(data);
        });
    })

    .declareMethod("updateStorage", function (my_language) {
      var gadget = this;
      if (my_language === gadget.state.locale) {
        return;
      }
      return new RSVP.Queue()
        .push(function () {
          return gadget.stateChange({"locale": my_language});
        })
        .push(function () {
          return gadget.volt_create(getConfig(my_language));
        })
        .push(function () {
          return gadget.buildContentLookupDict();
        })
        .push(function () {
          return gadget.fetchTranslationAndUpdateDom();
        });
    })
    
    /////////////////////////////
    // declared service
    /////////////////////////////

    // start/entry point, initial render call and global error handler
    .declareService(function () {
      var gadget = this;

      return new RSVP.Queue()
        .push(function () {
          return gadget.render(OPTION_DICT);
        })
        .push(null, function (my_error) {
          throw my_error;

          // fail here
          var fragment = DOCUMENT.createDocumentFragment();
          var p = DOCUMENT.createElement("p");
          var br = DOCUMENT.createElement("br");
          var a = DOCUMENT.createElement("a");
          var body = DOCUMENT.getElementsByTagName('body')[0];
          p.classList.add("volt-error");
          p.textContent = "Sorry, we either messed up or your browser does not seem to support this application :( ";
          a.classList.add("volt-error-link");
          a.textContent = "www.voltfrance.org";
          a.setAttribute("href", "https://www.voltfrance.org/");
          fragment.appendChild(p);
          fragment.appendChild(br);
          fragment.appendChild(a);

          while (body.firstChild) {
            body.removeChild(body.firstChild);
          }
          body.appendChild(fragment);
        });
    })

    ;

}(window, rJS, RSVP));