/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP, Math, Date, ics, saveAs, Object, isNaN, navigator */
(function (window, rJS, RSVP, Math, Date, ics, saveAs, Object, isNaN, navigator) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var ARR = [];
  var DICT = {};
  var NAME ="name";
  var KLASS = rJS(window);
  var UNDERSCORE = "_";
  var SPACER = "&nbsp;-&nbsp;";
  var CANVAS = "canvas";
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;
  var DOCUMENT = window.document;
  var MEETING = "Meeting";
  var PUBLICATION = "Publication";
  var PROPOSAL = "Proposal";
  var LOCATION = window.location;
  var MINI = "volt-event__card-mini";
  var MEETING_ACTION = "event_card_template_meeting_action";
  var PROPOSAL_URL = "event_card_template_proposal_url";
  var MEETING_URL = "event_card_template_meeting_url";
  var PUBLICATION_ACTION = "event_card_template_publication_action"; 
  var PUBLICATION_URL = "event_card_template_publication_url";
  var IMG_TEMPLATE = "event_card_template_image";
  var CARD_TEMPLATE = "event_card_template";
  var IMG_FALLBACK_TEMPLATE = "event_card_template_fallback";
  var MEETING_DIALOG = "event_dialog_meeting_template";
  var PROPOSAL_DIALOG = "event_dialog_proposal_template";
  var REFERENCE_TEMPLATE = "event_dialog_reference_template";
  var KEYWORD_TEMPLATE = "event_dialog_keyword_template";
  var CATEGORY_SEARCH_TEMPLATE = "event_keyword_search_template";
  var DESCRIPTION = "description";
  var LINE_BREAK = "\n";
  var LINK_DISABLED = "volt-link__disabled";
  var DOT = ".";
  var DOTDOT = ":";
  var LOCALISE = ".volt-dialog__action-localise";
  var DATE = "[object Date]";
  var IMG = "IMG";
  var HIDDEN = "volt-hidden";
  var FULLSCREEN = "volt-dialog-fullscreen";
  var LAZY = "volt-lazy";
  var BLANK = "_blank";
  var POPPER = "width=600,height=480,resizable=yes,scrollbars=yes,status=yes";
  var STR = "";
  var PLUS = "+";
  var ZERO = "0";
  var INTERSECTION_OBSERVER = window.IntersectionObserver;
  var FALLBACK_IMG_URL = "../../../../img/volt.purple.min.png";
  var SOCIAL_MEDIA_CONFIG = {
    "facebook": "https://www.facebook.com/sharer.php?u={url}",
    "twitter": "https://twitter.com/intent/tweet?url={url}&text={text}&hashtags={tag_list}"
  };
  var MAP_CONFIG = {
    "map_id": "venue",
    "zoom": 18
  };

  /////////////////////////////
  // methods
  /////////////////////////////
  function pad(n) {
    return n < 10 ? ZERO + n : STR + n;
  }

  function setTime(d) {
    return [pad(d.getHours()), pad(d.getMinutes())].join(DOTDOT);
  }

  function setDate(d) {
    return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join(DOT);
  }

  function setDatetimeStamp(my_date, my_flag_add_time) {
    return setDate(my_date) + (my_flag_add_time ? "," + setTime(my_date) : STR);
  }

  function valiDate(my_date, my_time) {
    return (Object.prototype.toString.call(my_date) === "[object Date]" &&
      !isNaN(my_date.getTime()) &&
        setDatetimeStamp(my_date, my_time)
    ) || STR;
  }

  function setBound(my_date_array, my_time) {
    return my_date_array.map(function (date) {
      return valiDate(new Date(date), my_time);
    }).filter(function (timestamp) {
      return timestamp !== STR;
    }).join(" - ");
  }

  function getAddress(my_location, my_separator) {
    return [
      my_location.title,
      my_location.physical_address,
      my_location.zip + " " + my_location.city,
      my_location.country
    ].join(my_separator || LINE_BREAK);
  }

  function setActionList(my_item, my_language) {
    if (my_item.event_type === MEETING) {
      return getTemplate(KLASS, MEETING_ACTION).supplant({
        "reference": my_item.reference,
        "subject": my_item.content_dict[my_language].title,
        "description": my_item.content_dict[my_language].description,
        "start_date": my_item.start_date,
        "stop_date": my_item.stop_date,
        "location": getAddress(my_item["location"])
      });
    }


    if (my_item.event_type === PROPOSAL) {
      return STR;
    }

    // this covers all other types of document
    return getTemplate(KLASS, PUBLICATION_ACTION).supplant({
      "description": my_item.content_dict[my_language].description,
      "url": getAbsolutePath(my_item.attachment_dict.document_dict[my_language].document_url)
    });
  }

  function setCallToAction(my_item, my_language) {
    var url;
    if (my_item.event_type === MEETING) {
      return getTemplate(KLASS, MEETING_URL).supplant({
        "reference": my_item.reference
      });
    }
    if (my_item.event_type === PROPOSAL) {
      return getTemplate(KLASS, MEETING_URL).supplant({
        "reference": my_item.reference
      });
    }
    url = my_item.attachment_dict.document_dict[my_language].document_url;
    return getTemplate(KLASS, PUBLICATION_URL).supplant({
      "document_url": url || STR,
      "disabled": url ? STR : LINK_DISABLED
    });
  }

  function getAbsolutePath(my_url) {
    var link = DOCUMENT.createElement("a");
    link.href = my_url;
    return link.href;
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

  function paginate(my_opts) {
    var limit = my_opts.limit;
    var delta;
    if (limit && limit.length > 0) {
      delta = limit[1] - limit[0] + 1;
      my_opts.limit = [(limit[0] + delta), (limit[1] + delta)];
    }
    return my_opts;
  }

  function observeImage(my_dict, my_image_list) {
    if (!my_dict.observer) {
      return;
    }
    my_image_list.forEach(function (image) {
      my_dict.observer.observe(image);
    });
  }

  function loadImage(entries, observer) {
    entries.forEach(function (entry) {
      var img = entry.target;
      if (img.classList.contains(LAZY)) {
        img.setAttribute("src", img.getAttribute("data-src"));
        img.classList.remove(LAZY);
        observer.unobserve(img);
      }
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
    // state
    /////////////////////////////
    .setState({
      "dialog_pending": null,
      "grid": null,
      "current_position": null
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      var el = gadget.element;
      gadget.property_dict = {
        "keyword_container": getElem(el, ".volt-category__container"),
        "item_container": getElem(el, ".volt-item__container"),
        "dialog": getElem(el, ".volt-dialog-event"),
        "loader": getElem(el, ".dot-flashing"),
        "paginate": getElem(el, ".volt-search-more"),
        "nill": getElem(el, ".volt-grid__no-records"),

        // lazy, fetch from indexeddb
        "event_dict": {}
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
    // to keep map gadget generic, content specific parameters are set here
    .allowPublicAcquisition("setMarkerContent", function (my_payload) {
      var gadget = this;
      var dict = gadget.property_dict;
      var response = {};

      response.zoom = 15;
      response.position = gadget.state.current_position;
      response.entry_list = [{
        "position": gadget.state.current_position,
        "content": ""
      }];
      return response;
    })

    // not used
    .allowPublicAcquisition("updateMapState", function (my_payload) {
      return;
    })

    /////////////////////////////
    // declared methods
    /////////////////////////////
    .declareMethod("handleFailedImageError", function (my_image) {
      my_image.classList.add(LAZY);
      my_image.src = FALLBACK_IMG_URL;
    })

    // thx: https://css-tricks.com/simple-social-sharing-links/
    // twitter prevalidate url: https://cards-dev.twitter.com/validator
    // https://developers.facebook.com/docs/sharing/best-practices/
    .declareMethod("shareUrl", function (my_gafa, my_target) {
      var popup;
      var is_mobile = window.matchMedia("only screen and (max-width: 48em)");
      var popup_resolver;

      // lots of bells and whistles for trying to stay on the page, use this
      // with localstorage is we want to keep state or login on social media
      var resolver = new Promise(function (resolve, reject) {
        popup_resolver = function resolver(href) {
          return resolve({});
        };
      });
      popup = window.open(
        SOCIAL_MEDIA_CONFIG[my_gafa].supplant({
          "url": window.encodeURIComponent(my_target.share_url.value),
          "text": my_target.share_description.value,
          "tag_list": ""
        }),
        is_mobile.matches ? BLANK : STR,
        is_mobile.matches ? null : POPPER
      );
      popup.opener.popup_resolver = popup_resolver;
      return window.promiseEventListener(popup, "load", true);
    })

    .declareMethod("createIcsFile", function (my_target) {
      var cal = ics();
      cal.addEvent(
        my_target.calendar_subject.value,
        my_target.calendar_description.value,
        my_target.calendar_location.value,
        my_target.calendar_begin.value,
        my_target.calendar_end.value
      );
      return cal.download(my_target.calendar_reference.value);
    })

    .declareMethod("updateSearchResults", function (my_config, my_purge) {
      var gadget = this;
      var dict = gadget.property_dict;
      var lang = dict.selected_language;
      var config = my_config || paginate(dict.grid_config);
      var keyword_list;

      dict.loader.classList.remove(HIDDEN);
      return gadget.buildDataLookupDict(config)
        .push(function (response) {
          dict.loader.classList.add(HIDDEN);
          setDom(
            dict.item_container,
            response.data.rows.sort(function (a, b) {
              return new Date(b.release_date) - new Date(a.release_date); 
            }).map(function (item) {
              var portal_type = item.event_type.toLowerCase();
              var no_date = item.event_type === PROPOSAL;
              var title = item.content_dict[lang].title;
              var image = getTemplate(KLASS, item.thumb_url ? IMG_TEMPLATE : IMG_FALLBACK_TEMPLATE)
                .supplant({
                  "title": title,
                  "img_url": item.thumb_url,
                  "fallback_url": FALLBACK_IMG_URL
                });
              if (portal_type === PROPOSAL.toLowerCase()) {
                setDom(
                  dict.keyword_container,
                  getTemplate(KLASS, CATEGORY_SEARCH_TEMPLATE),
                  true)
                ;
              }
              dict.event_dict[item.reference] = item;
              return getTemplate(KLASS, CARD_TEMPLATE).supplant({
                "title": title,
                "mini": portal_type === PROPOSAL.toLowerCase() ? MINI : STR,
                "reference": item.reference,
                "portal_type": portal_type,
                "event_handler": "volt-event__" + portal_type, 
                "image": image,
                "description": item.content_dict[lang][DESCRIPTION],
                "start_date": no_date ? STR : (setDate(new Date(item.start_date || item.release_date)) + SPACER),
                "event_action_list": setActionList(item, lang),
                "call_to_action": setCallToAction(item, lang)
              });
            }), my_purge
          );
          if (config.limit[1] >= response.data.total_count) {
            dict.paginate.classList.add(HIDDEN);
          } else {
            dict.paginate.classList.remove(HIDDEN);
          }
          if (response.data.total_rows === 0) {
            dict.nill.classList.remove(HIDDEN);
          } else {
            dict.nill.classList.add(HIDDEN);
          }
          observeImage(dict, dict.item_container.querySelectorAll("img"));
          return RSVP.all([
            gadget.remoteTranslate(dict.ui_dict, gadget.element),
            gadget.changeState({"grid": config})
          ]);
        });
    })

    // -------------------------- Dialogs --------------------------------------
    .declareMethod("openDialog", function (my_target) {
      var gadget = this;
      var dict;
      var dialog;
      var item;

      if (gadget.state.dialog_pending) {
        return;
      }

      dict = gadget.property_dict;
      dialog = dict.dialog;
      item = dict.event_dict[my_target.event_reference.value];

      if (!dialog.showModal) {
        DIALOG_POLYFILL.registerDialog(dialog);
      }
      if (item.event_type === PROPOSAL) {
        return gadget.getProposalDialogContent(item);
      }
      if (item.event_type === MEETING) {
        return gadget.getMeetupDialogContent(item);
      }
      return;
    })

    .declareMethod("getProposalDialogContent", function (my_proposal) {
      var gadget = this;
      var dict = gadget.property_dict;
      var dialog = dict.dialog;
      return gadget.stateChange({"dialog_pending": true})
        .push(function () {
          var lang = dict.selected_language;
          var content = my_proposal.content_dict[lang];
          var keyword_list = my_proposal.keyword_dict[lang];
          setDom(dialog, getTemplate(KLASS, PROPOSAL_DIALOG).supplant({
            "title": content.title,
            "img_url": my_proposal.img_url,
            "fallback_url": FALLBACK_IMG_URL,
            "description": content["description"],
            "text_content": content.text_content,
            "keyword_list": keyword_list.map(function (word) {
              return getTemplate(KLASS, KEYWORD_TEMPLATE).supplant({
                "search_term": word,
                "display_text": word.split(UNDERSCORE)[0]
              });
            }).join(STR),
            "reference_list": my_proposal.reference_list.map(function (ref) {
              return getTemplate(KLASS, REFERENCE_TEMPLATE).supplant({
                "reference_url": ref.url,
                "reference_title": ref.title,
                "language": ref.i18n
              });
            }).join(STR)
          }), true);
          dialog.showModal();
          observeImage(dict, dialog.querySelectorAll(".volt-lazy"));
          window.componentHandler.upgradeElements(dialog);
        });
    })

    .declareMethod("getMeetupDialogContent", function (my_meetup) {
      var gadget = this;
      var dict = gadget.property_dict;
      var dialog = dict.dialog;
      return gadget.stateChange({
        "dialog_pending": true,
        "current_position": my_meetup.location.coordinates
      })
        .push(function () {
          var lang = dict.selected_language;
          var content = my_meetup.content_dict[lang];
          var start = new Date(my_meetup.start_date);
          var venue = my_meetup["location"];
          var links = my_meetup.attachment_dict.social_media_url_dict || DICT;

          setDom(dialog, getTemplate(KLASS, MEETING_DIALOG).supplant({
            "title": content.title,
            "img_url": my_meetup.img_url,
            "fallback_url": FALLBACK_IMG_URL,
            "description": content.text_content,
            "datetime": setBound([my_meetup.start_date, my_meetup.stop_date], true),
            "location": venue ? getAddress(venue, ", ") : STR,
            "facebook_url": links.facebook_url || STR,
            "facebook_disabled": links.facebook_url || LINK_DISABLED, 
            "meetup_url": links.meetup_url || STR,
            "meetup_disabled": links.meetup_url || LINK_DISABLED,
            "evensi_url": links.evensi_url || STR,
            "evensi_disabled": links.evensi_url || LINK_DISABLED,
            "add_to_calendar": setActionList(my_meetup, lang)
          }), true);
          dialog.showModal();
          observeImage(dict, dialog.querySelectorAll(".volt-lazy"));
          window.componentHandler.upgradeElements(dialog);
          if (navigator.geolocation) {
            getElem(dialog, LOCALISE).classList.remove(LINK_DISABLED);
          }
          if (dict.map_gadget === undefined) {
            return gadget.declareGadget("gadget_map.html", {
              "scope": "meetup",
              "element": getElem(gadget.element, ".volt-venue__wrapper")
            });
          }
          return dict.map_gadget;
        })
        .push(function (map_gadget) {
          return map_gadget.render({"config": MAP_CONFIG})
            .push(function () {
              return map_gadget.renderMap("just do it !!!");
            });
        });
    })

    .declareMethod("localiseVenue", function (my_event) {
      var gadget = this;
      return gadget.getDeclaredGadget("")
        .push(function (my_gadget) {
          return my_gadget.localiseUser();
        });
    })

    .declareMethod("buildSearch", function (my_target) {
      var gadget = this;
      var dict = gadget.property_dict;
      var search = my_target.category_reference.value;
      dict.grid_config.query =  dict.grid_config.query.split(PLUS)[0] + (search ? (PLUS + search) : STR);
      return RSVP.all([
        gadget.updateSearchResults(dict.grid_config, true),
        gadget.changeState({"grid": dict.grid_config})
      ]);

    })

    .declareMethod("expandDialog", function (my_event, my_fullscreen) {
      var gadget = this;
      var el = gadget.element;
      var dict = gadget.property_dict;
      var full = getElem(el, ".volt-dialog__action-full");
      var exit = getElem(el, ".volt-dialog__action-exit");
      
      if (my_fullscreen) {
        dict.dialog.classList.add(FULLSCREEN);
        full.classList.add(HIDDEN);
        exit.classList.remove(HIDDEN);
      } else {
        dict.dialog.classList.remove(FULLSCREEN);
        full.classList.remove(HIDDEN);
        exit.classList.add(HIDDEN);
      }
      return gadget.getDeclaredGadget("event")
        .push(function (my_declared_gadget) {
          return my_declared_gadget.redrawMap();
        })
        .push(undefined, function (error) {
          if (error.name === "scopeerror") {
            return;
          }
          throw error;
        });
    })

    .declareMethod("localiseUser", function (my_event) {
      var gadget = this;
      return gadget.getDeclaredGadget("map")
        .push(function (my_gadget) {
          return my_gadget.localiseUser();
        });
    })


    // ---------------------- StateChange --------------------------------------
    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      var state = gadget.state;
      if (delta.hasOwnProperty("dialog_pending")) {
        state.dialog_pending = delta.dialog_pening;
      }
      if (delta.hasOwnProperty("grid")) {
        state.grid = delta.grid;
      }
      if (delta.hasOwnProperty("current_position")) {
        state.current_position = delta.current_position;
      }
      return;
    })


    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      mergeDict(dict, my_option_dict);
      if (INTERSECTION_OBSERVER !== undefined) {
        dict.observer = new INTERSECTION_OBSERVER(loadImage, {"threshold": 0.5});
      }
      return RSVP.all([
        gadget.updateSearchResults(dict.grid_config),
        gadget.changeState({"grid": dict.grid_config})
      ]);
    })

    /////////////////////////////
    // declared service
    /////////////////////////////

    /////////////////////////////
    // declared jobs
    /////////////////////////////
    .declareJob("closeDialog", function () {
      var gadget = this;
      var dict = gadget.property_dict;
      var dialog = dict.dialog;
      dialog.close();
      return gadget.stateChange({"dialog_pending": null});
    })

    /////////////////////////////
    // event bindings
    /////////////////////////////    
    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
        case "volt-dialog":
          return this.openDialog(event.target);
        case "volt-dialog-close":
          return this.closeDialog();
        case "volt-share-facebook":
          return this.shareUrl("facebook", event.target);
        case "volt-share-twitter":
          return this.shareUrl("twitter", event.target);
        case "volt-share-calendar":
          return this.createIcsFile(event.target);
        case "volt-search-more":
          return this.updateSearchResults();
        case "volt-fullscreen":
          return this.expandDialog(event, true);
        case "volt-minimize":
          return this.expandDialog(event);
        case "volt-localise":
          return this.localiseVenue(event);
        case "volt-event":
          return this.openDialog(event.target);
        case "volt-search":
          return this.buildSearch(event.target);
      }
    })

    .onEvent("error", function (event) {
      switch (event.target.tagName) {
        case IMG:
          return this.handleFailedImageError(event.target);
      }
    }, true);


}(window, rJS, RSVP, Math, Date, ics, saveAs, Object, isNaN, navigator));
