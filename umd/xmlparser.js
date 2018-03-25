(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('coreutil')) :
  typeof define === 'function' && define.amd ? define(['exports', 'coreutil'], factory) :
  (factory((global.xmlparser = {}),global.coreutil));
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
              while (coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                  cursor++;
              }
              if (xml.charAt(cursor) == ':') {
                  coreutil$1.Logger.debug(depth, 'Found namespace');
                  cursor++;
                  while (coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
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

                  coreutil$1.Logger.debug(depth, 'Found attribute from ' + detectedAttrNameCursor + '  to ' + cursor);
                  cursor = this.detectValue(name, namespace, depth, xml, cursor + 1);
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
              if (xml.charAt(cursor) == ":") {
                  cursor++;
                  while (coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor))) {
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
              coreutil$1.Logger.debug(depth, 'Possible attribute value start at ' + valuePos);
              var valueStartPos = valuePos;
              while (this.isAttributeContent(depth, xml, valuePos)) {
                  valuePos++;
              }
              if (valuePos == cursor) {
                  this._attributes.set(fullname, new XmlAttribute(name, namespace, ''));
              } else {
                  this._attributes.set(fullname, new XmlAttribute(name, namespace, xml.substring(valueStartPos, valuePos)));
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
      function XmlElement(name, namespace, namespaceUri, selfClosing) {
          classCallCheck(this, XmlElement);

          this._name = name;
          this._namespace = namespace;
          this._selfClosing = selfClosing;
          this._childElements = new coreutil$1.List();
          this._attributes = new coreutil$1.Map();
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
              coreutil$1.Logger.debug(depth, 'Looking for opening element at position ' + xmlCursor.cursor);
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
              coreutil$1.Logger.debug(depth, 'Looking for self closing element at position ' + xmlCursor.cursor);
              var elementBody = new ElementBody();
              var endpos = ClosingElementDetector.detectClosingElement(depth, xmlCursor.xml, xmlCursor.cursor, elementBody);
              if (endpos != -1) {
                  this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), this._namespaceUriMap, true);

                  elementBody.getAttributes().forEach(function (attributeName, attributeValue, parent) {
                      parent._element.setAttribute(attributeName, attributeValue);
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
      function DomScaffold(namespaceUriMap) {
          classCallCheck(this, DomScaffold);

          this._namespaceUriMap = namespaceUriMap;
          this._element = null;
          this._childDomScaffolds = new coreutil$1.List();
          this._detectors = new coreutil$1.List();
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
                  var namespaceUriMap = new coreutil$1.Map();
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
              var domScaffold = new DomScaffold(new coreutil$1.Map());
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1scGFyc2VyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvbWFpbi94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvcmVhZEFoZWFkLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwveG1sQXR0cmlidXRlLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9lbGVtZW50Qm9keS5qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3htbENkYXRhLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwveG1sRWxlbWVudC5qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9jZGF0YURldGVjdG9yLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9jbG9zaW5nRWxlbWVudERldGVjdG9yLmpzIiwiLi4vc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3htbEN1cnNvci5qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kb21TY2FmZm9sZC5qcyIsIi4uL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL2RvbVRyZWUuanMiLCIuLi9zcmMvbWFpbi94bWxwYXJzZXIveG1sUGFyc2VyRXhjZXB0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFJlYWRBaGVhZHtcblxuICAgIHN0YXRpYyByZWFkKHZhbHVlLCBtYXRjaGVyLCBjdXJzb3IsIGlnbm9yZVdoaXRlc3BhY2UgPSBmYWxzZSl7XG4gICAgICAgIGxldCBpbnRlcm5hbEN1cnNvciA9IGN1cnNvcjtcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG1hdGNoZXIubGVuZ3RoICYmIGkgPCB2YWx1ZS5sZW5ndGggOyBpKyspe1xuICAgICAgICAgICAgd2hpbGUoaWdub3JlV2hpdGVzcGFjZSAmJiB2YWx1ZS5jaGFyQXQoaW50ZXJuYWxDdXJzb3IpID09ICcgJyl7XG4gICAgICAgICAgICAgICAgaW50ZXJuYWxDdXJzb3IrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHZhbHVlLmNoYXJBdChpbnRlcm5hbEN1cnNvcikgPT0gbWF0Y2hlci5jaGFyQXQoaSkpe1xuICAgICAgICAgICAgICAgIGludGVybmFsQ3Vyc29yKys7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW50ZXJuYWxDdXJzb3IgLSAxO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFhtbEF0dHJpYnV0ZSB7XG5cbiAgY29uc3RydWN0b3IobmFtZSxuYW1lc3BhY2UsdmFsdWUpIHtcbiAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgdGhpcy5fbmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldE5hbWUoKXtcbiAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG5cbiAgc2V0TmFtZSh2YWwpe1xuICAgICAgdGhpcy5fbmFtZSA9IHZhbDtcbiAgfVxuXG4gIGdldE5hbWVzcGFjZSgpe1xuICAgIHJldHVybiB0aGlzLl9uYW1lc3BhY2U7XG4gIH1cblxuICBzZXROYW1lc3BhY2UodmFsKXtcbiAgICB0aGlzLl9uYW1lc3BhY2UgPSB2YWw7XG4gIH1cblxuICBnZXRWYWx1ZSgpe1xuICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICB9XG5cbiAgc2V0VmFsdWUodmFsKXtcbiAgICAgIHRoaXMuX3ZhbHVlID0gdmFsO1xuICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TG9nZ2VyLCBNYXAsIFN0cmluZ1V0aWxzfSBmcm9tIFwiY29yZXV0aWxcIjtcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkXCI7XG5pbXBvcnQge1htbEF0dHJpYnV0ZX0gZnJvbSBcIi4uLy4uL3htbEF0dHJpYnV0ZVwiO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudEJvZHl7XG5cbiAgICBjb25zdHJ1Y3Rvcigpe1xuICAgICAgICB0aGlzLl9uYW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBnZXROYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgICB9XG5cbiAgICBnZXROYW1lc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9uYW1lc3BhY2U7XG4gICAgfVxuXG4gICAgZ2V0QXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgZGV0ZWN0UG9zaXRpb25zKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCBuYW1lU3RhcnRwb3MgPSBjdXJzb3I7XG4gICAgICAgIGxldCBuYW1lRW5kcG9zID0gbnVsbDtcbiAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGN1cnNvciArKztcbiAgICAgICAgfVxuICAgICAgICBpZih4bWwuY2hhckF0KGN1cnNvcikgPT0gJzonKXtcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIG5hbWVzcGFjZScpO1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbmFtZUVuZHBvcyA9IGN1cnNvci0xO1xuICAgICAgICB0aGlzLl9uYW1lID0geG1sLnN1YnN0cmluZyhuYW1lU3RhcnRwb3MsIG5hbWVFbmRwb3MrMSk7XG4gICAgICAgIGlmKHRoaXMuX25hbWUuaW5kZXhPZihcIjpcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gdGhpcy5fbmFtZS5zcGxpdChcIjpcIilbMF07XG4gICAgICAgICAgICAgICAgdGhpcy5fbmFtZSA9IHRoaXMuX25hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciA9IHRoaXMuZGV0ZWN0QXR0cmlidXRlcyhkZXB0aCx4bWwsY3Vyc29yKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG5cbiAgICBkZXRlY3RBdHRyaWJ1dGVzKGRlcHRoLHhtbCxjdXJzb3Ipe1xuICAgICAgICBsZXQgZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvciA9IG51bGw7XG4gICAgICAgIHdoaWxlKChkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0U3RhcnRBdHRyaWJ1dGUoZGVwdGgsIHhtbCwgY3Vyc29yKSkgIT0gLTEpe1xuICAgICAgICAgICAgY3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGRldGVjdGVkQXR0ck5hbWVDdXJzb3IpO1xuICAgICAgICAgICAgbGV0IG5hbWVzcGFjZSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IHhtbC5zdWJzdHJpbmcoZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvcixjdXJzb3IrMSk7XG5cbiAgICAgICAgICAgIGlmKG5hbWUuaW5kZXhPZihcIjpcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlID0gbmFtZS5zcGxpdChcIjpcIilbMF07XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICAgICAgfSAgXG5cbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIGF0dHJpYnV0ZSBmcm9tICcgKyBkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yICsgJyAgdG8gJyArIGN1cnNvcik7XG4gICAgICAgICAgICBjdXJzb3IgPSB0aGlzLmRldGVjdFZhbHVlKG5hbWUsbmFtZXNwYWNlLGRlcHRoLCB4bWwsIGN1cnNvcisxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuXG4gICAgZGV0ZWN0TmV4dFN0YXJ0QXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSAnICcgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICBpZihTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgZGV0ZWN0TmV4dEVuZEF0dHJpYnV0ZShkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICB3aGlsZShTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSl7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYoeG1sLmNoYXJBdChjdXJzb3IpID09IFwiOlwiKXtcbiAgICAgICAgICAgIGN1cnNvciArKztcbiAgICAgICAgICAgIHdoaWxlKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpKXtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvciAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3RWYWx1ZShuYW1lLCBuYW1lc3BhY2UsIGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCB2YWx1ZVBvcyA9IGN1cnNvcjtcbiAgICAgICAgbGV0IGZ1bGxuYW1lID0gbmFtZTtcbiAgICAgICAgaWYobmFtZXNwYWNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBmdWxsbmFtZSA9IG5hbWVzcGFjZSArIFwiOlwiICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZigodmFsdWVQb3MgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz1cIicsdmFsdWVQb3MsdHJ1ZSkpID09IC0xKXtcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMuc2V0KGZ1bGxuYW1lLG5ldyBYbWxBdHRyaWJ1dGUobmFtZSxuYW1lc3BhY2UsbnVsbCkpO1xuICAgICAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZVBvcysrO1xuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdQb3NzaWJsZSBhdHRyaWJ1dGUgdmFsdWUgc3RhcnQgYXQgJyArIHZhbHVlUG9zKTtcbiAgICAgICAgbGV0IHZhbHVlU3RhcnRQb3MgPSB2YWx1ZVBvcztcbiAgICAgICAgd2hpbGUodGhpcy5pc0F0dHJpYnV0ZUNvbnRlbnQoZGVwdGgsIHhtbCwgdmFsdWVQb3MpKXtcbiAgICAgICAgICAgIHZhbHVlUG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYodmFsdWVQb3MgPT0gY3Vyc29yKXtcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMuc2V0KGZ1bGxuYW1lLCBuZXcgWG1sQXR0cmlidXRlKG5hbWUsbmFtZXNwYWNlLCcnKSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhpcy5fYXR0cmlidXRlcy5zZXQoZnVsbG5hbWUsIG5ldyBYbWxBdHRyaWJ1dGUobmFtZSxuYW1lc3BhY2UseG1sLnN1YnN0cmluZyh2YWx1ZVN0YXJ0UG9zLHZhbHVlUG9zKSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgYXR0cmlidXRlIGNvbnRlbnQgZW5kaW5nIGF0ICcgKyAodmFsdWVQb3MtMSkpO1xuXG4gICAgICAgIGlmKCh2YWx1ZVBvcyA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnXCInLHZhbHVlUG9zLHRydWUpKSAhPSAtMSl7XG4gICAgICAgICAgICB2YWx1ZVBvcysrO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIExvZ2dlci5lcnJvcignTWlzc2luZyBlbmQgcXVvdGVzIG9uIGF0dHJpYnV0ZSBhdCBwb3NpdGlvbiAnICsgdmFsdWVQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZVBvcztcbiAgICB9XG5cblxuICAgIGlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCdcIicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsXCJcblxuZXhwb3J0IGNsYXNzIFhtbENkYXRhe1xuXG5cdGNvbnN0cnVjdG9yKHZhbHVlKXtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBzZXRWYWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuXG4gICAgZHVtcCgpe1xuICAgICAgICB0aGlzLmR1bXBMZXZlbCgwKTtcbiAgICB9XG5cbiAgICBkdW1wTGV2ZWwobGV2ZWwpe1xuICAgICAgICBsZXQgc3BhY2VyID0gJzonO1xuICAgICAgICBmb3IobGV0IHNwYWNlID0gMCA7IHNwYWNlIDwgbGV2ZWwqMiA7IHNwYWNlICsrKXtcbiAgICAgICAgICAgIHNwYWNlciA9IHNwYWNlciArICcgJztcbiAgICAgICAgfVxuXG4gICAgICAgIExvZ2dlci5sb2coc3BhY2VyICsgdGhpcy5fdmFsdWUpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVhZCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlciwgTGlzdCwgTWFwfSBmcm9tIFwiY29yZXV0aWxcIjtcbmltcG9ydCB7WG1sQ2RhdGF9IGZyb20gXCIuL3htbENkYXRhXCI7XG5cbmV4cG9ydCBjbGFzcyBYbWxFbGVtZW50e1xuXG5cdGNvbnN0cnVjdG9yKG5hbWUsIG5hbWVzcGFjZSwgbmFtZXNwYWNlVXJpLCBzZWxmQ2xvc2luZyl7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLl9uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuX3NlbGZDbG9zaW5nID0gc2VsZkNsb3Npbmc7XG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9uYW1lc3BhY2VVcmkgPSBuYW1lc3BhY2VVcmk7XG4gICAgfVxuXG4gICAgZ2V0TmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgfVxuXG4gICAgZ2V0TmFtZXNwYWNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlO1xuICAgIH1cblxuICAgIGdldE5hbWVzcGFjZVVyaSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlVXJpO1xuICAgIH1cblxuICAgIGdldEZ1bGxOYW1lKCkge1xuICAgICAgICBpZih0aGlzLl9uYW1lc3BhY2UgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlICsgJzonICsgdGhpcy5fbmFtZTtcbiAgICB9XG5cbiAgICBnZXRBdHRyaWJ1dGVzKCl7XG4gICAgICAgIHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyl7XG4gICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZShrZXksdmFsdWUpIHtcblx0XHR0aGlzLl9hdHRyaWJ1dGVzLnNldChrZXksdmFsdWUpO1xuXHR9XG5cblx0Z2V0QXR0cmlidXRlKGtleSkge1xuXHRcdHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzLmdldChrZXkpO1xuXHR9XG5cbiAgICBjb250YWluc0F0dHJpYnV0ZShrZXkpe1xuICAgICAgICByZXR1cm4gdGhpcy5fYXR0cmlidXRlcy5jb250YWlucyhrZXkpO1xuICAgIH1cblxuXHRjbGVhckF0dHJpYnV0ZSgpe1xuXHRcdHRoaXMuX2F0dHJpYnV0ZXMgPSBuZXcgTWFwKCk7XG5cdH1cblxuICAgIGdldENoaWxkRWxlbWVudHMoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkRWxlbWVudHM7XG4gICAgfVxuXG4gICAgc2V0Q2hpbGRFbGVtZW50cyhlbGVtZW50cykge1xuICAgICAgICB0aGlzLl9jaGlsZEVsZW1lbnRzID0gZWxlbWVudHM7XG4gICAgfVxuXG4gICAgc2V0VGV4dCh0ZXh0KXtcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cyA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMuYWRkVGV4dCh0ZXh0KTtcbiAgICB9XG5cbiAgICBhZGRUZXh0KHRleHQpe1xuICAgICAgICBsZXQgdGV4dEVsZW1lbnQgPSBuZXcgWG1sQ2RhdGEodGV4dCk7XG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMuYWRkKHRleHRFbGVtZW50KTtcbiAgICB9XG5cbiAgICBkdW1wKCl7XG4gICAgICAgIHRoaXMuZHVtcExldmVsKDApO1xuICAgIH1cblxuICAgIGR1bXBMZXZlbChsZXZlbCl7XG4gICAgICAgIGxldCBzcGFjZXIgPSAnOic7XG4gICAgICAgIGZvcihsZXQgc3BhY2UgPSAwIDsgc3BhY2UgPCBsZXZlbCoyIDsgc3BhY2UgKyspe1xuICAgICAgICAgICAgc3BhY2VyID0gc3BhY2VyICsgJyAnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodGhpcy5fc2VsZkNsb3Npbmcpe1xuICAgICAgICAgICAgTG9nZ2VyLmxvZyhzcGFjZXIgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnLz4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBMb2dnZXIubG9nKHNwYWNlciArICc8JyArIHRoaXMuZ2V0RnVsbE5hbWUoKSArIHRoaXMucmVhZEF0dHJpYnV0ZXMoKSArICc+Jyk7XG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpe1xuICAgICAgICAgICAgY2hpbGRFbGVtZW50LmR1bXBMZXZlbChsZXZlbCsxKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgTG9nZ2VyLmxvZyhzcGFjZXIgKyAnPC8nICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgJz4nKTtcbiAgICB9XG5cbiAgICByZWFkKCl7XG4gICAgICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAgICAgaWYodGhpcy5fc2VsZkNsb3Npbmcpe1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJy8+JztcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJz4nO1xuICAgICAgICB0aGlzLl9jaGlsZEVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24oY2hpbGRFbGVtZW50KXtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArIGNoaWxkRWxlbWVudC5yZWFkKCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICc8LycgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyAnPic7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmVhZEF0dHJpYnV0ZXMoKXtcbiAgICAgICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzLmZvckVhY2goZnVuY3Rpb24gKGtleSxhdHRyaWJ1dGUscGFyZW50KSB7XG4gICAgICAgICAgICBsZXQgZnVsbG5hbWUgPSBhdHRyaWJ1dGUuZ2V0TmFtZSgpO1xuICAgICAgICAgICAgaWYoYXR0cmlidXRlLmdldE5hbWVzcGFjZSgpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZnVsbG5hbWUgPSBhdHRyaWJ1dGUuZ2V0TmFtZXNwYWNlKCkgKyBcIjpcIiArIGF0dHJpYnV0ZS5nZXROYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnICcgKyBmdWxsbmFtZTtcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZS5nZXRWYWx1ZSgpICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnPVwiJyArIGF0dHJpYnV0ZS5nZXRWYWx1ZSgpICsgJ1wiJztcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsXCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZFwiO1xuaW1wb3J0IHtFbGVtZW50Qm9keX0gZnJvbSBcIi4vZWxlbWVudEJvZHlcIjtcbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcIi4uLy4uL3htbEVsZW1lbnRcIjtcbmltcG9ydCB7WG1sQXR0cmlidXRlfSBmcm9tIFwiLi4vLi4veG1sQXR0cmlidXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBFbGVtZW50RGV0ZWN0b3J7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lc3BhY2VVcmlNYXApe1xuICAgICAgICB0aGlzLl90eXBlID0gJ0VsZW1lbnREZXRlY3Rvcic7XG4gICAgICAgIHRoaXMuX25hbWVzcGFjZVVyaU1hcCA9IG5hbWVzcGFjZVVyaU1hcDtcbiAgICAgICAgdGhpcy5faGFzQ2hpbGRyZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZm91bmQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5feG1sQ3Vyc29yID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XG4gICAgfVxuXG4gICAgZ2V0VHlwZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XG4gICAgfVxuXG4gICAgaXNGb3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvdW5kO1xuICAgIH1cblxuICAgIGhhc0NoaWxkcmVuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFzQ2hpbGRyZW47XG4gICAgfVxuXG4gICAgZGV0ZWN0KGRlcHRoLCB4bWxDdXJzb3Ipe1xuICAgICAgICB0aGlzLl94bWxDdXJzb3IgPSB4bWxDdXJzb3I7XG4gICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0xvb2tpbmcgZm9yIG9wZW5pbmcgZWxlbWVudCBhdCBwb3NpdGlvbiAnICsgeG1sQ3Vyc29yLmN1cnNvcik7XG4gICAgICAgIGxldCBlbGVtZW50Qm9keSA9IG5ldyBFbGVtZW50Qm9keSgpO1xuICAgICAgICBsZXQgZW5kcG9zID0gRWxlbWVudERldGVjdG9yLmRldGVjdE9wZW5FbGVtZW50KGRlcHRoLCB4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yLGVsZW1lbnRCb2R5KTtcbiAgICAgICAgaWYoZW5kcG9zICE9IC0xKSB7XG5cbiAgICAgICAgICAgIGxldCBuYW1lc3BhY2VVcmkgPSBudWxsO1xuICAgICAgICAgICAgaWYoZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCkgIT09IG51bGwgJiYgZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCkgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlVXJpID0gdGhpcy5fbmFtZXNwYWNlVXJpTWFwLmdldChlbGVtZW50Qm9keS5nZXROYW1lc3BhY2UoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBuZXcgWG1sRWxlbWVudChlbGVtZW50Qm9keS5nZXROYW1lKCksIGVsZW1lbnRCb2R5LmdldE5hbWVzcGFjZSgpLCBuYW1lc3BhY2VVcmksIGZhbHNlKTtcblxuICAgICAgICAgICAgZWxlbWVudEJvZHkuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgICAgIHBhcmVudC5fZWxlbWVudC5nZXRBdHRyaWJ1dGVzKCkuc2V0KGF0dHJpYnV0ZU5hbWUsYXR0cmlidXRlVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSx0aGlzKTtcblxuICAgICAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgb3BlbmluZyB0YWcgPCcgKyB0aGlzLl9lbGVtZW50LmdldEZ1bGxOYW1lKCkgKyAnPiBmcm9tICcgKyAgeG1sQ3Vyc29yLmN1cnNvciAgKyAnIHRvICcgKyBlbmRwb3MpO1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZHBvcyArIDE7XG5cbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3AoZGVwdGgpKXtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYXNDaGlsZHJlbiA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9mb3VuZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKGRlcHRoKXtcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnTG9va2luZyBmb3IgY2xvc2luZyBlbGVtZW50IGF0IHBvc2l0aW9uICcgKyB0aGlzLl94bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgbGV0IGNsb3NpbmdFbGVtZW50ID0gRWxlbWVudERldGVjdG9yLmRldGVjdEVuZEVsZW1lbnQoZGVwdGgsIHRoaXMuX3htbEN1cnNvci54bWwsIHRoaXMuX3htbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBpZihjbG9zaW5nRWxlbWVudCAhPSAtMSl7XG4gICAgICAgICAgICBsZXQgY2xvc2luZ1RhZ05hbWUgPSAgdGhpcy5feG1sQ3Vyc29yLnhtbC5zdWJzdHJpbmcodGhpcy5feG1sQ3Vyc29yLmN1cnNvcisyLGNsb3NpbmdFbGVtZW50KTtcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIGNsb3NpbmcgdGFnIDwvJyArIGNsb3NpbmdUYWdOYW1lICsgJz4gZnJvbSAnICsgIHRoaXMuX3htbEN1cnNvci5jdXJzb3IgICsgJyB0byAnICsgY2xvc2luZ0VsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZih0aGlzLl9lbGVtZW50LmdldEZ1bGxOYW1lKCkgIT0gY2xvc2luZ1RhZ05hbWUpe1xuICAgICAgICAgICAgICAgIExvZ2dlci5lcnJvcignRVJSOiBNaXNtYXRjaCBiZXR3ZWVuIG9wZW5pbmcgdGFnIDwnICsgdGhpcy5fZWxlbWVudC5nZXRGdWxsTmFtZSgpICsgJz4gYW5kIGNsb3NpbmcgdGFnIDwvJyArIGNsb3NpbmdUYWdOYW1lICsgJz4gV2hlbiBleGl0aW5nIHRvIHBhcmVudCBlbGVtbnQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3htbEN1cnNvci5jdXJzb3IgPSBjbG9zaW5nRWxlbWVudCArMTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZGV0ZWN0T3BlbkVsZW1lbnQoZGVwdGgsIHhtbCwgY3Vyc29yLCBlbGVtZW50Qm9keSkge1xuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc8JyxjdXJzb3IpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICBjdXJzb3IgPSBlbGVtZW50Qm9keS5kZXRlY3RQb3NpdGlvbnMoZGVwdGgrMSwgeG1sLCBjdXJzb3IpO1xuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc+JyxjdXJzb3IpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG5cbiAgICBzdGF0aWMgZGV0ZWN0RW5kRWxlbWVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc8LycsY3Vyc29yKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciArKztcbiAgICAgICAgY3Vyc29yID0gbmV3IEVsZW1lbnRCb2R5KCkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJzb3I7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsXCI7XG5pbXBvcnQge1htbENkYXRhfSBmcm9tIFwiLi4vLi4veG1sQ2RhdGFcIjtcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkXCI7XG5cbmV4cG9ydCBjbGFzcyBDZGF0YURldGVjdG9ye1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgdGhpcy5fdHlwZSA9ICdDZGF0YURldGVjdG9yJztcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLl9mb3VuZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlzRm91bmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mb3VuZDtcbiAgICB9XG5cbiAgICBnZXRUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdHlwZTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFhtbENkYXRhKHRoaXMuX3ZhbHVlKTtcbiAgICB9XG5cbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcil7XG4gICAgICAgIHRoaXMuX2ZvdW5kID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVsbDtcblxuICAgICAgICBsZXQgZW5kUG9zID0gdGhpcy5kZXRlY3RDb250ZW50KGRlcHRoLCB4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yLCB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQpO1xuICAgICAgICBpZihlbmRQb3MgIT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuX2ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaGFzQ2hpbGRyZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0geG1sQ3Vyc29yLnhtbC5zdWJzdHJpbmcoeG1sQ3Vyc29yLmN1cnNvcixlbmRQb3MpO1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZFBvcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRldGVjdENvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yLCBwYXJlbnREb21TY2FmZm9sZCkge1xuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdDZGF0YSBzdGFydCBhdCAnICsgY3Vyc29yKTtcbiAgICAgICAgbGV0IGludGVybmFsU3RhcnRQb3MgPSBjdXJzb3I7XG4gICAgICAgIGlmKCFDZGF0YURldGVjdG9yLmlzQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3IpKXtcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ05vIENkYXRhIGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUoQ2RhdGFEZXRlY3Rvci5pc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKSAmJiBjdXJzb3IgPCB4bWwubGVuZ3RoKXtcbiAgICAgICAgICAgIGN1cnNvciArKztcbiAgICAgICAgfVxuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdDZGF0YSBlbmQgYXQgJyArIChjdXJzb3ItMSkpO1xuICAgICAgICBpZihwYXJlbnREb21TY2FmZm9sZCA9PT0gbnVsbCl7XG4gICAgICAgICAgICBMb2dnZXIuZXJyb3IoJ0VSUjogQ29udGVudCBub3QgYWxsb3dlZCBvbiByb290IGxldmVsIGluIHhtbCBkb2N1bWVudCcpO1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0NkYXRhIGZvdW5kIHZhbHVlIGlzICcgKyB4bWwuc3Vic3RyaW5nKGludGVybmFsU3RhcnRQb3MsY3Vyc29yKSk7XG4gICAgICAgIHJldHVybiBjdXJzb3I7XG4gICAgfVxuXG4gICAgc3RhdGljIGlzQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsXCI7XG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCIuLi8uLi94bWxFbGVtZW50XCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZFwiO1xuaW1wb3J0IHtFbGVtZW50Qm9keX0gZnJvbSBcIi4vZWxlbWVudEJvZHlcIjtcbmltcG9ydCB7WG1sQXR0cmlidXRlfSBmcm9tIFwiLi4vLi4veG1sQXR0cmlidXRlXCI7XG5cbmV4cG9ydCBjbGFzcyBDbG9zaW5nRWxlbWVudERldGVjdG9ye1xuXG4gICAgY29uc3RydWN0b3IobmFtZXNwYWNlVXJpTWFwKXtcbiAgICAgICAgdGhpcy5fdHlwZSA9ICdDbG9zaW5nRWxlbWVudERldGVjdG9yJztcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlVXJpTWFwID0gbmFtZXNwYWNlVXJpTWFwO1xuICAgICAgICB0aGlzLl9mb3VuZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXRUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdHlwZTtcbiAgICB9XG5cbiAgICBpc0ZvdW5kKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZm91bmQ7XG4gICAgfVxuXG4gICAgZGV0ZWN0KGRlcHRoLCB4bWxDdXJzb3IpIHtcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnTG9va2luZyBmb3Igc2VsZiBjbG9zaW5nIGVsZW1lbnQgYXQgcG9zaXRpb24gJyArIHhtbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBsZXQgZWxlbWVudEJvZHkgPSBuZXcgRWxlbWVudEJvZHkoKTtcbiAgICAgICAgbGV0IGVuZHBvcyA9IENsb3NpbmdFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0Q2xvc2luZ0VsZW1lbnQoZGVwdGgsIHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IsZWxlbWVudEJvZHkpO1xuICAgICAgICBpZihlbmRwb3MgIT0gLTEpe1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnRCb2R5LmdldE5hbWUoKSwgZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCksIHRoaXMuX25hbWVzcGFjZVVyaU1hcCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnRCb2R5LmdldEF0dHJpYnV0ZXMoKS5mb3JFYWNoKGZ1bmN0aW9uKGF0dHJpYnV0ZU5hbWUsYXR0cmlidXRlVmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgICAgICBwYXJlbnQuX2VsZW1lbnQuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsYXR0cmlidXRlVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSx0aGlzKTtcblxuICAgICAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgc2VsZiBjbG9zaW5nIHRhZyA8JyArIHRoaXMuX2VsZW1lbnQuZ2V0RnVsbE5hbWUoKSArICcvPiBmcm9tICcgKyAgeG1sQ3Vyc29yLmN1cnNvciAgKyAnIHRvICcgKyBlbmRwb3MpO1xuICAgICAgICAgICAgdGhpcy5fZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZHBvcyArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZGV0ZWN0Q2xvc2luZ0VsZW1lbnQoZGVwdGgsIHhtbCwgY3Vyc29yLCBlbGVtZW50Qm9keSl7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIGN1cnNvciA9IGVsZW1lbnRCb2R5LmRldGVjdFBvc2l0aW9ucyhkZXB0aCsxLCB4bWwsIGN1cnNvcik7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJy8+JyxjdXJzb3IpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBYbWxDdXJzb3J7XG5cbiAgICBjb25zdHJ1Y3Rvcih4bWwsIGN1cnNvciwgcGFyZW50RG9tU2NhZmZvbGQpe1xuICAgICAgICB0aGlzLnhtbCA9IHhtbDtcbiAgICAgICAgdGhpcy5jdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgIHRoaXMucGFyZW50RG9tU2NhZmZvbGQgPSBwYXJlbnREb21TY2FmZm9sZDtcbiAgICB9XG5cbiAgICBlb2YoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3Vyc29yID49IHRoaXMueG1sLmxlbmd0aDtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TWFwLCBMaXN0fSBmcm9tIFwiY29yZXV0aWxcIjtcbmltcG9ydCB7RWxlbWVudERldGVjdG9yfSBmcm9tIFwiLi9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yXCI7XG5pbXBvcnQge0NkYXRhRGV0ZWN0b3J9IGZyb20gXCIuL2RldGVjdG9ycy9jZGF0YURldGVjdG9yXCI7XG5pbXBvcnQge0Nsb3NpbmdFbGVtZW50RGV0ZWN0b3J9IGZyb20gXCIuL2RldGVjdG9ycy9jbG9zaW5nRWxlbWVudERldGVjdG9yXCI7XG5pbXBvcnQge1htbEN1cnNvcn0gZnJvbSBcIi4veG1sQ3Vyc29yXCI7XG5cbmV4cG9ydCBjbGFzcyBEb21TY2FmZm9sZHtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWVzcGFjZVVyaU1hcCl7XG4gICAgICAgIHRoaXMuX25hbWVzcGFjZVVyaU1hcCA9IG5hbWVzcGFjZVVyaU1hcDtcbiAgICAgICAgdGhpcy5fZWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NoaWxkRG9tU2NhZmZvbGRzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lciA9IG51bGw7XG4gICAgICAgIHRoaXMuX2RldGVjdG9ycy5hZGQobmV3IEVsZW1lbnREZXRlY3Rvcih0aGlzLl9uYW1lc3BhY2VVcmlNYXApKTtcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzLmFkZChuZXcgQ2RhdGFEZXRlY3RvcigpKTtcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzLmFkZChuZXcgQ2xvc2luZ0VsZW1lbnREZXRlY3Rvcih0aGlzLl9uYW1lc3BhY2VVcmlNYXApKTtcbiAgICB9XG5cbiAgICBnZXRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZWxlbWVudDtcbiAgICB9XG5cbiAgICBsb2FkKHhtbCwgY3Vyc29yLCBlbGVtZW50Q3JlYXRlZExpc3RlbmVyKXtcbiAgICAgICAgbGV0IHhtbEN1cnNvciA9IG5ldyBYbWxDdXJzb3IoeG1sLCBjdXJzb3IsIG51bGwpO1xuICAgICAgICB0aGlzLmxvYWREZXB0aCgxLCB4bWxDdXJzb3IsIGVsZW1lbnRDcmVhdGVkTGlzdGVuZXIpO1xuICAgIH1cblxuICAgIGxvYWREZXB0aChkZXB0aCwgeG1sQ3Vyc29yLCBlbGVtZW50Q3JlYXRlZExpc3RlbmVyKXtcbiAgICAgICAgY29yZXV0aWwuTG9nZ2VyLnNob3dQb3MoeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcik7XG4gICAgICAgIGNvcmV1dGlsLkxvZ2dlci5kZWJ1ZyhkZXB0aCwgJ1N0YXJ0aW5nIERvbVNjYWZmb2xkJyk7XG4gICAgICAgIHRoaXMuX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIgPSBlbGVtZW50Q3JlYXRlZExpc3RlbmVyO1xuXG4gICAgICAgIGlmKHhtbEN1cnNvci5lb2YoKSl7XG4gICAgICAgICAgICBjb3JldXRpbC5Mb2dnZXIuZGVidWcoZGVwdGgsICdSZWFjaGVkIGVvZi4gRXhpdGluZycpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVsZW1lbnREZXRlY3RvciA9IG51bGw7XG4gICAgICAgIHRoaXMuX2RldGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uKGN1ckVsZW1lbnREZXRlY3RvcixwYXJlbnQpe1xuICAgICAgICAgICAgY29yZXV0aWwuTG9nZ2VyLmRlYnVnKGRlcHRoLCAnU3RhcnRpbmcgJyArIGN1ckVsZW1lbnREZXRlY3Rvci5nZXRUeXBlKCkpO1xuICAgICAgICAgICAgY3VyRWxlbWVudERldGVjdG9yLmRldGVjdChkZXB0aCArIDEseG1sQ3Vyc29yKTtcbiAgICAgICAgICAgIGlmKCFjdXJFbGVtZW50RGV0ZWN0b3IuaXNGb3VuZCgpKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnREZXRlY3RvciA9IGN1ckVsZW1lbnREZXRlY3RvcjtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSx0aGlzKTtcblxuICAgICAgICBpZihlbGVtZW50RGV0ZWN0b3IgPT09IG51bGwpe1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvcisrO1xuICAgICAgICAgICAgY29yZXV0aWwuTG9nZ2VyLndhcm4oJ1dBUk46IE5vIGhhbmRsZXIgd2FzIGZvdW5kIHNlYXJjaGluZyBmcm9tIHBvc2l0aW9uOiAnICsgeG1sQ3Vyc29yLmN1cnNvcik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9lbGVtZW50ID0gZWxlbWVudERldGVjdG9yLmNyZWF0ZUVsZW1lbnQoKTtcblxuICAgICAgICBpZihlbGVtZW50RGV0ZWN0b3IgaW5zdGFuY2VvZiBFbGVtZW50RGV0ZWN0b3IgJiYgZWxlbWVudERldGVjdG9yLmhhc0NoaWxkcmVuKCkpIHtcbiAgICAgICAgICAgIGxldCBuYW1lc3BhY2VVcmlNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBuYW1lc3BhY2VVcmlNYXAuYWRkQWxsKHRoaXMuX25hbWVzcGFjZVVyaU1hcCk7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LmdldEF0dHJpYnV0ZXMoKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUsY3VyQXR0cmlidXRlLHBhcmVudCl7XG4gICAgICAgICAgICAgICAgaWYoXCJ4bWxuc1wiID09PSBjdXJBdHRyaWJ1dGUuZ2V0TmFtZXNwYWNlKCkpe1xuICAgICAgICAgICAgICAgICAgICBuYW1lc3BhY2VVcmlNYXAuc2V0KGN1ckF0dHJpYnV0ZS5nZXROYW1lKCksY3VyQXR0cmlidXRlLmdldFZhbHVlKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sdGhpcyk7XG4gICAgICAgICAgICB3aGlsZSghZWxlbWVudERldGVjdG9yLnN0b3AoZGVwdGggKyAxKSAmJiB4bWxDdXJzb3IuY3Vyc29yIDwgeG1sQ3Vyc29yLnhtbC5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGxldCBwcmV2aW91c1BhcmVudFNjYWZmb2xkID0geG1sQ3Vyc29yLnBhcmVudERvbVNjYWZmb2xkO1xuICAgICAgICAgICAgICAgIGxldCBjaGlsZFNjYWZmb2xkID0gbmV3IERvbVNjYWZmb2xkKG5hbWVzcGFjZVVyaU1hcCk7XG4gICAgICAgICAgICAgICAgeG1sQ3Vyc29yLnBhcmVudERvbVNjYWZmb2xkID0gY2hpbGRTY2FmZm9sZDtcbiAgICAgICAgICAgICAgICBjaGlsZFNjYWZmb2xkLmxvYWREZXB0aChkZXB0aCsxLCB4bWxDdXJzb3IsIHRoaXMuX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NoaWxkRG9tU2NhZmZvbGRzLmFkZChjaGlsZFNjYWZmb2xkKTtcbiAgICAgICAgICAgICAgICB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQgPSBwcmV2aW91c1BhcmVudFNjYWZmb2xkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvcmV1dGlsLkxvZ2dlci5zaG93UG9zKHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IpO1xuICAgIH1cblxuICAgIGdldFRyZWUocGFyZW50Tm90aWZ5UmVzdWx0KXtcbiAgICAgICAgaWYodGhpcy5fZWxlbWVudCA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub3RpZnlSZXN1bHQgPSB0aGlzLm5vdGlmeUVsZW1lbnRDcmVhdGVkTGlzdGVuZXIodGhpcy5fZWxlbWVudCxwYXJlbnROb3RpZnlSZXN1bHQpO1xuXG4gICAgICAgIHRoaXMuX2NoaWxkRG9tU2NhZmZvbGRzLmZvckVhY2goZnVuY3Rpb24oY2hpbGREb21TY2FmZm9sZCxwYXJlbnQpIHtcbiAgICAgICAgICAgIGxldCBjaGlsZEVsZW1lbnQgPSBjaGlsZERvbVNjYWZmb2xkLmdldFRyZWUobm90aWZ5UmVzdWx0KTtcbiAgICAgICAgICAgIGlmKGNoaWxkRWxlbWVudCAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgcGFyZW50Ll9lbGVtZW50LmdldENoaWxkRWxlbWVudHMoKS5hZGQoY2hpbGRFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50O1xuICAgIH1cblxuICAgIG5vdGlmeUVsZW1lbnRDcmVhdGVkTGlzdGVuZXIoZWxlbWVudCwgcGFyZW50Tm90aWZ5UmVzdWx0KSB7XG4gICAgICAgIGlmKHRoaXMuX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIgIT09IG51bGwgJiYgdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lciAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyLmVsZW1lbnRDcmVhdGVkKGVsZW1lbnQsIHBhcmVudE5vdGlmeVJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7RG9tU2NhZmZvbGR9IGZyb20gXCIuL3BhcnNlci9kb21TY2FmZm9sZFwiO1xuaW1wb3J0IHtNYXB9IGZyb20gXCJjb3JldXRpbFwiO1xuXG5leHBvcnQgY2xhc3MgRG9tVHJlZXtcblxuICAgIGNvbnN0cnVjdG9yKHhtbCwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyID0gZWxlbWVudENyZWF0ZWRMaXN0ZW5lcjtcbiAgICAgICAgdGhpcy5feG1sID0geG1sO1xuICAgICAgICB0aGlzLl9yb290RWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0Um9vdEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yb290RWxlbWVudDtcbiAgICB9XG5cbiAgICBzZXRSb290RWxlbWVudChlbGVtZW50KSB7XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gZWxlbWVudDtcbiAgICB9XG5cbiAgICBsb2FkKCl7XG4gICAgICAgIGxldCBkb21TY2FmZm9sZCA9IG5ldyBEb21TY2FmZm9sZChuZXcgTWFwKCkpO1xuICAgICAgICBkb21TY2FmZm9sZC5sb2FkKHRoaXMuX3htbCwwLHRoaXMuX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIpO1xuICAgICAgICB0aGlzLl9yb290RWxlbWVudCA9IGRvbVNjYWZmb2xkLmdldFRyZWUoKTtcbiAgICB9XG5cbiAgICBkdW1wKCl7XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50LmR1bXAoKTtcbiAgICB9XG5cbiAgICByZWFkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLl9yb290RWxlbWVudC5yZWFkKCk7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5jbGFzcyBYbWxQYXJzZXJFeGNlcHRpb24ge1xuXG4gICAgY29uc3RydWN0b3IodmFsdWUpe1xuICAgIH1cblxufVxuIl0sIm5hbWVzIjpbIlJlYWRBaGVhZCIsInZhbHVlIiwibWF0Y2hlciIsImN1cnNvciIsImlnbm9yZVdoaXRlc3BhY2UiLCJpbnRlcm5hbEN1cnNvciIsImkiLCJsZW5ndGgiLCJjaGFyQXQiLCJYbWxBdHRyaWJ1dGUiLCJuYW1lIiwibmFtZXNwYWNlIiwiX25hbWUiLCJfbmFtZXNwYWNlIiwiX3ZhbHVlIiwidmFsIiwiRWxlbWVudEJvZHkiLCJfYXR0cmlidXRlcyIsIk1hcCIsImRlcHRoIiwieG1sIiwibmFtZVN0YXJ0cG9zIiwibmFtZUVuZHBvcyIsIlN0cmluZ1V0aWxzIiwiaXNJbkFscGhhYmV0IiwiTG9nZ2VyIiwiZGVidWciLCJzdWJzdHJpbmciLCJpbmRleE9mIiwic3BsaXQiLCJkZXRlY3RBdHRyaWJ1dGVzIiwiZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvciIsImRldGVjdE5leHRTdGFydEF0dHJpYnV0ZSIsImRldGVjdE5leHRFbmRBdHRyaWJ1dGUiLCJkZXRlY3RWYWx1ZSIsInZhbHVlUG9zIiwiZnVsbG5hbWUiLCJyZWFkIiwic2V0IiwidmFsdWVTdGFydFBvcyIsImlzQXR0cmlidXRlQ29udGVudCIsImVycm9yIiwiWG1sQ2RhdGEiLCJkdW1wTGV2ZWwiLCJsZXZlbCIsInNwYWNlciIsInNwYWNlIiwibG9nIiwiWG1sRWxlbWVudCIsIm5hbWVzcGFjZVVyaSIsInNlbGZDbG9zaW5nIiwiX3NlbGZDbG9zaW5nIiwiX2NoaWxkRWxlbWVudHMiLCJMaXN0IiwiX25hbWVzcGFjZVVyaSIsImF0dHJpYnV0ZXMiLCJrZXkiLCJnZXQiLCJjb250YWlucyIsImVsZW1lbnRzIiwidGV4dCIsImFkZFRleHQiLCJ0ZXh0RWxlbWVudCIsImFkZCIsImdldEZ1bGxOYW1lIiwicmVhZEF0dHJpYnV0ZXMiLCJmb3JFYWNoIiwiY2hpbGRFbGVtZW50IiwicmVzdWx0IiwiYXR0cmlidXRlIiwicGFyZW50IiwiZ2V0TmFtZSIsImdldE5hbWVzcGFjZSIsImdldFZhbHVlIiwiRWxlbWVudERldGVjdG9yIiwibmFtZXNwYWNlVXJpTWFwIiwiX3R5cGUiLCJfbmFtZXNwYWNlVXJpTWFwIiwiX2hhc0NoaWxkcmVuIiwiX2ZvdW5kIiwiX3htbEN1cnNvciIsIl9lbGVtZW50IiwieG1sQ3Vyc29yIiwiZWxlbWVudEJvZHkiLCJlbmRwb3MiLCJkZXRlY3RPcGVuRWxlbWVudCIsInVuZGVmaW5lZCIsImdldEF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVOYW1lIiwiYXR0cmlidXRlVmFsdWUiLCJzdG9wIiwiY2xvc2luZ0VsZW1lbnQiLCJkZXRlY3RFbmRFbGVtZW50IiwiY2xvc2luZ1RhZ05hbWUiLCJkZXRlY3RQb3NpdGlvbnMiLCJDZGF0YURldGVjdG9yIiwiZW5kUG9zIiwiZGV0ZWN0Q29udGVudCIsInBhcmVudERvbVNjYWZmb2xkIiwiaGFzQ2hpbGRyZW4iLCJpbnRlcm5hbFN0YXJ0UG9zIiwiaXNDb250ZW50IiwiQ2xvc2luZ0VsZW1lbnREZXRlY3RvciIsImRldGVjdENsb3NpbmdFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwiWG1sQ3Vyc29yIiwiRG9tU2NhZmZvbGQiLCJfY2hpbGREb21TY2FmZm9sZHMiLCJfZGV0ZWN0b3JzIiwiX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIiLCJlbGVtZW50Q3JlYXRlZExpc3RlbmVyIiwibG9hZERlcHRoIiwiY29yZXV0aWwiLCJzaG93UG9zIiwiZW9mIiwiZWxlbWVudERldGVjdG9yIiwiY3VyRWxlbWVudERldGVjdG9yIiwiZ2V0VHlwZSIsImRldGVjdCIsImlzRm91bmQiLCJ3YXJuIiwiY3JlYXRlRWxlbWVudCIsImFkZEFsbCIsImN1ckF0dHJpYnV0ZSIsInByZXZpb3VzUGFyZW50U2NhZmZvbGQiLCJjaGlsZFNjYWZmb2xkIiwicGFyZW50Tm90aWZ5UmVzdWx0Iiwibm90aWZ5UmVzdWx0Iiwibm90aWZ5RWxlbWVudENyZWF0ZWRMaXN0ZW5lciIsImNoaWxkRG9tU2NhZmZvbGQiLCJnZXRUcmVlIiwiZ2V0Q2hpbGRFbGVtZW50cyIsImVsZW1lbnQiLCJlbGVtZW50Q3JlYXRlZCIsIkRvbVRyZWUiLCJfeG1sIiwiX3Jvb3RFbGVtZW50IiwiZG9tU2NhZmZvbGQiLCJsb2FkIiwiZHVtcCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBQUE7O0FBRUEsTUFBYUEsU0FBYjtFQUFBO0VBQUE7RUFBQTs7RUFBQTtFQUFBO0VBQUEsNkJBRWdCQyxLQUZoQixFQUV1QkMsT0FGdkIsRUFF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
