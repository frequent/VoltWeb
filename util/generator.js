/*jslint maxlen: 80, indent: 2 */
/*global window, rJS, RSVP, L */
(function (window, rJS, RSVP, L) {
  "use strict";

  /////////////////////////////
  // parameters
  /////////////////////////////
  var DICT = {};
  var SLASH = "/";
  var MINUS = "-";
  var STR = "";

  /////////////////////////////
  // methods
  /////////////////////////////
  function getTemplate(my_payload) {
    var uuid = getUuid();
    var path = replaceAll(my_payload.event_origin, SLASH, MINUS);
    var today = new Date();
    return  {
      "type": "event",
      "event_type": my_payload.event_type,
      "event_nature": "",
      "event_origin": my_payload.event_origin,
      "id": uuid,
      "file_name": path + uuid,
      "reference": [path, my_payload.event_type, convertDate(today)].join("."),
      "title": my_payload.file_title,
      "img_url": my_payload.image_title,
      "thumb_url": may_payload.tumbnail_title,
      "category_dict": {},
      "contributor_list": {},
      "keyword_dict": {},
      "content_dict": {
        "en": {
          "title": "Volt Lille Newsletter #36 - General Assembly",
          "description": "End of the week our French general assembly will take place in Lille with election of a new board, statuts and open discussion to define our strategy for the next year",
          "text_content": ""
        },
        "fr": {
          "title": "Volt Lille Bulletin #36 - L'Assemblée Générale",
          "description": "À la fin de cette semaine, notre assemblée générale d'équipe Volt France aura lieu à Lille avec l'élection d'un nouveau bureau, les nouveaux statuts et la définition de notre stratégie ici en France pour l'an prochaine.",
          "text_content": ""
        }
      },
      "start_date": my_payload.start_date || STR,
      "stop_date": my_payload.stop_date || STR,
      "release_date": new Date(),
      "location": {},
      "scope": my_payload.event_origin,
      "attachment_dict": {
        "social_media_url_dict": {},
        "document_dict": {
          "fr": {
            "document_url": "../../../../doc/EU-FR-Lille.Bulletin.2019-09-09.html",
            "mime-type": "text/html"
          },
          "en": {
            "document_url": "../../../../doc/EU-FR-Lille.Bulletin.2019-09-09.html",
            "mime-type": "text/html"
          }
        }
      },
      "reference_list": []
    };
  }

  function convertDate(date) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth()+1).toString();
    var dd  = date.getDate().toString();
  
    var mmChars = mm.split('');
    var ddChars = dd.split('');
  
    return yyyy + '-' + (mmChars[1]?mm:"0"+mmChars[0]) + '-' + (ddChars[1]?dd:"0"+ddChars[0]);
  }

  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
  }

  function S4() {
    return ('0000' + Math.floor(
      Math.random() * 0x10000 /* 65536 */
    ).toString(16)).slice(-4);
  }

  function getUuid() {
    return S4() + S4() + "-" +
      S4() + "-" +
      S4() + "-" +
      S4() + "-" +
      S4() + S4() + S4();
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
    .setState({})

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.property_dict = {
        "output_container": getElem(gadget.element, ".volt-output")
      };
    })

    /////////////////////////////
    // published methods
    /////////////////////////////

    /////////////////////////////
    // acquired methods
    /////////////////////////////

    /////////////////////////////
    // declared methods
    /////////////////////////////

    // -------------------.--- Render ------------------------------------------
    .declareMethod("render", function (my_option_dict) {
      var gadget = this;
      var dict = gadget.property_dict;

    })

    .declareMethod("stateChange", function (delta) {
      var gadget = this;

      return;
    })

    .declareMethod("generateContent", function (my_target) {
      
    })
    
    /////////////////////////////
    // declared service
    /////////////////////////////

    /////////////////////////////
    // event bindings
    /////////////////////////////
    .onEvent("submit", function (event) {
      switch (event.target.getAttribute(NAME)) {
        case "volt-form__generator":
          return this.generateContent(event.target);
      }
    });


}(window, rJS, RSVP, L));
