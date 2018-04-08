import multiEntry from 'rollup-plugin-multi-entry';
import babel from 'rollup-plugin-babel';

export default {
    moduleName: 'xmlparser',
    input: "src/main/**/*.mjs",
    output: {
        file: "es_module/xmlparser.mjs",
        format: "es"
    },
    sourceMap: "inline",
    plugins: [
        multiEntry(),
        babel()
    ]
}
