@echo off
mkdir out
CMD /C babel .\src\ --out-file .\out\domParser.js --map-sources
CMD /C browserify .\out\domParser.js --s xmlParser | uglifyjs --compress --mangle > .\out\domParser-browser.js
copy /y .\src\*.html .\out\ 