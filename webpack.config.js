var path = require('path');

const library = 'modular';

var glob = require("glob");

var entries = ['./index.js'];

function makeConfig(opts) {

	var libraryTarget = opts.libraryTarget;

    return {
        entry: entries,
        devtool: 'source-maps',
        output: {
            path: path.join(__dirname, 'build'),
            filename: library + '.' + libraryTarget + '.js',
            library,
            libraryTarget
        },
        module: {
            loaders: [
                {
                    exclude: /(node_modules|bower_components)/,
                    test: /\.js$/,
                    loader: 'babel-loader',
                    query: {
                        presets: ['es2015']
                    }
                }
            ]
        }
    }
}

module.exports = [
    makeConfig({libraryTarget: 'this'}), 
    //makeConfig({libraryTarget: 'var'}), 
    //makeConfig({libraryTarget: 'commonjs2'})
];