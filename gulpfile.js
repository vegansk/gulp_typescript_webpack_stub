const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const ts = require("gulp-typescript");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const watch = require("gulp-watch");
const sequence = require('gulp-watch-sequence');
const clean = require("gulp-dest-clean");
const plumber = require("gulp-plumber");
const spawn = require("child_process").spawn;
const fs = require("fs");
const gutil = require("gulp-util");

const webpackConfig = require("./scripts/webpack-config.js");

const srcDir = "src";
const buildDir = "build";
const distDir = "dist";
const resources = [`${srcDir}/**/*`, `!${srcDir}/**/*.ts`];

const targetDir = (target) => (debug) => `${target}/${debug === "debug"? "debug" : "release"}`;
const tsOutDir = targetDir(buildDir);
const outDir = targetDir(distDir);

const PORT = process.env.PORT || 8080;

const copyResourcesTask = (debug, { watchMode = false } = {}) => () => {
  const task = () => gulp.src(resources)
    .pipe(gulp.dest(tsOutDir(debug)));
  if(watchMode)
    return watch(resources, task);
  else
    return task();
};

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
  const tsc = spawn("./node_modules/.bin/tsc", args, { stdio: "inherit" });
  tsc.on("close", (code) => {
    if(code !== 0)
      cb(new Error(`tsc exited with the code ${code}`));
    else
      cb();
  });
};

const webpackTask = (debug, { watchMode = false } = {}) => () => {
  const task = () => gulp.src(`${tsOutDir(debug)}/**/*`)
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

function isDirExist(dirName) {
  try {
    return fs.statSync(dirName).isDirectory();
  } catch (e) {
    if(e.code === "ENOENT")
      return false;
    throw e;
  }
}

function buildBeforeWatch(debug) {
  return new Promise((resolve, reject) => {
    if(isDirExist(tsOutDir(debug))) {
      resolve();
    } else {
      gutil.log("Perform intial build...");
      gulp.start(`build:${debug}`, (err) => {
        if(err)
          reject(err);
        else
          resolve();
      });
    }
  });
};

const watchTask = (debug) => () => {
  buildBeforeWatch(debug).then(() => {
    gulp.start(`res:${debug}:watch`);
    gulp.start(`ts:${debug}:watch`);
    gulp.start(`build:${debug}:watch`);
  });
};

const webpackDevServerTask = (debug) => () => {
  const config = webpackConfig(debug, tsOutDir(debug));
  config.entry.main.unshift(`webpack-dev-server/client?http://localhost:${PORT}/`);

  const server = new WebpackDevServer(
    webpack(config), {
      stats: {
        color: true
      },
      publicPath: "/",
      contentBase: outDir(debug),
      watchOptions: {
        aggregateTimeout: 300,
        poll: 1000,
        ignored: `${tsOutDir(debug)}/**/*`
      }
    }
  );
  server.listen(PORT);
};

const startTask = (debug) => () => {
  buildBeforeWatch(debug).then(() => {
    gulp.start(`res:${debug}:watch`);
    gulp.start(`ts:${debug}:watch`);
    gutil.log("Starting dev server...");
    gulp.start(`devServer:${debug}`);
  });
};

const createTasks = (debug) => {
  gulp.task(`res:${debug}`, copyResourcesTask(`${debug}`));
  gulp.task(`res:${debug}:watch`, copyResourcesTask(`${debug}`, { watchMode: true }));
  gulp.task(`ts:${debug}`, tsExecTask(`${debug}`));
  gulp.task(`ts:${debug}:watch`, tsExecTask(`${debug}`, { watchMode: true }));
  gulp.task(`build:${debug}`, [`res:${debug}`, `ts:${debug}`], webpackTask(`${debug}`));
  gulp.task(`build:${debug}:watch`, webpackTask(`${debug}`, { watchMode: true }));
  // The dependency is needed because watch task silently
  // fails when target doesn't exist
  gulp.task(`watch:${debug}`, watchTask(`${debug}`));
  gulp.task(`devServer:${debug}`, webpackDevServerTask(`${debug}`));
  gulp.task(`start:${debug}`, startTask(`${debug}`));
};

createTasks("debug");
createTasks("release");
