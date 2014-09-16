grunt-locale-html
=================

Grunt plugin to generage translated HTML files based on an HTML template that uses underscore.js templating.

#### Example Grunt Configuration

```javascript
grunt.initConfig({
    localeHtml: {
        dist: {
            options: {
                i18n: 'src/i18n.json'
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

#### Example i18n.json File

```javascript
[{
    "variable": "copyright",
    "en": "&copy; 2014 Company Name, All Rights Reserved.",
    "es": "&copy; 2014 Company Name, Todos los Derechos Reservados."
},{
    "variable": "title",
    "en": "Use Full Page",
    "es": "Utilizár Página Completa"
}];

```

#### Example HTML File

```html
<!doctype html>
<html>
    <head>
        <title><%= title %></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    </head>
    <body>
        <header></header>
        <div>
            <h1><%= title %></h1>
        </div>
        <footer><%= copyright %></footer>
    </body>
</html>

```
