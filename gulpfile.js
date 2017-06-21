const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const ts = require("gulp-typescript");
const gulpWebpack = require("webpack-stream");
const webpack = require("webpack");
const clean = require('gulp-dest-clean');

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
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write(".", {includeContent: false, sourceRoot: `../../${srcDir}`}))
    .pipe(gulp.dest(tsOutDir(debug)));
};

const webpackTask = (debug) => () => {
  return gulp.src(`${tsOutDir(debug)}/**/*.js`)
    .pipe(clean(outDir(debug)))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(gulpWebpack(webpackConfig(debug, tsOutDir(debug)), webpack))
    .pipe(sourcemaps.write(".", {includeContent: false, sourceRoot: `../../${srcDir}`}))
    .pipe(gulp.dest(outDir(debug)));
};

gulp.task("ts:debug", tsTask("debug"));
gulp.task("build:debug", ["ts:debug"], webpackTask("debug"));
