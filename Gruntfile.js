/*global require */
module.exports = function (grunt) {
  "use strict";

  grunt.loadNpmTasks('grunt-contrib-qunit');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    qunit: {
      all: ['test/index.html']
    }
  });
  grunt.registerTask('test', ['qunit']);
};