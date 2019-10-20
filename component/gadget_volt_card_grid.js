/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP, Math, Date, ics, saveAs */
(function (window, rJS, RSVP, Math, Date, ics, saveAs) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var ARR = [];
  var NAME ="name";
  var KLASS = rJS(window);
  var CANVAS = "canvas";
  var TEMPLATE_PARSER = /\{([^{}]*)\}/g;
  var DOCUMENT = window.document;
  var EVENT = "event_card_template";
  var MEETING = "Meeting";
  var PUBLICATION = "Publication";
  var LOCATION = window.location;
  var MEETING_ACTION = "event_card_template_meeting_action";
  var MEETING_URL = "event_card_template_meeting_url";
  var PUBLICATION_ACTION = "event_card_template_publication_action"; 
  var PUBLICATION_URL = "event_card_template_publication_url";
  var IMG = "event_card_template_image";
  var IMG_FALLBACK = "event_card_template_fallback";
  var DESCRIPTION = "description";
  var LINE_BREAK = "\n";
  var DOT = ".";
  var BLANK = "_blank";
  var POPPER = "width=600,height=480,resizable=yes,scrollbars=yes,status=yes";
  var STR = "";
  var ZERO = "0";
  var SOCIAL_MEDIA_CONFIG = {
    "facebook": "https://www.facebook.com/sharer.php?u={url}",
    "twitter": "https://twitter.com/intent/tweet?url={url}&text={text}&hashtags={tag_list}"
  };

  /////////////////////////////
  // methods
  /////////////////////////////
  function pad(n) {
    return n < 10 ? ZERO + n : STR + n;
  }

  function setDate(d) {
    if (d === STR) {
      return STR;
    }
    return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join(DOT);
  }

  function getAbsolutePath(my_url) {
    var link = DOCUMENT.createElement("a");
    link.href = my_url;
    return link.href;
  }

  function getAddress(my_location) {
    return [
      my_location.title,
      my_location.physical_address,
      my_location.zip,
      my_location.city,
      my_location.country
    ].join(LINE_BREAK);
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

  function setActionList(my_item, my_locale) {
    if (my_item.event_type === MEETING) {
      return getTemplate(KLASS, MEETING_ACTION).supplant({
        "reference": my_item.reference,
        "subject": my_item.content_dict[my_locale].title,
        "description": my_item.content_dict[my_locale].description,
        "start_date": my_item.start_date,
        "stop_date": my_item.stop_date,
        "location": getAddress(my_item["location"])
      });
    }
    return getTemplate(KLASS, PUBLICATION_ACTION).supplant({
      "description": my_item.content_dict[my_locale].description,
      "url": getAbsolutePath(my_item.attachment_dict.document_dict[my_locale].document_url)
    });
  }

  function setCallToAction(my_item, my_locale) {
    if (my_item.event_type === MEETING) {
      return getTemplate(KLASS, MEETING_URL).supplant({
        "reference": my_item.reference
      });
    }
    return getTemplate(KLASS, PUBLICATION_URL).supplant({
      "document_url": my_item.attachment_dict.document_dict[my_locale].document_url
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
      "dialog_pending": null
    })

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      var el = gadget.element;
      gadget.property_dict = {
        "item_container": getElem(el, ".volt-item__container"),
        "dialog": getElem(el, ".volt-dialog-event"),
        "dialog_map_wrapper": getElem(el, ".volt-dialog-map-wrapper"),

        // lazy again, not another storage at this point
        "event_dict": {}
      };
      return gadget.declareGadget("gadget_map_event.html", {
        "scope": "dialog-map",
        "element": gadget.property_dict.dialog_map_wrapper
      });
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

    // ---------------------- StateChange --------------------------------------
    .declareMethod("stateChange", function (delta) {
      var gadget = this;
      var state = gadget.state;
      if (delta.hasOwnProperty("dialog_pending")) {
        state.dialog_pending = delta.dialog_pening;
      }
      return;
    })


    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;
      return new RSVP.Queue()
        .push(function () {
          return gadget.buildDataLookupDict();
        })
        .push(function (response) {
          setDom(
            gadget.property_dict.item_container,
            response.data.rows.sort(function (a, b) {
              return new Date(b.publication_date) - new Date(a.publication_date); 
            }).map(function (item) {
              var locale = my_option_dict.locale;
              var title = item.content_dict[locale].title;
              var image = getTemplate(KLASS, item.thumb_url ? IMG : IMG_FALLBACK)
                .supplant({
                  "title": title,
                  "thumb_url": item.thumb_url
                });
              dict.event_dict[item.reference] = item;
              return getTemplate(KLASS, EVENT).supplant({
                "title": title,
                "type": item.event_type,
                "image": image,
                "description": item.content_dict[locale][DESCRIPTION],
                "start_date": setDate(new Date(item.start_date || item.publication_date)),
                "publication_date": setDate(new Date(item.publication_date)),
                "event_action_list": setActionList(item, my_option_dict.locale),
                "call_to_action": setCallToAction(item, my_option_dict.locale)
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
    // declared jobs
    /////////////////////////////
    .declareJob("closeDialog", function () {
      var gadget = this;
      var dict = gadget.property_dict;
      var dialog = dict.dialog;
      dialog.close();
      return gadget.stateChange({"dialog_pending": null});
    })

    .declareMethod("openDialog", function (my_target) {
      var gadget = this;
      var dict = gadget.property_dict;
      var dialog = dict.dialog;
      var reference = my_target.event_reference.value;
      var active_element = DOCUMENT.activeElement;
      if (gadget.state.dialog_pending) {
        return;
      }
      /*
      return new RSVP.Queue()
        .push(function () {
          return gadget.stateChange({"dialog_pending": true});
        })
        .push(function () {
          if (!dialog.showModal) {
            DIALOG_POLYFILL.registerDialog(dialog);
          }
          return gadget.getDeclaredGadget("dialog-map");
        })
        .push(function (my_gadget) {
          dict.map_gadget = my_gadget;
          return dict.map_gadget.render({
            "scope": reference,
            "event_to_display": dict.event_dict[reference]
          });
        })
        .push(function () {
          dialog.showModal();
          return dict.map_gadget.renderMap();
        })
        .push(function(marker_dict) {
          window.componentHandler.upgradeElements(dialog);
        });
        */
        return;
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
        }
    });


}(window, rJS, RSVP, Math, Date, ics, saveAs));
