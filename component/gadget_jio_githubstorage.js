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
      var opts = {};

      // we could use up to 5x AND:+ NOT:- OR:| ?
      if (options.query) {
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
    .declareMethod('allAttachments', function (key) {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.allAttachments.apply(storage, [key]);
    })
    .declareMethod('get', function (key) {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.get.apply(storage, [key]);
    })
    .declareMethod('put', function (key, doc) {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.put.apply(storage, [key, doc]);
    })
    .declareMethod('post', function (doc) {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.post.apply(storage, [doc]);
    })
    .declareMethod('remove', function (key) {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.remove.apply(storage, [key]);
    })
    .declareMethod('getAttachment', function (key, name) {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.getAttachment.apply(storage, [key, name]);
    })
    .declareMethod('putAttachment', function (key, name, doc) {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.putAttachment.apply(storage, [key, name, doc]);
    })
    .declareMethod('removeAttachment', function (key, name) {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.removeAttachment.apply(storage, [key, name]);
    })
    .declareMethod('repair', function () {
      var storage = this.state_parameter_dict.jio_storage;
      return storage.repair.apply(storage, []);
    });

}(window, rJS, jIO, Query, SimpleQuery, ComplexQuery));