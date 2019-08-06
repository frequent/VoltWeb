/*global window, rJS, jIO, Query, SimpleQuery, ComplexQuery */
/*jslint indent: 2, maxerr: 3 */
(function (window, rJS, jIO, Query, SimpleQuery, ComplexQuery9) {
  "use strict";

  function setQuery(my_key, my_val) {
    return new SimpleQuery({"key": my_key, "value": my_val, "type": "simple"});
  }

  rJS(window)

    /////////////////////////////
    // ready
    /////////////////////////////
    .ready(function (gadget) {
      gadget.state_parameter_dict = {};
    })

    /////////////////////////////
    // declared methods
    /////////////////////////////

    .declareMethod('createJIO', function () {
      this.state_parameter_dict.jio_storage =
        jIO.createJIO.apply(jIO, arguments);
    })
    .declareMethod('allDocs', function (options) {
      var storage = this.state_parameter_dict.jio_storage;
      var query_list;
      var query;
      var opts = options;

      // we could use up to 5x AND:+ NOT:- OR:| ?
      if (options && options.query) {
        query_list = options.query.split("+");
        query = new ComplexQuery({
          "operator": "AND",
          "type": "complex",
          "query_list": query_list.map(function (tag) {
            return setQuery("token", tag);
          })
        });
        opts.query = Query.objectToSearchText(query);
      }
      return storage.allDocs.apply(storage, [opts]);
    })
    .declareMethod('allAttachments', function () {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.allAttachments.apply(storage, arguments);
    })
    .declareMethod('get', function () {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.get.apply(storage, arguments);
    })
    .declareMethod('put', function () {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.put.apply(storage, arguments);
    })
    .declareMethod('post', function () {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.post.apply(storage, arguments);
    })
    .declareMethod('remove', function () {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.remove.apply(storage, arguments);
    })
    .declareMethod('getAttachment', function () {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.getAttachment.apply(storage, arguments);
    })
    .declareMethod('putAttachment', function () {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.putAttachment.apply(storage, arguments);
    })
    .declareMethod('removeAttachment', function () {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.removeAttachment.apply(storage, arguments);
    })
    .declareMethod('repair', function () {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.repair.apply(storage, arguments);
    });

}(window, rJS, jIO, Query, SimpleQuery, ComplexQuery));