mkdir out
babel .\src\ --out-file .\out\domParser.js --map-sources
browserify .\out\domParser.js  | uglifyjs --compress --mangle > .\out\domParser-browser.js