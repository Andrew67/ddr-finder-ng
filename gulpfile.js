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

    // Onsen UI Custom Theme
    // gulp.src('onsenui-custom-theme/onsen-css-components.css')
    //     .pipe(rename('onsen-css-components-custom.css'))
    //     .pipe(gulp.dest(PREFIX + '/lib/onsen/css'));

    // Leaflet.EasyButton
    gulp.src(['node_modules/leaflet-easybutton/src/easy-button.js', 'node_modules/leaflet-easybutton/src/easy-button.css'])
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-easybutton'));

    // Leaflet.LocateControl
    gulp.src('node_modules/leaflet.locatecontrol/src/L.Control.Locate.js')
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-locatecontrol'));

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
    // gulp.src('onsenui-custom-theme/onsen-css-components.css')
    //     .pipe(cleanCSS())
    //     .pipe(rename('onsen-css-components-custom.css'))
    //     .pipe(gulp.dest(PREFIX + '/lib/onsen/css'));

    // Leaflet.EasyButton
    gulp.src('node_modules/leaflet-easybutton/src/easy-button.js')
        .pipe(uglify())
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-easybutton'));
    gulp.src('node_modules/leaflet-easybutton/src/easy-button.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-easybutton'));

    // Leaflet.LocateControl
    gulp.src('node_modules/leaflet.locatecontrol/dist/L.Control.Locate.min.js')
        .pipe(rename('L.Control.Locate.js'))
        .pipe(gulp.dest(PREFIX + '/lib/leaflet-locatecontrol'));

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
    gulp.watch(['src/**', 'onsenui-custom-theme/onsen-css-components.css'], ['build']);
});