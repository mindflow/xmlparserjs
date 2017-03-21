(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('coreutil')) :
	typeof define === 'function' && define.amd ? define(['exports', 'coreutil'], factory) :
	(factory((global.xmlparser = global.xmlparser || {}),global.coreutil));
}(this, (function (exports,coreutil$1) { 'use strict';

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

var ReadAhead = function () {
    function ReadAhead() {
        classCallCheck(this, ReadAhead);
    }

    createClass(ReadAhead, null, [{
        key: 'read',
        value: function read(value, matcher, cursor) {
            var ignoreWhitespace = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

            var internalCursor = cursor;
            for (var i = 0; i < matcher.length && i < value.length; i++) {
                while (ignoreWhitespace && value.charAt(internalCursor) == ' ') {
                    internalCursor++;
                }
                if (value.charAt(internalCursor) == matcher.charAt(i)) {
                    internalCursor++;
                } else {
                    return -1;
                }
            }

            return internalCursor - 1;
        }
    }]);
    return ReadAhead;
}();

/* jshint esversion: 6 */

var ElementBody = function () {
    function ElementBody() {
        classCallCheck(this, ElementBody);

        this._name = null;
        this._namespace = null;
        this._attributes = new coreutil$1.Map();
    }

    createClass(ElementBody, [{
        key: "getName",
        value: function getName() {
            return this._name;
        }
    }, {
        key: "getNamespace",
        value: function getNamespace() {
            return this._namespace;
        }
    }, {
        key: "getAttributes",
        value: function getAttributes() {
            return this._attributes;
        }
    }, {
        key: "detectPositions",
        value: function detectPositions(depth, xml, cursor) {
            var nameStartpos = cursor;
            var nameEndpos = null;
            var namespaceEndpos = null;
            var namespaceStartpos = null;
            while (coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                cursor++;
            }
            if (xml.charAt(cursor) == ':') {
                coreutil$1.Logger.debug(depth, 'Found namespace');
                namespaceStartpos = nameStartpos;
                namespaceEndpos = cursor - 1;
                nameStartpos = cursor + 1;
                cursor++;
                while (coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                    cursor++;
                }
            }
            nameEndpos = cursor - 1;
            this._name = xml.substring(nameStartpos, nameEndpos + 1);
            if (namespaceStartpos !== null && namespaceEndpos !== null) {
                this._namespace = xml.substring(namespaceStartpos, namespaceEndpos + 1);
            }
            cursor = this.detectAttributes(depth, xml, cursor);
            return cursor;
        }
    }, {
        key: "detectAttributes",
        value: function detectAttributes(depth, xml, cursor) {
            var detectedAttrNameCursor = null;
            while ((detectedAttrNameCursor = this.detectNextStartAttribute(depth, xml, cursor)) != -1) {
                cursor = this.detectNextEndAttribute(depth, xml, detectedAttrNameCursor);
                var name = xml.substring(detectedAttrNameCursor, cursor + 1);
                coreutil$1.Logger.debug(depth, 'Found attribute from ' + detectedAttrNameCursor + '  to ' + cursor);
                cursor = this.detectValue(name, depth, xml, cursor + 1);
            }
            return cursor;
        }
    }, {
        key: "detectNextStartAttribute",
        value: function detectNextStartAttribute(depth, xml, cursor) {
            while (xml.charAt(cursor) == ' ' && cursor < xml.length) {
                cursor++;
                if (coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor))) {
                    return cursor;
                }
            }
            return -1;
        }
    }, {
        key: "detectNextEndAttribute",
        value: function detectNextEndAttribute(depth, xml, cursor) {
            while (coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor))) {
                cursor++;
            }
            return cursor - 1;
        }
    }, {
        key: "detectValue",
        value: function detectValue(name, depth, xml, cursor) {
            var valuePos = cursor;
            if ((valuePos = ReadAhead.read(xml, '="', valuePos, true)) == -1) {
                this._attributes.set(name, null);
                return cursor;
            }
            valuePos++;
            coreutil$1.Logger.debug(depth, 'Possible attribute value start at ' + valuePos);
            var valueStartPos = valuePos;
            while (this.isAttributeContent(depth, xml, valuePos)) {
                valuePos++;
            }
            if (valuePos == cursor) {
                this._attributes.set(name, '');
            } else {
                this._attributes.set(name, xml.substring(valueStartPos, valuePos));
            }

            coreutil$1.Logger.debug(depth, 'Found attribute content ending at ' + (valuePos - 1));

            if ((valuePos = ReadAhead.read(xml, '"', valuePos, true)) != -1) {
                valuePos++;
            } else {
                coreutil$1.Logger.error('Missing end quotes on attribute at position ' + valuePos);
            }
            return valuePos;
        }
    }, {
        key: "isAttributeContent",
        value: function isAttributeContent(depth, xml, cursor) {
            if (ReadAhead.read(xml, '<', cursor) != -1) {
                return false;
            }
            if (ReadAhead.read(xml, '>', cursor) != -1) {
                return false;
            }
            if (ReadAhead.read(xml, '"', cursor) != -1) {
                return false;
            }
            return true;
        }
    }]);
    return ElementBody;
}();

/* jshint esversion: 6 */

var XmlCdata = function () {
    function XmlCdata(value) {
        classCallCheck(this, XmlCdata);

        this._value = value;
    }

    createClass(XmlCdata, [{
        key: 'setValue',
        value: function setValue(value) {
            this._value = value;
        }
    }, {
        key: 'getValue',
        value: function getValue() {
            return this._value;
        }
    }, {
        key: 'dump',
        value: function dump() {
            this.dumpLevel(0);
        }
    }, {
        key: 'dumpLevel',
        value: function dumpLevel(level) {
            var spacer = ':';
            for (var space = 0; space < level * 2; space++) {
                spacer = spacer + ' ';
            }

            coreutil$1.Logger.log(spacer + this._value);
            return;
        }
    }, {
        key: 'read',
        value: function read() {
            return this._value;
        }
    }]);
    return XmlCdata;
}();

/* jshint esversion: 6 */

var XmlElement = function () {
    function XmlElement(name, namespace, selfClosing, childElements) {
        classCallCheck(this, XmlElement);

        this._name = name;
        this._namespace = namespace;
        this._selfClosing = selfClosing;
        this._childElements = new coreutil$1.List();
        this._attributes = new coreutil$1.Map();
    }

    createClass(XmlElement, [{
        key: "getName",
        value: function getName() {
            return this._name;
        }
    }, {
        key: "getNamespace",
        value: function getNamespace() {
            return this._namespace;
        }
    }, {
        key: "getFullName",
        value: function getFullName() {
            if (this._namespace === null) {
                return this._name;
            }
            return this._namespace + ':' + this._name;
        }
    }, {
        key: "getAttributes",
        value: function getAttributes() {
            return this._attributes;
        }
    }, {
        key: "setAttributes",
        value: function setAttributes(attributes) {
            this._attributes = attributes;
        }
    }, {
        key: "setAttribute",
        value: function setAttribute(key, value) {
            this._attributes.set(key, value);
        }
    }, {
        key: "getAttribute",
        value: function getAttribute(key) {
            return this._attributes.get(key);
        }
    }, {
        key: "containsAttribute",
        value: function containsAttribute(key) {
            return this._attributes.contains(key);
        }
    }, {
        key: "clearAttribute",
        value: function clearAttribute() {
            this._attributes = new coreutil$1.Map();
        }
    }, {
        key: "getChildElements",
        value: function getChildElements() {
            return this._childElements;
        }
    }, {
        key: "setChildElements",
        value: function setChildElements(elements) {
            this._childElements = elements;
        }
    }, {
        key: "setText",
        value: function setText(text) {
            this._childElements = new coreutil$1.List();
            this.addText(text);
        }
    }, {
        key: "addText",
        value: function addText(text) {
            var textElement = new XmlCdata(text);
            this._childElements.add(textElement);
        }
    }, {
        key: "dump",
        value: function dump() {
            this.dumpLevel(0);
        }
    }, {
        key: "dumpLevel",
        value: function dumpLevel(level) {
            var spacer = ':';
            for (var space = 0; space < level * 2; space++) {
                spacer = spacer + ' ';
            }

            if (this._selfClosing) {
                coreutil$1.Logger.log(spacer + '<' + this.getFullName() + this.readAttributes() + '/>');
                return;
            }
            coreutil$1.Logger.log(spacer + '<' + this.getFullName() + this.readAttributes() + '>');
            this._childElements.forEach(function (childElement) {
                childElement.dumpLevel(level + 1);
                return true;
            });
            coreutil$1.Logger.log(spacer + '</' + this.getFullName() + '>');
        }
    }, {
        key: "read",
        value: function read() {
            var result = '';
            if (this._selfClosing) {
                result = result + '<' + this.getFullName() + this.readAttributes() + '/>';
                return result;
            }
            result = result + '<' + this.getFullName() + this.readAttributes() + '>';
            this._childElements.forEach(function (childElement) {
                result = result + childElement.read();
                return true;
            });
            result = result + '</' + this.getFullName() + '>';
            return result;
        }
    }, {
        key: "readAttributes",
        value: function readAttributes() {
            var result = '';
            this._attributes.forEach(function (key, attribute, parent) {
                result = result + ' ' + attribute.getName();
                if (attribute.getValue() !== null) {
                    result = result + '="' + attribute.getValue() + '"';
                }
                return true;
            }, this);
            return result;
        }
    }]);
    return XmlElement;
}();

/* jshint esversion: 6 */

var XmlAttribute = function () {
    function XmlAttribute(name, value) {
        classCallCheck(this, XmlAttribute);

        this._name = name;
        this._value = value;
    }

    createClass(XmlAttribute, [{
        key: "getName",
        value: function getName() {
            return this._name;
        }
    }, {
        key: "setName",
        value: function setName(val) {
            this._name = val;
        }
    }, {
        key: "getValue",
        value: function getValue() {
            return this._value;
        }
    }, {
        key: "setValue",
        value: function setValue(val) {
            this._value = val;
        }
    }]);
    return XmlAttribute;
}();

/* jshint esversion: 6 */

var ElementDetector = function () {
    function ElementDetector() {
        classCallCheck(this, ElementDetector);

        this._type = 'ElementDetector';
        this._hasChildren = false;
        this._found = false;
        this._xmlCursor = null;
        this._element = null;
    }

    createClass(ElementDetector, [{
        key: "createElement",
        value: function createElement() {
            return this._element;
        }
    }, {
        key: "getType",
        value: function getType() {
            return this._type;
        }
    }, {
        key: "isFound",
        value: function isFound() {
            return this._found;
        }
    }, {
        key: "hasChildren",
        value: function hasChildren() {
            return this._hasChildren;
        }
    }, {
        key: "detect",
        value: function detect(depth, xmlCursor) {
            this._xmlCursor = xmlCursor;
            coreutil$1.Logger.debug(depth, 'Looking for opening element at position ' + xmlCursor.cursor);
            var elementBody = new ElementBody();
            var endpos = ElementDetector.detectOpenElement(depth, xmlCursor.xml, xmlCursor.cursor, elementBody);
            if (endpos != -1) {

                this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), false);

                elementBody.getAttributes().forEach(function (attributeName, attributeValue, parent) {
                    parent._element.getAttributes().set(attributeName, new XmlAttribute(attributeName, attributeValue));
                    return true;
                }, this);

                coreutil$1.Logger.debug(depth, 'Found opening tag <' + this._element.getFullName() + '> from ' + xmlCursor.cursor + ' to ' + endpos);
                xmlCursor.cursor = endpos + 1;

                if (!this.stop(depth)) {
                    this._hasChildren = true;
                }
                this._found = true;
            }
        }
    }, {
        key: "stop",
        value: function stop(depth) {
            coreutil$1.Logger.debug(depth, 'Looking for closing element at position ' + this._xmlCursor.cursor);
            var closingElement = ElementDetector.detectEndElement(depth, this._xmlCursor.xml, this._xmlCursor.cursor);
            if (closingElement != -1) {
                var closingTagName = this._xmlCursor.xml.substring(this._xmlCursor.cursor + 2, closingElement);
                coreutil$1.Logger.debug(depth, 'Found closing tag </' + closingTagName + '> from ' + this._xmlCursor.cursor + ' to ' + closingElement);

                if (this._element.getFullName() != closingTagName) {
                    coreutil$1.Logger.error('ERR: Mismatch between opening tag <' + this._element.getFullName() + '> and closing tag </' + closingTagName + '> When exiting to parent elemnt');
                }
                this._xmlCursor.cursor = closingElement + 1;
                return true;
            }
            return false;
        }
    }], [{
        key: "detectOpenElement",
        value: function detectOpenElement(depth, xml, cursor, elementBody) {
            if ((cursor = ReadAhead.read(xml, '<', cursor)) == -1) {
                return -1;
            }
            cursor++;
            cursor = elementBody.detectPositions(depth + 1, xml, cursor);
            if ((cursor = ReadAhead.read(xml, '>', cursor)) == -1) {
                return -1;
            }
            return cursor;
        }
    }, {
        key: "detectEndElement",
        value: function detectEndElement(depth, xml, cursor) {
            if ((cursor = ReadAhead.read(xml, '</', cursor)) == -1) {
                return -1;
            }
            cursor++;
            cursor = new ElementBody().detectPositions(depth + 1, xml, cursor);
            if ((cursor = ReadAhead.read(xml, '>', cursor)) == -1) {
                return -1;
            }
            return cursor;
        }
    }]);
    return ElementDetector;
}();

/* jshint esversion: 6 */
var CdataDetector = function () {
    function CdataDetector() {
        classCallCheck(this, CdataDetector);

        this._type = 'CdataDetector';
        this._value = null;
        this._found = false;
    }

    createClass(CdataDetector, [{
        key: "isFound",
        value: function isFound() {
            return this._found;
        }
    }, {
        key: "getType",
        value: function getType() {
            return this._type;
        }
    }, {
        key: "createElement",
        value: function createElement() {
            return new XmlCdata(this._value);
        }
    }, {
        key: "detect",
        value: function detect(depth, xmlCursor) {
            this._found = false;
            this._value = null;

            var endPos = this.detectContent(depth, xmlCursor.xml, xmlCursor.cursor, xmlCursor.parentDomScaffold);
            if (endPos != -1) {
                this._found = true;
                this.hasChildren = false;
                this._value = xmlCursor.xml.substring(xmlCursor.cursor, endPos);
                xmlCursor.cursor = endPos;
            }
        }
    }, {
        key: "detectContent",
        value: function detectContent(depth, xml, cursor, parentDomScaffold) {
            coreutil$1.Logger.debug(depth, 'Cdata start at ' + cursor);
            var internalStartPos = cursor;
            if (!CdataDetector.isContent(depth, xml, cursor)) {
                coreutil$1.Logger.debug(depth, 'No Cdata found');
                return -1;
            }
            while (CdataDetector.isContent(depth, xml, cursor) && cursor < xml.length) {
                cursor++;
            }
            coreutil$1.Logger.debug(depth, 'Cdata end at ' + (cursor - 1));
            if (parentDomScaffold === null) {
                coreutil$1.Logger.error('ERR: Content not allowed on root level in xml document');
                return -1;
            }
            coreutil$1.Logger.debug(depth, 'Cdata found value is ' + xml.substring(internalStartPos, cursor));
            return cursor;
        }
    }], [{
        key: "isContent",
        value: function isContent(depth, xml, cursor) {
            if (ReadAhead.read(xml, '<', cursor) != -1) {
                return false;
            }
            if (ReadAhead.read(xml, '>', cursor) != -1) {
                return false;
            }
            return true;
        }
    }]);
    return CdataDetector;
}();

/* jshint esversion: 6 */

var ClosingElementDetector = function () {
    function ClosingElementDetector() {
        classCallCheck(this, ClosingElementDetector);

        this._type = 'ClosingElementDetector';
        this._found = false;
        this._element = null;
    }

    createClass(ClosingElementDetector, [{
        key: "createElement",
        value: function createElement() {
            return this._element;
        }
    }, {
        key: "getType",
        value: function getType() {
            return this._type;
        }
    }, {
        key: "isFound",
        value: function isFound() {
            return this._found;
        }
    }, {
        key: "detect",
        value: function detect(depth, xmlCursor) {
            coreutil$1.Logger.debug(depth, 'Looking for self closing element at position ' + xmlCursor.cursor);
            var elementBody = new ElementBody();
            var endpos = ClosingElementDetector.detectClosingElement(depth, xmlCursor.xml, xmlCursor.cursor, elementBody);
            if (endpos != -1) {
                this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), true);

                elementBody.getAttributes().forEach(function (attributeName, attributeValue, parent) {
                    parent._element.setAttribute(attributeName, new XmlAttribute(attributeName, attributeValue));
                    return true;
                }, this);

                coreutil$1.Logger.debug(depth, 'Found self closing tag <' + this._element.getFullName() + '/> from ' + xmlCursor.cursor + ' to ' + endpos);
                this._found = true;
                xmlCursor.cursor = endpos + 1;
            }
        }
    }], [{
        key: "detectClosingElement",
        value: function detectClosingElement(depth, xml, cursor, elementBody) {
            if ((cursor = ReadAhead.read(xml, '<', cursor)) == -1) {
                return -1;
            }
            cursor++;
            cursor = elementBody.detectPositions(depth + 1, xml, cursor);
            if ((cursor = ReadAhead.read(xml, '/>', cursor)) == -1) {
                return -1;
            }
            return cursor;
        }
    }]);
    return ClosingElementDetector;
}();

/* jshint esversion: 6 */

var XmlCursor = function () {
    function XmlCursor(xml, cursor, parentDomScaffold) {
        classCallCheck(this, XmlCursor);

        this.xml = xml;
        this.cursor = cursor;
        this.parentDomScaffold = parentDomScaffold;
    }

    createClass(XmlCursor, [{
        key: "eof",
        value: function eof() {
            return this.cursor >= this.xml.length;
        }
    }]);
    return XmlCursor;
}();

/* jshint esversion: 6 */

var DomScaffold = function () {
    function DomScaffold() {
        classCallCheck(this, DomScaffold);

        this._element = null;
        this._childDomScaffolds = new coreutil$1.List();
        this._detectors = new coreutil$1.List();
        this._elementCreatedListener = null;
        this._detectors.add(new ElementDetector());
        this._detectors.add(new CdataDetector());
        this._detectors.add(new ClosingElementDetector());
    }

    createClass(DomScaffold, [{
        key: "getElement",
        value: function getElement() {
            return this._element;
        }
    }, {
        key: "load",
        value: function load(xml, cursor, elementCreatedListener) {
            var xmlCursor = new XmlCursor(xml, cursor, null);
            this.loadDepth(1, xmlCursor, elementCreatedListener);
        }
    }, {
        key: "loadDepth",
        value: function loadDepth(depth, xmlCursor, elementCreatedListener) {
            coreutil.Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
            coreutil.Logger.debug(depth, 'Starting DomScaffold');
            this._elementCreatedListener = elementCreatedListener;

            if (xmlCursor.eof()) {
                coreutil.Logger.debug(depth, 'Reached eof. Exiting');
                return false;
            }

            var elementDetector = null;
            this._detectors.forEach(function (curElementDetector, parent) {
                coreutil.Logger.debug(depth, 'Starting ' + curElementDetector.getType());
                curElementDetector.detect(depth + 1, xmlCursor);
                if (!curElementDetector.isFound()) {
                    return true;
                }
                elementDetector = curElementDetector;
                return false;
            }, this);

            if (elementDetector === null) {
                xmlCursor.cursor++;
                coreutil.Logger.warn('WARN: No handler was found searching from position: ' + xmlCursor.cursor);
            }

            this._element = elementDetector.createElement();

            if (elementDetector instanceof ElementDetector && elementDetector.hasChildren()) {
                while (!elementDetector.stop(depth + 1) && xmlCursor.cursor < xmlCursor.xml.length) {
                    var previousParentScaffold = xmlCursor.parentDomScaffold;
                    var childScaffold = new DomScaffold();
                    xmlCursor.parentDomScaffold = childScaffold;
                    childScaffold.loadDepth(depth + 1, xmlCursor, this._elementCreatedListener);
                    this._childDomScaffolds.add(childScaffold);
                    xmlCursor.parentDomScaffold = previousParentScaffold;
                }
            }
            coreutil.Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
        }
    }, {
        key: "getTree",
        value: function getTree(parentNotifyResult) {
            if (this._element === null) {
                return null;
            }

            var notifyResult = this.notifyElementCreatedListener(this._element, parentNotifyResult);

            this._childDomScaffolds.forEach(function (childDomScaffold, parent) {
                var childElement = childDomScaffold.getTree(notifyResult);
                if (childElement !== null) {
                    parent._element.getChildElements().add(childElement);
                }
                return true;
            }, this);

            return this._element;
        }
    }, {
        key: "notifyElementCreatedListener",
        value: function notifyElementCreatedListener(element, parentNotifyResult) {
            if (this._elementCreatedListener !== null) {
                return this._elementCreatedListener.elementCreated(element, parentNotifyResult);
            }
            return null;
        }
    }]);
    return DomScaffold;
}();

/* jshint esversion: 6 */

var DomTree = function () {
    function DomTree(xml, elementCreatedListener) {
        classCallCheck(this, DomTree);

        this._elementCreatedListener = elementCreatedListener;
        this._xml = xml;
        this._rootElement = null;
    }

    createClass(DomTree, [{
        key: "getRootElement",
        value: function getRootElement() {
            return this._rootElement;
        }
    }, {
        key: "setRootElement",
        value: function setRootElement(element) {
            this._rootElement = element;
        }
    }, {
        key: "load",
        value: function load() {
            var domScaffold = new DomScaffold();
            domScaffold.load(this._xml, 0, this._elementCreatedListener);
            this._rootElement = domScaffold.getTree();
        }
    }, {
        key: "dump",
        value: function dump() {
            this._rootElement.dump();
        }
    }, {
        key: "read",
        value: function read() {
            return this._rootElement.read();
        }
    }]);
    return DomTree;
}();

/* jshint esversion: 6 */

exports.DomTree = DomTree;
exports.CdataDetector = CdataDetector;
exports.ClosingElementDetector = ClosingElementDetector;
exports.ElementBody = ElementBody;
exports.ElementDetector = ElementDetector;
exports.DomScaffold = DomScaffold;
exports.ReadAhead = ReadAhead;
exports.XmlCursor = XmlCursor;
exports.XmlAttribute = XmlAttribute;
exports.XmlCdata = XmlCdata;
exports.XmlElement = XmlElement;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1scGFyc2VyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvbWFpbi94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvcmVhZEFoZWFkLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9lbGVtZW50Qm9keS5qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3htbENkYXRhLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwveG1sRWxlbWVudC5qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3htbEF0dHJpYnV0ZS5qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9jZGF0YURldGVjdG9yLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9jbG9zaW5nRWxlbWVudERldGVjdG9yLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3htbEN1cnNvci5qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kb21TY2FmZm9sZC5qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL2RvbVRyZWUuanMiLCIuLi9zcmMvbWFpbi94bWxwYXJzZXIveG1sUGFyc2VyRXhjZXB0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBSZWFkQWhlYWR7XHJcblxyXG4gICAgc3RhdGljIHJlYWQodmFsdWUsIG1hdGNoZXIsIGN1cnNvciwgaWdub3JlV2hpdGVzcGFjZSA9IGZhbHNlKXtcclxuICAgICAgICBsZXQgaW50ZXJuYWxDdXJzb3IgPSBjdXJzb3I7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG1hdGNoZXIubGVuZ3RoICYmIGkgPCB2YWx1ZS5sZW5ndGggOyBpKyspe1xyXG4gICAgICAgICAgICB3aGlsZShpZ25vcmVXaGl0ZXNwYWNlICYmIHZhbHVlLmNoYXJBdChpbnRlcm5hbEN1cnNvcikgPT0gJyAnKXtcclxuICAgICAgICAgICAgICAgIGludGVybmFsQ3Vyc29yKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYodmFsdWUuY2hhckF0KGludGVybmFsQ3Vyc29yKSA9PSBtYXRjaGVyLmNoYXJBdChpKSl7XHJcbiAgICAgICAgICAgICAgICBpbnRlcm5hbEN1cnNvcisrO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGludGVybmFsQ3Vyc29yIC0gMTtcclxuICAgIH1cclxufVxyXG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXHJcblxyXG5pbXBvcnQge0xvZ2dlciwgTWFwLCBTdHJpbmdVdGlsc30gZnJvbSBcImNvcmV1dGlsXCI7XHJcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRWxlbWVudEJvZHl7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICB0aGlzLl9uYW1lID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9uYW1lc3BhY2UgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TmFtZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXROYW1lc3BhY2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWVzcGFjZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRBdHRyaWJ1dGVzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzO1xyXG4gICAgfVxyXG5cclxuICAgIGRldGVjdFBvc2l0aW9ucyhkZXB0aCwgeG1sLCBjdXJzb3Ipe1xyXG4gICAgICAgIGxldCBuYW1lU3RhcnRwb3MgPSBjdXJzb3I7XHJcbiAgICAgICAgbGV0IG5hbWVFbmRwb3MgPSBudWxsO1xyXG4gICAgICAgIGxldCBuYW1lc3BhY2VFbmRwb3MgPSBudWxsO1xyXG4gICAgICAgIGxldCBuYW1lc3BhY2VTdGFydHBvcyA9IG51bGw7XHJcbiAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY3Vyc29yICsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih4bWwuY2hhckF0KGN1cnNvcikgPT0gJzonKXtcclxuICAgICAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgbmFtZXNwYWNlJyk7XHJcbiAgICAgICAgICAgIG5hbWVzcGFjZVN0YXJ0cG9zID0gbmFtZVN0YXJ0cG9zO1xyXG4gICAgICAgICAgICBuYW1lc3BhY2VFbmRwb3MgPSBjdXJzb3ItMTtcclxuICAgICAgICAgICAgbmFtZVN0YXJ0cG9zID0gY3Vyc29yKzE7XHJcbiAgICAgICAgICAgIGN1cnNvciArKztcclxuICAgICAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGN1cnNvciArKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBuYW1lRW5kcG9zID0gY3Vyc29yLTE7XHJcbiAgICAgICAgdGhpcy5fbmFtZSA9IHhtbC5zdWJzdHJpbmcobmFtZVN0YXJ0cG9zLCBuYW1lRW5kcG9zKzEpO1xyXG4gICAgICAgIGlmKG5hbWVzcGFjZVN0YXJ0cG9zICE9PSBudWxsICYmIG5hbWVzcGFjZUVuZHBvcyAhPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9uYW1lc3BhY2UgPSB4bWwuc3Vic3RyaW5nKG5hbWVzcGFjZVN0YXJ0cG9zLCBuYW1lc3BhY2VFbmRwb3MrMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN1cnNvciA9IHRoaXMuZGV0ZWN0QXR0cmlidXRlcyhkZXB0aCx4bWwsY3Vyc29yKTtcclxuICAgICAgICByZXR1cm4gY3Vyc29yO1xyXG4gICAgfVxyXG5cclxuICAgIGRldGVjdEF0dHJpYnV0ZXMoZGVwdGgseG1sLGN1cnNvcil7XHJcbiAgICAgICAgbGV0IGRldGVjdGVkQXR0ck5hbWVDdXJzb3IgPSBudWxsO1xyXG4gICAgICAgIHdoaWxlKChkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0U3RhcnRBdHRyaWJ1dGUoZGVwdGgsIHhtbCwgY3Vyc29yKSkgIT0gLTEpe1xyXG4gICAgICAgICAgICBjdXJzb3IgPSB0aGlzLmRldGVjdE5leHRFbmRBdHRyaWJ1dGUoZGVwdGgsIHhtbCwgZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvcik7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0geG1sLnN1YnN0cmluZyhkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yLGN1cnNvcisxKTtcclxuICAgICAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgYXR0cmlidXRlIGZyb20gJyArIGRldGVjdGVkQXR0ck5hbWVDdXJzb3IgKyAnICB0byAnICsgY3Vyc29yKTtcclxuICAgICAgICAgICAgY3Vyc29yID0gdGhpcy5kZXRlY3RWYWx1ZShuYW1lLGRlcHRoLCB4bWwsIGN1cnNvcisxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZGV0ZWN0TmV4dFN0YXJ0QXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XHJcbiAgICAgICAgd2hpbGUoeG1sLmNoYXJBdChjdXJzb3IpID09ICcgJyAmJiBjdXJzb3IgPCB4bWwubGVuZ3RoKXtcclxuICAgICAgICAgICAgY3Vyc29yICsrO1xyXG4gICAgICAgICAgICBpZihTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIH1cclxuXHJcbiAgICBkZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XHJcbiAgICAgICAgd2hpbGUoU3RyaW5nVXRpbHMuaXNJbkFscGhhYmV0KHhtbC5jaGFyQXQoY3Vyc29yKSkpe1xyXG4gICAgICAgICAgICBjdXJzb3IgKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjdXJzb3IgLTE7XHJcbiAgICB9XHJcblxyXG4gICAgZGV0ZWN0VmFsdWUobmFtZSwgZGVwdGgsIHhtbCwgY3Vyc29yKXtcclxuICAgICAgICBsZXQgdmFsdWVQb3MgPSBjdXJzb3I7XHJcbiAgICAgICAgaWYoKHZhbHVlUG9zID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc9XCInLHZhbHVlUG9zLHRydWUpKSA9PSAtMSl7XHJcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMuc2V0KG5hbWUsbnVsbCk7XHJcbiAgICAgICAgICAgIHJldHVybiBjdXJzb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhbHVlUG9zKys7XHJcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnUG9zc2libGUgYXR0cmlidXRlIHZhbHVlIHN0YXJ0IGF0ICcgKyB2YWx1ZVBvcyk7XHJcbiAgICAgICAgbGV0IHZhbHVlU3RhcnRQb3MgPSB2YWx1ZVBvcztcclxuICAgICAgICB3aGlsZSh0aGlzLmlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCB2YWx1ZVBvcykpe1xyXG4gICAgICAgICAgICB2YWx1ZVBvcysrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih2YWx1ZVBvcyA9PSBjdXJzb3Ipe1xyXG4gICAgICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzLnNldChuYW1lLCAnJyk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMuc2V0KG5hbWUsIHhtbC5zdWJzdHJpbmcodmFsdWVTdGFydFBvcyx2YWx1ZVBvcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgYXR0cmlidXRlIGNvbnRlbnQgZW5kaW5nIGF0ICcgKyAodmFsdWVQb3MtMSkpO1xyXG5cclxuICAgICAgICBpZigodmFsdWVQb3MgPSBSZWFkQWhlYWQucmVhZCh4bWwsJ1wiJyx2YWx1ZVBvcyx0cnVlKSkgIT0gLTEpe1xyXG4gICAgICAgICAgICB2YWx1ZVBvcysrO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBMb2dnZXIuZXJyb3IoJ01pc3NpbmcgZW5kIHF1b3RlcyBvbiBhdHRyaWJ1dGUgYXQgcG9zaXRpb24gJyArIHZhbHVlUG9zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlUG9zO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBpc0F0dHJpYnV0ZUNvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKXtcclxuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCdcIicsY3Vyc29yKSAhPSAtMSl7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbFwiXHJcblxyXG5leHBvcnQgY2xhc3MgWG1sQ2RhdGF7XHJcblxyXG5cdGNvbnN0cnVjdG9yKHZhbHVlKXtcclxuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFZhbHVlKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRWYWx1ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZHVtcCgpe1xyXG4gICAgICAgIHRoaXMuZHVtcExldmVsKDApO1xyXG4gICAgfVxyXG5cclxuICAgIGR1bXBMZXZlbChsZXZlbCl7XHJcbiAgICAgICAgbGV0IHNwYWNlciA9ICc6JztcclxuICAgICAgICBmb3IobGV0IHNwYWNlID0gMCA7IHNwYWNlIDwgbGV2ZWwqMiA7IHNwYWNlICsrKXtcclxuICAgICAgICAgICAgc3BhY2VyID0gc3BhY2VyICsgJyAnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgTG9nZ2VyLmxvZyhzcGFjZXIgKyB0aGlzLl92YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWQoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XHJcbiAgICB9XHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuaW1wb3J0IHtMb2dnZXIsIExpc3QsIE1hcH0gZnJvbSBcImNvcmV1dGlsXCI7XHJcbmltcG9ydCB7WG1sQ2RhdGF9IGZyb20gXCIuL3htbENkYXRhXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgWG1sRWxlbWVudHtcclxuXHJcblx0Y29uc3RydWN0b3IobmFtZSwgbmFtZXNwYWNlLCBzZWxmQ2xvc2luZywgY2hpbGRFbGVtZW50cyl7XHJcbiAgICAgICAgdGhpcy5fbmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gbmFtZXNwYWNlO1xyXG4gICAgICAgIHRoaXMuX3NlbGZDbG9zaW5nID0gc2VsZkNsb3Npbmc7XHJcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cyA9IG5ldyBMaXN0KCk7XHJcbiAgICAgICAgdGhpcy5fYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXROYW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE5hbWVzcGFjZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEZ1bGxOYW1lKCkge1xyXG4gICAgICAgIGlmKHRoaXMuX25hbWVzcGFjZSA9PT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlICsgJzonICsgdGhpcy5fbmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRBdHRyaWJ1dGVzKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKXtcclxuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcclxuICAgIH1cclxuXHJcbiAgICBzZXRBdHRyaWJ1dGUoa2V5LHZhbHVlKSB7XHJcblx0XHR0aGlzLl9hdHRyaWJ1dGVzLnNldChrZXksdmFsdWUpO1xyXG5cdH1cclxuXHJcblx0Z2V0QXR0cmlidXRlKGtleSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXMuZ2V0KGtleSk7XHJcblx0fVxyXG5cclxuICAgIGNvbnRhaW5zQXR0cmlidXRlKGtleSl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXMuY29udGFpbnMoa2V5KTtcclxuICAgIH1cclxuXHJcblx0Y2xlYXJBdHRyaWJ1dGUoKXtcclxuXHRcdHRoaXMuX2F0dHJpYnV0ZXMgPSBuZXcgTWFwKCk7XHJcblx0fVxyXG5cclxuICAgIGdldENoaWxkRWxlbWVudHMoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRFbGVtZW50cztcclxuICAgIH1cclxuXHJcbiAgICBzZXRDaGlsZEVsZW1lbnRzKGVsZW1lbnRzKSB7XHJcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cyA9IGVsZW1lbnRzO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRleHQodGV4dCl7XHJcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cyA9IG5ldyBMaXN0KCk7XHJcbiAgICAgICAgdGhpcy5hZGRUZXh0KHRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRleHQodGV4dCl7XHJcbiAgICAgICAgbGV0IHRleHRFbGVtZW50ID0gbmV3IFhtbENkYXRhKHRleHQpO1xyXG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMuYWRkKHRleHRFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBkdW1wKCl7XHJcbiAgICAgICAgdGhpcy5kdW1wTGV2ZWwoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgZHVtcExldmVsKGxldmVsKXtcclxuICAgICAgICBsZXQgc3BhY2VyID0gJzonO1xyXG4gICAgICAgIGZvcihsZXQgc3BhY2UgPSAwIDsgc3BhY2UgPCBsZXZlbCoyIDsgc3BhY2UgKyspe1xyXG4gICAgICAgICAgICBzcGFjZXIgPSBzcGFjZXIgKyAnICc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLl9zZWxmQ2xvc2luZyl7XHJcbiAgICAgICAgICAgIExvZ2dlci5sb2coc3BhY2VyICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJy8+Jyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgTG9nZ2VyLmxvZyhzcGFjZXIgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnPicpO1xyXG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpe1xyXG4gICAgICAgICAgICBjaGlsZEVsZW1lbnQuZHVtcExldmVsKGxldmVsKzEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBMb2dnZXIubG9nKHNwYWNlciArICc8LycgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyAnPicpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWQoKXtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XHJcbiAgICAgICAgaWYodGhpcy5fc2VsZkNsb3Npbmcpe1xyXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnLz4nO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnPic7XHJcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkRWxlbWVudCl7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArIGNoaWxkRWxlbWVudC5yZWFkKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICc8LycgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyAnPic7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICByZWFkQXR0cmlidXRlcygpe1xyXG4gICAgICAgIGxldCByZXN1bHQgPSAnJztcclxuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzLmZvckVhY2goZnVuY3Rpb24gKGtleSxhdHRyaWJ1dGUscGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICcgJyArIGF0dHJpYnV0ZS5nZXROYW1lKCk7XHJcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZS5nZXRWYWx1ZSgpICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICc9XCInICsgYXR0cmlidXRlLmdldFZhbHVlKCkgKyAnXCInO1xyXG4gICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSx0aGlzKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59XHJcbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBYbWxBdHRyaWJ1dGUge1xyXG5cclxuICBjb25zdHJ1Y3RvcihuYW1lLHZhbHVlKSB7XHJcbiAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xyXG4gICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgZ2V0TmFtZSgpe1xyXG4gICAgICByZXR1cm4gdGhpcy5fbmFtZTtcclxuICB9XHJcblxyXG4gIHNldE5hbWUodmFsKXtcclxuICAgICAgdGhpcy5fbmFtZSA9IHZhbDtcclxuICB9XHJcblxyXG4gIGdldFZhbHVlKCl7XHJcbiAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcclxuICB9XHJcblxyXG4gIHNldFZhbHVlKHZhbCl7XHJcbiAgICAgIHRoaXMuX3ZhbHVlID0gdmFsO1xyXG4gIH1cclxufVxyXG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXHJcblxyXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsXCI7XHJcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkXCI7XHJcbmltcG9ydCB7RWxlbWVudEJvZHl9IGZyb20gXCIuL2VsZW1lbnRCb2R5XCI7XHJcbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcIi4uLy4uL3htbEVsZW1lbnRcIjtcclxuaW1wb3J0IHtYbWxBdHRyaWJ1dGV9IGZyb20gXCIuLi8uLi94bWxBdHRyaWJ1dGVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFbGVtZW50RGV0ZWN0b3J7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICB0aGlzLl90eXBlID0gJ0VsZW1lbnREZXRlY3Rvcic7XHJcbiAgICAgICAgdGhpcy5faGFzQ2hpbGRyZW4gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9mb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX3htbEN1cnNvciA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fZWxlbWVudCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUeXBlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90eXBlO1xyXG4gICAgfVxyXG5cclxuICAgIGlzRm91bmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvdW5kO1xyXG4gICAgfVxyXG5cclxuICAgIGhhc0NoaWxkcmVuKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9oYXNDaGlsZHJlbjtcclxuICAgIH1cclxuXHJcbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcil7XHJcbiAgICAgICAgdGhpcy5feG1sQ3Vyc29yID0geG1sQ3Vyc29yO1xyXG4gICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0xvb2tpbmcgZm9yIG9wZW5pbmcgZWxlbWVudCBhdCBwb3NpdGlvbiAnICsgeG1sQ3Vyc29yLmN1cnNvcik7XHJcbiAgICAgICAgbGV0IGVsZW1lbnRCb2R5ID0gbmV3IEVsZW1lbnRCb2R5KCk7XHJcbiAgICAgICAgbGV0IGVuZHBvcyA9IEVsZW1lbnREZXRlY3Rvci5kZXRlY3RPcGVuRWxlbWVudChkZXB0aCwgeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcixlbGVtZW50Qm9keSk7XHJcbiAgICAgICAgaWYoZW5kcG9zICE9IC0xKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50ID0gbmV3IFhtbEVsZW1lbnQoZWxlbWVudEJvZHkuZ2V0TmFtZSgpLCBlbGVtZW50Qm9keS5nZXROYW1lc3BhY2UoKSwgZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgZWxlbWVudEJvZHkuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSxwYXJlbnQpe1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Ll9lbGVtZW50LmdldEF0dHJpYnV0ZXMoKS5zZXQoYXR0cmlidXRlTmFtZSxuZXcgWG1sQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSx0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIG9wZW5pbmcgdGFnIDwnICsgdGhpcy5fZWxlbWVudC5nZXRGdWxsTmFtZSgpICsgJz4gZnJvbSAnICsgIHhtbEN1cnNvci5jdXJzb3IgICsgJyB0byAnICsgZW5kcG9zKTtcclxuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZHBvcyArIDE7XHJcblxyXG4gICAgICAgICAgICBpZighdGhpcy5zdG9wKGRlcHRoKSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9oYXNDaGlsZHJlbiA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fZm91bmQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdG9wKGRlcHRoKXtcclxuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdMb29raW5nIGZvciBjbG9zaW5nIGVsZW1lbnQgYXQgcG9zaXRpb24gJyArIHRoaXMuX3htbEN1cnNvci5jdXJzb3IpO1xyXG4gICAgICAgIGxldCBjbG9zaW5nRWxlbWVudCA9IEVsZW1lbnREZXRlY3Rvci5kZXRlY3RFbmRFbGVtZW50KGRlcHRoLCB0aGlzLl94bWxDdXJzb3IueG1sLCB0aGlzLl94bWxDdXJzb3IuY3Vyc29yKTtcclxuICAgICAgICBpZihjbG9zaW5nRWxlbWVudCAhPSAtMSl7XHJcbiAgICAgICAgICAgIGxldCBjbG9zaW5nVGFnTmFtZSA9ICB0aGlzLl94bWxDdXJzb3IueG1sLnN1YnN0cmluZyh0aGlzLl94bWxDdXJzb3IuY3Vyc29yKzIsY2xvc2luZ0VsZW1lbnQpO1xyXG4gICAgICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdGb3VuZCBjbG9zaW5nIHRhZyA8LycgKyBjbG9zaW5nVGFnTmFtZSArICc+IGZyb20gJyArICB0aGlzLl94bWxDdXJzb3IuY3Vyc29yICArICcgdG8gJyArIGNsb3NpbmdFbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgIGlmKHRoaXMuX2VsZW1lbnQuZ2V0RnVsbE5hbWUoKSAhPSBjbG9zaW5nVGFnTmFtZSl7XHJcbiAgICAgICAgICAgICAgICBMb2dnZXIuZXJyb3IoJ0VSUjogTWlzbWF0Y2ggYmV0d2VlbiBvcGVuaW5nIHRhZyA8JyArIHRoaXMuX2VsZW1lbnQuZ2V0RnVsbE5hbWUoKSArICc+IGFuZCBjbG9zaW5nIHRhZyA8LycgKyBjbG9zaW5nVGFnTmFtZSArICc+IFdoZW4gZXhpdGluZyB0byBwYXJlbnQgZWxlbW50Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5feG1sQ3Vyc29yLmN1cnNvciA9IGNsb3NpbmdFbGVtZW50ICsxO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBkZXRlY3RPcGVuRWxlbWVudChkZXB0aCwgeG1sLCBjdXJzb3IsIGVsZW1lbnRCb2R5KSB7XHJcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPCcsY3Vyc29yKSkgPT0gLTEpe1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN1cnNvciArKztcclxuICAgICAgICBjdXJzb3IgPSBlbGVtZW50Qm9keS5kZXRlY3RQb3NpdGlvbnMoZGVwdGgrMSwgeG1sLCBjdXJzb3IpO1xyXG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz4nLGN1cnNvcikpID09IC0xKXtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3Vyc29yO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBkZXRlY3RFbmRFbGVtZW50KGRlcHRoLCB4bWwsIGN1cnNvcil7XHJcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPC8nLGN1cnNvcikpID09IC0xKXtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjdXJzb3IgKys7XHJcbiAgICAgICAgY3Vyc29yID0gbmV3IEVsZW1lbnRCb2R5KCkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcclxuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc+JyxjdXJzb3IpKSA9PSAtMSl7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsXCI7XHJcbmltcG9ydCB7WG1sQ2RhdGF9IGZyb20gXCIuLi8uLi94bWxDZGF0YVwiO1xyXG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENkYXRhRGV0ZWN0b3J7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICB0aGlzLl90eXBlID0gJ0NkYXRhRGV0ZWN0b3InO1xyXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9mb3VuZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlzRm91bmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvdW5kO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFR5cGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFhtbENkYXRhKHRoaXMuX3ZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcil7XHJcbiAgICAgICAgdGhpcy5fZm91bmQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bGw7XHJcblxyXG4gICAgICAgIGxldCBlbmRQb3MgPSB0aGlzLmRldGVjdENvbnRlbnQoZGVwdGgsIHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IsIHhtbEN1cnNvci5wYXJlbnREb21TY2FmZm9sZCk7XHJcbiAgICAgICAgaWYoZW5kUG9zICE9IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5oYXNDaGlsZHJlbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IHhtbEN1cnNvci54bWwuc3Vic3RyaW5nKHhtbEN1cnNvci5jdXJzb3IsZW5kUG9zKTtcclxuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZFBvcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZGV0ZWN0Q29udGVudChkZXB0aCwgeG1sLCBjdXJzb3IsIHBhcmVudERvbVNjYWZmb2xkKSB7XHJcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnQ2RhdGEgc3RhcnQgYXQgJyArIGN1cnNvcik7XHJcbiAgICAgICAgbGV0IGludGVybmFsU3RhcnRQb3MgPSBjdXJzb3I7XHJcbiAgICAgICAgaWYoIUNkYXRhRGV0ZWN0b3IuaXNDb250ZW50KGRlcHRoLCB4bWwsIGN1cnNvcikpe1xyXG4gICAgICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdObyBDZGF0YSBmb3VuZCcpO1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoaWxlKENkYXRhRGV0ZWN0b3IuaXNDb250ZW50KGRlcHRoLCB4bWwsIGN1cnNvcikgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XHJcbiAgICAgICAgICAgIGN1cnNvciArKztcclxuICAgICAgICB9XHJcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnQ2RhdGEgZW5kIGF0ICcgKyAoY3Vyc29yLTEpKTtcclxuICAgICAgICBpZihwYXJlbnREb21TY2FmZm9sZCA9PT0gbnVsbCl7XHJcbiAgICAgICAgICAgIExvZ2dlci5lcnJvcignRVJSOiBDb250ZW50IG5vdCBhbGxvd2VkIG9uIHJvb3QgbGV2ZWwgaW4geG1sIGRvY3VtZW50Jyk7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnQ2RhdGEgZm91bmQgdmFsdWUgaXMgJyArIHhtbC5zdWJzdHJpbmcoaW50ZXJuYWxTdGFydFBvcyxjdXJzb3IpKTtcclxuICAgICAgICByZXR1cm4gY3Vyc29yO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBpc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKXtcclxuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbFwiO1xyXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCIuLi8uLi94bWxFbGVtZW50XCI7XHJcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkXCI7XHJcbmltcG9ydCB7RWxlbWVudEJvZHl9IGZyb20gXCIuL2VsZW1lbnRCb2R5XCI7XHJcbmltcG9ydCB7WG1sQXR0cmlidXRlfSBmcm9tIFwiLi4vLi4veG1sQXR0cmlidXRlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2xvc2luZ0VsZW1lbnREZXRlY3RvcntcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIHRoaXMuX3R5cGUgPSAnQ2xvc2luZ0VsZW1lbnREZXRlY3Rvcic7XHJcbiAgICAgICAgdGhpcy5fZm91bmQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVFbGVtZW50KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIGdldFR5cGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XHJcbiAgICB9XHJcblxyXG4gICAgaXNGb3VuZCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZm91bmQ7XHJcbiAgICB9XHJcblxyXG4gICAgZGV0ZWN0KGRlcHRoLCB4bWxDdXJzb3IpIHtcclxuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdMb29raW5nIGZvciBzZWxmIGNsb3NpbmcgZWxlbWVudCBhdCBwb3NpdGlvbiAnICsgeG1sQ3Vyc29yLmN1cnNvcik7XHJcbiAgICAgICAgbGV0IGVsZW1lbnRCb2R5ID0gbmV3IEVsZW1lbnRCb2R5KCk7XHJcbiAgICAgICAgbGV0IGVuZHBvcyA9IENsb3NpbmdFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0Q2xvc2luZ0VsZW1lbnQoZGVwdGgsIHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IsZWxlbWVudEJvZHkpO1xyXG4gICAgICAgIGlmKGVuZHBvcyAhPSAtMSl7XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBuZXcgWG1sRWxlbWVudChlbGVtZW50Qm9keS5nZXROYW1lKCksIGVsZW1lbnRCb2R5LmdldE5hbWVzcGFjZSgpLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnRCb2R5LmdldEF0dHJpYnV0ZXMoKS5mb3JFYWNoKGZ1bmN0aW9uKGF0dHJpYnV0ZU5hbWUsYXR0cmlidXRlVmFsdWUscGFyZW50KXtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5fZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSxuZXcgWG1sQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSx0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIHNlbGYgY2xvc2luZyB0YWcgPCcgKyB0aGlzLl9lbGVtZW50LmdldEZ1bGxOYW1lKCkgKyAnLz4gZnJvbSAnICsgIHhtbEN1cnNvci5jdXJzb3IgICsgJyB0byAnICsgZW5kcG9zKTtcclxuICAgICAgICAgICAgdGhpcy5fZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yID0gZW5kcG9zICsgMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGRldGVjdENsb3NpbmdFbGVtZW50KGRlcHRoLCB4bWwsIGN1cnNvciwgZWxlbWVudEJvZHkpe1xyXG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikpID09IC0xKXtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjdXJzb3IgKys7XHJcbiAgICAgICAgY3Vyc29yID0gZWxlbWVudEJvZHkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcclxuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCcvPicsY3Vyc29yKSkgPT0gLTEpe1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjdXJzb3I7XHJcbiAgICB9XHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuZXhwb3J0IGNsYXNzIFhtbEN1cnNvcntcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih4bWwsIGN1cnNvciwgcGFyZW50RG9tU2NhZmZvbGQpe1xyXG4gICAgICAgIHRoaXMueG1sID0geG1sO1xyXG4gICAgICAgIHRoaXMuY3Vyc29yID0gY3Vyc29yO1xyXG4gICAgICAgIHRoaXMucGFyZW50RG9tU2NhZmZvbGQgPSBwYXJlbnREb21TY2FmZm9sZDtcclxuICAgIH1cclxuXHJcbiAgICBlb2YoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJzb3IgPj0gdGhpcy54bWwubGVuZ3RoO1xyXG4gICAgfVxyXG59XHJcbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmltcG9ydCB7TGlzdH0gZnJvbSBcImNvcmV1dGlsXCI7XHJcbmltcG9ydCB7RWxlbWVudERldGVjdG9yfSBmcm9tIFwiLi9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yXCI7XHJcbmltcG9ydCB7Q2RhdGFEZXRlY3Rvcn0gZnJvbSBcIi4vZGV0ZWN0b3JzL2NkYXRhRGV0ZWN0b3JcIjtcclxuaW1wb3J0IHtDbG9zaW5nRWxlbWVudERldGVjdG9yfSBmcm9tIFwiLi9kZXRlY3RvcnMvY2xvc2luZ0VsZW1lbnREZXRlY3RvclwiO1xyXG5pbXBvcnQge1htbEN1cnNvcn0gZnJvbSBcIi4veG1sQ3Vyc29yXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRG9tU2NhZmZvbGR7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9jaGlsZERvbVNjYWZmb2xkcyA9IG5ldyBMaXN0KCk7XHJcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzID0gbmV3IExpc3QoKTtcclxuICAgICAgICB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9kZXRlY3RvcnMuYWRkKG5ldyBFbGVtZW50RGV0ZWN0b3IoKSk7XHJcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzLmFkZChuZXcgQ2RhdGFEZXRlY3RvcigpKTtcclxuICAgICAgICB0aGlzLl9kZXRlY3RvcnMuYWRkKG5ldyBDbG9zaW5nRWxlbWVudERldGVjdG9yKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEVsZW1lbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZCh4bWwsIGN1cnNvciwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcil7XHJcbiAgICAgICAgbGV0IHhtbEN1cnNvciA9IG5ldyBYbWxDdXJzb3IoeG1sLCBjdXJzb3IsIG51bGwpO1xyXG4gICAgICAgIHRoaXMubG9hZERlcHRoKDEsIHhtbEN1cnNvciwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZERlcHRoKGRlcHRoLCB4bWxDdXJzb3IsIGVsZW1lbnRDcmVhdGVkTGlzdGVuZXIpe1xyXG4gICAgICAgIGNvcmV1dGlsLkxvZ2dlci5zaG93UG9zKHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IpO1xyXG4gICAgICAgIGNvcmV1dGlsLkxvZ2dlci5kZWJ1ZyhkZXB0aCwgJ1N0YXJ0aW5nIERvbVNjYWZmb2xkJyk7XHJcbiAgICAgICAgdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lciA9IGVsZW1lbnRDcmVhdGVkTGlzdGVuZXI7XHJcblxyXG4gICAgICAgIGlmKHhtbEN1cnNvci5lb2YoKSl7XHJcbiAgICAgICAgICAgIGNvcmV1dGlsLkxvZ2dlci5kZWJ1ZyhkZXB0aCwgJ1JlYWNoZWQgZW9mLiBFeGl0aW5nJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBlbGVtZW50RGV0ZWN0b3IgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2RldGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uKGN1ckVsZW1lbnREZXRlY3RvcixwYXJlbnQpe1xyXG4gICAgICAgICAgICBjb3JldXRpbC5Mb2dnZXIuZGVidWcoZGVwdGgsICdTdGFydGluZyAnICsgY3VyRWxlbWVudERldGVjdG9yLmdldFR5cGUoKSk7XHJcbiAgICAgICAgICAgIGN1ckVsZW1lbnREZXRlY3Rvci5kZXRlY3QoZGVwdGggKyAxLHhtbEN1cnNvcik7XHJcbiAgICAgICAgICAgIGlmKCFjdXJFbGVtZW50RGV0ZWN0b3IuaXNGb3VuZCgpKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsZW1lbnREZXRlY3RvciA9IGN1ckVsZW1lbnREZXRlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sdGhpcyk7XHJcblxyXG4gICAgICAgIGlmKGVsZW1lbnREZXRlY3RvciA9PT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHhtbEN1cnNvci5jdXJzb3IrKztcclxuICAgICAgICAgICAgY29yZXV0aWwuTG9nZ2VyLndhcm4oJ1dBUk46IE5vIGhhbmRsZXIgd2FzIGZvdW5kIHNlYXJjaGluZyBmcm9tIHBvc2l0aW9uOiAnICsgeG1sQ3Vyc29yLmN1cnNvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9lbGVtZW50ID0gZWxlbWVudERldGVjdG9yLmNyZWF0ZUVsZW1lbnQoKTtcclxuXHJcbiAgICAgICAgaWYoZWxlbWVudERldGVjdG9yIGluc3RhbmNlb2YgRWxlbWVudERldGVjdG9yICYmIGVsZW1lbnREZXRlY3Rvci5oYXNDaGlsZHJlbigpKSB7XHJcbiAgICAgICAgICAgIHdoaWxlKCFlbGVtZW50RGV0ZWN0b3Iuc3RvcChkZXB0aCArIDEpICYmIHhtbEN1cnNvci5jdXJzb3IgPCB4bWxDdXJzb3IueG1sLmxlbmd0aCl7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHJldmlvdXNQYXJlbnRTY2FmZm9sZCA9IHhtbEN1cnNvci5wYXJlbnREb21TY2FmZm9sZDtcclxuICAgICAgICAgICAgICAgIGxldCBjaGlsZFNjYWZmb2xkID0gbmV3IERvbVNjYWZmb2xkKCk7XHJcbiAgICAgICAgICAgICAgICB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQgPSBjaGlsZFNjYWZmb2xkO1xyXG4gICAgICAgICAgICAgICAgY2hpbGRTY2FmZm9sZC5sb2FkRGVwdGgoZGVwdGgrMSwgeG1sQ3Vyc29yLCB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NoaWxkRG9tU2NhZmZvbGRzLmFkZChjaGlsZFNjYWZmb2xkKTtcclxuICAgICAgICAgICAgICAgIHhtbEN1cnNvci5wYXJlbnREb21TY2FmZm9sZCA9IHByZXZpb3VzUGFyZW50U2NhZmZvbGQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29yZXV0aWwuTG9nZ2VyLnNob3dQb3MoeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VHJlZShwYXJlbnROb3RpZnlSZXN1bHQpe1xyXG4gICAgICAgIGlmKHRoaXMuX2VsZW1lbnQgPT09IG51bGwpe1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBub3RpZnlSZXN1bHQgPSB0aGlzLm5vdGlmeUVsZW1lbnRDcmVhdGVkTGlzdGVuZXIodGhpcy5fZWxlbWVudCxwYXJlbnROb3RpZnlSZXN1bHQpO1xyXG5cclxuICAgICAgICB0aGlzLl9jaGlsZERvbVNjYWZmb2xkcy5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkRG9tU2NhZmZvbGQscGFyZW50KSB7XHJcbiAgICAgICAgICAgIGxldCBjaGlsZEVsZW1lbnQgPSBjaGlsZERvbVNjYWZmb2xkLmdldFRyZWUobm90aWZ5UmVzdWx0KTtcclxuICAgICAgICAgICAgaWYoY2hpbGRFbGVtZW50ICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5fZWxlbWVudC5nZXRDaGlsZEVsZW1lbnRzKCkuYWRkKGNoaWxkRWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSx0aGlzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgbm90aWZ5RWxlbWVudENyZWF0ZWRMaXN0ZW5lcihlbGVtZW50LCBwYXJlbnROb3RpZnlSZXN1bHQpIHtcclxuICAgICAgICBpZih0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyICE9PSBudWxsKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIuZWxlbWVudENyZWF0ZWQoZWxlbWVudCwgcGFyZW50Tm90aWZ5UmVzdWx0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmltcG9ydCB7RG9tU2NhZmZvbGR9IGZyb20gXCIuL3BhcnNlci9kb21TY2FmZm9sZFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERvbVRyZWV7XHJcblxyXG4gICAgY29uc3RydWN0b3IoeG1sLCBlbGVtZW50Q3JlYXRlZExpc3RlbmVyKSB7XHJcbiAgICAgICAgdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lciA9IGVsZW1lbnRDcmVhdGVkTGlzdGVuZXI7XHJcbiAgICAgICAgdGhpcy5feG1sID0geG1sO1xyXG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb290RWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcm9vdEVsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Um9vdEVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBsb2FkKCl7XHJcbiAgICAgICAgbGV0IGRvbVNjYWZmb2xkID0gbmV3IERvbVNjYWZmb2xkKCk7XHJcbiAgICAgICAgZG9tU2NhZmZvbGQubG9hZCh0aGlzLl94bWwsMCx0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyKTtcclxuICAgICAgICB0aGlzLl9yb290RWxlbWVudCA9IGRvbVNjYWZmb2xkLmdldFRyZWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBkdW1wKCl7XHJcbiAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQuZHVtcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWQoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcm9vdEVsZW1lbnQucmVhZCgpO1xyXG4gICAgfVxyXG59XHJcbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmNsYXNzIFhtbFBhcnNlckV4Y2VwdGlvbiB7XHJcblxyXG4gICAgY29uc3RydWN0b3IodmFsdWUpe1xyXG4gICAgfVxyXG5cclxufVxyXG4iXSwibmFtZXMiOlsiUmVhZEFoZWFkIiwidmFsdWUiLCJtYXRjaGVyIiwiY3Vyc29yIiwiaWdub3JlV2hpdGVzcGFjZSIsImludGVybmFsQ3Vyc29yIiwiaSIsImxlbmd0aCIsImNoYXJBdCIsIkVsZW1lbnRCb2R5IiwiX25hbWUiLCJfbmFtZXNwYWNlIiwiX2F0dHJpYnV0ZXMiLCJNYXAiLCJkZXB0aCIsInhtbCIsIm5hbWVTdGFydHBvcyIsIm5hbWVFbmRwb3MiLCJuYW1lc3BhY2VFbmRwb3MiLCJuYW1lc3BhY2VTdGFydHBvcyIsIlN0cmluZ1V0aWxzIiwiaXNJbkFscGhhYmV0IiwiZGVidWciLCJzdWJzdHJpbmciLCJkZXRlY3RBdHRyaWJ1dGVzIiwiZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvciIsImRldGVjdE5leHRTdGFydEF0dHJpYnV0ZSIsImRldGVjdE5leHRFbmRBdHRyaWJ1dGUiLCJuYW1lIiwiZGV0ZWN0VmFsdWUiLCJ2YWx1ZVBvcyIsInJlYWQiLCJzZXQiLCJ2YWx1ZVN0YXJ0UG9zIiwiaXNBdHRyaWJ1dGVDb250ZW50IiwiZXJyb3IiLCJYbWxDZGF0YSIsIl92YWx1ZSIsImR1bXBMZXZlbCIsImxldmVsIiwic3BhY2VyIiwic3BhY2UiLCJsb2ciLCJYbWxFbGVtZW50IiwibmFtZXNwYWNlIiwic2VsZkNsb3NpbmciLCJjaGlsZEVsZW1lbnRzIiwiX3NlbGZDbG9zaW5nIiwiX2NoaWxkRWxlbWVudHMiLCJMaXN0IiwiYXR0cmlidXRlcyIsImtleSIsImdldCIsImNvbnRhaW5zIiwiZWxlbWVudHMiLCJ0ZXh0IiwiYWRkVGV4dCIsInRleHRFbGVtZW50IiwiYWRkIiwiZ2V0RnVsbE5hbWUiLCJyZWFkQXR0cmlidXRlcyIsImZvckVhY2giLCJjaGlsZEVsZW1lbnQiLCJyZXN1bHQiLCJhdHRyaWJ1dGUiLCJwYXJlbnQiLCJnZXROYW1lIiwiZ2V0VmFsdWUiLCJYbWxBdHRyaWJ1dGUiLCJ2YWwiLCJFbGVtZW50RGV0ZWN0b3IiLCJfdHlwZSIsIl9oYXNDaGlsZHJlbiIsIl9mb3VuZCIsIl94bWxDdXJzb3IiLCJfZWxlbWVudCIsInhtbEN1cnNvciIsImVsZW1lbnRCb2R5IiwiZW5kcG9zIiwiZGV0ZWN0T3BlbkVsZW1lbnQiLCJnZXROYW1lc3BhY2UiLCJnZXRBdHRyaWJ1dGVzIiwiYXR0cmlidXRlTmFtZSIsImF0dHJpYnV0ZVZhbHVlIiwic3RvcCIsImNsb3NpbmdFbGVtZW50IiwiZGV0ZWN0RW5kRWxlbWVudCIsImNsb3NpbmdUYWdOYW1lIiwiZGV0ZWN0UG9zaXRpb25zIiwiQ2RhdGFEZXRlY3RvciIsImVuZFBvcyIsImRldGVjdENvbnRlbnQiLCJwYXJlbnREb21TY2FmZm9sZCIsImhhc0NoaWxkcmVuIiwiaW50ZXJuYWxTdGFydFBvcyIsImlzQ29udGVudCIsIkNsb3NpbmdFbGVtZW50RGV0ZWN0b3IiLCJkZXRlY3RDbG9zaW5nRWxlbWVudCIsInNldEF0dHJpYnV0ZSIsIlhtbEN1cnNvciIsIkRvbVNjYWZmb2xkIiwiX2NoaWxkRG9tU2NhZmZvbGRzIiwiX2RldGVjdG9ycyIsIl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyIiwiZWxlbWVudENyZWF0ZWRMaXN0ZW5lciIsImxvYWREZXB0aCIsIkxvZ2dlciIsInNob3dQb3MiLCJlb2YiLCJlbGVtZW50RGV0ZWN0b3IiLCJjdXJFbGVtZW50RGV0ZWN0b3IiLCJnZXRUeXBlIiwiZGV0ZWN0IiwiaXNGb3VuZCIsIndhcm4iLCJjcmVhdGVFbGVtZW50IiwicHJldmlvdXNQYXJlbnRTY2FmZm9sZCIsImNoaWxkU2NhZmZvbGQiLCJwYXJlbnROb3RpZnlSZXN1bHQiLCJub3RpZnlSZXN1bHQiLCJub3RpZnlFbGVtZW50Q3JlYXRlZExpc3RlbmVyIiwiY2hpbGREb21TY2FmZm9sZCIsImdldFRyZWUiLCJnZXRDaGlsZEVsZW1lbnRzIiwiZWxlbWVudCIsImVsZW1lbnRDcmVhdGVkIiwiRG9tVHJlZSIsIl94bWwiLCJfcm9vdEVsZW1lbnQiLCJkb21TY2FmZm9sZCIsImxvYWQiLCJkdW1wIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFFQSxJQUFhQSxTQUFiOzs7Ozs7OzZCQUVnQkMsS0FGaEIsRUFFdUJDLE9BRnZCLEVBRWdDQyxNQUZoQyxFQUVpRTtnQkFBekJDLGdCQUF5Qix1RUFBTixLQUFNOztnQkFDckRDLGlCQUFpQkYsTUFBckI7aUJBQ0ksSUFBSUcsSUFBSSxDQUFaLEVBQWVBLElBQUlKLFFBQVFLLE1BQVosSUFBc0JELElBQUlMLE1BQU1NLE1BQS9DLEVBQXdERCxHQUF4RCxFQUE0RDt1QkFDbERGLG9CQUFvQkgsTUFBTU8sTUFBTixDQUFhSCxjQUFiLEtBQWdDLEdBQTFELEVBQThEOzs7b0JBRzNESixNQUFNTyxNQUFOLENBQWFILGNBQWIsS0FBZ0NILFFBQVFNLE1BQVIsQ0FBZUYsQ0FBZixDQUFuQyxFQUFxRDs7aUJBQXJELE1BRUs7MkJBQ00sQ0FBQyxDQUFSOzs7O21CQUlERCxpQkFBaUIsQ0FBeEI7Ozs7OztBQ2pCUjs7QUFFQSxBQUNBLEFBRUEsSUFBYUksV0FBYjsyQkFFaUI7OzthQUNKQyxLQUFMLEdBQWEsSUFBYjthQUNLQyxVQUFMLEdBQWtCLElBQWxCO2FBQ0tDLFdBQUwsR0FBbUIsSUFBSUMsY0FBSixFQUFuQjs7Ozs7a0NBR007bUJBQ0MsS0FBS0gsS0FBWjs7Ozt1Q0FHVzttQkFDSixLQUFLQyxVQUFaOzs7O3dDQUdZO21CQUNMLEtBQUtDLFdBQVo7Ozs7d0NBR1lFLEtBcEJwQixFQW9CMkJDLEdBcEIzQixFQW9CZ0NaLE1BcEJoQyxFQW9CdUM7Z0JBQzNCYSxlQUFlYixNQUFuQjtnQkFD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
