@echo off

echo "Installing babel-cli"
CMD /C npm install babel-cli -g

echo "Installing babel latest preset"
CMD /C npm install babel-preset-latest -g

echo "Installing import ensure"
npm install babel-plugin-dynamic-import-webpack -g

echo "Install developer deps"
CMD /C npm install
