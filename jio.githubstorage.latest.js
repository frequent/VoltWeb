/**
 * 
 * CUSTOM Translate Storage (fetches json files from a github repo)
 * 
 * 
 **/
/*jslint indent: 2, nomen: true, maxlen: 120*/
/*global jIO, RSVP, JSON */
(function (jIO, RSVP, JSON) {
  "use strict";

  function GithubStorage(spec) {

    // requires CSP setting:
    // connect-src 'self' https://raw.githubusercontent.com https://api.github.com data:;

    //https://api.github.com/repos/VoltEuropa/VoltWeb/lang/{lang}/?ref=master
    //https://api.github.com/repos/VoltEuropa/VoltWeb/lang/{lang}/ui.json
    //https://api.github.com/repos/VoltEuropa/VoltWeb/lang/{lang}/{day}.json

    if (typeof spec.path !== 'string' || !spec.path) {
      throw new TypeError("path must be a string " +
                          "which contains more than one character.");
    }
    if (typeof spec.repo !== 'string' || !spec.repo) {
      throw new TypeError("repo must be a string " +
                          "which contains more than one character.");
    }

    this._href = 'https://api.github.com/repos';
    this._user = 'VoltEuropa';
    this._path = spec.repo + '/contents/' + spec.path;
    this._url = [this._href, this._user, this._path, '?ref=gh-pages'].join('/');
    this.__debug = spec.__debug;
  }

  GithubStorage.prototype.get = function (id) {
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({type: "GET", url: id, dataType: "text"});
      })
      .push(
        function (response) {
          return JSON.parse(response.target.response || response.target.responseText);
        },
        function (error) {
          if ((error.target !== undefined) &&
              (error.target.status === 404)) {
            throw new jIO.util.jIOError("Cannot find document", 404);
          }
          throw error;
        }
      );
  };

  GithubStorage.prototype.hasCapacity = function (name) {
    return (name === "list");
  };

  GithubStorage.prototype.buildQuery = function () {
    var url = this.__debug || this._url;

    // fetch download-urls of files in folder on github
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({"type": "GET", "url": url});
      })
      .push(function (data) {
        var data_list = JSON.parse(data.target.response || data.target.responseText),
          result_list = [],
          data_entry,
          len,
          i;

        for (i = 0, len = data_list.length; i < len; i += 1) {
          data_entry = data_list[i];
          if (data_entry.path.indexOf(".json") > -1) {
            result_list.push({
              id: data_entry.download_url,
              value: {}
            });
          }
        }
        return result_list;
      })
      .push(undefined, function (response) {
        if (response.target.status === 404) {
          return [];
        }
        throw response;
      });
  };

  jIO.addStorage('github_storage', GithubStorage);

}(jIO, RSVP, JSON));