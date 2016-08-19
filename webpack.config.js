var webpack = require('webpack');
var path = require("path");

var WebpackDevServer = require("webpack-dev-server");

var tsSrcDir = path.join(__dirname, 'src', 'main', 'ts'),
    npmDir = path.join(__dirname, 'node_modules'),
    libDir = path.join(__dirname, 'lib');

var devServer = {
    quiet: false,
    stats: { colors: true },
    proxy: {
        '/intersystemsapi/*': {
            target: 'http://localhost:57772',//'http://198.211.125.30:57772',
            rewrite: function (req){
                // console.log('1. ' + req.url);
                // req.url = 'http://198.211.125.30:57772' + req.url.substring('/intersystemsapi/'.length-1, req.url.length);
				// req.url = 'http://localhost:57772' + req.url.substring('/intersystemsapi/'.length-1, req.url.length);
                // console.log('2. ' + req.url);
            }
        }
    },
    headers: {"Access-Control-Allow-Origin": "*"},
    host: '0.0.0.0'
}

var config = {
    entry: {
        isceditor: path.join(tsSrcDir, 'entry-points', 'isc-editor.ts')
    },
    resolve: {
        extensions: ['', '.ts', '.tsx', '.webpack.js', '.web.js', '.js'],
        alias: {
            'underscore': path.join(npmDir, 'underscore', 'underscore.js'),
            'jointjs': path.join(npmDir, 'jointjs', 'dist', 'joint.js'),
        }
    },
    module: {
        loaders: [
            {test: /\.ts$|\.tsx$/, loader: 'ts-loader'},
            {test: /\.css$/, loader: 'style-loader!css-loader'},
            {test: /\.scss$/, loaders: ["style", "css", "sass"]},
            {test: /\.jpe?g$|\.gif$|\.png$/i, loader: 'file?name=images/[name].[ext]'},
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            '$': 'jquery',
            '_': 'underscore',
            'Promise': 'exports?global.Promise!es6-promise' /* remove when IE support will be dropped */
        })
    ],
    output: {
        path: path.join(__dirname, "build", "webpack", "static", "webpack"),
        filename: "[name]-bundle.js",
        chunkFilename: "[id]-chunk.js",
        publicPath: "build/webpack/static/webpack/"
    },
    devtool: "#inline-source-map",
    devServer: devServer
};
module.exports = config;

var compiler = webpack(config);
var server = new WebpackDevServer(compiler, devServer);
server.listen(8080);
