'use strict';

import gulp     from 'gulp';
import webpack  from 'webpack';
import path     from 'path';
import sync     from 'run-sequence';
import rename   from 'gulp-rename';
import template from 'gulp-template';
import fs       from 'fs';
import yargs    from 'yargs';
import lodash   from 'lodash';
import gutil    from 'gulp-util';
import serve    from 'browser-sync';
import del      from 'del';
import webpackDevMiddelware from 'webpack-dev-middleware';
import webpachHotMiddelware from 'webpack-hot-middleware';
import colorsSupported      from 'supports-color';
import historyApiFallback   from 'connect-history-api-fallback';
import mockMiddleware from './gulp/middleware';

let root = 'client';

// helper method for resolving paths
let resolveToApp = (glob = '') => {
    return path.join(root, 'app', glob); // app/{glob}
};

let resolveToComponents = (glob = '') => {
    return path.join(root, 'app/components', glob); // app/components/{glob}
};

// map of all paths
let paths = {
    js: resolveToComponents('**/*!(.spec.js).js'), // exclude spec files
    scss: resolveToApp('**/*.scss'), // stylesheets
    html: [
        resolveToApp('**/*.html'),
        path.join(root, 'index.html')
    ],
    entry: [
        'babel-polyfill',
        path.join(__dirname, root, 'app/app.js')
    ],
    output: root,
    blankTemplates: path.join(__dirname, 'generator', 'component/**/*.**'),
    dest: path.join(__dirname, 'dist')
};


// use webpack.config.js to build modules
gulp.task('webpack', ['clean'], (cb) => {
    const config = require('./webpack.dist.config');
    config.entry.app = paths.entry;

    webpack(config, (err, stats) => {
        if (err) {
            throw new gutil.PluginError("webpack", err);
        }

        gutil.log("[webpack]", stats.toString({
            colors: colorsSupported,
            chunks: false,
            errorDetails: true
        }));

        cb();
    });
});

//init bs
function initBs(bs, isloacl, compiler, config) {
    let conf = {
        port: process.env.PORT || 3000,
        open: isloacl ? "local" : "external",
        server: {
            baseDir: root,
            directory: true
        },
        middleware: [
            historyApiFallback(),
            webpackDevMiddelware(compiler, {
                stats: {
                    colors: colorsSupported,
                    chunks: false,
                    modules: false
                },
                publicPath: config.output.publicPath
            }),
            webpachHotMiddelware(compiler),
            mockMiddleware
        ]
    };

    // let Proxy = require('yamljs').load('./proxy.yml').proxy;
    //
    // if (isloacl || Proxy == '') {
    //     conf['server'] = {baseDir: root}
    // }else {
    //     conf['proxy']={
    //             target: Proxy,
    //             middleware: function (req, res, next) {
    //                 console.log(req.url);
    //                 next();
    //             }
    //         }
    // }

    bs.watch("proxy.yml").on("change", bs.reload);
    bs.init(conf);
}

gulp.task('serve', () => {
    const config = require('./webpack.dev.config');
    config.entry.app = [
        // this modules required to make HRM working
        // it responsible for all this webpack magic
        'webpack-hot-middleware/client?reload=true',
        // application entry point
    ].concat(paths.entry);

    var compiler = webpack(config);

    let bs = serve.create();

    initBs(bs, false, compiler, config)

    bs.reload();
});

gulp.task('serveLocal', () => {
    const config = require('./webpack.dev.config');
    config.entry.app = [
        // this modules required to make HRM working
        // it responsible for all this webpack magic
        'webpack-hot-middleware/client?reload=true',
        // application entry point
    ].concat(paths.entry);

    var compiler = webpack(config);

    let bs = serve.create();

    initBs(bs, true, compiler, config)

    bs.reload("*.html");
});

gulp.task('component', () => {
    const cap = (val) => {
        return val.charAt(0).toUpperCase() + val.slice(1);
    };
    const name = yargs.argv.name;
    const parentPath = yargs.argv.parent || '';
    const destPath = path.join(resolveToComponents(), parentPath, name);

    return gulp.src(paths.blankTemplates)
        .pipe(template({
            name: name,
            upCaseName: cap(name)
        }))
        .pipe(rename((path) => {
            path.basename = path.basename.replace('temp', name);
        }))
        .pipe(gulp.dest(destPath));
});

gulp.task('clean', (cb) => {
    del([paths.dest]).then(function (paths) {
        gutil.log("[clean]", paths);
        cb();
    })
});

gulp.task('default', ['serve']);
