/**
 * grunt-locale-html
 * 
 * Copyright (c) 2014 Shawn Melton
 */

'use strict';

var minify = require('html-minifier').minify,
    parser = require('xml2json'),
    _ = require('underscore'),
    i18nReferenceWritten = false,

    /**
     * Capitalize the first letter of every word in string.
     * @param str <String>
     * @return <String>
     */
    ucwords = function(str) {
        return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
            return $1.toUpperCase();
        });
    },

    /**
     * Convert a string of words to a camelcase variable name.
     * @param words <String>
     * @return <String>
     */
    convertVarFromWords = function(words) {
        words = ucwords(words).replace(/[^A-Za-z0-9]/g, '');
        if(words.length > 30) {
            words = words.substr(0, 30) +'_';
        }

        return words.substr(0, 1).toLowerCase() + words.substr(1);
    };


module.exports = function(grunt) {

    grunt.registerMultiTask('localeHtml', 'Translate HTML Template', function() {
        var options = this.options();

        // tmx will point to the .tmx file that we will use to determine locale values.
        if(!('tmx' in options)) {
            return grunt.log.warn('Configuration is not properly set up.  tmx file not provided.');
        }

        /**
         * i18n will provide the path and file name for the json interpretation of the tmx file.
         * This will be a reference file for variable names. 
         */
        if(!('i18n' in options)) {
            return grunt.log.warn('Configuration is not properly set up.  tmx file not provided.');
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
                tmxObj,
                templateObj = {},
                i18nReference = [];

            // Parse the internationlization file that we will use to produce the translation.
            try {
                tmxObj = parser.toJson(grunt.file.read(options.tmx, { encoding: 'ISO-8859-1' }), {
                    object: true,
                    reversible: false,
                    coerce: true,
                    sanitize: false,
                    trim: true,
                    arrayNotation: false
                });
            } catch(e) {
                return grunt.log.warn('Internationlization file failed to be properly read.  Please check to make sure your JSON is valid.');
            }

            // Walk through tmx object to swap in the appropriate locale values.
            var locale = file.locale.toString().toLowerCase();
            tmxObj.tmx.body.tu.forEach(function(tu) {
                if('tuid' in tu) {
                    var variable = convertVarFromWords(tu.tuid),
                        i18nObj = {
                            variable: variable,
                            en: tu.tuid
                        };

                    if(locale === 'en') {
                       templateObj[variable] = tu.tuid; 
                    }

                    if('tuv' in tu && 'xml:lang' in tu.tuv && 'seg' in tu.tuv) {
                        i18nObj[tu.tuv['xml:lang']] = tu.tuv.seg;

                        if(locale === tu.tuv['xml:lang'].toString().toLowerCase()) {
                            templateObj[variable] = tu.tuv.seg;
                        }
                    }

                    i18nReference.push(i18nObj);
                }
            });

            // Use Underscore.js to swap out template placeholders with actual locale values.
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

            // Write the HTML file with the appropriate locale information.
            grunt.file.write(file.dest, fileContents);
            grunt.log.writeln('Successfully generated new translated HTML file "'+ file.dest +'"!');

            // Write the i18n reference file.
            if(!i18nReferenceWritten) {
                i18nReferenceWritten = true;
                grunt.file.write(options.i18n, JSON.stringify(i18nReference, null, 4));
            }
        });
    });

};