module.exports = function(config) {
    config.set({

        basePath: '',
        frameworks: ['browserify', 'mocha', 'chai', 'sinon'],

        files: [
            './node_modules/phantomjs-polyfill/bind-polyfill.js', 
            'app/bower_components/angular/angular.js',
            'app/bower_components/angular-route/angular-route.js',
            'app/bower_components/angular-mocks/angular-mocks.js',
            'app/js/main.js',
            'app/js/**/*.js',
        ],


        exclude: [
          'app/js/bundled.js'
        ],

        preprocessors: {
            'app/bower_components/angular/angular.js': ["browserify"],
            'app/bower_components/angular-route/angular-route.js': ["browserify"],
            'app/bower_components/angular-mocks/angular-mocks.js': ["browserify"],
            'app/js/main.js': ["browserify"],
            'app/js/**/*.js': ["browserify"],
        },

       // browserify: {
       //   extensions: ['.js'],
       //   // ignore: ['path.join __dirname', 'components/angular-unstable/angular.js'],
       //   watch: true,
       //   debug: true,
       //   noParse: ['jquery']
       // },

        reporters: ['progress'],

        port: 9876,

        colors: true,

        logLevel: config.LOG_DEBUG,

        autoWatch: true,

        browsers: ['PhantomJS'],

        singleRun: false
    });
};
