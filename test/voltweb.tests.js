/*jslint nomen: true */
/*global */
(function (QUnit) {
  "use strict";
  var test = QUnit.test,
    stop = QUnit.stop,
    start = QUnit.start,
    ok = QUnit.ok,
    expect = QUnit.expect,
    deepEqual = QUnit.deepEqual,
    equal = QUnit.equal,
    module = QUnit.module;

  /////////////////////////////////////////////////////////////////
  // memoryStorage constructor
  /////////////////////////////////////////////////////////////////
  module("memoryStorage.constructor");

  test("dummy", function () {
    equal("dummy", "dummy");
  });

}(QUnit));