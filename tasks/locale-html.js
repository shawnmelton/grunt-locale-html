/**
 * grunt-locale-html
 *
 * Copyright (c) 2014 Shawn Melton
 */

'use strict';

require('date-util');

var minify = require('html-minifier').minify;
var _ = require('underscore');


module.exports = function (grunt) {

    grunt.registerMultiTask('localeHtml', 'Translate HTML Template', function () {
        var defaults = {
            flatten: false,
            minify: false,
            variablesFile: process.cwd() + '/variables.json',
            locales: [
                {
                    id: 'en',
                    localeCue: 'English',
                    localeCueCode: 'en',
                    isPrimary: true
                }, {
                    id: 'es',
                    localeCue: 'En Español',
                    localeCueCode: 'es'
                }
            ]
        };
        var options = _.extend({}, defaults, this.options()),

            /**
             * Build the object that we will output for reference and use to generate the HTML
             * from Underscore templates.
             * @param <Object> dictionary - Translation definitions.
             * @return <Object> i18nReference - The reference object for the internalization translation.
             */
            buildi18nReferenceObj = function (dictionary) {
                var i18nReference = {};

                options.locales.forEach(function (locale) {
                    i18nReference[locale.id] = {};

                    i18nReference[locale.id].localeId = locale.id;
                    i18nReference[locale.id].localeCode = locale.isPrimary ? '' : locale.id;

                    // TODO - These will not work when multiple translations
                    // There's no way to make this work for multiple translations without breaking or modifying the front end.
                    i18nReference[locale.id].localeCueCode = locale.id === 'en' ? 'es' : 'en';
                    i18nReference[locale.id].localeCue = locale.id === 'en' ? 'En Español' : 'English';
                    i18nReference[locale.id].currentYear = new Date().format('yyyy');
                });

                Object.keys(dictionary).forEach(function (key) {
                    if (key) {
                        var variable = convertVarFromWords(key);

                        if (dictionary[key]) {
                            options.locales.forEach(function (locale) {
                                if (!locale.isPrimary) {
                                    i18nReference[locale.id][variable] = dictionary[key][locale.id];
                                } else {
                                    i18nReference[locale.id][variable] = key;
                                }
                            });
                        }
                    }
                });

                return i18nReference;
            },

            /**
             * Convert a string of words to a camelcase variable name.
             * @param <String> words
             * @return <String>
             */
            convertVarFromWords = function (words) {
                words = ucwords(words).replace(/[^A-Za-z0-9]/g, '');
                if (words.length > 30) {
                    words = words.substr(0, 30) + '_';
                }

                // Variable names can't start with #'s. Add digit_ string to fix this issue.
                if (/^\d$/.test(words.substr(0, 1))) {
                    words = '_' + words;
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
            generateDestinationFileName = function (srcString, locale, folder, file) {
                if (options.flatten) {
                    var parts = file.split('/');
                    return folder + '/' + locale + '/' + parts[parts.length - 1];
                }
                return folder + '/' + locale + '/' +
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
            generateHTMLFiles = function (files, destFolder, srcString, locales, i18nReference) {
                files.forEach(function (file) {
                    var tmpl = null;
                    try {
                        tmpl = _.template(grunt.file.read(file));
                    } catch (e) { }

                    if (tmpl === null) {
                        grunt.log.warn('"' + file + '" had an Underscore variable that was not found in "' + options.i18n + '".');
                        return;
                    }

                    locales.forEach(function (locale) {
                        var htmlContent = tmpl(i18nReference[locale.id]);

                        if (options.minify) {
                            htmlContent = minifyHTML(htmlContent);
                        }

                        writeHTMLFile(generateDestinationFileName(srcString, locale.id, destFolder, file), htmlContent);
                    });
                });
            },

            /**
             * Minify HTML contents before writing.
             * @param <String> htmlContent
             * @return <String>
             */
            minifyHTML = function (htmlContent) {
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
            ucwords = function (str) {
                return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
                    return $1.toUpperCase();
                });
            },

            /**
             * Make sure that provided object has required properties and values are valid.
             * @param <Object> file - HTML template file (Underscore.js template)
             */
            validateFile = function (file) {
                // Each file should have the following properties: src, dest and locale
                if (!('src' in file) || !('dest' in file)) {
                    return grunt.log.warn('Configuration is not properly set up.  Each file must have src, dest and locale.');
                }

                file.src.forEach(function (srcFile) {
                    // Make sure that the source HTML file exists.
                    if (!grunt.file.exists(srcFile)) {
                        return grunt.log.warn('The source file "' + file.src + '" was not found.');
                    }
                });
            },

            /**
             * Make sure that Gruntfile has provided all of the required options and that
             * the options have valid entries.
             */
            validateOptions = function () {
                /**
                 * i18n will provide the path and file name for the json interpretation of the tmx file.
                 * This will be a reference file for variable names.
                 */
                if (!('i18n' in options)) {
                    return grunt.log.warn('Configuration is not properly set up.  i18n option not provided.');
                }
            },

            /**
             * Write the HTML file with the appropriate locale information.
             * @param <String> htmlFile
             * @param <String> htmlContents
             */
            writeHTMLFile = function (htmlFile, htmlContents) {
                grunt.file.write(htmlFile, htmlContents);
                grunt.log.writeln('Successfully generated translated HTML file "' + htmlFile + '".');
            };


        validateOptions();

        var dictionary = grunt.file.readJSON(options.i18n);
        var i18nReference = buildi18nReferenceObj(dictionary);

        this.files.forEach(function(file) {
            validateFile(file);
            generateHTMLFiles(file.src, file.dest, file.orig.src[0], options.locales, i18nReference);
        });

        // Write the i18n reference file.
        grunt.file.write(options.variablesFile, JSON.stringify(i18nReference, null, 4));
        grunt.log.writeln('Successfully generated internalization reference file: "' + options.variablesFile + '".');
    });
};
