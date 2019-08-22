/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP, JSON, Object, Blob, CONFIG */
(function (window, rJS, RSVP, JSON, Object, Blob, CONFIG) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var DICT = {};
  var ARR = [];
  var ATTR = "data-attr";
  var I18N = "data-i18n";
  var LB = "[";
  var RB = "]";
  var HREF = "href";
  var STR = "";
  var MAIN = "volt-layout__content";
  var DATA = "data";
  var LOCAL ="local";
  var UI = "ui";
  var SETTINGS = "settings";
  var DOCUMENT = window.document;
  var LOCATION = DOCUMENT.location;
  var FALLBACK_PATH = "https://raw.githubusercontent.com/VoltEuropa/VoltWeb/master/ui/";
  var DOC = "/";
  var ESC = "Esc";
  var ESCAPE = "Escape";
  var EXPIRE_DB = "volt:expire_db";
  var VOLT_KEY = "volt:";
  var GADGET_ATTR = "[data-gadget-url]";
  var SCOPE = "data-gadget-scope";

  /////////////////////////////
  // methods
  /////////////////////////////

  function setCookie (name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + 24*60*60*1000*days);
    DOCUMENT.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
  }

  function getCookie(name) {
    var v = DOCUMENT.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
  }

  // ios OS9 doesn't support github api v3 redirects, create response by hand
  function getFallbackDict (my_language) {
    return {"data": {
      "rows": [
        {"id": FALLBACK_PATH + my_language + "/names.json", "value": DICT},
        {"id": FALLBACK_PATH + my_language + "/ui.json", "value": DICT},
        {"id": FALLBACK_PATH + my_language + "/markers.json", "value": DICT}
      ],
      "total_rows": 3
    }};
  }

  // this could be passed in CONFIG to connect to the actual endpoint
  function getConfigDict(my_path) {
    return {
      "type": "github_storage",
      "user": "VoltEuropa",
      "repo": "VoltWeb",
      "path": my_path
    };
  }

  function getParent(my_element, my_class) {
    if (my_element && my_element.classList.contains(my_class)) {
      return my_element;
    }
    if (my_element.parentElement) {
      return getParent(my_element.parentElement, my_class);
    }
    return null;
  }

  function getTarget(my_dict, my_path) {
    var key;
    if (my_path) {
      for (key in my_dict) {
        if (my_dict[key] === my_path) {
          return key;
        }
      }
    }
  }

  function getTimeStamp() {
    return new window.Date().getTime();
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

      // the default language to display
      "default_language": null,

       // the language the user picked
      "selected_language": null,

      // the location the site is set to, must be passed by CONFIG
      "scope": null
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.property_dict = {
        "ui_dict": {},
        "content_wrapper": getElem(gadget.element, ".volt-layout__content")
      };
      return RSVP.all([
        gadget.declareGadget("../../../../component/gadget_volt_jio.html", {"scope": "local"}),
        gadget.declareGadget("../../../../component/gadget_volt_jio.html", {"scope": "ui"}),
        gadget.declareGadget("../../../../component/gadget_volt_jio.html", {"scope": "data"}),
        gadget.declareGadget("../../../../component/gadget_volt_jio.html", {"scope": "settings"})
      ]);
    })

    /////////////////////////////
    // published methods
    /////////////////////////////

    // poor man's i18n translations
    .allowPublicAcquisition("remoteTranslate", function (my_payload) {
      return this.translateDom(my_payload);
    })

    .allowPublicAcquisition("getSocialMediaSource", function () {
      var gadget = this;
      var dict = gadget.property_dict;
      var scope_list = dict.scope.split("/");
      var city_list;
      switch (scope_list.length) {
        case 1:
          return dict.marker_dict[scope_list[0]];
        case 2:
          return dict.marker_dict[scope_list[1]];
        case 3:
          return dict.marker_dict[scope_list[1]].city_list.filter(function (city) {
            return city.i18n.toLowerCase().indexOf(scope_list[2]) === 0; 
          })[0];
      }
    })

    .allowPublicAcquisition("changeLanguage", function (my_event) {
      return this.resetApplication(my_event);
    })

    .allowPublicAcquisition("buildDataLookupDict", function (my_option_dict) {
      var gadget = this;
      var scope = gadget.state.scope.replace(/\//g, "-");
      var reply = {"data": {"rows": [], "total_rows": undefined}};
      var config = my_option_dict ? my_option_dict[0] : {};
      var opts = {};

      opts.limit = config.limit || ARR;
      opts.query = gadget.state.scope + (config.query ? "+" + config.query : STR);

      // since we can't search file contents on indexeddb, we always hit Github
      // which can search file content (rate limit = 10 searches/minute/IP)
      return new RSVP.Queue()
        .push(function () {
          return gadget.data_allDocs(opts);
        })
        .push(function (response) {
          reply.data.total_count = response.data.rows.total_count;
          reply.data.total_rows = response.data.total_rows;

          return RSVP.all(response.data.rows.map(function (dict) {
            var id = dict.id.toLowerCase();
            var portal_type = id.split(scope)[1].split(".")[1];
            return new RSVP.Queue()
              .push(function () {
                return new RSVP.Queue()
                  .push(function () {
                    return gadget.local_get(portal_type);
                  })
                  .push(undefined, function (error) {
                    return gadget.handleError(error, {"404": gadget.local_put(portal_type)});
                  });
              })
              .push(function () {
                return gadget.local_getAttachment(portal_type, dict.id, {"format": "json"});
              })
              .push(undefined, function (error) {
                return gadget.handleError(error, {"404": gadget.data_get(dict.id)});
              })
              .push(function (file) {
                reply.data.rows.push(file);
                return gadget.local_putAttachment(
                  portal_type,
                  dict.id,
                  new Blob([JSON.stringify(file)], {type: "application/json"})
                );
              });
            })
          );
        })
        .push(function () {
          return reply;
        });
    })

    /////////////////////////////
    // declared methods
    /////////////////////////////
    .declareMethod("resetApplication", function (my_payload) {
      var gadget = this;
      var dict = gadget.property_dict;
      var select;
      var selected_language;
      var language;

      // mdl-events still fire multiple times, stateChange is too slow to trap
      if (dict.stop) {
        return;
      }
      dict.stop = true;

      // if language was selected, use it, else fallback to default scope
      if (my_payload) {
        select = my_payload[0].target;
        language = select.options[select.selectedIndex].value;
      } else {
        language = gadget.state.default_language;
      }
      selected_language = gadget.state.selected_language;
      if (selected_language === language) {
        return;
      }

      // update storages with new language data, then load target/index page
      return new RSVP.Queue()
        .push(function () {
          return gadget.resetStorage();
        })
        .push(function () {
          return RSVP.all([
            gadget.setSetting("volt:selected_language", language),
            gadget.updateUiStorage(language)
          ]);
        })
        .push(function () {
          return RSVP.all([
            gadget.getSetting("volt:current_page"),
            gadget.buildUiLookupDict(true)
          ]);
        })
        .push(function (response_list) {
          var target = response_list[0];
          return LOCATION.assign(
            "../" + language + "/" + (target ? dict.ui_dict[target] : STR)
          );
        });
    })
    
    .declareMethod("translateDom", function (my_payload) {
      var state = this.state;
      var dictionary;
      var dom;
      if (state.selected_language === state.default_language) {
        return;
      }
      dictionary = my_payload[0];
      dom = my_payload[1];
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
            el.setAttribute(attr_pair[0], dictionary[attr_pair[1]]);
          });
        });
      }
    })

    .declareMethod("handleError", function (my_err, my_err_dict) {
      var code;
      var err = my_err.target ? JSON.parse(my_err.target.response).error : my_err;

      for (code in my_err_dict) {
        if (my_err_dict.hasOwnProperty(code)) {
          if ((err.status_code + STR) === code) {
            return my_err_dict[code];
          }
        }
      }
      throw err;
    })

    // ------------------------- Settings --------------------------------------
    .declareMethod("getSetting", function (my_key) {
      var gadget = this;
      return gadget.setting_getAttachment(DOC, my_key, {format: "text"})
        .push(function (response) {
          var data = JSON.parse(response);

          // switch to version
          if (my_key === EXPIRE_DB && data[my_key] !== gadget.property_dict.version) {
            return new RSVP.Queue()
              .push(function () {
                return gadget.setting_allAttachments(DOC);
              })
              .push(function (attachment_dict) {
                return RSVP.all(Object.keys(attachment_dict)
                  .filter(function (key) {
                    return key.indexOf(VOLT_KEY) === 0;  
                  })
                  .map(function (key) {
                    return gadget.setting_removeAttachment(DOC, key);
                  })
                );
              })
              .push(function () {
                return gadget.resetApplication();
              });
          }
          return data[my_key];
        })

        // if a setting doesn't exist, no need to update, just return undefined
        .push(undefined, function (my_error) {
          return gadget.handleError(my_error, {"404": undefined});
        });
    })

    .declareMethod("setSetting", function (my_setting, my_value) {
      var payload = {"timestamp": getTimeStamp()};
      payload[my_setting] = my_value;
      return this.setting_putAttachment(DOC, my_setting, new Blob([
        JSON.stringify(payload)
      ], {type: "text/plain"}));
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

    .declareMethod("data_create", function (my_option_dict) {
      return this.route(DATA, "createJIO", my_option_dict);
    })
    .declareMethod("data_get", function (my_id) {
      return this.route(DATA, "get", my_id);
    })
    .declareMethod("data_allDocs", function (my_options) {
      return this.route(DATA, "allDocs", my_options);
    })

    .declareMethod("ui_create", function (my_option_dict) {
      return this.route(UI, "createJIO", my_option_dict);
    })
    .declareMethod("ui_get", function (my_id) {
      return this.route(UI, "get", my_id);
    })
    .declareMethod("ui_allDocs", function (my_options) {
      return this.route(UI, "allDocs", my_options);
    })

    .declareMethod("local_create", function (my_option_dict) {
      return this.route(LOCAL, "createJIO", my_option_dict);
    })
    .declareMethod("local_get", function (my_id) {
      return this.route(LOCAL, "get", my_id);
    })
    .declareMethod("local_put", function (my_id, my_meta_data) {
      return this.route(LOCAL, "put", my_id, my_meta_data);
    })
    .declareMethod("local_remove", function (my_id) {
      return this.route(LOCAL, "remove", my_id);
    })
    .declareMethod("local_putAttachment", function (my_id, my_name, my_blob) {
      return this.route(LOCAL, "putAttachment", my_id, my_name, my_blob);
    })
    .declareMethod("local_getAttachment", function (my_id, my_name, my_dict) {
      return this.route(LOCAL, "getAttachment", my_id, my_name, my_dict);
    })
    .declareMethod("local_removeAttachment", function (my_id, my_name) {
      return this.route(LOCAL, "removeAttachment", my_id, my_name);
    })
    .declareMethod("local_allAttachments", function (my_id) {
      return this.route(LOCAL, "allAttachments", my_id);
    })
    .declareMethod("local_allDocs", function (my_option_dict) {
      return this.route(LOCAL, "allDocs", my_option_dict);
    })

    .declareMethod("setting_create", function (my_option_dict) {
      return this.route(SETTINGS, "createJIO", my_option_dict);
    })
    .declareMethod("setting_getAttachment", function (my_id, my_tag, my_dict) {
      return this.route(SETTINGS, "getAttachment", my_id, my_tag, my_dict);
    })
    .declareMethod("setting_putAttachment", function (my_id, my_tag, my_dict) {
      return this.route(SETTINGS, "putAttachment", my_id, my_tag, my_dict);
    })
    .declareMethod("setting_removeAttachment", function (my_id, my_tag) {
      return this.route(SETTINGS, "removeAttachment", my_id, my_tag);
    })
    .declareMethod("setting_allAttachments", function (my_id) {
      return this.route(SETTINGS, "allAttachments", my_id);
    })

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      var selected_language = gadget.state.selected_language;
      mergeDict(dict, my_option_dict);

      return new RSVP.Queue()
        .push(function () {
          return RSVP.all([
            gadget.stateChange({
              "default_language": dict.default_language,
              "scope": my_option_dict.scope
            }),
            gadget.setting_create({"type": "local", "sessiononly": false}),
            gadget.local_create({"type": "indexeddb", "database": "volt"}),
            gadget.data_create(getConfigDict("data"))
          ]);
        })

        // we have to wait until here to determine whether to force re-load
        .push(function () {
          return gadget.getSetting(EXPIRE_DB);
        })

        // we continue
        .push(function () {
          return gadget.getSetting("volt:selected_language");
        })
        .push(function (my_language) {
          var language = my_language || dict.default_language;

          // set parameters to pass them on to child gadgets
          dict.default_language = gadget.state.default_language;
          dict.selected_language = language;

          return RSVP.all([
            gadget.stateChange({"selected_language": language}),
            gadget.setSetting("volt:selected_language", language),
            gadget.setSetting("volt:expire_db", dict.version),
            gadget.ui_create(getConfigDict("ui/" + language))
          ]);
        })

        // get translations and data lookup dicts
        .push(function () {
          return gadget.buildUiLookupDict();
        })

        .push(function () {
          return RSVP.Queue()
            .push(function () {
              return RSVP.all([
                gadget.getDeclaredGadget("header"),
                gadget.getDeclaredGadget("footer"),
              ]);
            })
            .push(function (response_list) {
              var content_gadget_list = dict.content_wrapper.querySelectorAll(GADGET_ATTR);

              // load all gadgets in the main section (if any)
              return new RSVP.Queue()
                .push(function () {
                  return RSVP.all(
                    [].slice.call(content_gadget_list).map(function (el) {
                      return gadget.getDeclaredGadget(el.getAttribute(SCOPE));
                    })
                  );
                })
                .push(function (gadget_list) {
                  return response_list.concat(gadget_list);
                });
            });
        })

        // render everything, upgrade/translate DOM and keep reference to
        // the page we are on
        .push(function (gadget_list) {
          return RSVP.all(gadget_list.map(function (gadget) {
            return gadget.render(dict);
          }));
        })
        .push(function () {
          DOCUMENT.body.classList.remove("volt-splash");
          window.componentHandler.upgradeDom();
          return gadget.translateDom([dict.ui_dict, dict.content_wrapper]);
        })
        .push(function () {
          return gadget.setSetting(
            "volt:current_page",
            getTarget(dict.ui_dict, LOCATION.href.split("/").pop())
          );
        });
    })

    // ---------------------- StateChange --------------------------------------
    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      var state = gadget.state;
      if (delta.hasOwnProperty("selected_language")) {
        state.selected_language = delta.selected_language;
      }
      if (delta.hasOwnProperty("default_language")) {
        state.default_language = delta.default_language;
      }
      if (delta.hasOwnProperty("scope")) {
        state.scope = delta.scope;
      }
      return;
    })

    // ---------------------- Data Handlers --------------------------------------
    .declareMethod("getRemoteDataUrlIndex", function () {
      var gadget = this;
      return new RSVP.Queue()
        .push(function () {
          return gadget.ui_allDocs();
        })

        // we only need language to build the dict, so in case of errors on
        // OS X/Safari 9, which cannot handle Github APIv3 redirect, we just
        // build the thing by hand.
        .push(undefined, function (whatever) {
          return getFallbackDict(gadget.state.selected_language);
        })
        .push(function (response) {

          // call passed but set language (eg XX) does not exist, use default
          if (response.total_rows === 0) {
            return gadget.updateUiStorage(dict.default_language)
              .push(function () {
                return RSVP.all([
                  gadget.ui_allDocs(),
                  gadget.setSetting("volt:selected_language", dict.default_language),
                  gadget.stateChange({"selected_language": dict.default_language})
                ]);
              })
              .push(function (response_list) {
                return response_list[0];
              });
          }
          return response;
        })

        // store records in indexeddb to avoid roundtrip to github
        .push(function (response) {
          return new RSVP.Queue()
            .push(function () {
              return RSVP.all(
                response.data.rows.map(function (row) {
                  return gadget.local_put(row.id, DICT);  
                })
              );
            })
            .push(function () {
              return response;
            });
        });
    })

    .declareMethod("getRemoteData", function (my_id) {
      var gadget = this;
      return gadget.ui_get(my_id)
        .push(function (data) {
          return gadget.local_putAttachment(my_id, "data",
            new Blob([JSON.stringify(data)], {type: "application/json"})
          )
          .push(function () {
            return {"id": my_id, "data": data};
          });
        });
    })

    .declareMethod("buildUiLookupDict", function (my_purge) {
      var gadget = this;
      var queue = new RSVP.Queue();

      // indexeddb first, if not available/change language = purge), ask remote
      if (my_purge === undefined) {
        queue.push(function () {
          return gadget.local_allDocs();
        });
      }

      return queue
        .push(function (response) {
          if (response && response.total_rows > 0) {
            return response;
          }
          return gadget.getRemoteDataUrlIndex();
        })

        //this response will not be empty (from indexeddb or github or fallback)
        .push(function (document_dict) {
          return new RSVP.Queue()
            .push(function () {
              return RSVP.all(document_dict.data.rows.map(function (row) {
                return gadget.local_getAttachment(row.id, "data", {"format": "json"})
                  .push(undefined, function (my_error) {
                    return gadget.handleError(my_error, {"404": undefined});
                  })
                  .push(function (response) {
                    if (response) {
                      return {"id": row.id, "data": response};
                    }
                    return gadget.getRemoteData(row.id);
                  });
                })
              );
            })
            .push(function (response_list) {
              var merge_dict = {};
              response_list.forEach(function (dict) {
                if (dict.id.indexOf("marker") > -1) {
                  gadget.property_dict.marker_dict = dict.data;
                } else {
                  merge_dict = mergeDict(merge_dict, dict.data);
                }
              });

              // for now tack ui_dict on props to pass to child gadgets
              gadget.property_dict.ui_dict = merge_dict;
            });
        });
    })

    // wipe indexeddb
    .declareMethod("resetStorage", function () {
      var gadget = this;
      return new RSVP.Queue()
        .push(function () {
          return gadget.local_allDocs();
        })
        .push(function (document_list) {
          return RSVP.all(
            document_list.data.rows.map(function (row) {
              return gadget.local_allAttachments(row.id)
                .push(function (attachment_dict) {
                  return RSVP.all(
                    Object.keys(attachment_dict).map(function (key) {
                      return gadget.local_removeAttachment(row.id, key);
                    })
                  );
                })
                .push(function () {
                  return gadget.local_remove(row.id);
                });
            })
          );
        });
    })

    .declareMethod("updateUiStorage", function (my_language) {
      var gadget = this;
      if (my_language === gadget.state.selected_language) {
        return;
      }
      return new RSVP.Queue()
        .push(function () {
          return gadget.stateChange({"selected_language": my_language});
        })
        .push(function () {
          return gadget.ui_create(getConfigDict("ui/" + my_language));
        });
    })

    .declareMethod("hideMenu", function () {
      return this.getDeclaredGadget("header")
        .push(function (my_header_gadget) {
          return my_header_gadget.swapMenuClass();
        });
    })
    
    /////////////////////////////
    // declared service
    /////////////////////////////

    // start/entry point, initial render call and global error handler
    .declareService(function () {
      var gadget = this;

      if (getCookie("init") === null) {
        setCookie("init", 1, 1);
      }

      return new RSVP.Queue()
        .push(function () {
          return gadget.render(CONFIG);
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

    /////////////////////////////
    // event bindings
    /////////////////////////////
    .onEvent("keydown", function (event) {
      if (event.key === ESCAPE || event.key === ESC) {
        return this.hideMenu();
      }
    }, false, false)

    .onEvent("click", function (event) {
      if (getParent(event.target, MAIN)) {
        return this.hideMenu();
      }
    }, false, false);

}(window, rJS, RSVP, JSON, Object, Blob, CONFIG));
