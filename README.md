grunt-locale-html
=================

Grunt plugin to translate an HTML template into new HTML files.

#### Example config

```javascript
grunt.initConfig({
    localeHtml: {
        dist: {
            options: {

            },
            files: [{
                src: 'src/index.html',
                dest: 'dist/index.html',
                locale: 'en'
            },{
                src: 'src/index.html',
                dest: 'dist/es/index.html',
                locale: 'es'
            }]
        }
    }
});

grunt.registerTask('default', ['localeHtml']);
```
