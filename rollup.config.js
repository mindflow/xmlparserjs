import multiEntry from 'rollup-plugin-multi-entry';
import * as path from 'path';

export default {
    moduleName: 'xmlparser',
    entry: "src/**/*.js",
    dest: "target/xmlparser.js",
    format: "umd",
    sourceMap: "inline",
    external: [ "coreutil" ],
    globals:{
        coreutil: "coreutil"
    },
    plugins: [
        multiEntry()
    ]
}
