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
        if(!('i18n' in options)) {
            return grunt.log.warn('Configuration is not properly set up.  i18n file not provided.');
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

            var fileContents = grunt.file.read(file.src),
                i18n,
                templateObj = {};

            // Parse the internationlization file that we will use to produce the translation.
            try {
                i18n = JSON.parse(grunt.file.read(options.i18n));
            } catch(e) {
                grunt.log.warn(e);
                return grunt.log.warn('Internationlization file failed to be properly read.  Please check to make sure your JSON is valid.');
            }

            // Find the appropriate locale and swap out template placeholders.
            i18n.forEach(function(setting) {
                var locale = file.locale.toString().toLowerCase();
                if(locale in setting && 'variable' in setting) {
                    templateObj[setting.variable] = setting[locale];
                }
            });

            var tmpl = _.template(fileContents);
            fileContents = tmpl(templateObj);

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