// Gulp
var gulp = require('gulp');

// Plugins

// gulp-load-plugins requires invocation, which is done immediately after
// `require` here
var plugins     = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();
var ftp         = require('vinyl-ftp');
var del         = require('del');
var gutil       = plugins.util;

// Globs
var devDir   = 'dev/';
var distDir  = 'dist/';
var htmlDev  = devDir + '*.html';
var cssDev   = devDir + 'css/*.css';
var jsDev    = devDir + 'js/*.js';
var imgDev   = devDir + 'img/*';
var htmlDist = distDir;
var cssDist  = distDir + 'css/';
var jsDist   = distDir + 'js/';
var imgDist  = distDir + 'img/';

// Environment variables
var env = gutil.env;
var productionMode = env.production || env.p || false;

// Config
var config = {
	useBabel: env.babel || env.b || false,
	babel: {
		presets: ['es2015']
	},
	htmlmin: {
		collapseWhitespace: true
	},
	htmlReplace: {
		'css': 	(productionMode) ? 'css/main.min.css' 	: 'css/main.css',
		'js' : 	(productionMode) ? 'js/main.min.js' 	: 'js/main.js'
	},
	autoprefixer: {
		browsers: ['last 2 versions']
	},
	imagemin: {
		progressive: true,
		interlaced: true,
		optimizationLevel: 3
	},
	browserSync: {
		// create static file server and serve files from baseDir
		server: {
			baseDir: './dist'
		}
		// alternatively you can use proxy (if you have file server already
		// or need back-end)
		// remove (or comment-out) `server` property above, uncomment
		// following line and insert your server address
		// proxy: 'yourlocal.dev'
	},
	// Replace `host`, `user` and `password` properties with your ftp credentials
	// You can experiment with `parallel` option to check if your server can
	// handle more requests at once. More requests = quicker upload.
	ftp: {
		host: 'hostname',
		user: 'username',
		password: 'password',
		parallel: 1,
		log: plugins.util.log
	}
};

// Tasks
/** Replaces filenames in html files  */
gulp.task('html', ['clean'], function() {
	return gulp.src(htmlDev)
		.pipe((productionMode) ? gutil.noop() : plugins.changed(htmlDist))
		.pipe((productionMode) ? plugins.htmlmin(config.htmlmin) : gutil.noop())
		.pipe(plugins.htmlReplace(config.htmlReplace))
        .pipe(gulp.dest(htmlDist));
});

/** Prefixes and minifies css files */
gulp.task('css', ['clean'], function() {
	return gulp.src(cssDev)
		.pipe((productionMode) ? gutil.noop() : plugins.changed(cssDist))
		.pipe(plugins.autoprefixer(config.autoprefixer))
        .pipe((productionMode) ? plugins.cssnano() : gutil.noop())
		.pipe((productionMode) ? plugins.rename('main.min.css') : gutil.noop())
        .pipe(gulp.dest(cssDist));
});

/** Minifies js files */
gulp.task('js', ['clean'], function() {
	return gulp.src(jsDev)
		.pipe(plugins.plumber())
		.pipe((productionMode) ? gutil.noop() : plugins.changed(jsDist))
		.pipe((config.useBabel) ? plugins.babel(config.babel) : gutil.noop())
		.pipe((productionMode) ? plugins.uglify() : gutil.noop())
		.pipe((productionMode) ? plugins.rename('main.min.js') : gutil.noop())
		.pipe(gulp.dest(jsDist));
});

/** Optimizes images */
gulp.task('img', ['clean'], function() {
	return gulp.src(imgDev)
		.pipe(plugins.changed(imgDist))
		.pipe(plugins.imagemin(config.imagemin))
        .pipe(gulp.dest(imgDist));
});

/** Clean distribution dir */
gulp.task('clean', function() {
	if (productionMode) {
		return del([
			distDir + '*'
		]);
	}
});

/** Shorthand for tasks above */
gulp.task('build', ['html', 'css', 'js', 'img']);

gulp.task('serve', ['build'], function() {
	var reload = browserSync.reload;

	// start browser-sync
	browserSync.init(config.browserSync);

	// watch changes in files from dev directories
	// on change, run corresponding task and reload browser
	gulp.watch(htmlDev, ['html']).on('change', reload);
	gulp.watch(cssDev, ['css']).on('change', reload);
	gulp.watch(jsDev, ['js']).on('change', reload);
});

/** Sends distribution directory contents to ftp server */
gulp.task('upload', ['build'], function() {
	var files = [
		htmlDist + '**',
		cssDist + '**',
		jsDist + '**',
		imgDist + '**'
	];

	var conn = ftp.create(config.ftp);

	return gulp.src(files, {buffer: false})
		.pipe(conn.newer('/public_html'))
		.pipe(conn.dest('/public_html'));
});

gulp.task('test', function() {
});
