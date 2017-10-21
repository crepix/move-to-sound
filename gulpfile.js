"use strict";
var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require("del");
var fs = require("fs-extra");

var config = require("./tsconfig");
var tsProject = ts.createProject("tsconfig.json");

gulp.task("clean", (cb) => {
  del([config.compilerOptions.outDir], cb);
});

gulp.task("compile", (cb) => {
  console.log(config.filesGlob);
  return gulp.src(config.filesGlob)
    .pipe(tsProject()) // instead of gulp.src(...)
    .js
    .pipe(gulp.dest(config.compilerOptions.outDir));
});

gulp.task("build", ["clean", "compile"]);
