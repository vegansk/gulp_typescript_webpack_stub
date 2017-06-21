const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const ts = require("gulp-typescript");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const watch = require("gulp-watch");
const sequence = require('gulp-watch-sequence');
const clean = require("gulp-dest-clean");
const plumber = require('gulp-plumber');

const webpackConfig = require("./scripts/webpack-config.js");

const tsProject = ts.createProject("tsconfig.json");

const srcDir = "src";
const buildDir = "build";
const distDir = "dist";

const targetDir = (target) => (debug) => `${target}/${debug === "debug"? "debug" : "release"}`;
const tsOutDir = targetDir(buildDir);
const outDir = targetDir(distDir);

const tsTask = (debug) => () => {
  return gulp.src(`${srcDir}/**/*.ts`)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write(".", {includeContent: false, sourceRoot: `../../${srcDir}`}))
    .pipe(gulp.dest(tsOutDir(debug)));
};

const webpackTask = (debug) => () => {
  return gulp.src(`${tsOutDir(debug)}/**/*.js`)
    .pipe(plumber())
    .pipe(clean(outDir(debug)))
    .pipe(webpackStream(webpackConfig(debug, tsOutDir(debug)), webpack))
    .pipe(gulp.dest(outDir(debug)));
};

const watchTask = (debug) => () => {
  var queue = sequence(300);
  watch(`${srcDir}/**/*.ts`, {
    name: "TS",
    emitOnGlob: false
  }, queue.getHandler(`build:${debug}`));
  watch(`${tsOutDir(debug)}/**/*.ts`, {
    name: "JS",
    emitOnGlob: false
  }, queue.getHandler(`build:${debug}`));
};

gulp.task("ts:debug", tsTask("debug"));
gulp.task("build:debug", ["ts:debug"], webpackTask("debug"));
gulp.task("watch:debug", watchTask("debug"));
