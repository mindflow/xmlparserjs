@echo off

echo "Installing babel-cli"
CMD /C npm install babel-cli -g

echo "Installing babel latest preset"
CMD /C npm install babel-preset-latest -g

echo "Installing uglify-js"
CMD /C npm install uglify-js -g

echo "Installing browserify"
CMD /C npm install browserify -g

echo "Install developer deps"
CMD /C npm install
