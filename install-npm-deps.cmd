@echo off
echo "Installing rollup"
CMD /C npm install rollup

echo "Installing rollup multi entry"
CMD /C npm install rollup-plugin-multi-entry

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