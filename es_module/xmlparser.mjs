import { Logger, Map, StringUtils, List } from './coreutil.mjs';

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

var XmlAttribute = function () {
    function XmlAttribute(name, namespace, value) {
        classCallCheck(this, XmlAttribute);

        this._name = name;
        this._namespace = namespace;
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
        key: "getNamespace",
        value: function getNamespace() {
            return this._namespace;
        }
    }, {
        key: "setNamespace",
        value: function setNamespace(val) {
            this._namespace = val;
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

var ElementBody = function () {
    function ElementBody() {
        classCallCheck(this, ElementBody);

        this._name = null;
        this._namespace = null;
        this._attributes = new Map();
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
            while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                cursor++;
            }
            if (xml.charAt(cursor) == ':') {
                Logger.debug(depth, 'Found namespace');
                cursor++;
                while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                    cursor++;
                }
            }
            nameEndpos = cursor - 1;
            this._name = xml.substring(nameStartpos, nameEndpos + 1);
            if (this._name.indexOf(":") > -1) {
                this._namespace = this._name.split(":")[0];
                this._name = this._name.split(":")[1];
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
                var namespace = null;
                var name = xml.substring(detectedAttrNameCursor, cursor + 1);

                if (name.indexOf(":") > -1) {
                    namespace = name.split(":")[0];
                    name = name.split(":")[1];
                }

                Logger.debug(depth, 'Found attribute from ' + detectedAttrNameCursor + '  to ' + cursor);
                cursor = this.detectValue(name, namespace, depth, xml, cursor + 1);
            }
            return cursor;
        }
    }, {
        key: "detectNextStartAttribute",
        value: function detectNextStartAttribute(depth, xml, cursor) {
            while (xml.charAt(cursor) == ' ' && cursor < xml.length) {
                cursor++;
                if (StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-") {
                    return cursor;
                }
            }
            return -1;
        }
    }, {
        key: "detectNextEndAttribute",
        value: function detectNextEndAttribute(depth, xml, cursor) {
            while (StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-") {
                cursor++;
            }
            if (xml.charAt(cursor) == ":") {
                cursor++;
                while (StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-") {
                    cursor++;
                }
            }
            return cursor - 1;
        }
    }, {
        key: "detectValue",
        value: function detectValue(name, namespace, depth, xml, cursor) {
            var valuePos = cursor;
            var fullname = name;
            if (namespace !== null) {
                fullname = namespace + ":" + name;
            }
            if ((valuePos = ReadAhead.read(xml, '="', valuePos, true)) == -1) {
                this._attributes.set(fullname, new XmlAttribute(name, namespace, null));
                return cursor;
            }
            valuePos++;
            Logger.debug(depth, 'Possible attribute value start at ' + valuePos);
            var valueStartPos = valuePos;
            while (this.isAttributeContent(depth, xml, valuePos)) {
                valuePos++;
            }
            if (valuePos == cursor) {
                this._attributes.set(fullname, new XmlAttribute(name, namespace, ''));
            } else {
                this._attributes.set(fullname, new XmlAttribute(name, namespace, xml.substring(valueStartPos, valuePos)));
            }

            Logger.debug(depth, 'Found attribute content ending at ' + (valuePos - 1));

            if ((valuePos = ReadAhead.read(xml, '"', valuePos, true)) != -1) {
                valuePos++;
            } else {
                Logger.error('Missing end quotes on attribute at position ' + valuePos);
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

            Logger.log(spacer + this._value);
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
    function XmlElement(name, namespace, namespaceUri, selfClosing) {
        classCallCheck(this, XmlElement);

        this._name = name;
        this._namespace = namespace;
        this._selfClosing = selfClosing;
        this._childElements = new List();
        this._attributes = new Map();
        this._namespaceUri = namespaceUri;
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
        key: "getNamespaceUri",
        value: function getNamespaceUri() {
            return this._namespaceUri;
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
            this._attributes = new Map();
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
            this._childElements = new List();
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
                Logger.log(spacer + '<' + this.getFullName() + this.readAttributes() + '/>');
                return;
            }
            Logger.log(spacer + '<' + this.getFullName() + this.readAttributes() + '>');
            this._childElements.forEach(function (childElement) {
                childElement.dumpLevel(level + 1);
                return true;
            });
            Logger.log(spacer + '</' + this.getFullName() + '>');
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
                var fullname = attribute.getName();
                if (attribute.getNamespace() !== null) {
                    fullname = attribute.getNamespace() + ":" + attribute.getName();
                }
                result = result + ' ' + fullname;
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

var ElementDetector = function () {
    function ElementDetector(namespaceUriMap) {
        classCallCheck(this, ElementDetector);

        this._type = 'ElementDetector';
        this._namespaceUriMap = namespaceUriMap;
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
            Logger.debug(depth, 'Looking for opening element at position ' + xmlCursor.cursor);
            var elementBody = new ElementBody();
            var endpos = ElementDetector.detectOpenElement(depth, xmlCursor.xml, xmlCursor.cursor, elementBody);
            if (endpos != -1) {

                var namespaceUri = null;
                if (elementBody.getNamespace() !== null && elementBody.getNamespace() !== undefined) {
                    namespaceUri = this._namespaceUriMap.get(elementBody.getNamespace());
                }

                this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), namespaceUri, false);

                elementBody.getAttributes().forEach(function (attributeName, attributeValue, parent) {
                    parent._element.getAttributes().set(attributeName, attributeValue);
                    return true;
                }, this);

                Logger.debug(depth, 'Found opening tag <' + this._element.getFullName() + '> from ' + xmlCursor.cursor + ' to ' + endpos);
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
            Logger.debug(depth, 'Looking for closing element at position ' + this._xmlCursor.cursor);
            var closingElement = ElementDetector.detectEndElement(depth, this._xmlCursor.xml, this._xmlCursor.cursor);
            if (closingElement != -1) {
                var closingTagName = this._xmlCursor.xml.substring(this._xmlCursor.cursor + 2, closingElement);
                Logger.debug(depth, 'Found closing tag </' + closingTagName + '> from ' + this._xmlCursor.cursor + ' to ' + closingElement);

                if (this._element.getFullName() != closingTagName) {
                    Logger.error('ERR: Mismatch between opening tag <' + this._element.getFullName() + '> and closing tag </' + closingTagName + '> When exiting to parent elemnt');
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
            Logger.debug(depth, 'Cdata start at ' + cursor);
            var internalStartPos = cursor;
            if (!CdataDetector.isContent(depth, xml, cursor)) {
                Logger.debug(depth, 'No Cdata found');
                return -1;
            }
            while (CdataDetector.isContent(depth, xml, cursor) && cursor < xml.length) {
                cursor++;
            }
            Logger.debug(depth, 'Cdata end at ' + (cursor - 1));
            if (parentDomScaffold === null) {
                Logger.error('ERR: Content not allowed on root level in xml document');
                return -1;
            }
            Logger.debug(depth, 'Cdata found value is ' + xml.substring(internalStartPos, cursor));
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
    function ClosingElementDetector(namespaceUriMap) {
        classCallCheck(this, ClosingElementDetector);

        this._type = 'ClosingElementDetector';
        this._namespaceUriMap = namespaceUriMap;
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
            Logger.debug(depth, 'Looking for self closing element at position ' + xmlCursor.cursor);
            var elementBody = new ElementBody();
            var endpos = ClosingElementDetector.detectClosingElement(depth, xmlCursor.xml, xmlCursor.cursor, elementBody);
            if (endpos != -1) {
                this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), this._namespaceUriMap, true);

                elementBody.getAttributes().forEach(function (attributeName, attributeValue, parent) {
                    parent._element.setAttribute(attributeName, attributeValue);
                    return true;
                }, this);

                Logger.debug(depth, 'Found self closing tag <' + this._element.getFullName() + '/> from ' + xmlCursor.cursor + ' to ' + endpos);
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
    function DomScaffold(namespaceUriMap) {
        classCallCheck(this, DomScaffold);

        this._namespaceUriMap = namespaceUriMap;
        this._element = null;
        this._childDomScaffolds = new List();
        this._detectors = new List();
        this._elementCreatedListener = null;
        this._detectors.add(new ElementDetector(this._namespaceUriMap));
        this._detectors.add(new CdataDetector());
        this._detectors.add(new ClosingElementDetector(this._namespaceUriMap));
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
            Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
            Logger.debug(depth, 'Starting DomScaffold');
            this._elementCreatedListener = elementCreatedListener;

            if (xmlCursor.eof()) {
                Logger.debug(depth, 'Reached eof. Exiting');
                return false;
            }

            var elementDetector = null;
            this._detectors.forEach(function (curElementDetector, parent) {
                Logger.debug(depth, 'Starting ' + curElementDetector.getType());
                curElementDetector.detect(depth + 1, xmlCursor);
                if (!curElementDetector.isFound()) {
                    return true;
                }
                elementDetector = curElementDetector;
                return false;
            }, this);

            if (elementDetector === null) {
                xmlCursor.cursor++;
                Logger.warn('WARN: No handler was found searching from position: ' + xmlCursor.cursor);
            }

            this._element = elementDetector.createElement();

            if (elementDetector instanceof ElementDetector && elementDetector.hasChildren()) {
                var namespaceUriMap = new Map();
                namespaceUriMap.addAll(this._namespaceUriMap);
                this._element.getAttributes().forEach(function (name, curAttribute, parent) {
                    if ("xmlns" === curAttribute.getNamespace()) {
                        namespaceUriMap.set(curAttribute.getName(), curAttribute.getValue());
                    }
                }, this);
                while (!elementDetector.stop(depth + 1) && xmlCursor.cursor < xmlCursor.xml.length) {
                    var previousParentScaffold = xmlCursor.parentDomScaffold;
                    var childScaffold = new DomScaffold(namespaceUriMap);
                    xmlCursor.parentDomScaffold = childScaffold;
                    childScaffold.loadDepth(depth + 1, xmlCursor, this._elementCreatedListener);
                    this._childDomScaffolds.add(childScaffold);
                    xmlCursor.parentDomScaffold = previousParentScaffold;
                }
            }
            Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
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
            if (this._elementCreatedListener !== null && this._elementCreatedListener !== undefined) {
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
            var domScaffold = new DomScaffold(new Map());
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

export { DomTree, CdataDetector, ClosingElementDetector, ElementBody, ElementDetector, DomScaffold, ReadAhead, XmlCursor, XmlAttribute, XmlCdata, XmlElement };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1scGFyc2VyLm1qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3JlYWRBaGVhZC5tanMiLCIuLi9zcmMvbWFpbi94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxBdHRyaWJ1dGUubWpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9lbGVtZW50Qm9keS5tanMiLCIuLi9zcmMvbWFpbi94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxDZGF0YS5tanMiLCIuLi9zcmMvbWFpbi94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxFbGVtZW50Lm1qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yLm1qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvY2RhdGFEZXRlY3Rvci5tanMiLCIuLi9zcmMvbWFpbi94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvZGV0ZWN0b3JzL2Nsb3NpbmdFbGVtZW50RGV0ZWN0b3IubWpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3htbEN1cnNvci5tanMiLCIuLi9zcmMvbWFpbi94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvZG9tU2NhZmZvbGQubWpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvZG9tVHJlZS5tanMiLCIuLi9zcmMvbWFpbi94bWxwYXJzZXIveG1sUGFyc2VyRXhjZXB0aW9uLm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBSZWFkQWhlYWR7XG5cbiAgICBzdGF0aWMgcmVhZCh2YWx1ZSwgbWF0Y2hlciwgY3Vyc29yLCBpZ25vcmVXaGl0ZXNwYWNlID0gZmFsc2Upe1xuICAgICAgICBsZXQgaW50ZXJuYWxDdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBtYXRjaGVyLmxlbmd0aCAmJiBpIDwgdmFsdWUubGVuZ3RoIDsgaSsrKXtcbiAgICAgICAgICAgIHdoaWxlKGlnbm9yZVdoaXRlc3BhY2UgJiYgdmFsdWUuY2hhckF0KGludGVybmFsQ3Vyc29yKSA9PSAnICcpe1xuICAgICAgICAgICAgICAgIGludGVybmFsQ3Vyc29yKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih2YWx1ZS5jaGFyQXQoaW50ZXJuYWxDdXJzb3IpID09IG1hdGNoZXIuY2hhckF0KGkpKXtcbiAgICAgICAgICAgICAgICBpbnRlcm5hbEN1cnNvcisrO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVybmFsQ3Vyc29yIC0gMTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBYbWxBdHRyaWJ1dGUge1xuXG4gIGNvbnN0cnVjdG9yKG5hbWUsbmFtZXNwYWNlLHZhbHVlKSB7XG4gICAgICB0aGlzLl9uYW1lID0gbmFtZTtcbiAgICAgIHRoaXMuX25hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBnZXROYW1lKCl7XG4gICAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgfVxuXG4gIHNldE5hbWUodmFsKXtcbiAgICAgIHRoaXMuX25hbWUgPSB2YWw7XG4gIH1cblxuICBnZXROYW1lc3BhY2UoKXtcbiAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlO1xuICB9XG5cbiAgc2V0TmFtZXNwYWNlKHZhbCl7XG4gICAgdGhpcy5fbmFtZXNwYWNlID0gdmFsO1xuICB9XG5cbiAgZ2V0VmFsdWUoKXtcbiAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgfVxuXG4gIHNldFZhbHVlKHZhbCl7XG4gICAgICB0aGlzLl92YWx1ZSA9IHZhbDtcbiAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlciwgTWFwLCBTdHJpbmdVdGlsc30gZnJvbSBcImNvcmV1dGlsXCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZC5tanNcIjtcbmltcG9ydCB7WG1sQXR0cmlidXRlfSBmcm9tIFwiLi4vLi4veG1sQXR0cmlidXRlLm1qc1wiO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudEJvZHl7XG5cbiAgICBjb25zdHJ1Y3Rvcigpe1xuICAgICAgICB0aGlzLl9uYW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBnZXROYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgICB9XG5cbiAgICBnZXROYW1lc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9uYW1lc3BhY2U7XG4gICAgfVxuXG4gICAgZ2V0QXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgZGV0ZWN0UG9zaXRpb25zKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCBuYW1lU3RhcnRwb3MgPSBjdXJzb3I7XG4gICAgICAgIGxldCBuYW1lRW5kcG9zID0gbnVsbDtcbiAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGN1cnNvciArKztcbiAgICAgICAgfVxuICAgICAgICBpZih4bWwuY2hhckF0KGN1cnNvcikgPT0gJzonKXtcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIG5hbWVzcGFjZScpO1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbmFtZUVuZHBvcyA9IGN1cnNvci0xO1xuICAgICAgICB0aGlzLl9uYW1lID0geG1sLnN1YnN0cmluZyhuYW1lU3RhcnRwb3MsIG5hbWVFbmRwb3MrMSk7XG4gICAgICAgIGlmKHRoaXMuX25hbWUuaW5kZXhPZihcIjpcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gdGhpcy5fbmFtZS5zcGxpdChcIjpcIilbMF07XG4gICAgICAgICAgICAgICAgdGhpcy5fbmFtZSA9IHRoaXMuX25hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciA9IHRoaXMuZGV0ZWN0QXR0cmlidXRlcyhkZXB0aCx4bWwsY3Vyc29yKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG5cbiAgICBkZXRlY3RBdHRyaWJ1dGVzKGRlcHRoLHhtbCxjdXJzb3Ipe1xuICAgICAgICBsZXQgZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvciA9IG51bGw7XG4gICAgICAgIHdoaWxlKChkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0U3RhcnRBdHRyaWJ1dGUoZGVwdGgsIHhtbCwgY3Vyc29yKSkgIT0gLTEpe1xuICAgICAgICAgICAgY3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGRldGVjdGVkQXR0ck5hbWVDdXJzb3IpO1xuICAgICAgICAgICAgbGV0IG5hbWVzcGFjZSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IHhtbC5zdWJzdHJpbmcoZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvcixjdXJzb3IrMSk7XG5cbiAgICAgICAgICAgIGlmKG5hbWUuaW5kZXhPZihcIjpcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlID0gbmFtZS5zcGxpdChcIjpcIilbMF07XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICAgICAgfSAgXG5cbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIGF0dHJpYnV0ZSBmcm9tICcgKyBkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yICsgJyAgdG8gJyArIGN1cnNvcik7XG4gICAgICAgICAgICBjdXJzb3IgPSB0aGlzLmRldGVjdFZhbHVlKG5hbWUsbmFtZXNwYWNlLGRlcHRoLCB4bWwsIGN1cnNvcisxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuXG4gICAgZGV0ZWN0TmV4dFN0YXJ0QXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSAnICcgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICBpZihTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSB8fCB4bWwuY2hhckF0KGN1cnNvcikgPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpIHx8IHhtbC5jaGFyQXQoY3Vyc29yKSA9PT0gXCItXCIpe1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICB9XG4gICAgICAgIGlmKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSBcIjpcIil7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB3aGlsZShTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSB8fCB4bWwuY2hhckF0KGN1cnNvcikgPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvciAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3RWYWx1ZShuYW1lLCBuYW1lc3BhY2UsIGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCB2YWx1ZVBvcyA9IGN1cnNvcjtcbiAgICAgICAgbGV0IGZ1bGxuYW1lID0gbmFtZTtcbiAgICAgICAgaWYobmFtZXNwYWNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBmdWxsbmFtZSA9IG5hbWVzcGFjZSArIFwiOlwiICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZigodmFsdWVQb3MgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz1cIicsdmFsdWVQb3MsdHJ1ZSkpID09IC0xKXtcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMuc2V0KGZ1bGxuYW1lLG5ldyBYbWxBdHRyaWJ1dGUobmFtZSxuYW1lc3BhY2UsbnVsbCkpO1xuICAgICAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZVBvcysrO1xuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdQb3NzaWJsZSBhdHRyaWJ1dGUgdmFsdWUgc3RhcnQgYXQgJyArIHZhbHVlUG9zKTtcbiAgICAgICAgbGV0IHZhbHVlU3RhcnRQb3MgPSB2YWx1ZVBvcztcbiAgICAgICAgd2hpbGUodGhpcy5pc0F0dHJpYnV0ZUNvbnRlbnQoZGVwdGgsIHhtbCwgdmFsdWVQb3MpKXtcbiAgICAgICAgICAgIHZhbHVlUG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYodmFsdWVQb3MgPT0gY3Vyc29yKXtcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMuc2V0KGZ1bGxuYW1lLCBuZXcgWG1sQXR0cmlidXRlKG5hbWUsbmFtZXNwYWNlLCcnKSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhpcy5fYXR0cmlidXRlcy5zZXQoZnVsbG5hbWUsIG5ldyBYbWxBdHRyaWJ1dGUobmFtZSxuYW1lc3BhY2UseG1sLnN1YnN0cmluZyh2YWx1ZVN0YXJ0UG9zLHZhbHVlUG9zKSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgYXR0cmlidXRlIGNvbnRlbnQgZW5kaW5nIGF0ICcgKyAodmFsdWVQb3MtMSkpO1xuXG4gICAgICAgIGlmKCh2YWx1ZVBvcyA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnXCInLHZhbHVlUG9zLHRydWUpKSAhPSAtMSl7XG4gICAgICAgICAgICB2YWx1ZVBvcysrO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIExvZ2dlci5lcnJvcignTWlzc2luZyBlbmQgcXVvdGVzIG9uIGF0dHJpYnV0ZSBhdCBwb3NpdGlvbiAnICsgdmFsdWVQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZVBvcztcbiAgICB9XG5cblxuICAgIGlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCdcIicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsXCJcblxuZXhwb3J0IGNsYXNzIFhtbENkYXRhe1xuXG5cdGNvbnN0cnVjdG9yKHZhbHVlKXtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBzZXRWYWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuXG4gICAgZHVtcCgpe1xuICAgICAgICB0aGlzLmR1bXBMZXZlbCgwKTtcbiAgICB9XG5cbiAgICBkdW1wTGV2ZWwobGV2ZWwpe1xuICAgICAgICBsZXQgc3BhY2VyID0gJzonO1xuICAgICAgICBmb3IobGV0IHNwYWNlID0gMCA7IHNwYWNlIDwgbGV2ZWwqMiA7IHNwYWNlICsrKXtcbiAgICAgICAgICAgIHNwYWNlciA9IHNwYWNlciArICcgJztcbiAgICAgICAgfVxuXG4gICAgICAgIExvZ2dlci5sb2coc3BhY2VyICsgdGhpcy5fdmFsdWUpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVhZCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlciwgTGlzdCwgTWFwfSBmcm9tIFwiY29yZXV0aWxcIjtcbmltcG9ydCB7WG1sQ2RhdGF9IGZyb20gXCIuL3htbENkYXRhLm1qc1wiO1xuXG5leHBvcnQgY2xhc3MgWG1sRWxlbWVudHtcblxuXHRjb25zdHJ1Y3RvcihuYW1lLCBuYW1lc3BhY2UsIG5hbWVzcGFjZVVyaSwgc2VsZkNsb3Npbmcpe1xuICAgICAgICB0aGlzLl9uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgICAgICB0aGlzLl9zZWxmQ2xvc2luZyA9IHNlbGZDbG9zaW5nO1xuICAgICAgICB0aGlzLl9jaGlsZEVsZW1lbnRzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5fYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlVXJpID0gbmFtZXNwYWNlVXJpO1xuICAgIH1cblxuICAgIGdldE5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICAgIH1cblxuICAgIGdldE5hbWVzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWVzcGFjZTtcbiAgICB9XG5cbiAgICBnZXROYW1lc3BhY2VVcmkoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWVzcGFjZVVyaTtcbiAgICB9XG5cbiAgICBnZXRGdWxsTmFtZSgpIHtcbiAgICAgICAgaWYodGhpcy5fbmFtZXNwYWNlID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWVzcGFjZSArICc6JyArIHRoaXMuX25hbWU7XG4gICAgfVxuXG4gICAgZ2V0QXR0cmlidXRlcygpe1xuICAgICAgICByZXR1cm4gdGhpcy5fYXR0cmlidXRlcztcbiAgICB9XG5cbiAgICBzZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpe1xuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcbiAgICB9XG5cbiAgICBzZXRBdHRyaWJ1dGUoa2V5LHZhbHVlKSB7XG5cdFx0dGhpcy5fYXR0cmlidXRlcy5zZXQoa2V5LHZhbHVlKTtcblx0fVxuXG5cdGdldEF0dHJpYnV0ZShrZXkpIHtcblx0XHRyZXR1cm4gdGhpcy5fYXR0cmlidXRlcy5nZXQoa2V5KTtcblx0fVxuXG4gICAgY29udGFpbnNBdHRyaWJ1dGUoa2V5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXMuY29udGFpbnMoa2V5KTtcbiAgICB9XG5cblx0Y2xlYXJBdHRyaWJ1dGUoKXtcblx0XHR0aGlzLl9hdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuXHR9XG5cbiAgICBnZXRDaGlsZEVsZW1lbnRzKCl7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaGlsZEVsZW1lbnRzO1xuICAgIH1cblxuICAgIHNldENoaWxkRWxlbWVudHMoZWxlbWVudHMpIHtcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cyA9IGVsZW1lbnRzO1xuICAgIH1cblxuICAgIHNldFRleHQodGV4dCl7XG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLmFkZFRleHQodGV4dCk7XG4gICAgfVxuXG4gICAgYWRkVGV4dCh0ZXh0KXtcbiAgICAgICAgbGV0IHRleHRFbGVtZW50ID0gbmV3IFhtbENkYXRhKHRleHQpO1xuICAgICAgICB0aGlzLl9jaGlsZEVsZW1lbnRzLmFkZCh0ZXh0RWxlbWVudCk7XG4gICAgfVxuXG4gICAgZHVtcCgpe1xuICAgICAgICB0aGlzLmR1bXBMZXZlbCgwKTtcbiAgICB9XG5cbiAgICBkdW1wTGV2ZWwobGV2ZWwpe1xuICAgICAgICBsZXQgc3BhY2VyID0gJzonO1xuICAgICAgICBmb3IobGV0IHNwYWNlID0gMCA7IHNwYWNlIDwgbGV2ZWwqMiA7IHNwYWNlICsrKXtcbiAgICAgICAgICAgIHNwYWNlciA9IHNwYWNlciArICcgJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHRoaXMuX3NlbGZDbG9zaW5nKXtcbiAgICAgICAgICAgIExvZ2dlci5sb2coc3BhY2VyICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJy8+Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgTG9nZ2VyLmxvZyhzcGFjZXIgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnPicpO1xuICAgICAgICB0aGlzLl9jaGlsZEVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24oY2hpbGRFbGVtZW50KXtcbiAgICAgICAgICAgIGNoaWxkRWxlbWVudC5kdW1wTGV2ZWwobGV2ZWwrMSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIExvZ2dlci5sb2coc3BhY2VyICsgJzwvJyArIHRoaXMuZ2V0RnVsbE5hbWUoKSArICc+Jyk7XG4gICAgfVxuXG4gICAgcmVhZCgpe1xuICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgICAgIGlmKHRoaXMuX3NlbGZDbG9zaW5nKXtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICc8JyArIHRoaXMuZ2V0RnVsbE5hbWUoKSArIHRoaXMucmVhZEF0dHJpYnV0ZXMoKSArICcvPic7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICc8JyArIHRoaXMuZ2V0RnVsbE5hbWUoKSArIHRoaXMucmVhZEF0dHJpYnV0ZXMoKSArICc+JztcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkRWxlbWVudCl7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgKyBjaGlsZEVsZW1lbnQucmVhZCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnPC8nICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgJz4nO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJlYWRBdHRyaWJ1dGVzKCl7XG4gICAgICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAgICAgdGhpcy5fYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChrZXksYXR0cmlidXRlLHBhcmVudCkge1xuICAgICAgICAgICAgbGV0IGZ1bGxuYW1lID0gYXR0cmlidXRlLmdldE5hbWUoKTtcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZS5nZXROYW1lc3BhY2UoKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZ1bGxuYW1lID0gYXR0cmlidXRlLmdldE5hbWVzcGFjZSgpICsgXCI6XCIgKyBhdHRyaWJ1dGUuZ2V0TmFtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJyAnICsgZnVsbG5hbWU7XG4gICAgICAgICAgICBpZihhdHRyaWJ1dGUuZ2V0VmFsdWUoKSAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJz1cIicgKyBhdHRyaWJ1dGUuZ2V0VmFsdWUoKSArICdcIic7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LHRoaXMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbFwiO1xuaW1wb3J0IHtSZWFkQWhlYWR9IGZyb20gXCIuLi9yZWFkQWhlYWQubWpzXCI7XG5pbXBvcnQge0VsZW1lbnRCb2R5fSBmcm9tIFwiLi9lbGVtZW50Qm9keS5tanNcIjtcbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcIi4uLy4uL3htbEVsZW1lbnQubWpzXCI7XG5pbXBvcnQge1htbEF0dHJpYnV0ZX0gZnJvbSBcIi4uLy4uL3htbEF0dHJpYnV0ZS5tanNcIjtcblxuZXhwb3J0IGNsYXNzIEVsZW1lbnREZXRlY3RvcntcblxuICAgIGNvbnN0cnVjdG9yKG5hbWVzcGFjZVVyaU1hcCl7XG4gICAgICAgIHRoaXMuX3R5cGUgPSAnRWxlbWVudERldGVjdG9yJztcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlVXJpTWFwID0gbmFtZXNwYWNlVXJpTWFwO1xuICAgICAgICB0aGlzLl9oYXNDaGlsZHJlbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9mb3VuZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl94bWxDdXJzb3IgPSBudWxsO1xuICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXRUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdHlwZTtcbiAgICB9XG5cbiAgICBpc0ZvdW5kKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZm91bmQ7XG4gICAgfVxuXG4gICAgaGFzQ2hpbGRyZW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9oYXNDaGlsZHJlbjtcbiAgICB9XG5cbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcil7XG4gICAgICAgIHRoaXMuX3htbEN1cnNvciA9IHhtbEN1cnNvcjtcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnTG9va2luZyBmb3Igb3BlbmluZyBlbGVtZW50IGF0IHBvc2l0aW9uICcgKyB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgbGV0IGVsZW1lbnRCb2R5ID0gbmV3IEVsZW1lbnRCb2R5KCk7XG4gICAgICAgIGxldCBlbmRwb3MgPSBFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0T3BlbkVsZW1lbnQoZGVwdGgsIHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IsZWxlbWVudEJvZHkpO1xuICAgICAgICBpZihlbmRwb3MgIT0gLTEpIHtcblxuICAgICAgICAgICAgbGV0IG5hbWVzcGFjZVVyaSA9IG51bGw7XG4gICAgICAgICAgICBpZihlbGVtZW50Qm9keS5nZXROYW1lc3BhY2UoKSAhPT0gbnVsbCAmJiBlbGVtZW50Qm9keS5nZXROYW1lc3BhY2UoKSAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2VVcmkgPSB0aGlzLl9uYW1lc3BhY2VVcmlNYXAuZ2V0KGVsZW1lbnRCb2R5LmdldE5hbWVzcGFjZSgpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnRCb2R5LmdldE5hbWUoKSwgZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCksIG5hbWVzcGFjZVVyaSwgZmFsc2UpO1xuXG4gICAgICAgICAgICBlbGVtZW50Qm9keS5nZXRBdHRyaWJ1dGVzKCkuZm9yRWFjaChmdW5jdGlvbihhdHRyaWJ1dGVOYW1lLGF0dHJpYnV0ZVZhbHVlLHBhcmVudCl7XG4gICAgICAgICAgICAgICAgcGFyZW50Ll9lbGVtZW50LmdldEF0dHJpYnV0ZXMoKS5zZXQoYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdGb3VuZCBvcGVuaW5nIHRhZyA8JyArIHRoaXMuX2VsZW1lbnQuZ2V0RnVsbE5hbWUoKSArICc+IGZyb20gJyArICB4bWxDdXJzb3IuY3Vyc29yICArICcgdG8gJyArIGVuZHBvcyk7XG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yID0gZW5kcG9zICsgMTtcblxuICAgICAgICAgICAgaWYoIXRoaXMuc3RvcChkZXB0aCkpe1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhc0NoaWxkcmVuID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3AoZGVwdGgpe1xuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdMb29raW5nIGZvciBjbG9zaW5nIGVsZW1lbnQgYXQgcG9zaXRpb24gJyArIHRoaXMuX3htbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBsZXQgY2xvc2luZ0VsZW1lbnQgPSBFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0RW5kRWxlbWVudChkZXB0aCwgdGhpcy5feG1sQ3Vyc29yLnhtbCwgdGhpcy5feG1sQ3Vyc29yLmN1cnNvcik7XG4gICAgICAgIGlmKGNsb3NpbmdFbGVtZW50ICE9IC0xKXtcbiAgICAgICAgICAgIGxldCBjbG9zaW5nVGFnTmFtZSA9ICB0aGlzLl94bWxDdXJzb3IueG1sLnN1YnN0cmluZyh0aGlzLl94bWxDdXJzb3IuY3Vyc29yKzIsY2xvc2luZ0VsZW1lbnQpO1xuICAgICAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgY2xvc2luZyB0YWcgPC8nICsgY2xvc2luZ1RhZ05hbWUgKyAnPiBmcm9tICcgKyAgdGhpcy5feG1sQ3Vyc29yLmN1cnNvciAgKyAnIHRvICcgKyBjbG9zaW5nRWxlbWVudCk7XG5cbiAgICAgICAgICAgIGlmKHRoaXMuX2VsZW1lbnQuZ2V0RnVsbE5hbWUoKSAhPSBjbG9zaW5nVGFnTmFtZSl7XG4gICAgICAgICAgICAgICAgTG9nZ2VyLmVycm9yKCdFUlI6IE1pc21hdGNoIGJldHdlZW4gb3BlbmluZyB0YWcgPCcgKyB0aGlzLl9lbGVtZW50LmdldEZ1bGxOYW1lKCkgKyAnPiBhbmQgY2xvc2luZyB0YWcgPC8nICsgY2xvc2luZ1RhZ05hbWUgKyAnPiBXaGVuIGV4aXRpbmcgdG8gcGFyZW50IGVsZW1udCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5feG1sQ3Vyc29yLmN1cnNvciA9IGNsb3NpbmdFbGVtZW50ICsxO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlY3RPcGVuRWxlbWVudChkZXB0aCwgeG1sLCBjdXJzb3IsIGVsZW1lbnRCb2R5KSB7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIGN1cnNvciA9IGVsZW1lbnRCb2R5LmRldGVjdFBvc2l0aW9ucyhkZXB0aCsxLCB4bWwsIGN1cnNvcik7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz4nLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlY3RFbmRFbGVtZW50KGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJzwvJyxjdXJzb3IpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICBjdXJzb3IgPSBuZXcgRWxlbWVudEJvZHkoKS5kZXRlY3RQb3NpdGlvbnMoZGVwdGgrMSwgeG1sLCBjdXJzb3IpO1xuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc+JyxjdXJzb3IpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cbmltcG9ydCB7TG9nZ2VyfSBmcm9tIFwiY29yZXV0aWxcIjtcbmltcG9ydCB7WG1sQ2RhdGF9IGZyb20gXCIuLi8uLi94bWxDZGF0YS5tanNcIjtcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkLm1qc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2RhdGFEZXRlY3RvcntcblxuICAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICAgIHRoaXMuX3R5cGUgPSAnQ2RhdGFEZXRlY3Rvcic7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZm91bmQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpc0ZvdW5kKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZm91bmQ7XG4gICAgfVxuXG4gICAgZ2V0VHlwZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBYbWxDZGF0YSh0aGlzLl92YWx1ZSk7XG4gICAgfVxuXG4gICAgZGV0ZWN0KGRlcHRoLCB4bWxDdXJzb3Ipe1xuICAgICAgICB0aGlzLl9mb3VuZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bGw7XG5cbiAgICAgICAgbGV0IGVuZFBvcyA9IHRoaXMuZGV0ZWN0Q29udGVudChkZXB0aCwgeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvciwgeG1sQ3Vyc29yLnBhcmVudERvbVNjYWZmb2xkKTtcbiAgICAgICAgaWYoZW5kUG9zICE9IC0xKSB7XG4gICAgICAgICAgICB0aGlzLl9mb3VuZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmhhc0NoaWxkcmVuID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IHhtbEN1cnNvci54bWwuc3Vic3RyaW5nKHhtbEN1cnNvci5jdXJzb3IsZW5kUG9zKTtcbiAgICAgICAgICAgIHhtbEN1cnNvci5jdXJzb3IgPSBlbmRQb3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZXRlY3RDb250ZW50KGRlcHRoLCB4bWwsIGN1cnNvciwgcGFyZW50RG9tU2NhZmZvbGQpIHtcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnQ2RhdGEgc3RhcnQgYXQgJyArIGN1cnNvcik7XG4gICAgICAgIGxldCBpbnRlcm5hbFN0YXJ0UG9zID0gY3Vyc29yO1xuICAgICAgICBpZighQ2RhdGFEZXRlY3Rvci5pc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKSl7XG4gICAgICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdObyBDZGF0YSBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlKENkYXRhRGV0ZWN0b3IuaXNDb250ZW50KGRlcHRoLCB4bWwsIGN1cnNvcikgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIH1cbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnQ2RhdGEgZW5kIGF0ICcgKyAoY3Vyc29yLTEpKTtcbiAgICAgICAgaWYocGFyZW50RG9tU2NhZmZvbGQgPT09IG51bGwpe1xuICAgICAgICAgICAgTG9nZ2VyLmVycm9yKCdFUlI6IENvbnRlbnQgbm90IGFsbG93ZWQgb24gcm9vdCBsZXZlbCBpbiB4bWwgZG9jdW1lbnQnKTtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdDZGF0YSBmb3VuZCB2YWx1ZSBpcyAnICsgeG1sLnN1YnN0cmluZyhpbnRlcm5hbFN0YXJ0UG9zLGN1cnNvcikpO1xuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuICAgIHN0YXRpYyBpc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKXtcbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCc8JyxjdXJzb3IpICE9IC0xKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJz4nLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbFwiO1xuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwiLi4vLi4veG1sRWxlbWVudC5tanNcIjtcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkLm1qc1wiO1xuaW1wb3J0IHtFbGVtZW50Qm9keX0gZnJvbSBcIi4vZWxlbWVudEJvZHkubWpzXCI7XG5pbXBvcnQge1htbEF0dHJpYnV0ZX0gZnJvbSBcIi4uLy4uL3htbEF0dHJpYnV0ZS5tanNcIjtcblxuZXhwb3J0IGNsYXNzIENsb3NpbmdFbGVtZW50RGV0ZWN0b3J7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lc3BhY2VVcmlNYXApe1xuICAgICAgICB0aGlzLl90eXBlID0gJ0Nsb3NpbmdFbGVtZW50RGV0ZWN0b3InO1xuICAgICAgICB0aGlzLl9uYW1lc3BhY2VVcmlNYXAgPSBuYW1lc3BhY2VVcmlNYXA7XG4gICAgICAgIHRoaXMuX2ZvdW5kID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2VsZW1lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50O1xuICAgIH1cblxuICAgIGdldFR5cGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90eXBlO1xuICAgIH1cblxuICAgIGlzRm91bmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mb3VuZDtcbiAgICB9XG5cbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcikge1xuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdMb29raW5nIGZvciBzZWxmIGNsb3NpbmcgZWxlbWVudCBhdCBwb3NpdGlvbiAnICsgeG1sQ3Vyc29yLmN1cnNvcik7XG4gICAgICAgIGxldCBlbGVtZW50Qm9keSA9IG5ldyBFbGVtZW50Qm9keSgpO1xuICAgICAgICBsZXQgZW5kcG9zID0gQ2xvc2luZ0VsZW1lbnREZXRlY3Rvci5kZXRlY3RDbG9zaW5nRWxlbWVudChkZXB0aCwgeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcixlbGVtZW50Qm9keSk7XG4gICAgICAgIGlmKGVuZHBvcyAhPSAtMSl7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50ID0gbmV3IFhtbEVsZW1lbnQoZWxlbWVudEJvZHkuZ2V0TmFtZSgpLCBlbGVtZW50Qm9keS5nZXROYW1lc3BhY2UoKSwgdGhpcy5fbmFtZXNwYWNlVXJpTWFwLCB0cnVlKTtcblxuICAgICAgICAgICAgZWxlbWVudEJvZHkuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgICAgIHBhcmVudC5fZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdGb3VuZCBzZWxmIGNsb3NpbmcgdGFnIDwnICsgdGhpcy5fZWxlbWVudC5nZXRGdWxsTmFtZSgpICsgJy8+IGZyb20gJyArICB4bWxDdXJzb3IuY3Vyc29yICArICcgdG8gJyArIGVuZHBvcyk7XG4gICAgICAgICAgICB0aGlzLl9mb3VuZCA9IHRydWU7XG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yID0gZW5kcG9zICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlY3RDbG9zaW5nRWxlbWVudChkZXB0aCwgeG1sLCBjdXJzb3IsIGVsZW1lbnRCb2R5KXtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPCcsY3Vyc29yKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciArKztcbiAgICAgICAgY3Vyc29yID0gZWxlbWVudEJvZHkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnLz4nLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFhtbEN1cnNvcntcblxuICAgIGNvbnN0cnVjdG9yKHhtbCwgY3Vyc29yLCBwYXJlbnREb21TY2FmZm9sZCl7XG4gICAgICAgIHRoaXMueG1sID0geG1sO1xuICAgICAgICB0aGlzLmN1cnNvciA9IGN1cnNvcjtcbiAgICAgICAgdGhpcy5wYXJlbnREb21TY2FmZm9sZCA9IHBhcmVudERvbVNjYWZmb2xkO1xuICAgIH1cblxuICAgIGVvZigpe1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJzb3IgPj0gdGhpcy54bWwubGVuZ3RoO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXIsIE1hcCwgTGlzdH0gZnJvbSBcImNvcmV1dGlsXCI7XG5pbXBvcnQge0VsZW1lbnREZXRlY3Rvcn0gZnJvbSBcIi4vZGV0ZWN0b3JzL2VsZW1lbnREZXRlY3Rvci5tanNcIjtcbmltcG9ydCB7Q2RhdGFEZXRlY3Rvcn0gZnJvbSBcIi4vZGV0ZWN0b3JzL2NkYXRhRGV0ZWN0b3IubWpzXCI7XG5pbXBvcnQge0Nsb3NpbmdFbGVtZW50RGV0ZWN0b3J9IGZyb20gXCIuL2RldGVjdG9ycy9jbG9zaW5nRWxlbWVudERldGVjdG9yLm1qc1wiO1xuaW1wb3J0IHtYbWxDdXJzb3J9IGZyb20gXCIuL3htbEN1cnNvci5tanNcIjtcblxuZXhwb3J0IGNsYXNzIERvbVNjYWZmb2xke1xuXG4gICAgY29uc3RydWN0b3IobmFtZXNwYWNlVXJpTWFwKXtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlVXJpTWFwID0gbmFtZXNwYWNlVXJpTWFwO1xuICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY2hpbGREb21TY2FmZm9sZHMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLl9kZXRlY3RvcnMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzLmFkZChuZXcgRWxlbWVudERldGVjdG9yKHRoaXMuX25hbWVzcGFjZVVyaU1hcCkpO1xuICAgICAgICB0aGlzLl9kZXRlY3RvcnMuYWRkKG5ldyBDZGF0YURldGVjdG9yKCkpO1xuICAgICAgICB0aGlzLl9kZXRlY3RvcnMuYWRkKG5ldyBDbG9zaW5nRWxlbWVudERldGVjdG9yKHRoaXMuX25hbWVzcGFjZVVyaU1hcCkpO1xuICAgIH1cblxuICAgIGdldEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50O1xuICAgIH1cblxuICAgIGxvYWQoeG1sLCBjdXJzb3IsIGVsZW1lbnRDcmVhdGVkTGlzdGVuZXIpe1xuICAgICAgICBsZXQgeG1sQ3Vyc29yID0gbmV3IFhtbEN1cnNvcih4bWwsIGN1cnNvciwgbnVsbCk7XG4gICAgICAgIHRoaXMubG9hZERlcHRoKDEsIHhtbEN1cnNvciwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgbG9hZERlcHRoKGRlcHRoLCB4bWxDdXJzb3IsIGVsZW1lbnRDcmVhdGVkTGlzdGVuZXIpe1xuICAgICAgICBMb2dnZXIuc2hvd1Bvcyh4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnU3RhcnRpbmcgRG9tU2NhZmZvbGQnKTtcbiAgICAgICAgdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lciA9IGVsZW1lbnRDcmVhdGVkTGlzdGVuZXI7XG5cbiAgICAgICAgaWYoeG1sQ3Vyc29yLmVvZigpKXtcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ1JlYWNoZWQgZW9mLiBFeGl0aW5nJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZWxlbWVudERldGVjdG9yID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzLmZvckVhY2goZnVuY3Rpb24oY3VyRWxlbWVudERldGVjdG9yLHBhcmVudCl7XG4gICAgICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdTdGFydGluZyAnICsgY3VyRWxlbWVudERldGVjdG9yLmdldFR5cGUoKSk7XG4gICAgICAgICAgICBjdXJFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0KGRlcHRoICsgMSx4bWxDdXJzb3IpO1xuICAgICAgICAgICAgaWYoIWN1ckVsZW1lbnREZXRlY3Rvci5pc0ZvdW5kKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudERldGVjdG9yID0gY3VyRWxlbWVudERldGVjdG9yO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgIGlmKGVsZW1lbnREZXRlY3RvciA9PT0gbnVsbCl7XG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yKys7XG4gICAgICAgICAgICBMb2dnZXIud2FybignV0FSTjogTm8gaGFuZGxlciB3YXMgZm91bmQgc2VhcmNoaW5nIGZyb20gcG9zaXRpb246ICcgKyB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2VsZW1lbnQgPSBlbGVtZW50RGV0ZWN0b3IuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIGlmKGVsZW1lbnREZXRlY3RvciBpbnN0YW5jZW9mIEVsZW1lbnREZXRlY3RvciAmJiBlbGVtZW50RGV0ZWN0b3IuaGFzQ2hpbGRyZW4oKSkge1xuICAgICAgICAgICAgbGV0IG5hbWVzcGFjZVVyaU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIG5hbWVzcGFjZVVyaU1hcC5hZGRBbGwodGhpcy5fbmFtZXNwYWNlVXJpTWFwKTtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24obmFtZSxjdXJBdHRyaWJ1dGUscGFyZW50KXtcbiAgICAgICAgICAgICAgICBpZihcInhtbG5zXCIgPT09IGN1ckF0dHJpYnV0ZS5nZXROYW1lc3BhY2UoKSl7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZVVyaU1hcC5zZXQoY3VyQXR0cmlidXRlLmdldE5hbWUoKSxjdXJBdHRyaWJ1dGUuZ2V0VmFsdWUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgICAgIHdoaWxlKCFlbGVtZW50RGV0ZWN0b3Iuc3RvcChkZXB0aCArIDEpICYmIHhtbEN1cnNvci5jdXJzb3IgPCB4bWxDdXJzb3IueG1sLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgbGV0IHByZXZpb3VzUGFyZW50U2NhZmZvbGQgPSB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQ7XG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkU2NhZmZvbGQgPSBuZXcgRG9tU2NhZmZvbGQobmFtZXNwYWNlVXJpTWFwKTtcbiAgICAgICAgICAgICAgICB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQgPSBjaGlsZFNjYWZmb2xkO1xuICAgICAgICAgICAgICAgIGNoaWxkU2NhZmZvbGQubG9hZERlcHRoKGRlcHRoKzEsIHhtbEN1cnNvciwgdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2hpbGREb21TY2FmZm9sZHMuYWRkKGNoaWxkU2NhZmZvbGQpO1xuICAgICAgICAgICAgICAgIHhtbEN1cnNvci5wYXJlbnREb21TY2FmZm9sZCA9IHByZXZpb3VzUGFyZW50U2NhZmZvbGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgTG9nZ2VyLnNob3dQb3MoeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcik7XG4gICAgfVxuXG4gICAgZ2V0VHJlZShwYXJlbnROb3RpZnlSZXN1bHQpe1xuICAgICAgICBpZih0aGlzLl9lbGVtZW50ID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vdGlmeVJlc3VsdCA9IHRoaXMubm90aWZ5RWxlbWVudENyZWF0ZWRMaXN0ZW5lcih0aGlzLl9lbGVtZW50LHBhcmVudE5vdGlmeVJlc3VsdCk7XG5cbiAgICAgICAgdGhpcy5fY2hpbGREb21TY2FmZm9sZHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZERvbVNjYWZmb2xkLHBhcmVudCkge1xuICAgICAgICAgICAgbGV0IGNoaWxkRWxlbWVudCA9IGNoaWxkRG9tU2NhZmZvbGQuZ2V0VHJlZShub3RpZnlSZXN1bHQpO1xuICAgICAgICAgICAgaWYoY2hpbGRFbGVtZW50ICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICBwYXJlbnQuX2VsZW1lbnQuZ2V0Q2hpbGRFbGVtZW50cygpLmFkZChjaGlsZEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XG4gICAgfVxuXG4gICAgbm90aWZ5RWxlbWVudENyZWF0ZWRMaXN0ZW5lcihlbGVtZW50LCBwYXJlbnROb3RpZnlSZXN1bHQpIHtcbiAgICAgICAgaWYodGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lciAhPT0gbnVsbCAmJiB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIuZWxlbWVudENyZWF0ZWQoZWxlbWVudCwgcGFyZW50Tm90aWZ5UmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtEb21TY2FmZm9sZH0gZnJvbSBcIi4vcGFyc2VyL2RvbVNjYWZmb2xkLm1qc1wiO1xuaW1wb3J0IHtNYXB9IGZyb20gXCJjb3JldXRpbFwiO1xuXG5leHBvcnQgY2xhc3MgRG9tVHJlZXtcblxuICAgIGNvbnN0cnVjdG9yKHhtbCwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyID0gZWxlbWVudENyZWF0ZWRMaXN0ZW5lcjtcbiAgICAgICAgdGhpcy5feG1sID0geG1sO1xuICAgICAgICB0aGlzLl9yb290RWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0Um9vdEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yb290RWxlbWVudDtcbiAgICB9XG5cbiAgICBzZXRSb290RWxlbWVudChlbGVtZW50KSB7XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gZWxlbWVudDtcbiAgICB9XG5cbiAgICBsb2FkKCl7XG4gICAgICAgIGxldCBkb21TY2FmZm9sZCA9IG5ldyBEb21TY2FmZm9sZChuZXcgTWFwKCkpO1xuICAgICAgICBkb21TY2FmZm9sZC5sb2FkKHRoaXMuX3htbCwwLHRoaXMuX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIpO1xuICAgICAgICB0aGlzLl9yb290RWxlbWVudCA9IGRvbVNjYWZmb2xkLmdldFRyZWUoKTtcbiAgICB9XG5cbiAgICBkdW1wKCl7XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50LmR1bXAoKTtcbiAgICB9XG5cbiAgICByZWFkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLl9yb290RWxlbWVudC5yZWFkKCk7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5jbGFzcyBYbWxQYXJzZXJFeGNlcHRpb24ge1xuXG4gICAgY29uc3RydWN0b3IodmFsdWUpe1xuICAgIH1cblxufVxuIl0sIm5hbWVzIjpbIlJlYWRBaGVhZCIsInZhbHVlIiwibWF0Y2hlciIsImN1cnNvciIsImlnbm9yZVdoaXRlc3BhY2UiLCJpbnRlcm5hbEN1cnNvciIsImkiLCJsZW5ndGgiLCJjaGFyQXQiLCJYbWxBdHRyaWJ1dGUiLCJuYW1lIiwibmFtZXNwYWNlIiwiX25hbWUiLCJfbmFtZXNwYWNlIiwiX3ZhbHVlIiwidmFsIiwiRWxlbWVudEJvZHkiLCJfYXR0cmlidXRlcyIsIk1hcCIsImRlcHRoIiwieG1sIiwibmFtZVN0YXJ0cG9zIiwibmFtZUVuZHBvcyIsIlN0cmluZ1V0aWxzIiwiaXNJbkFscGhhYmV0IiwiZGVidWciLCJzdWJzdHJpbmciLCJpbmRleE9mIiwic3BsaXQiLCJkZXRlY3RBdHRyaWJ1dGVzIiwiZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvciIsImRldGVjdE5leHRTdGFydEF0dHJpYnV0ZSIsImRldGVjdE5leHRFbmRBdHRyaWJ1dGUiLCJkZXRlY3RWYWx1ZSIsInZhbHVlUG9zIiwiZnVsbG5hbWUiLCJyZWFkIiwic2V0IiwidmFsdWVTdGFydFBvcyIsImlzQXR0cmlidXRlQ29udGVudCIsImVycm9yIiwiWG1sQ2RhdGEiLCJkdW1wTGV2ZWwiLCJsZXZlbCIsInNwYWNlciIsInNwYWNlIiwibG9nIiwiWG1sRWxlbWVudCIsIm5hbWVzcGFjZVVyaSIsInNlbGZDbG9zaW5nIiwiX3NlbGZDbG9zaW5nIiwiX2NoaWxkRWxlbWVudHMiLCJMaXN0IiwiX25hbWVzcGFjZVVyaSIsImF0dHJpYnV0ZXMiLCJrZXkiLCJnZXQiLCJjb250YWlucyIsImVsZW1lbnRzIiwidGV4dCIsImFkZFRleHQiLCJ0ZXh0RWxlbWVudCIsImFkZCIsImdldEZ1bGxOYW1lIiwicmVhZEF0dHJpYnV0ZXMiLCJmb3JFYWNoIiwiY2hpbGRFbGVtZW50IiwicmVzdWx0IiwiYXR0cmlidXRlIiwicGFyZW50IiwiZ2V0TmFtZSIsImdldE5hbWVzcGFjZSIsImdldFZhbHVlIiwiRWxlbWVudERldGVjdG9yIiwibmFtZXNwYWNlVXJpTWFwIiwiX3R5cGUiLCJfbmFtZXNwYWNlVXJpTWFwIiwiX2hhc0NoaWxkcmVuIiwiX2ZvdW5kIiwiX3htbEN1cnNvciIsIl9lbGVtZW50IiwieG1sQ3Vyc29yIiwiZWxlbWVudEJvZHkiLCJlbmRwb3MiLCJkZXRlY3RPcGVuRWxlbWVudCIsInVuZGVmaW5lZCIsImdldEF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVOYW1lIiwiYXR0cmlidXRlVmFsdWUiLCJzdG9wIiwiY2xvc2luZ0VsZW1lbnQiLCJkZXRlY3RFbmRFbGVtZW50IiwiY2xvc2luZ1RhZ05hbWUiLCJkZXRlY3RQb3NpdGlvbnMiLCJDZGF0YURldGVjdG9yIiwiZW5kUG9zIiwiZGV0ZWN0Q29udGVudCIsInBhcmVudERvbVNjYWZmb2xkIiwiaGFzQ2hpbGRyZW4iLCJpbnRlcm5hbFN0YXJ0UG9zIiwiaXNDb250ZW50IiwiQ2xvc2luZ0VsZW1lbnREZXRlY3RvciIsImRldGVjdENsb3NpbmdFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiWG1sQ3Vyc29yIiwiRG9tU2NhZmZvbGQiLCJfY2hpbGREb21TY2FmZm9sZHMiLCJfZGV0ZWN0b3JzIiwiX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIiLCJlbGVtZW50Q3JlYXRlZExpc3RlbmVyIiwibG9hZERlcHRoIiwic2hvd1BvcyIsImVvZiIsImVsZW1lbnREZXRlY3RvciIsImN1ckVsZW1lbnREZXRlY3RvciIsImdldFR5cGUiLCJkZXRlY3QiLCJpc0ZvdW5kIiwid2FybiIsImNyZWF0ZUVsZW1lbnQiLCJhZGRBbGwiLCJjdXJBdHRyaWJ1dGUiLCJwcmV2aW91c1BhcmVudFNjYWZmb2xkIiwiY2hpbGRTY2FmZm9sZCIsInBhcmVudE5vdGlmeVJlc3VsdCIsIm5vdGlmeVJlc3VsdCIsIm5vdGlmeUVsZW1lbnRDcmVhdGVkTGlzdGVuZXIiLCJjaGlsZERvbVNjYWZmb2xkIiwiZ2V0VHJlZSIsImdldENoaWxkRWxlbWVudHMiLCJlbGVtZW50IiwiZWxlbWVudENyZWF0ZWQiLCJEb21UcmVlIiwiX3htbCIsIl9yb290RWxlbWVudCIsImRvbVNjYWZmb2xkIiwibG9hZCIsImR1bXAiXSwibWFwcGluZ3Mi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
