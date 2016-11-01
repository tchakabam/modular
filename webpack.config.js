var path = require('path');

const library = 'modular';

function makeConfig({libraryTarget}) {
    return {
        entry: './index.js',
        output: {
            path: path.join(__dirname, 'build'),
            filename: library + '.' + libraryTarget + '.js',
            library: library,
            libraryTarget: libraryTarget
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