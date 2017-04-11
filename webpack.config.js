/* webpack.config.js
 
	james.brunner@smithsmicrowave.com
 
	To build for development:
 
		$ npm run build:dev

	To build for production:

		$ npm run build

	Notes:

	Requires node, npm, webpack 2.

	Builds the source files from /source to this folder.

*/
var webpack = require('webpack');

var ExtractTextPlugin = require('extract-text-webpack-plugin');

var path = require('path');
var debug = process.env.NODE_ENV !== 'production';

var plugins = [ 
	new ExtractTextPlugin('style.css'),
	new webpack.ProvidePlugin({
		$: "jquery",
		jQuery: "jquery",
		"window.jQuery": "jquery"
	})
];

if (!debug) {
	plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
	plugins.push(new webpack.optimize.UglifyJsPlugin({ 
		mangle: false, 
		sourcemap: false 
	}));
}


module.exports = {
	context: path.join(__dirname, './source'),
	devtool: debug ? 'inline-sourcemap' : false,
	entry: {
		cme: './app.jsx'
	},
	output: {
		path: path.join(__dirname, './'),
		filename: 'bundle.js'
	},
	externals: {
		"jquery": "jQuery"
	},
	resolve: {
		extensions: [ '.js', '.jsx', '.styl' ],
		modules: [ path.join(__dirname, './source'), 'node_modules']
	},
	module: {
		rules: [
			{
				test: /\.jsx$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['es2015', 'react'],
						plugins: [require('babel-plugin-transform-object-assign')]
					}
				}
			},
			{
				test: /\.styl$/,
				exclude: /node_modules/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [{
							loader: 'css-loader', options: {
								sourceMap: debug
							}
						},{	
							loader: 'stylus-loader', options: {
								sourceMap: debug,
								compress: !debug
							}
					}]
				})
			}
		]
	},
	plugins: plugins
}