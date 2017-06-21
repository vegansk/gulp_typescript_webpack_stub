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

const srcDir = "src";
const buildDir = "build";
const distDir = "dist";

const targetDir = (target) => (debug) => `${target}/${debug === "debug"? "debug" : "release"}`;
const tsOutDir = targetDir(buildDir);
const outDir = targetDir(distDir);

const tsTask = (debug, { watchMode = false } = {}, addOpts = {}) => () => {

  const tsProject = ts.createProject("tsconfig.json", addOpts);

  const task = () => gulp.src(`${srcDir}/**/*.ts`)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write(".", {includeContent: false, sourceRoot: `../../${srcDir}`}))
    .pipe(gulp.dest(tsOutDir(debug)));

  if(watchMode) {
    const queue = sequence(300);
    watch(`${srcDir}/**/*.ts`, {
      name: "TS",
      emitOnGlob: false
    }, queue.getHandler(`ts:${debug}`));
  } else
    task();
};

const webpackTask = (debug, { watchMode = false } = {}) => () => {
  const task = () => gulp.src(`${tsOutDir(debug)}/**/*.js`)
    .pipe(plumber())
    .pipe(clean(outDir(debug)))
        .pipe(webpackStream(
          Object.assign({}, webpackConfig(debug, tsOutDir(debug)), {
            watch: watchMode
          }),
          webpack
        ))
    .pipe(gulp.dest(outDir(debug)));
  return task();
};

const watchTask = (debug) => () => {
  var queue = sequence(300);
  watch(`${srcDir}/**/*.ts`, {
    name: "TS",
    emitOnGlob: false
  }, queue.getHandler(`ts:${debug}`));
  gulp.start(`build:${debug}:watch`);
};

gulp.task("ts:debug", tsTask("debug"));
gulp.task("ts:debug:watch", tsTask("debug", { watchMode: true }));
gulp.task("build:debug", ["ts:debug"], webpackTask("debug"));
gulp.task("build:debug:watch", webpackTask("debug", { watchMode: true }));
gulp.task("watch:debug", watchTask("debug"));
