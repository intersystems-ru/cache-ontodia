var webpack = require('webpack');
var path = require("path");

module.exports = {
    entry: {
        ontodia: path.join(__dirname, 'index.ts')
    },
    resolve: {
        extensions: ['', '.ts', '.tsx', '.webpack.js', '.web.js', '.js'],
        alias: {
            // 'underscore': path.join(npmDir, 'underscore', 'underscore.js'),
            // 'jointjs': path.join(npmDir, 'jointjs', 'dist', 'joint.js'),
            // 'waypoints': path.join(npmDir, 'waypoints', 'lib', 'noframework.waypoints.js')
        }
    },
    module: {
        loaders: [
            {test: /\.ts$|\.tsx$/, loader: 'ts-loader'},
            {test: /\.css$/, loader: 'style-loader!css-loader'},
            {test: /\.scss$/, loaders: ["style", "css", "sass"]},
            {test: /\.jpe?g$|\.gif$|\.png$/i, loader: 'file?name=images/[name].[ext]'},
            // {test: /\.jpe?g$|\.gif$|\.png$/i, loader: 'base64-loader'},
            {
                test: /[\/\\]noframework\.waypoints\.js$/,
                loader: 'exports?Waypoint=window.Waypoint,Context=window.Waypoint.Context'
            }
            //{ test: /jquery\.js$/, loader: "expose?$!expose?jQuery!jquery" }
        ]
    },
    plugins: [
        // new webpack.ProvidePlugin({
        //     '$': 'jquery',
        //     '_': 'underscore',
        //     'Promise': 'exports?global.Promise!es6-promise' /* remove when IE support will be dropped */
        // })
    ],
    output: {
        path: path.join(__dirname, "dist"),
        filename: "ontodia.bundle.js",
        library: "Ontodia",
        libraryTarget: "umd"
    },
    externals: {
        "backbone": {
            root: 'Backbone',
            commonjs2: 'backbone',
            commonjs: 'backbone',
            amd: 'backbone'
        },
        "jointjs": {
            root: 'jointjs',
            commonjs2: 'jointjs',
            commonjs: 'jointjs',
            amd: 'jointjs'
        },
        "react-dom": {
            root: 'ReactDOM',
            commonjs2: 'react-dom',
            commonjs: 'react-dom',
            amd: 'react-dom'
        },
        "jquery": {
            root: 'jQuery',
            commonjs2: 'jquery',
            commonjs: 'jquery',
            amd: 'jquery'
        },
        "intro.js": {
            root: 'introJs',
            commonjs2: 'intro.js',
            commonjs: 'intro.js',
            amd: 'intro.js'
        },
        jstree: 'jstree'
    },
    devtool: "#inline-source-map"
};
