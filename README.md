grunt-locale-html
=================

Grunt plugin to generage translated HTML files based on an HTML template that uses underscore.js templating.  This plugin requires you to provide a .tmx file.  A reference i18n file will be created so the user can refer to variable names to use in the template.

#### Example Grunt Configuration

```javascript
grunt.initConfig({
    localeHtml: {
        dist: {
            options: {
                tmx: '../domain.com/application/lang/example.tmx',
                i18n: 'src/i18n.json'   // Reference file only.  Generated from .tmx file above.
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

#### Example TMX file

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<tmx version="1.4">
    <header />
    <body>
        <tu tuid="All Rights Reserved"><tuv xml:lang="es"><seg>Todos los Derechos Reservados</seg></tuv></tu>
        <tu tuid="Application error"><tuv xml:lang="es"><seg>Error en la aplicación</seg></tuv></tu>
        <tu tuid="Back"><tuv xml:lang="es"><seg>Retroceder</seg></tuv></tu>
    </body>
</tmx>
```

#### Example i18n.json File

This file will be generated from the .tmx file that is referred to in the Grunt task configuration.  The variable property will be used in the HTML template file.

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

This file uses Underscore.js templating syntax.

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
