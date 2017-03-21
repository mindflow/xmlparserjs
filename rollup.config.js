import multiEntry from 'rollup-plugin-multi-entry';
import babel from 'rollup-plugin-babel';

export default {
    moduleName: 'xmlparser',
    entry: "src/main/**/*.js",
    dest: "umd/xmlparser.js",
    format: "umd",
    sourceMap: "inline",
    external: [ "coreutil" ],
    globals:{
        coreutil: "coreutil"
    },
    plugins: [
        multiEntry(),
        babel()
    ]
}
