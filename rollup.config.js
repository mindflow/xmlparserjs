import multi from '@rollup/plugin-multi-entry';
import replace from '@rollup/plugin-replace';
import { terser } from "rollup-plugin-terser";

export default [{
    input: "src/**/*.js",
    external: [ 'coreutil_v1' ],
    output: {
        name: 'xmlparser_v1',
        file: "dist/jsm/xmlparser_v1.js",
        sourcemap: "inline",
        format: "es"
    },
    plugins: [
        multi(),
        replace({
            'coreutil_v1': 'coreutilv1',

            'coreutilv1': './coreutil_v1.js'
        })
    ]
},{
    input: "src/**/*.js",
    external: [ 'coreutil_v1' ],
    output: {
        name: 'xmlparser_v1',
        file: "dist/jsm/xmlparser_v1.min.js",
        format: "es"
    },
    plugins: [
        multi(),
        replace({
            'coreutil_v1': 'coreutilv1',

            'coreutilv1': './coreutil_v1.js'
        }),
        terser()
    ]
},{
    input: "src/**/*.js",
    external: [ 'coreutil_v1' ],
    output: {
        name: 'xmlparser_v1',
        file: "dist/cjs/xmlparser_v1.js",
        sourcemap: "inline",
        format: "cjs"
    },
    plugins: [
        multi()
    ]
}]
