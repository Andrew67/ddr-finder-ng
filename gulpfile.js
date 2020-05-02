const gulp = require('gulp');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');

gulp.task('default', function () {
    // place code for your default task here
});

gulp.task('build', function () {
    const PREFIX = 'build/debug';

    return Promise.all([
        // Onsen UI
        gulp.src(['node_modules/onsenui/js/onsenui.js'])
            .pipe(gulp.dest(PREFIX + '/lib/onsen/js')),
        gulp.src('node_modules/onsenui/css/**')
            .pipe(gulp.dest(PREFIX + '/lib/onsen/css')),

        // Onsen UI Custom Theme
        gulp.src('onsenui-custom-theme/onsen-css-components.css')
            .pipe(rename('onsen-css-components-custom.css'))
            .pipe(gulp.dest(PREFIX + '/lib/onsen/css')),

        // Images
        gulp.src('src/img/**')
            .pipe(gulp.dest(PREFIX + '/img')),

        // My code
        gulp.src(['src/**/*.html', 'src/**/*.js', 'src/**/*.css', 'src/manifest.json'])
            .pipe(gulp.dest(PREFIX))
    ]);
});

gulp.task('build-release', function () {
    const PREFIX = 'build/release';

    return Promise.all([
        // Onsen UI
        gulp.src('node_modules/onsenui/js/onsenui.min.js')
            .pipe(rename('onsenui.js'))
            .pipe(gulp.dest(PREFIX + '/lib/onsen/js')),
        gulp.src('node_modules/onsenui/css/**/*.css')
            .pipe(cleanCSS())
            .pipe(gulp.dest(PREFIX + '/lib/onsen/css')),
        gulp.src('node_modules/onsenui/css/**/fonts/*')
            .pipe(gulp.dest(PREFIX + '/lib/onsen/css')),
        gulp.src('node_modules/onsenui/css/**/webfonts/*')
            .pipe(gulp.dest(PREFIX + '/lib/onsen/css')),

        // Onsen UI Custom Theme
        gulp.src('onsenui-custom-theme/onsen-css-components.css')
            .pipe(cleanCSS())
            .pipe(rename('onsen-css-components-custom.css'))
            .pipe(gulp.dest(PREFIX + '/lib/onsen/css')),

        // Images
        gulp.src('src/img/**')
            .pipe(gulp.dest(PREFIX + '/img')),

        // My code
        gulp.src('src/**/*.html')
            .pipe(htmlmin({
                collapseWhitespace: true,
                removeComments: true
            }))
            .pipe(gulp.dest(PREFIX)),
        gulp.src('src/**/*.js')
            .pipe(uglify())
            .pipe(gulp.dest(PREFIX)),
        gulp.src('src/**/*.css')
            .pipe(cleanCSS())
            .pipe(gulp.dest(PREFIX)),
        gulp.src(['src/manifest.json'])
            .pipe(gulp.dest(PREFIX))
    ]);
});

gulp.task('watch', function() {
    return gulp.watch(['src/**', 'onsenui-custom-theme/onsen-css-components.css'], gulp.series('build'));
});