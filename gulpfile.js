const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const ts = require("gulp-typescript");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const watch = require("gulp-watch");
const sequence = require('gulp-watch-sequence');
const clean = require("gulp-dest-clean");
const plumber = require('gulp-plumber');
const spawn = require('child_process').spawn;

const webpackConfig = require("./scripts/webpack-config.js");

const srcDir = "src";
const buildDir = "build";
const distDir = "dist";

const targetDir = (target) => (debug) => `${target}/${debug === "debug"? "debug" : "release"}`;
const tsOutDir = targetDir(buildDir);
const outDir = targetDir(distDir);

const tsTask = (debug, { watchMode = false } = {}) => () => {

  const tsProject = ts.createProject("tsconfig.json");

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

const tsExecTask = (debug, { watchMode = false } = {}) => (cb) => {
  const args = ["--outDir", tsOutDir(debug), "-p", "."].concat(
    watchMode ? ["--watch"] : []
  );
  const tsc = spawn("tsc", args, { stdio: "inherit" });
  tsc.on("close", (code) => {
    if(code !== 0)
      cb(new Error(`tsc exited with the code ${code}`));
    else
      cb();
  });
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
  gulp.start(`ts:${debug}:watch`);
  gulp.start(`build:${debug}:watch`);
};

gulp.task("ts:debug", tsExecTask("debug"));
gulp.task("ts:debug:watch", tsExecTask("debug", { watchMode: true }));
gulp.task("build:debug", ["ts:debug"], webpackTask("debug"));
gulp.task("build:debug:watch", webpackTask("debug", { watchMode: true }));
// The dependency is needed because watch task silently
// fails when target doesn't exist
gulp.task("watch:debug", ["build:debug"], watchTask("debug"));
