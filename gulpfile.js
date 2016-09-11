var gulp = require('gulp');
var rename = require('gulp-rename');
var cleanCSS = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var stylus = require('gulp-stylus');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');

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

    // Onsen UI Custom Theme
    gulp.src('stylus/onsen-custom-theme.styl')
        .pipe(stylus())
        .pipe(postcss([autoprefixer()]))
        .pipe(gulp.dest(PREFIX + '/css'));

    // Leaflet.loading
    gulp.src(['node_modules/leaflet-loading/src/Control.Loading.js', 'node_modules/leaflet-loading/src/Control.Loading.css'])
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-loading'));

    // add-to-homescreen
    gulp.src(['node_modules/add-to-homescreen/addtohomescreen.js', 'node_modules/add-to-homescreen/dist/style/addtohomescreen.css'])
        .pipe(gulp.dest(PREFIX + '/lib/ath'));

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

    // Onsen UI Custom Theme
    gulp.src('stylus/onsen-custom-theme.styl')
        .pipe(stylus())
        .pipe(postcss([autoprefixer()]))
        .pipe(cleanCSS())
        .pipe(gulp.dest(PREFIX + '/css'));

    // Leaflet.loading
    gulp.src('node_modules/leaflet-loading/src/Control.Loading.js')
        .pipe(uglify())
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-loading'));
    gulp.src('node_modules/leaflet-loading/src/Control.Loading.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-loading'));

    // add-to-homescreen
    gulp.src('node_modules/add-to-homescreen/dist/addtohomescreen.min.js')
        .pipe(rename('addtohomescreen.js'))
        .pipe(gulp.dest(PREFIX + '/lib/ath'));
    gulp.src('node_modules/add-to-homescreen/dist/style/addtohomescreen.css')
        .pipe(gulp.dest(PREFIX + '/lib/ath'));

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
    gulp.src(['src/manifest.json'])
        .pipe(gulp.dest(PREFIX));
});

gulp.task('watch', function() {
    gulp.watch(['src/**', 'stylus/*.styl'], ['build']);
});