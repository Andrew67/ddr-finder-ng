var gulp = require('gulp');
var rename = require('gulp-rename');
var cleanCSS = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');

gulp.task('default', function() {
    // place code for your default task here
});

gulp.task('build', function() {
    var PREFIX = 'build/debug';

    // Onsen UI
    gulp.src(['node_modules/onsenui/js/angular-onsenui.js', 'node_modules/onsenui/js/onsenui.js'])
        .pipe(gulp.dest(PREFIX + '/lib/onsen/js'));
    gulp.src('node_modules/onsenui/css/**')
        .pipe(gulp.dest(PREFIX + '/lib/onsen/css'));

    // Leaflet.loading
    gulp.src(['node_modules/leaflet-loading/src/Control.Loading.js', 'node_modules/leaflet-loading/src/Control.Loading.css'])
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-loading'));

    // Images
    gulp.src('src/img/**')
        .pipe(gulp.dest(PREFIX + '/img'));

    // My code
    gulp.src(['src/**/*.html', 'src/**/*.js', 'src/**/*.css', 'src/manifest.json'])
        .pipe(gulp.dest(PREFIX));
});

gulp.task('build-release', function() {
    var PREFIX = 'build/release';

    // Onsen UI
    gulp.src('node_modules/onsenui/js/angular-onsenui.min.js')
        .pipe(rename('angular-onsenui.js'))
        .pipe(gulp.dest(PREFIX + '/lib/onsen/js'));
    gulp.src('node_modules/onsenui/js/onsenui.min.js')
        .pipe(rename('onsenui.js'))
        .pipe(gulp.dest(PREFIX + '/lib/onsen/js'));
    gulp.src('node_modules/onsenui/css/**/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest(PREFIX + '/lib/onsen/css'));
    gulp.src('node_modules/onsenui/css/**/fonts/*')
        .pipe(gulp.dest(PREFIX + '/lib/onsen/css'));

    // Leaflet.loading
    gulp.src('node_modules/leaflet-loading/src/Control.Loading.js')
        .pipe(uglify())
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-loading'));
    gulp.src('node_modules/leaflet-loading/src/Control.Loading.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-loading'));

    // Images
    gulp.src('src/img/**')
        .pipe(gulp.dest(PREFIX + '/img'));

    // My code
    gulp.src('src/**/*.html')
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(gulp.dest(PREFIX));
    gulp.src('src/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(PREFIX));
    gulp.src('src/**/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest(PREFIX));
    gulp.src(['src/manifest.json', 'src/img/*'])
        .pipe(gulp.dest(PREFIX));
});

gulp.task('watch', function() {
    gulp.watch('src/**', ['build']);
});