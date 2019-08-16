/**
 * 
 * CUSTOM Github Storage (fetches json files from a github repo)
 * 
 * 
 **/
/*jslint indent: 2, nomen: true, maxlen: 120*/
/*global jIO, RSVP, JSON, UriTemplate, Query, SimpleQuery, ComplexQuery,
Arrray*/
(function (jIO, RSVP, JSON, UriTemplate, Query, SimpleQuery, ComplexQuery,
Array) {
  "use strict";

  // get folder contents and files and search in code

  // contents
  // https://developer.github.com/v3/repos/contents/
  // get folder content:
  // https://api.github.com/repos/{user}/{repo}/{path_to_folder}/?ref=gh-pages
  // get file
  // https://api.github.com/repos/{user}/{repo}/{path_to_file}

  // search (only master, max 384k per file, max 500.000 files)
  // https://help.github.com/en/articles/searching-code
  // https://developer.github.com/v3/search/#search-code
  // https://help.github.com/en/articles/understanding-the-search-syntax
  // get results
  // https://api.github.com/search/code?q={terms}+in:file+language:json+repo:{user}/{repo}+path:{path_to_directory}&per_page={per_page}&page={page}

  // raw content (used for get requests)
  // https://raw.githubusercontent.com/{user}/{repo}/{ref}/{path_to_file}

  var GITHUB_API = 'https://api.github.com/',
    GITHUB_RAW = 'https://raw.githubusercontent.com/',
    SEARCH_URL = GITHUB_API + 'search/code?q={query}+in:file+language:json' + 
      '+repo:{user}/{repo}+path:{path}&per_page={per_page}' +
      '&page={page}&sort=best_match&order=desc',
    search_template = UriTemplate.parse(SEARCH_URL),
    CONTENT_URL = GITHUB_API + 'repos/{user}/{repo}/contents/{path}/' +
      '?ref=gh-pages',
    content_template = UriTemplate.parse(CONTENT_URL);

  // keeping it simple for now, total of five of AND OR NOT possible
  function setQuery(parsed_query) {
    if (parsed_query instanceof SimpleQuery) {
      return parsed_query.value;
    }
    if ((parsed_query instanceof ComplexQuery) && (parsed_query.operator === 'AND')) {
      return parsed_query.query_list.map(function (query) {
        return query.value;
      }).join("+");
    }
  }

  function setDownloadUrl(doc) {
    return [
      GITHUB_RAW + doc.repository.full_name,
      doc.url.split("?ref=")[1],
      doc.path
    ].join("/");
  }

  function GithubStorage(spec) {

    if (typeof spec.path !== 'string' || !spec.path) {
      throw new TypeError("path must be a string " +
                          "which contains more than one character.");
    }
    if (typeof spec.repo !== 'string' || !spec.repo) {
      throw new TypeError("repo must be a string " +
                          "which contains more than one character.");
    }
    if (typeof spec.user !== 'string' || !spec.user) {
      throw new TypeError("user must be a string " +
                          "which contains more than one character.");
    }

    this._repo = spec.repo;
    this._path = spec.path;
    this._user = spec.user;
  }

  GithubStorage.prototype.buildQuery = function (options) {
    var opts = options || {};
    var url = content_template.expand({
      "repo": this._repo,
      "path": this._path,
      "user": this._user
    });
    var per_page;
    var page;
    var query;

    if (Object.entries(opts).length > 0 && opts.constructor === Object) {
      if (opts.query) {
        query = setQuery(jIO.QueryFactory.create(opts.query));
      }
      if (opts.limit && opts.limit.length > 0) {
        per_page = opts.limit[1] - opts.limit[0] + 1;
        page = opts.limit[0] === 0 ? 0 : (opts.limit[1]+1)/per_page;
      }
      url = search_template.expand({
        "repo": this._repo,
        "user": this._user,
        "query": query,
        "per_page": per_page || 24,
        "page": page || 1,
        "path": this._path
      });
    }

    // fetch download-urls of files in folder on github
    return new RSVP.Queue()
      .push(function () {
        return jIO.util.ajax({"type": "GET", "url": url});
      })
      .push(function (evt) {
        var data = JSON.parse(evt.target.response || evt.target.responseText),
          result_list = [],
          data_list,
          data_entry,
          len,
          i;

        // fit both content and search api into this
        data_list = Array.isArray(data) ? data : data.items;

        for (i = 0, len = data_list.length; i < len; i += 1) {
          data_entry = data_list[i];
          if (data_entry.path.indexOf(".json") > -1) {
            result_list.push({
              id: data_entry.download_url || setDownloadUrl(data_entry),
              value: {}
            });
          }
        }

        // NOTE, not nice to set arbitrary property on array. We should get x+1
        result_list.total_count = data.total_count;

        return result_list;
      })
      .push(undefined, function (response) {
        if (response.target.status === 404) {
          return [];
        }
        throw response;
      });
  };

  GithubStorage.prototype.hasCapacity = function (name) {
    return (name === "list") || (name === "query") || name === "limit";
  };

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
            throw new jIO.util.jIOError("Cannot find document: " + id, 404);
          }
          throw error;
        }
      );
  };

  jIO.addStorage('github_storage', GithubStorage);

}(jIO, RSVP, JSON, UriTemplate, Query, SimpleQuery, ComplexQuery, Array));