grunt-locale-html
=================

Grunt plugin to translate an HTML template into new HTML files.

#### Example config

```javascript
grunt.initConfig({
    localeHtml: {
        dist: {
            options: {
                localeVars: [{
                    locale: 'en',
                    copyright: '&copy; 2014 Company Name, All Rights Reserved.'
                }, {
                    locale: 'es',
                    copyright: '&copy; 2014 Company Name, Todos los Derechos Reservados.'
                }]
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
