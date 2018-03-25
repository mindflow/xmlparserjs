@echo off
echo "Installing rollup"
CMD /C npm install rollup

echo "Installing rollup multi entry"
CMD /C npm install rollup-plugin-multi-entry

echo "Installing rollup babel plugin"
CMD /C npm install rollup-plugin-babel

echo "Installing rollup babel latest preset"
CMD /C npm install babel-cli babel-preset-latest

echo "Installing rollup external helpers"
CMD /C npm install babel-plugin-external-helpers

echo "Installing jasmine"
CMD /C npm install jasmine
CMD /C ./node_modules/.bin/jasmine init

echo "Installing jasmine-node"
CMD /C npm install jasmine-node

echo "Installing coreutil"
CMD /C npm install ..\coreutiljs

echo "Build self"
CMD /C npm run build

echo "Install self"
CMD /C npm install .

echo "Test self"
CMD /C npm run test