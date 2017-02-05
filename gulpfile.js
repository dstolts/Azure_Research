// gulp
var gulp = require('gulp');

// plugins
var connect = require('gulp-connect');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var KarmaServer = require('karma').Server;
var path = require('path');
var zip = require('gulp-zip');
var minimist = require('minimist');
var fs = require('fs');
var jsdoc = require('gulp-jsdoc3');

var knownOptions = {
	string: 'packageName',
	string: 'packagePath',
	default: {packageName: "Package.zip", packagePath: path.join(__dirname, '_package')}
}

var options = minimist(process.argv.slice(2), knownOptions);

// tasks
gulp.task('lint', function() {
  return gulp.src(['./app/**/*.js', '!./app/bower_components/**', '!./app/js/bundled.js', '!./app/js/**/*Spec.js', '!./app/docs/**'])
    .pipe(jshint({"browserify": true}))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});
gulp.task('clean', function() {
    return del(['./dist/*', './app/js/bundled.js', './_package/*']);
});

gulp.task('karma', function (done) {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});

gulp.task('minify-css', function() {
  var opts = {comments:true,spare:true};
  return gulp.src(['./app/**/*.css', '!./app/bower_components/**'])
    .pipe(minifyCSS(opts))
    .pipe(gulp.dest('./dist/'));
});
gulp.task('minify-js', function() {
  return gulp.src(['./app/**/*.js', '!./app/bower_components/**'])
    .pipe(uglify({
      // inSourceMap:
      // outSourceMap: "app.js.map"
    }))
    .pipe(gulp.dest('./dist/'));
});
gulp.task('copy-bower-components', function () {

  var dependencies = [
      'app/bower_components/jquery/dist/jquery.js',
      'app/bower_components/bootstrap/dist/js/bootstrap.js',
      'app/bower_components/bootstrap/dist/css/bootstrap.css',
      'app/bower_components/fontawesome/css/font-awesome.css',
      'app/bower_components/animate.css/animate.css'
      ];

  return gulp.src(dependencies, {base: 'app/'} )
    .pipe(gulp.dest('dist/'));

});

gulp.task('doc', function (cb) {
  var config = require('./jsdoc.json');
  gulp.src(['./server/api/*.js', './server/config/*.js'], {read: false})
      .pipe(jsdoc(config, cb));
});

gulp.task('copy-html-files', function () {
  return gulp.src('./app/**/*.html')
    .pipe(gulp.dest('dist/'));
});
gulp.task('connect', function () {
  plugins.nodemon({ script: 'server.js', ext: 'js', watch: ['server/'], env: {NODE_ENV : ''}, cwd: 'server/' })
          .on('change', ['default'])
          .on('restart', function () {
              console.log('[nodemon] restarted dev server');
          });
 });

gulp.task('connectDist', function () {
   plugins.nodemon({ script: 'server.js', ext: 'js', watch: ['server/'], env: {NODE_ENV : 'prod'}, cwd: 'server/' })
          .on('change', ['build'])
          .on('restart', function () {
              console.log('[nodemon] restarted dev server');
          });
});
gulp.task('browserify', function() {
  return gulp.src(['app/js/main.js'])
  .pipe(browserify({
    insertGlobals: true,
    debug: true
  }))
  .pipe(concat('bundled.js'))
  .pipe(gulp.dest('./app/js'));
});
gulp.task('browserifyDist', function() {
  return gulp.src(['app/js/main.js'])
  .pipe(browserify({
    insertGlobals: true
  }))
  .pipe(concat('bundled.js'))
  .pipe(gulp.dest('./dist/js'));
});

gulp.task('watch-dev', function () {
  gulp.watch('./app/**/*.js ', ['browserify']);
});

gulp.task('watch-dist', function () {
  gulp.watch('./app/**/*.js ', ['browserifyDist']);
})

gulp.task('package', function () {

	var packagePaths = ['**', 
          '!**/app/**', 
					'!**/_package/**', 
					'!**/typings/**',
          '!app', 
					'!typings', 
					'!_package', 
					'!gulpfile.js']
	
	//add exclusion patterns for all dev dependencies
	var packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
	var devDeps = packageJSON.devDependencies;

	for(var propName in devDeps)
	{
		var excludePattern1 = "!**/node_modules/" + propName + "/**";
		var excludePattern2 = "!**/node_modules/" + propName;
		packagePaths.push(excludePattern1);
		packagePaths.push(excludePattern2);
	}
	
    return gulp.src(packagePaths)
        .pipe(zip(options.packageName))
        .pipe(gulp.dest(options.packagePath));
});

// *** default task *** //
gulp.task('default', function() {
  process.env.NODE_ENV = '';
  runSequence(
    'clean', 'lint', 'browserify', ['connect', 'watch-dev']
  );
});
// *** build task *** //
gulp.task('build', function() {
  process.env.NODE_ENV = 'prod';
  return runSequence(
    'clean', 'lint', 'minify-css', 'browserifyDist', 'copy-html-files', 'copy-bower-components', ['connect', 'watch-dist']
  );
});

// *** build task *** //
gulp.task('run', function() {
  process.env.NODE_ENV = '';
  return runSequence(
    'clean', 'lint', 'minify-css', 'browserifyDist', 'copy-html-files', 'copy-bower-components', ['connect', 'watch-dev']
  );
});

  // *** deploy task *** //
gulp.task('deploy', function() {
  process.env.NODE_ENV = 'prod';
  return runSequence(
    'clean', 'lint', 'minify-css', 'browserifyDist', 'copy-html-files', 'copy-bower-components', 'package'
  );
});
