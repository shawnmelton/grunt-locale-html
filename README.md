grunt-locale-html
=================

Version 1.1.0

###BREAKING in 1.0.0 - Plugin now reads a JSON dictionary and no longer supports .tmx files.

Grunt plugin to generage translated HTML files based on an HTML template that uses underscore.js templating.  This plugin requires you to provide a .json file.  A reference i18n file will be created so the user can refer to variable names to use in the template.

### Options
`flatten` - {Boolean} If set to true, will flatten directory structure of output files.
`minify` - {Boolean} If set to true, html will be minified after translation.
`variablesFile` - {String} Path to output generated variables file.
`locales` - {Object[]} - Collection of supported locales.

#### Sample locales option
```javascript
    [
        {
            id: 'en',
            localeCue: 'English',
            localeCueCode: 'en',
            isPrimary: true // Our dictionary is written in this language, others are translations of it.
        }, {
            id: 'es',
            localeCue: 'En Español',
            localeCueCode: 'es'
        }
    ]
```

#### Example Grunt Configuration

```javascript
grunt.initConfig({
    localeHtml: {
        dist: {
            options: {
                tmx: '../domain.com/application/lang/example.tmx',
                i18n: 'src/i18n.json'
            },
            files: {
                'dist': 'src/**/*.html'
            }
        }
    }
});

grunt.loadNpmTasks('grunt-locale-html');

grunt.registerTask(
    'default', ['localeHtml']
);
```

#### Example dictionary.json File (input)

```javascript
    {
        "Apartments": {
            "es": "Apartamentos"
        },
        "Apartments for Rent": {
            "es": "Apartamentos en Renta"
        }
    }
```

#### Example variables.json File (output)

This file will be generated from the .json file that is referred to in the Grunt task configuration.  The variable property will be used in the HTML template file.

```javascript
{
    "en": {
        "apartments": "Apartments",
        "apartmentsForRent": "Apartments For Rent",
    },
    "es": {
        "apartments": "Apartamentos",
        "apartmentsForRent": "Apartamentos en Renta",
    }
}

```

#### Example HTML File

This file uses Underscore.js templating syntax.

```html
<!doctype html>
<html>
    <head>
        <title><%= apartments %></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    </head>
    <body>
        <header></header>
        <div>
            <h1><%= apartmentsForRent %></h1>
        </div>
        <footer></footer>
    </body>
</html>

```

