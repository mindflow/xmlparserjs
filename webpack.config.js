var path = require('path');

module.exports = {
    entry: {
		xmlparser: "./target/xmlparser.js"
    },
    output: {
        filename: "xmlparser-browser.js",
        library: "xmlparser",
        libraryTarget: "var",
		path: path.resolve(__dirname, 'target')
    },
    externals: {
        "./coreutil": "coreutil"
    }
}
