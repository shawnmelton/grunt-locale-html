/**
 * grunt-locale-html
 * 
 * Copyright (c) 2014 Shawn Melton
 */

'use strict';

var minify = require('html-minifier').minify,
    parser = require('xml2json'),
    _ = require('underscore'),
    i18nReferenceWritten = false;


module.exports = function(grunt) {

    grunt.registerMultiTask('localeHtml', 'Translate HTML Template', function() {
        var options = this.options(),

            /**
             * Convert a .tmx file to a JavaScript object
             * @param <String> tmxFile
             * @return <Object> Null if this process fails.
             */
            convertTMXtoJSObject = function(tmxFile) {
                try {
                    return parser.toJson(grunt.file.read(options.tmx, { encoding: 'ISO-8859-1' }), {
                        object: true,
                        reversible: false,
                        coerce: true,
                        sanitize: false,
                        trim: true,
                        arrayNotation: false
                    });
                } catch(e) {
                    return null;
                }
            },

            /**
             * Convert a string of words to a camelcase variable name.
             * @param <String> words
             * @return <String>
             */
            convertVarFromWords = function(words) {
                words = ucwords(words).replace(/[^A-Za-z0-9]/g, '');
                if(words.length > 30) {
                    words = words.substr(0, 30) +'_';
                }

                return words.substr(0, 1).toLowerCase() + words.substr(1);
            },

            /**
             * Minify HTML contents before writing.
             * @param <String> htmlContent
             * @return <String>
             */
            minifyHTML = function(htmlContent) {
                try {
                    return minify(htmlContent, {
                        removeComments: true,
                        collapseWhitespace: true
                    });
                } catch (e) {
                    return htmlContent;
                }
            },

            /**
             * Capitalize the first letter of every word in string.
             * @param <String> str
             * @return <String>
             */
            ucwords = function(str) {
                return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
                    return $1.toUpperCase();
                });
            },

            /**
             * Make sure that provided object has required properties and values are valid.
             * @param <Object> file
             */
            validateFile = function(file) {
                // Each file should have the following properties: src, dest and locale
                if(!('src' in file) || !('dest' in file) || !('fbCrawlerPage' in file) || !('locale' in file)) {
                    return grunt.log.warn('Configuration is not properly set up.  Each file must have src, dest and locale.');
                }

                // Make sure that the source HTML file exists.
                if(!grunt.file.exists(file.src.toString())) {
                    return grunt.log.warn('The source file "'+ file.src +'" was not found.');
                }
            },

            /**
             * Make sure that Gruntfile has provided all of the required options and that 
             * the options have valid entries.
             */
            validateOptions = function() {
                // tmx will point to the .tmx file that we will use to determine locale values.
                if(!('tmx' in options)) {
                    return grunt.log.warn('Configuration is not properly set up.  tmx file not provided.');
                }

                // .tmx file not found
                if(!grunt.file.exists(options.tmx)) {
                    return grunt.log.warn('tmx file was not found!  Please double check that "'+ options.tmx +'" exists.');
                }

                /**
                 * i18n will provide the path and file name for the json interpretation of the tmx file.
                 * This will be a reference file for variable names. 
                 */
                if(!('i18n' in options)) {
                    return grunt.log.warn('Configuration is not properly set up.  i18n option not provided.');
                }

                /**
                 * i18n will provide the path and file name for the json interpretation of the tmx file.
                 * This will be a reference file for variable names. 
                 */
                if(!('fbCrawlerPHP' in options)) {
                    return grunt.log.warn('Configuration is not properly set up.  Facebook crawler file not provided.');
                }

                // .tmx file not found
                if(!grunt.file.exists(options.fbCrawlerPHP)) {
                    return grunt.log.warn('Facebook crawler file was not found!  Please double check that "'+ options.fbCrawlerPHP +'" exists.');
                }
            },

            /**
             * Generate a facebook crawler file provided with the appropriate html input file.
             * @param <String> htmlFile
             * @param <String> crawlerFile
             */
            writeFacebookCrawlerFile = function(htmlFile, phpFile, crawlerFile) {
                var htmlContents = grunt.file.read(htmlFile),
                    phpContents = grunt.file.read(phpFile),
                    headIdx = htmlContents.indexOf('</head>');

                grunt.file.write(crawlerFile, htmlContents.substr(0, headIdx) + 
                    phpContents + htmlContents.substr(headIdx));
            },

            /**
             * Write the HTML file with the appropriate locale information.
             * @param <String> htmlFile
             * @param <String> htmlContents
             */
            writeHTMLFile = function(htmlFile, htmlContents) {
                grunt.file.write(htmlFile, htmlContents);
                grunt.log.writeln('Successfully generated new translated HTML file "'+ htmlFile +'"!');
            };


        validateOptions();


        grunt.log.warn(this.file.src);

        return;


        this.files.forEach(function(file) {
            validateFile(file);
            
            var locale = file.locale.toString().toLowerCase(),
                templateObj = {},
                i18nReference = [],
                tmxObj = convertTMXtoJSObject(options.tmx);

            if(tmxObj === null) {
                return grunt.log.warn('Internationlization file failed to be properly read.  Please check to make sure your .tmx XML is valid.');
            }

            // Walk through tmx object to swap in the appropriate locale values.
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
            var tmpl = _.template(grunt.file.read(file.src));
            writeHTMLFile(file.dest, minifyHTML(tmpl(templateObj)));

            // Write the i18n reference file.
            if(!i18nReferenceWritten) {
                i18nReferenceWritten = true;
                grunt.file.write(options.i18n, JSON.stringify(i18nReference, null, 4));
            }

            // TODO - Finish this.
            // writeFacebookCrawlerFile(file.dest, options.fbCrawlerPHP, file.fbCrawlerPage);
        });
    });
};