"use strict";

const { src, dest, parallel, series, watch } = require("gulp");
const browserSync = require("browser-sync").create();
const sass = require("gulp-sass")(require("sass"));
const plumber = require("gulp-plumber");
const autoprefixer = require("gulp-autoprefixer");
const rename = require("gulp-rename");
const cssnano = require("gulp-cssnano");
const sourcemaps = require("gulp-sourcemaps");
const fileinclude = require("gulp-file-include");
const svgSprite = require("gulp-svg-sprite");
const ttf2woff2 = require("gulp-ttf2woff2");
const webpack = require("webpack");
const webpackStream = require("webpack-stream");
let uglify = require("gulp-uglify-es").default;
const del = require("del");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const avif = require("gulp-avif");
const size = require("gulp-size");
const htmlmin = require("gulp-htmlmin");
const cssimport = require("gulp-cssimport");
const gulppug = require("gulp-pug");

// Paths
const srcPath = "src";
const distPath = "dist";

const path = {
  build: {
    html: `./${distPath}`,
    css: `./${distPath}/css`,
    js: `./${distPath}/js`,
    img: `./${distPath}/img`,
    imgBuild: [
      `./${distPath}/img/**/*.jpg`,
      `./${distPath}/img/**/*.jpeg`,
      `./${distPath}/img/**/*.png`,
      `./${distPath}/img/**/*.webp`,
      `./${distPath}/img/**/*.avif`,
      `./${distPath}/img/**/*.svg`,
    ],
    fonts: `./${distPath}/fonts`,
    resources: `./${distPath}`,
    partials: `./${distPath}`,
  },
  src: {
    html: [`./${srcPath}/index.html`, `./${srcPath}/pages/**/*.html`],
    pug: [`./${srcPath}/index.pug`, `./${srcPath}/pages/**/*.pug`],
    css: `./${srcPath}/css/**/*.css`,
    scss: `./${srcPath}/scss/**/*.scss`,
    js: `./${srcPath}/js/main.js`,
    fonts: `./${distPath}/fonts/**/*.ttf`,
    svg: `./${srcPath}/img/sprite/**/*.svg`,
    img: [
      `./${srcPath}/img/**/*.jpg`,
      `./${srcPath}/img/**/*.jpeg`,
      `./${srcPath}/img/**/*.png`,
      `./${srcPath}/img/svg/**/*.svg`,
    ],
    webp: [
      `./${srcPath}/img/**/*.jpg`,
      `./${srcPath}/img/**/*.jpeg`,
      `./${srcPath}/img/**/*.png`,
    ],
    avif: [
      `./${srcPath}/img/**/*.jpg`,
      `./${srcPath}/img/**/*.jpeg`,
      `./${srcPath}/img/**/*.png`,
    ],
    resources: `./${srcPath}/resources/**`,
    partials: `./${srcPath}/partials/**`,
  },
  clean: `./${distPath}/*`,
};

function liveServer() {
  browserSync.init({
    server: {
      baseDir: "./dist",
    },
  });
  watch(path.src.img, imgToDist);
  watch(path.src.svg, sprite);
  watch(path.src.resources, resources);
  watch(path.src.fonts, fonts);
  // watch(path.src.html, html);
  watch(path.src.pug, pug);
  watch(path.src.scss, scss);
  watch(path.src.scss, css);
  watch(path.src.js, js);
}

function clean() {
  return del(path.clean);
}

function scss() {
  return src(path.src.scss)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer({ cascade: false }))
    .pipe(
      cssnano({
        zindex: false,
        discardComments: {
          removeAll: true,
        },
      })
    )
    .pipe(
      rename({
        suffix: ".min",
        extname: ".css",
      })
    )
    .pipe(sourcemaps.write("."))
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream());
}

function scssBuild() {
  return src(path.src.scss)
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(
      cssnano({
        zindex: false,
        discardComments: {
          removeAll: true,
        },
      })
    )
    .pipe(
      rename({
        suffix: ".min",
        extname: ".css",
      })
    )
    .pipe(dest(path.build.css));
}

function css() {
  return src(path.src.css)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(cssimport())
    .pipe(autoprefixer({ cascade: false }))
    .pipe(size({ title: "До сжатия" }))
    .pipe(
      cssnano({
        zindex: false,
        discardComments: {
          removeAll: true,
        },
      })
    )
    .pipe(
      rename({
        suffix: ".min",
        extname: ".css",
      })
    )
    .pipe(size({ title: "После сжатия" }))
    .pipe(sourcemaps.write("."))
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream());
}

function cssBuild() {
  return src(path.src.css)
    .pipe(plumber())
    .pipe(cssimport())
    .pipe(autoprefixer({ cascade: false }))
    .pipe(size({ title: "До сжатия" }))
    .pipe(
      cssnano({
        zindex: false,
        discardComments: {
          removeAll: true,
        },
      })
    )
    .pipe(
      rename({
        suffix: ".min",
        extname: ".css",
      })
    )
    .pipe(size({ title: "После сжатия" }))
    .pipe(dest(path.build.css));
}

function html() {
  return src(path.src.html)
    .pipe(
      fileinclude({
        prefix: "@",
        basepath: "@file",
      })
    )
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream());
}

function htmlBuild() {
  return src(path.build.html + "/**/*.html")
    .pipe(size({ title: "До сжатия" }))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(size({ title: "После сжатия" }))
    .pipe(dest(path.build.html));
}

function pug() {
  return src(path.src.pug)
    .pipe(
      gulppug({
        pretty: true,
      })
    )
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream());
}

function js() {
  return src(path.src.js)
    .pipe(
      webpackStream({
        output: {
          filename: "main.js",
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /node_modules/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: [["@babel/preset-env", { targets: "defaults" }]],
                },
              },
            },
          ],
        },
      })
    )
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream());
}

function jsBuild() {
  return src(path.src.js)
    .pipe(
      webpackStream({
        output: {
          filename: "main.js",
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /node_modules/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: [["@babel/preset-env", { targets: "defaults" }]],
                },
              },
            },
          ],
        },
      })
    )
    .pipe(plumber())
    .pipe(uglify())
    .pipe(dest(path.build.js));
}

function imgToDist() {
  return src(path.src.img).pipe(dest(path.build.img));
}

function imgToWebp() {
  return src(path.src.webp).pipe(webp()).pipe(dest(path.build.img));
}

function imgToAvif() {
  return src(path.src.avif).pipe(avif()).pipe(dest(path.build.img));
}

function imgBuild() {
  return src(path.build.imgBuild).pipe(imagemin()).pipe(dest(path.build.img));
}

function sprite() {
  return src(path.src.svg)
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../sprite.svg",
          },
        },
      })
    )
    .pipe(dest(path.build.img));
}

function resources() {
  return src(path.src.resources).pipe(dest(path.build.resources));
}

function fonts() {
  return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts));
}

exports.clean = clean;
exports.imgToDist = imgToDist;
exports.sprite = sprite;
exports.resources = resources;
exports.fonts = fonts;
// exports.html = html;
exports.pug = pug;
exports.scss = scss;
exports.css = css;
exports.js = js;
exports.liveServer = liveServer;

exports.default = series(
  clean,
  parallel(imgToDist, imgToWebp, imgToAvif, sprite, resources, fonts),
  // html,
  pug,
  scss,
  css,
  js,
  liveServer
);

exports.build = series(
  clean,
  parallel(imgToDist, imgToWebp, imgToAvif, sprite, resources, fonts),
  // html,
  pug,
  htmlBuild,
  scssBuild,
  cssBuild,
  jsBuild,
  imgBuild
);

// .pipe(
// 	plumber({
// 		errorHandler: notify.onError((error) => ({
// 			title: "HTML",
// 			message: error.message,
// 		})),
// 	})
// )
