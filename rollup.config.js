import multiEntry from 'rollup-plugin-multi-entry';
import postprocess from 'rollup-plugin-postprocess';

export default [{
    input: "src/**/*.js",
    external: [ 'coreutil_v1' ],
    output: {
        name: 'xmlparser_v1',
        file: "bundle/jsm/xmlparser_v1.js",
        sourcemap: "inline",
        format: "es"
    },
    plugins: [
        multiEntry(),
        postprocess([
            [/(?<=import\s*(.*)\s*from\s*)['"]((?!.*[.]js).*)['"];/, '\'./$2.js\'']
        ])
    ]
},{
    input: "src/**/*.js",
    external: [ 'coreutil_v1' ],
    output: {
        name: 'xmlparser_v1',
        file: "bundle/cjs/xmlparser_v1.js",
        sourcemap: "inline",
        format: "cjs"
    },
    plugins: [
        multiEntry()
    ]
}]
