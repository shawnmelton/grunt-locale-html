/**
 * grunt-locale-html
 * 
 * Copyright (c) 2014 Shawn Melton
 */

'use strict';

var minify = require('html-minifier').minify,
    _ = require('underscore');

module.exports = function(grunt) {

    grunt.registerMultiTask('localeHtml', 'Translate HTML Template', function() {
        var options = this.options();

        // localeVars will define variables and their appropriate locale associated value.
        if(!('localeVars' in options)) {
            return grunt.log.warn('Configuration is not properly set up.  Locale variables have not been added.');
        }

        this.files.forEach(function(file) {
            // Each file should have the following properties: src, dest and locale
            if(!('src' in file) || !('dest' in file) || !('locale' in file)) {
                return grunt.log.warn('Configuration is not properly set up.  Each file must have src, dest and locale.');
            }

            // Make sure that the file exists.
            if(!grunt.file.exists(file.src.toString())) {
                return grunt.log.warn('The source file "'+ file.src +'" was not found.');
            }

            var fileContents = grunt.file.read(file.src);

            // Find the appropriate locale and swap out template placeholders.
            options.localeVars.forEach(function(v) {
                if(v.locale.toString().toLowerCase() === file.locale.toString().toLowerCase()) {
                    var tmpl = _.template(fileContents);
                    fileContents = tmpl(v);
                }
            });

            // Minify HTML contents before writing.
            try {
                fileContents = minify(fileContents, {
                    removeComments: true,
                    collapseWhitespace: true
                });
            } catch (e) {
                return grunt.log.warn('File "'+ file.src +'"\'s HTML failed to minify.');
            }

            grunt.file.write(file.dest, fileContents);
            grunt.log.writeln('Successfully generated new translated HTML files!');
        });
    });

};