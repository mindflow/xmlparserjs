var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

/* jshint esversion: 6 */

/**
 * Generic List class
 */
var List = function () {

    /**
     * Create new list and optionally assign existing array
     * 
     * @param {Array} values 
     */
    function List(values) {
        classCallCheck(this, List);

        if (values !== undefined && values instanceof Array) {
            this._list = values;
        } else {
            this._list = [];
        }
    }

    /**
     * Get value of position
     * 
     * @param {number} index 
     * @return {any}
     */


    createClass(List, [{
        key: "get",
        value: function get$$1(index) {
            return this._list[index];
        }

        /**
         * Set value on position
         * 
         * @param {number} index 
         * @param {any} value 
         */

    }, {
        key: "set",
        value: function set$$1(index, value) {
            this._list[index] = value;
        }

        /**
         * Add value to end of list
         * 
         * @param {any} value 
         */

    }, {
        key: "add",
        value: function add(value) {
            this._list.push(value);
        }

        /**
         * Get the size of the list
         * 
         * @return {number}
         */

    }, {
        key: "size",
        value: function size() {
            return this._list.length;
        }

        /**
         * Run the function for each value in the list
         * 
         * @param {function} listener - The function to call for each entry
         * @param {any} parent - The outer context passed into the function, function should return true to continue and false to break
         */

    }, {
        key: "forEach",
        value: function forEach(listener, parent) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this._list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var val = _step.value;

                    if (!listener(val, parent)) {
                        break;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }]);
    return List;
}();

/* jshint esversion: 6 */

var Logger = function () {
    function Logger() {
        classCallCheck(this, Logger);
    }

    createClass(Logger, null, [{
        key: 'disableDebug',
        value: function disableDebug() {
            Logger.debugEnabled = false;
        }
    }, {
        key: 'enableDebug',
        value: function enableDebug() {
            Logger.debugEnabled = true;
        }
    }, {
        key: 'log',
        value: function log(value) {
            console.log(value);
        }
    }, {
        key: 'debug',
        value: function debug(depth, value) {
            if (!Logger.debugEnabled) {
                return;
            }
            var line = '';
            line = line + depth;
            for (var i = 0; i < depth; i++) {
                line = line + ' ';
            }
            line = line + value;
            console.log(line);
        }
    }, {
        key: 'warn',
        value: function warn(value) {
            console.warn('------------------WARN------------------');
            console.warn(value);
            console.warn('------------------/WARN------------------');
        }
    }, {
        key: 'error',
        value: function error(value) {
            console.error('------------------ERROR------------------');
            console.error(value);
            console.error('------------------/ERROR------------------');
        }
    }, {
        key: 'showPos',
        value: function showPos(text, position) {
            if (!Logger.debugEnabled) {
                return;
            }
            var cursorLine = '';
            for (var i = 0; i < text.length; i++) {
                if (i == position) {
                    cursorLine = cursorLine + '+';
                } else {
                    cursorLine = cursorLine + ' ';
                }
            }
            console.log(cursorLine);
            console.log(text);
            console.log(cursorLine);
        }
    }]);
    return Logger;
}();
Logger.debugEanbled = false;

/* jshint esversion: 6 */

var Map = function () {
    function Map() {
        classCallCheck(this, Map);

        this._map = {};
    }

    createClass(Map, [{
        key: "size",
        value: function size() {
            return Object.keys(this._map).length;
        }
    }, {
        key: "get",
        value: function get$$1(name) {
            return this._map[name];
        }
    }, {
        key: "set",
        value: function set$$1(name, value) {
            this._map[name] = value;
        }
    }, {
        key: "contains",
        value: function contains(name) {
            return this.exists(name);
        }
    }, {
        key: "exists",
        value: function exists(name) {
            if (name in this._map) {
                return true;
            }
            return false;
        }
    }, {
        key: "forEach",
        value: function forEach(listener, parent) {
            for (var key in this._map) {
                if (!listener(key, this._map[key], parent)) {
                    break;
                }
            }
        }
    }, {
        key: "addAll",
        value: function addAll(sourceMap) {
            sourceMap.forEach(function (key, value, parent) {
                parent.set(key, value);
            }, this);
        }
    }]);
    return Map;
}();

/* jshint esversion: 6 */

var ObjectFunction = function () {
    function ObjectFunction(theObject, theFunction) {
        classCallCheck(this, ObjectFunction);

        this._object = theObject;
        this._function = theFunction;
    }

    createClass(ObjectFunction, [{
        key: "getObject",
        value: function getObject() {
            return this._object;
        }
    }, {
        key: "getFunction",
        value: function getFunction() {
            return this._function;
        }
    }, {
        key: "call",
        value: function call(params) {
            this._function.call(this._object, params);
        }
    }]);
    return ObjectFunction;
}();

/* jshint esversion: 6 */

var PropertyAccessor = function () {
    function PropertyAccessor() {
        classCallCheck(this, PropertyAccessor);
    }

    createClass(PropertyAccessor, null, [{
        key: 'getValue',
        value: function getValue(destination, name) {
            var pathArray = name.split('.');
            for (var i = 0, n = pathArray.length; i < n; ++i) {
                var key = pathArray[i];
                if (key in destination) {
                    destination = destination[key];
                } else {
                    return;
                }
            }
            return destination;
        }
    }, {
        key: 'setValue',
        value: function setValue(destination, name, value) {
            var pathArray = name.split('.');
            for (var i = 0, n = pathArray.length; i < n; ++i) {
                var key = pathArray[i];
                if (i == n - 1) {
                    destination[key] = value;
                    return;
                }
                if (!(key in destination) || destination[key] === null) {
                    destination[key] = {};
                }
                destination = destination[key];
            }
        }
    }]);
    return PropertyAccessor;
}();

/* jshint esversion: 6 */

var StringUtils = function () {
    function StringUtils() {
        classCallCheck(this, StringUtils);
    }

    createClass(StringUtils, null, [{
        key: "isInAlphabet",
        value: function isInAlphabet(val) {
            if (val.charCodeAt(0) >= 65 && val.charCodeAt(0) <= 90) {
                return true;
            }
            if (val.charCodeAt(0) >= 97 && val.charCodeAt(0) <= 122) {
                return true;
            }
            if (val.charCodeAt(0) >= 48 && val.charCodeAt(0) <= 57) {
                return true;
            }
            return false;
        }
    }]);
    return StringUtils;
}();

var Url = function () {
    function Url(protocol, domain, pathList, parameterMap, bookmark) {
        classCallCheck(this, Url);

        this._protocol = protocol;
        this._domain = domain;
        this._pathList = pathList;
        this._parameterMap = parameterMap;
        this._bookmark = bookmark;
    }

    /**
     * Parse value
     * 
     * @param {Object} value 
     */


    createClass(Url, [{
        key: "getProtocol",
        value: function getProtocol() {
            return this._protocol;
        }
    }, {
        key: "getDomain",
        value: function getDomain() {
            return this._domain;
        }
    }, {
        key: "getPathList",
        value: function getPathList() {
            return this._pathList;
        }
    }, {
        key: "getParameterMap",
        value: function getParameterMap() {
            return this._parameterMap;
        }
    }, {
        key: "getBookmark",
        value: function getBookmark() {
            return this._bookmark;
        }

        /**
         * Returns the url object if it produces the url equal to the value
         * 
         * @param {string} value 
         */

    }, {
        key: "validate",
        value: function validate(value) {
            return this;
        }
    }, {
        key: "toString",
        value: function toString() {
            var url = "";
            if (this.getProtocol() !== null && this.getProtocol() !== undefined) {
                url = url + this.getProtocol() + "://";
            }
            if (this.getDomain() !== null && this.getDomain() !== undefined) {
                url = url + this.getDomain();
            }
            if (this.getPathList() !== null && this.getPathList() !== undefined && this.getPathList().size() > 0) {
                this.getPathList().forEach(function (path, parent) {
                    url = url + "/" + path;
                    return true;
                }, this);
            }
            if (this.getParameterMap() !== null && this.getParameterMap() !== undefined && this.getParameterMap().size() > 0) {
                url = url + "?";
                this.getParameterMap().forEach(function (key, value, parent) {
                    if (url.charAt(url.length - 1) !== "?") {
                        url = url + "&";
                    }
                    url = url + key + "=" + value;
                    return true;
                }, this);
            }
            if (this.getBookmark() !== null && this.getBookmark() !== null) {}
            return url;
        }
    }], [{
        key: "parseUrl",
        value: function parseUrl(value) {
            if (typeof value === 'string' || s instanceof String) {
                return Url.parseUrlString(value);
            }
            return null;
        }

        /**
         * Parse url from string
         * 
         * @param {string} value 
         */

    }, {
        key: "parseUrlString",
        value: function parseUrlString(value) {
            return new Url(Url.detectProtocol(value), Url.detectDomain(value), Url.detectPathList(value), Url.detectParamterMap(value), Url.detectBookmark(value));
        }

        /**
         * Detect protocol
         * 
         * @param {string} value 
         */

    }, {
        key: "detectProtocol",
        value: function detectProtocol(value) {
            var index = value.indexOf("://");
            if (index !== -1) {
                return value.substring(0, index);
            }
            return null;
        }

        /**
         * Detect domain
         * 
         * @param {string} value 
         */

    }, {
        key: "detectDomain",
        value: function detectDomain(value) {
            var endOfDomain = value.length;
            if (value.indexOf("://") !== -1) {
                value = value.substring(value.indexOf("://") + 3, value.length);
            }
            if (value.indexOf("/") !== -1) {
                endOfDomain = value.indexOf("/");
            }
            return value.substring(0, endOfDomain);
        }

        /**
         * Detect path list
         * 
         * @param {string} value 
         */

    }, {
        key: "detectPathList",
        value: function detectPathList(value) {
            var endOfPath = value.length;
            if (value.indexOf("://") !== -1) {
                value = value.substring(value.indexOf("://") + 3, value.length);
            }

            if (value.indexOf("/") !== -1) {
                value = value.substring(value.indexOf("/") + 1, value.length);
            } else {
                return new List();
            }

            if (value.indexOf("?") !== -1) {
                value = value.substring(0, value.indexOf("?"));
            } else if (value.indexOf("#") !== -1) {
                value = value.substring(0, value.indexOf("#"));
            }

            return new List(value.split("/"));
        }

        /**
         * Detect parameter map
         * 
         * @param {string} value 
         */

    }, {
        key: "detectParamterMap",
        value: function detectParamterMap(value) {
            var endOfPath = value.length;
            if (value.indexOf("://") !== -1) {
                value = value.substring(value.indexOf("://") + 3, value.length);
            }

            if (value.indexOf("/") !== -1) {
                value = value.substring(value.indexOf("/") + 1, value.length);
            } else {
                return new Map();
            }

            if (value.indexOf("?") !== -1) {
                value = value.substring(value.indexOf("?") + 1, value.length);
            } else {
                return new Map();
            }

            if (value.indexOf("#") !== -1) {
                value = value.substring(0, value.indexOf("#"));
            }

            var map = new Map();
            new List(value.split("&")).forEach(function (part, parent) {
                if (part.indexOf("=") != -1) {
                    map.set(part.split("=")[0], part.split("=")[1]);
                } else {
                    map.set(part, "");
                }
                return true;
            }, this);
            return map;
        }

        /**
         * Detect bookmark
         * 
         * @param {string} value 
         */

    }, {
        key: "detectBookmark",
        value: function detectBookmark(value) {
            var endOfPath = value.length;
            if (value.indexOf("://") !== -1) {
                value = value.substring(value.indexOf("://") + 3, value.length);
            }

            if (value.indexOf("/") !== -1) {
                value = value.substring(value.indexOf("/") + 1, value.length);
            } else {
                return new List();
            }

            if (value.indexOf("#") !== -1) {
                value = value.substring(value.indexOf("#") + 1, value.length);
            } else {
                return null;
            }

            return value;
        }
    }]);
    return Url;
}();

export { List, Logger, Map, ObjectFunction, PropertyAccessor, StringUtils, Url };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZXV0aWwubWpzIiwic291cmNlcyI6WyIuLi9zcmMvbWFpbi9jb3JldXRpbC9saXN0Lm1qcyIsIi4uL3NyYy9tYWluL2NvcmV1dGlsL2xvZ2dlci5tanMiLCIuLi9zcmMvbWFpbi9jb3JldXRpbC9tYXAubWpzIiwiLi4vc3JjL21haW4vY29yZXV0aWwvb2JqZWN0RnVuY3Rpb24ubWpzIiwiLi4vc3JjL21haW4vY29yZXV0aWwvcHJvcGVydHlBY2Nlc3Nvci5tanMiLCIuLi9zcmMvbWFpbi9jb3JldXRpbC9zdHJpbmdVdGlscy5tanMiLCIuLi9zcmMvbWFpbi9jb3JldXRpbC91cmwubWpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuLyoqXG4gKiBHZW5lcmljIExpc3QgY2xhc3NcbiAqL1xuZXhwb3J0IGNsYXNzIExpc3Qge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5ldyBsaXN0IGFuZCBvcHRpb25hbGx5IGFzc2lnbiBleGlzdGluZyBhcnJheVxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlcyBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZXMpIHtcbiAgICAgICAgaWYodmFsdWVzICE9PSB1bmRlZmluZWQgJiYgdmFsdWVzIGluc3RhbmNlb2YgQXJyYXkpe1xuICAgICAgICAgICAgdGhpcy5fbGlzdCA9IHZhbHVlcztcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB0aGlzLl9saXN0ID0gW107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdmFsdWUgb2YgcG9zaXRpb25cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggXG4gICAgICogQHJldHVybiB7YW55fVxuICAgICAqL1xuICAgIGdldChpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbGlzdFtpbmRleF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHZhbHVlIG9uIHBvc2l0aW9uXG4gICAgICogXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBcbiAgICAgKi9cbiAgICBzZXQoaW5kZXgsdmFsdWUpIHtcbiAgICAgICAgdGhpcy5fbGlzdFtpbmRleF0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgdmFsdWUgdG8gZW5kIG9mIGxpc3RcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2FueX0gdmFsdWUgXG4gICAgICovXG4gICAgYWRkKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2xpc3QucHVzaCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBzaXplIG9mIHRoZSBsaXN0XG4gICAgICogXG4gICAgICogQHJldHVybiB7bnVtYmVyfVxuICAgICAqL1xuICAgIHNpemUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9saXN0Lmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSdW4gdGhlIGZ1bmN0aW9uIGZvciBlYWNoIHZhbHVlIGluIHRoZSBsaXN0XG4gICAgICogXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGlzdGVuZXIgLSBUaGUgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCBlbnRyeVxuICAgICAqIEBwYXJhbSB7YW55fSBwYXJlbnQgLSBUaGUgb3V0ZXIgY29udGV4dCBwYXNzZWQgaW50byB0aGUgZnVuY3Rpb24sIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gdHJ1ZSB0byBjb250aW51ZSBhbmQgZmFsc2UgdG8gYnJlYWtcbiAgICAgKi9cbiAgICBmb3JFYWNoKGxpc3RlbmVyLHBhcmVudCkge1xuICAgICAgICBmb3IobGV0IHZhbCBvZiB0aGlzLl9saXN0KSB7XG4gICAgICAgICAgICBpZighbGlzdGVuZXIodmFsLHBhcmVudCkpe1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBMb2dnZXJ7XG5cbiAgICBzdGF0aWMgZGlzYWJsZURlYnVnKCkge1xuICAgICAgICBMb2dnZXIuZGVidWdFbmFibGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGVuYWJsZURlYnVnKCkge1xuICAgICAgICBMb2dnZXIuZGVidWdFbmFibGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbG9nKHZhbHVlKXtcbiAgICAgICAgY29uc29sZS5sb2codmFsdWUpO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZWJ1ZyhkZXB0aCwgdmFsdWUpe1xuICAgICAgICBpZighTG9nZ2VyLmRlYnVnRW5hYmxlZCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxpbmUgPSAnJztcbiAgICAgICAgbGluZSA9IGxpbmUgKyBkZXB0aDtcbiAgICAgICAgZm9yKGxldCBpID0gMCA7IGkgPCBkZXB0aCA7IGkrKyl7XG4gICAgICAgICAgICBsaW5lID0gbGluZSArICcgJztcbiAgICAgICAgfVxuICAgICAgICBsaW5lID0gbGluZSArIHZhbHVlO1xuICAgICAgICBjb25zb2xlLmxvZyhsaW5lKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgd2Fybih2YWx1ZSl7XG4gICAgICAgIGNvbnNvbGUud2FybignLS0tLS0tLS0tLS0tLS0tLS0tV0FSTi0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgICAgICBjb25zb2xlLndhcm4odmFsdWUpO1xuICAgICAgICBjb25zb2xlLndhcm4oJy0tLS0tLS0tLS0tLS0tLS0tLS9XQVJOLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGVycm9yKHZhbHVlKXtcbiAgICAgICAgY29uc29sZS5lcnJvcignLS0tLS0tLS0tLS0tLS0tLS0tRVJST1ItLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICAgICAgY29uc29sZS5lcnJvcih2YWx1ZSk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJy0tLS0tLS0tLS0tLS0tLS0tLS9FUlJPUi0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgIH1cblxuICAgIHN0YXRpYyBzaG93UG9zKHRleHQscG9zaXRpb24pe1xuICAgICAgICBpZighTG9nZ2VyLmRlYnVnRW5hYmxlZCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGN1cnNvckxpbmUgPSAnJztcbiAgICAgICAgZm9yKGxldCBpID0gMCA7IGkgPCB0ZXh0Lmxlbmd0aCA7IGkrKykge1xuICAgICAgICAgICAgaWYoaSA9PSBwb3NpdGlvbil7XG4gICAgICAgICAgICAgICAgY3Vyc29yTGluZSA9IGN1cnNvckxpbmUgKyAnKyc7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBjdXJzb3JMaW5lID0gY3Vyc29yTGluZSArICcgJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhjdXJzb3JMaW5lKTtcbiAgICAgICAgY29uc29sZS5sb2codGV4dCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGN1cnNvckxpbmUpO1xuXG4gICAgfVxuXG59XG5Mb2dnZXIuZGVidWdFYW5ibGVkID0gZmFsc2U7XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBNYXAge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX21hcCA9IHt9O1xuICAgIH1cblxuICAgIHNpemUoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLl9tYXApLmxlbmd0aDtcbiAgICB9XG5cbiAgICBnZXQobmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwW25hbWVdO1xuICAgIH1cblxuICAgIHNldChuYW1lLHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX21hcFtuYW1lXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGNvbnRhaW5zKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhpc3RzKG5hbWUpO1xuICAgIH1cblxuICAgIGV4aXN0cyhuYW1lKXtcbiAgICAgICAgaWYgKG5hbWUgaW4gdGhpcy5fbWFwKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZm9yRWFjaChsaXN0ZW5lcixwYXJlbnQpIHtcbiAgICAgICAgZm9yKGxldCBrZXkgaW4gdGhpcy5fbWFwKSB7XG4gICAgICAgICAgICBpZighbGlzdGVuZXIoa2V5LHRoaXMuX21hcFtrZXldLHBhcmVudCkpe1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYWRkQWxsKHNvdXJjZU1hcCl7XG4gICAgICAgIHNvdXJjZU1hcC5mb3JFYWNoKGZ1bmN0aW9uKGtleSx2YWx1ZSxwYXJlbnQpIHtcbiAgICAgICAgICAgIHBhcmVudC5zZXQoa2V5LHZhbHVlKTtcbiAgICAgICAgfSx0aGlzKTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIE9iamVjdEZ1bmN0aW9ue1xuXG4gICAgY29uc3RydWN0b3IodGhlT2JqZWN0LHRoZUZ1bmN0aW9uKXtcbiAgICAgICAgdGhpcy5fb2JqZWN0ID0gdGhlT2JqZWN0O1xuICAgICAgICB0aGlzLl9mdW5jdGlvbiA9IHRoZUZ1bmN0aW9uO1xuICAgIH1cblxuICAgIGdldE9iamVjdCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5fb2JqZWN0O1xuICAgIH1cblxuICAgIGdldEZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB0aGlzLl9mdW5jdGlvbjtcbiAgICB9XG5cbiAgICBjYWxsKHBhcmFtcyl7XG4gICAgICAgIHRoaXMuX2Z1bmN0aW9uLmNhbGwodGhpcy5fb2JqZWN0LHBhcmFtcyk7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eUFjY2Vzc29ye1xuXG4gICAgc3RhdGljIGdldFZhbHVlKGRlc3RpbmF0aW9uLCBuYW1lKSB7XG4gICAgICAgIHZhciBwYXRoQXJyYXkgPSBuYW1lLnNwbGl0KCcuJyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gcGF0aEFycmF5Lmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgdmFyIGtleSA9IHBhdGhBcnJheVtpXTtcbiAgICAgICAgICAgIGlmIChrZXkgaW4gZGVzdGluYXRpb24pIHtcbiAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbiA9IGRlc3RpbmF0aW9uW2tleV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVzdGluYXRpb247XG4gICAgfVxuXG4gICAgc3RhdGljIHNldFZhbHVlKGRlc3RpbmF0aW9uLCBuYW1lLCB2YWx1ZSkge1xuICAgICAgICB2YXIgcGF0aEFycmF5ID0gbmFtZS5zcGxpdCgnLicpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IHBhdGhBcnJheS5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBwYXRoQXJyYXlbaV07XG4gICAgICAgICAgICBpZihpID09IG4tMSl7XG4gICAgICAgICAgICAgICAgZGVzdGluYXRpb25ba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghKGtleSBpbiBkZXN0aW5hdGlvbikgfHwgZGVzdGluYXRpb25ba2V5XSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uW2tleV0gPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlc3RpbmF0aW9uID0gZGVzdGluYXRpb25ba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5leHBvcnQgY2xhc3MgU3RyaW5nVXRpbHN7XG5cbiAgICBzdGF0aWMgaXNJbkFscGhhYmV0KHZhbCkge1xuICAgICAgICBpZiAodmFsLmNoYXJDb2RlQXQoMCkgPj0gNjUgJiYgdmFsLmNoYXJDb2RlQXQoMCkgPD0gOTApIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICggdmFsLmNoYXJDb2RlQXQoMCkgPj0gOTcgJiYgdmFsLmNoYXJDb2RlQXQoMCkgPD0gMTIyICkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCB2YWwuY2hhckNvZGVBdCgwKSA+PSA0OCAmJiB2YWwuY2hhckNvZGVBdCgwKSA8PSA1NyApIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4iLCJpbXBvcnQge0xpc3R9IGZyb20gXCIuL2xpc3QubWpzXCI7XHJcbmltcG9ydCB7TWFwfSBmcm9tIFwiLi9tYXAubWpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgVXJsIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90b2NvbCwgZG9tYWluLCBwYXRoTGlzdCwgcGFyYW1ldGVyTWFwLCBib29rbWFyaykge1xyXG4gICAgICAgIHRoaXMuX3Byb3RvY29sID0gcHJvdG9jb2w7XHJcbiAgICAgICAgdGhpcy5fZG9tYWluID0gZG9tYWluO1xyXG4gICAgICAgIHRoaXMuX3BhdGhMaXN0ID0gcGF0aExpc3Q7XHJcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyTWFwID0gcGFyYW1ldGVyTWFwO1xyXG4gICAgICAgIHRoaXMuX2Jvb2ttYXJrID0gYm9va21hcms7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZSB2YWx1ZVxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBwYXJzZVVybCh2YWx1ZSkge1xyXG4gICAgICAgIGlmKHR5cGVvZih2YWx1ZSkgPT09ICdzdHJpbmcnIHx8IHMgaW5zdGFuY2VvZiBTdHJpbmcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFVybC5wYXJzZVVybFN0cmluZyh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGFyc2UgdXJsIGZyb20gc3RyaW5nXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHBhcnNlVXJsU3RyaW5nKHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBVcmwoXHJcbiAgICAgICAgICAgIFVybC5kZXRlY3RQcm90b2NvbCh2YWx1ZSksXHJcbiAgICAgICAgICAgIFVybC5kZXRlY3REb21haW4odmFsdWUpLFxyXG4gICAgICAgICAgICBVcmwuZGV0ZWN0UGF0aExpc3QodmFsdWUpLFxyXG4gICAgICAgICAgICBVcmwuZGV0ZWN0UGFyYW10ZXJNYXAodmFsdWUpLFxyXG4gICAgICAgICAgICBVcmwuZGV0ZWN0Qm9va21hcmsodmFsdWUpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERldGVjdCBwcm90b2NvbFxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkZXRlY3RQcm90b2NvbCh2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IHZhbHVlLmluZGV4T2YoXCI6Ly9cIik7XHJcbiAgICAgICAgaWYoaW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5zdWJzdHJpbmcoMCxpbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGV0ZWN0IGRvbWFpblxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkZXRlY3REb21haW4odmFsdWUpIHtcclxuICAgICAgICB2YXIgZW5kT2ZEb21haW4gPSB2YWx1ZS5sZW5ndGg7XHJcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIjovL1wiKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIjovL1wiKSArIDMsdmFsdWUubGVuZ3RoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIi9cIikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgIGVuZE9mRG9tYWluID0gdmFsdWUuaW5kZXhPZihcIi9cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2YWx1ZS5zdWJzdHJpbmcoMCxlbmRPZkRvbWFpbik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZXRlY3QgcGF0aCBsaXN0XHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRldGVjdFBhdGhMaXN0KHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGVuZE9mUGF0aCA9IHZhbHVlLmxlbmd0aDtcclxuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiOi8vXCIpICE9PSAtMSkge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiOi8vXCIpICsgMyx2YWx1ZS5sZW5ndGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIi9cIikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKHZhbHVlLmluZGV4T2YoXCIvXCIpICsgMSx2YWx1ZS5sZW5ndGgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTGlzdCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIj9cIikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDAsdmFsdWUuaW5kZXhPZihcIj9cIikpO1xyXG4gICAgICAgIH0gZWxzZSBpZih2YWx1ZS5pbmRleE9mKFwiI1wiKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcoMCx2YWx1ZS5pbmRleE9mKFwiI1wiKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IExpc3QodmFsdWUuc3BsaXQoXCIvXCIpKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBEZXRlY3QgcGFyYW1ldGVyIG1hcFxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkZXRlY3RQYXJhbXRlck1hcCh2YWx1ZSkge1xyXG4gICAgICAgIHZhciBlbmRPZlBhdGggPSB2YWx1ZS5sZW5ndGg7XHJcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIjovL1wiKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIjovL1wiKSArIDMsdmFsdWUubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCIvXCIpICE9PSAtMSkge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiL1wiKSArIDEsdmFsdWUubGVuZ3RoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hcCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIj9cIikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKHZhbHVlLmluZGV4T2YoXCI/XCIpKzEsdmFsdWUubGVuZ3RoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hcCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiI1wiKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcoMCx2YWx1ZS5pbmRleE9mKFwiI1wiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBtYXAgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgbmV3IExpc3QodmFsdWUuc3BsaXQoXCImXCIpKS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQscGFyZW50KSB7XHJcbiAgICAgICAgICAgIGlmKHBhcnQuaW5kZXhPZihcIj1cIikgIT0gLTEpe1xyXG4gICAgICAgICAgICAgICAgbWFwLnNldChwYXJ0LnNwbGl0KFwiPVwiKVswXSxwYXJ0LnNwbGl0KFwiPVwiKVsxXSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBtYXAuc2V0KHBhcnQsXCJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSx0aGlzKTtcclxuICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGV0ZWN0IGJvb2ttYXJrXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRldGVjdEJvb2ttYXJrKHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGVuZE9mUGF0aCA9IHZhbHVlLmxlbmd0aDtcclxuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiOi8vXCIpICE9PSAtMSkge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiOi8vXCIpICsgMyx2YWx1ZS5sZW5ndGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIi9cIikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKHZhbHVlLmluZGV4T2YoXCIvXCIpICsgMSx2YWx1ZS5sZW5ndGgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTGlzdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiI1wiKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikrMSx2YWx1ZS5sZW5ndGgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UHJvdG9jb2woKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb3RvY29sO1xyXG4gICAgfVxyXG5cclxuICAgIGdldERvbWFpbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZG9tYWluO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFBhdGhMaXN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9wYXRoTGlzdDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRQYXJhbWV0ZXJNYXAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlck1hcDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRCb29rbWFyaygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYm9va21hcms7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSB1cmwgb2JqZWN0IGlmIGl0IHByb2R1Y2VzIHRoZSB1cmwgZXF1YWwgdG8gdGhlIHZhbHVlXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBcclxuICAgICAqL1xyXG4gICAgdmFsaWRhdGUodmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICB0b1N0cmluZygpIHtcclxuICAgICAgICB2YXIgdXJsID0gXCJcIjtcclxuICAgICAgICBpZih0aGlzLmdldFByb3RvY29sKCkgIT09IG51bGwgJiYgdGhpcy5nZXRQcm90b2NvbCgpICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdXJsID0gdXJsICsgdGhpcy5nZXRQcm90b2NvbCgpICsgXCI6Ly9cIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5nZXREb21haW4oKSAhPT0gbnVsbCAmJiB0aGlzLmdldERvbWFpbigpICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdXJsID0gdXJsICsgdGhpcy5nZXREb21haW4oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5nZXRQYXRoTGlzdCgpICE9PSBudWxsICYmIHRoaXMuZ2V0UGF0aExpc3QoKSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZ2V0UGF0aExpc3QoKS5zaXplKCkgPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0UGF0aExpc3QoKS5mb3JFYWNoKCBmdW5jdGlvbihwYXRoLHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgdXJsID0gdXJsICsgXCIvXCIgKyBwYXRoO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0sdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoaXMuZ2V0UGFyYW1ldGVyTWFwKCkgIT09IG51bGwgJiYgdGhpcy5nZXRQYXJhbWV0ZXJNYXAoKSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZ2V0UGFyYW1ldGVyTWFwKCkuc2l6ZSgpID4gMCkge1xyXG4gICAgICAgICAgICB1cmwgPSB1cmwgKyBcIj9cIjtcclxuICAgICAgICAgICAgdGhpcy5nZXRQYXJhbWV0ZXJNYXAoKS5mb3JFYWNoKCBmdW5jdGlvbihrZXksdmFsdWUscGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICBpZih1cmwuY2hhckF0KHVybC5sZW5ndGgtMSkgIT09IFwiP1wiKXtcclxuICAgICAgICAgICAgICAgICAgICB1cmwgPSB1cmwgKyBcIiZcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHVybCA9IHVybCArIGtleSArIFwiPVwiICsgdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSx0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5nZXRCb29rbWFyaygpICE9PSBudWxsICYmIHRoaXMuZ2V0Qm9va21hcmsoKSAhPT0gbnVsbCkge1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVybDtcclxuICAgIH1cclxuXHJcbn0iXSwibmFtZXMiOlsiTGlzdCIsInZhbHVlcyIsInVuZGVmaW5lZCIsIkFycmF5IiwiX2xpc3QiLCJpbmRleCIsInZhbHVlIiwicHVzaCIsImxlbmd0aCIsImxpc3RlbmVyIiwicGFyZW50IiwidmFsIiwiTG9nZ2VyIiwiZGVidWdFbmFibGVkIiwibG9nIiwiZGVwdGgiLCJsaW5lIiwiaSIsIndhcm4iLCJlcnJvciIsInRleHQiLCJwb3NpdGlvbiIsImN1cnNvckxpbmUiLCJkZWJ1Z0VhbmJsZWQiLCJNYXAiLCJfbWFwIiwiT2JqZWN0Iiwia2V5cyIsIm5hbWUiLCJleGlzdHMiLCJrZXkiLCJzb3VyY2VNYXAiLCJmb3JFYWNoIiwic2V0IiwiT2JqZWN0RnVuY3Rpb24iLCJ0aGVPYmplY3QiLCJ0aGVGdW5jdGlvbiIsIl9vYmplY3QiLCJfZnVuY3Rpb24iLCJwYXJhbXMiLCJjYWxsIiwiUHJvcGVydHlBY2Nlc3NvciIsImRlc3RpbmF0aW9uIiwicGF0aEFycmF5Iiwic3BsaXQiLCJuIiwiU3RyaW5nVXRpbHMiLCJjaGFyQ29kZUF0IiwiVXJsIiwicHJvdG9jb2wiLCJkb21haW4iLCJwYXRoTGlzdCIsInBhcmFtZXRlck1hcCIsImJvb2ttYXJrIiwiX3Byb3RvY29sIiwiX2RvbWFpbiIsIl9wYXRoTGlzdCIsIl9wYXJhbWV0ZXJNYXAiLCJfYm9va21hcmsiLCJ1cmwiLCJnZXRQcm90b2NvbCIsImdldERvbWFpbiIsImdldFBhdGhMaXN0Iiwic2l6ZSIsInBhdGgiLCJnZXRQYXJhbWV0ZXJNYXAiLCJjaGFyQXQiLCJnZXRCb29rbWFyayIsInMiLCJTdHJpbmciLCJwYXJzZVVybFN0cmluZyIsImRldGVjdFByb3RvY29sIiwiZGV0ZWN0RG9tYWluIiwiZGV0ZWN0UGF0aExpc3QiLCJkZXRlY3RQYXJhbXRlck1hcCIsImRldGVjdEJvb2ttYXJrIiwiaW5kZXhPZiIsInN1YnN0cmluZyIsImVuZE9mRG9tYWluIiwiZW5kT2ZQYXRoIiwibWFwIiwicGFydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7O0FBS0EsSUFBYUEsSUFBYjs7Ozs7OztrQkFPZ0JDLE1BQVosRUFBb0I7OztZQUNiQSxXQUFXQyxTQUFYLElBQXdCRCxrQkFBa0JFLEtBQTdDLEVBQW1EO2lCQUMxQ0MsS0FBTCxHQUFhSCxNQUFiO1NBREosTUFFSztpQkFDSUcsS0FBTCxHQUFhLEVBQWI7Ozs7Ozs7Ozs7Ozs7OytCQVVKQyxLQXJCUixFQXFCZTttQkFDQSxLQUFLRCxLQUFMLENBQVdDLEtBQVgsQ0FBUDs7Ozs7Ozs7Ozs7OytCQVNBQSxLQS9CUixFQStC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
