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
             * Build the object that we will output for reference and use to generate the HTML
             * from Underscore templates.
             * @param <Object> tmxObj - The tmx file translated into a JavaScript object.
             * @param <Array> locales - An array of all of the locales in the .tmx file.
             * @return <Object> i18nReference - The reference object for the internalization translation.
             */
            buildi18nReferenceObj = function(tmxObj, locales) {
                var i18nReference = {};

                locales.forEach(function(locale) {
                    i18nReference[locale] = {};
                });

                tmxObj.tmx.body.tu.forEach(function(tu) {
                    if('tuid' in tu) {
                        var variable = convertVarFromWords(tu.tuid);
                        i18nReference['en'][variable] = tu.tuid;

                        if('tuv' in tu && 'xml:lang' in tu.tuv && 'seg' in tu.tuv) {
                            i18nReference[tu.tuv['xml:lang']][variable] = tu.tuv.seg;
                        }
                    }
                });

                return i18nReference;
            },

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
             * Based on the criteria for this file, generate the destination file name.
             * @param <String> srcString
             * @param <String> locale
             * @param <String> folder
             * @param <String> file
             */
            generateDestinationFileName = function(srcString, locale, folder, file) {
                return folder +'/'+ (locale === 'en' ? '' : locale +'/') + 
                    file.replace(file.substring(0, srcString.indexOf('/*') + 1), '');
            },

            /**
             * Generate HTML files from the Underscore templates.
             * @param <Array> files - Template files that need to be translated.
             * @param <String> destFolder - Destination folder where HTML files will be written.
             * @param <String> srcString - The string that is used to find all of the source files.
             * @param <Array> locales - Array of all of the locales used in the .tmx file.
             * @param <Object> i18nReference - The reference object that will be used with Underscore to translate the templates.
             */
            generateHTMLFiles = function(files, destFolder, srcString, locales, i18nReference) {
                files.forEach(function(file) {
                    var tmpl = null;
                    try {
                        tmpl = _.template(grunt.file.read(file));
                    } catch (e) {}

                    if(tmpl === null) {
                        grunt.log.warn('"'+ file +'" had an Underscore variable that was not found in "'+ options.i18n +'".');
                        return;
                    }

                    locales.forEach(function(locale) {
                        writeHTMLFile(generateDestinationFileName(srcString, locale, destFolder, file),
                        minifyHTML(tmpl(i18nReference[locale])));

                        // We only need to generate the crawler page for the index.html.
                        if(file.indexOf('index.html') !== -1) {
                            writeFacebookCrawlerFile(generateDestinationFileName(srcString, locale, destFolder, file),
                                options.fbCrawlerPHP, destFolder +'/'+ (locale === 'en' ? '' : locale +'/') + 'facebook-crawler.php');
                        }
                    });
                });
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
             * Determine all of the locales that are used in the .tmx file.
             * @param <Object> tmxObj - JavaScript object parsed from the .tmx file.
             * @return <Array> locales - Array of two character strings
             */
            parseLocalesFromTMX = function(tmxObj) {
                var locales = ['en'];
                tmxObj.tmx.body.tu.forEach(function(tu) {
                    if('tuid' in tu && 'tuv' in tu && 'xml:lang' in tu.tuv && locales.indexOf(tu.tuv['xml:lang']) === -1) {
                        locales.push(tu.tuv['xml:lang']);
                    }
                });

                return locales;
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
             * @param <Object> file - HTML template file (Underscore.js template)
             */
            validateFile = function(file) {
                // Each file should have the following properties: src, dest and locale
                if(!('src' in file) || !('dest' in file)) {
                    return grunt.log.warn('Configuration is not properly set up.  Each file must have src, dest and locale.');
                }

                file.src.forEach(function(srcFile) {
                    // Make sure that the source HTML file exists.
                    if(!grunt.file.exists(srcFile)) {
                        return grunt.log.warn('The source file "'+ file.src +'" was not found.');
                    }
                });
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
                grunt.log.writeln('Successfully generated translated PHP file "'+ crawlerFile +'".');
            },

            /**
             * Write the HTML file with the appropriate locale information.
             * @param <String> htmlFile
             * @param <String> htmlContents
             */
            writeHTMLFile = function(htmlFile, htmlContents) {
                grunt.file.write(htmlFile, htmlContents);
                grunt.log.writeln('Successfully generated translated HTML file "'+ htmlFile +'".');
            };


        validateOptions();

        var tmxObj = convertTMXtoJSObject(options.tmx),
            locales = parseLocalesFromTMX(tmxObj),
            i18nReference = buildi18nReferenceObj(tmxObj, locales);

        this.files.forEach(function(file) {
            validateFile(file);
            generateHTMLFiles(file.src, file.dest, file.orig.src[0], locales, i18nReference);
        });

        // Write the i18n reference file.
        grunt.file.write(options.i18n, JSON.stringify(i18nReference, null, 4));
        grunt.log.writeln('Successfully generated internalization reference file: "'+ options.i18n +'".');
    });
};