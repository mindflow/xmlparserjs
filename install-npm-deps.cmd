@echo off

echo "Installing rollup"
CMD /C npm install rollup -g

echo "Installing rollup multi entry"
CMD /C npm install rollup-plugin-multi-entry -g

echo "Installing coreutil"
CMD /C npm install ..\coreutiljs

echo "Install developer deps"
CMD /C npm install
