'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var coreutil_v1 = require('coreutil_v1');

/* jshint esversion: 6 */

class ReadAhead{

    static read(value, matcher, cursor, ignoreWhitespace = false){
        let internalCursor = cursor;
        for(let i = 0; i < matcher.length && i < value.length ; i++){
            while(ignoreWhitespace && value.charAt(internalCursor) == ' '){
                internalCursor++;
            }
            if(value.charAt(internalCursor) == matcher.charAt(i)){
                internalCursor++;
            }else{
                return -1;
            }
        }

        return internalCursor - 1;
    }
}

/* jshint esversion: 6 */

class XmlAttribute {

  constructor(name,namespace,value) {
      this.name = name;
      this.namespace = namespace;
      this.value = value;
  }

  getName(){
      return this.name;
  }

  setName(val){
      this.name = val;
  }

  getNamespace(){
    return this.namespace;
  }

  setNamespace(val){
    this.namespace = val;
  }

  getValue(){
      return this.value;
  }

  setValue(val){
      this.value = val;
  }
}

/* jshint esversion: 6 */

const LOG = new coreutil_v1.Logger("ElementBody");

class ElementBody{

    constructor(){
        this.name = null;
        this.namespace = null;
        this.attributes = new coreutil_v1.Map();
    }

    getName() {
        return this.name;
    }

    getNamespace() {
        return this.namespace;
    }

    getAttributes() {
        return this.attributes;
    }

    detectPositions(depth, xml, cursor){
        let nameStartpos = cursor;
        let nameEndpos = null;
        while (coreutil_v1.StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
            cursor ++;
        }
        if(xml.charAt(cursor) == ':'){
            LOG.debug(depth, 'Found namespace');
            cursor ++;
            while (coreutil_v1.StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                cursor ++;
            }
        }
        nameEndpos = cursor-1;
        this.name = xml.substring(nameStartpos, nameEndpos+1);
        if(this.name.indexOf(":") > -1){
                this.namespace = this.name.split(":")[0];
                this.name = this.name.split(":")[1];
        }
        cursor = this.detectAttributes(depth,xml,cursor);
        return cursor;
    }

    detectAttributes(depth,xml,cursor){
        let detectedAttrNameCursor = null;
        while((detectedAttrNameCursor = this.detectNextStartAttribute(depth, xml, cursor)) != -1){
            cursor = this.detectNextEndAttribute(depth, xml, detectedAttrNameCursor);
            let namespace = null;
            let name = xml.substring(detectedAttrNameCursor,cursor+1);

            if(name.indexOf(":") > -1){
                namespace = name.split(":")[0];
                name = name.split(":")[1];
            }  

            LOG.debug(depth, 'Found attribute from ' + detectedAttrNameCursor + '  to ' + cursor);
            cursor = this.detectValue(name,namespace,depth, xml, cursor+1);
        }
        return cursor;
    }


    detectNextStartAttribute(depth, xml, cursor){
        while(xml.charAt(cursor) == ' ' && cursor < xml.length){
            cursor ++;
            if(coreutil_v1.StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-"){
                return cursor;
            }
        }
        return -1;
    }

    detectNextEndAttribute(depth, xml, cursor){
        while(coreutil_v1.StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-"){
            cursor ++;
        }
        if(xml.charAt(cursor) == ":"){
            cursor ++;
            while(coreutil_v1.StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-"){
                cursor ++;
            }
        }
        return cursor -1;
    }

    detectValue(name, namespace, depth, xml, cursor){
        let valuePos = cursor;
        let fullname = name;
        if(namespace !== null) {
            fullname = namespace + ":" + name;
        }
        if((valuePos = ReadAhead.read(xml,'="',valuePos,true)) == -1){
            this.attributes.set(fullname,new XmlAttribute(name,namespace,null));
            return cursor;
        }
        valuePos++;
        LOG.debug(depth, 'Possible attribute value start at ' + valuePos);
        let valueStartPos = valuePos;
        while(this.isAttributeContent(depth, xml, valuePos)){
            valuePos++;
        }
        if(valuePos == cursor){
            this.attributes.set(fullname, new XmlAttribute(name,namespace,''));
        }else{
            this.attributes.set(fullname, new XmlAttribute(name,namespace,xml.substring(valueStartPos,valuePos)));
        }

        LOG.debug(depth, 'Found attribute content ending at ' + (valuePos-1));

        if((valuePos = ReadAhead.read(xml,'"',valuePos,true)) != -1){
            valuePos++;
        }else{
            LOG.error('Missing end quotes on attribute at position ' + valuePos);
        }
        return valuePos;
    }


    isAttributeContent(depth, xml, cursor){
        if(ReadAhead.read(xml,'<',cursor) != -1){
            return false;
        }
        if(ReadAhead.read(xml,'>',cursor) != -1){
            return false;
        }
        if(ReadAhead.read(xml,'"',cursor) != -1){
            return false;
        }
        return true;
    }
}

/* jshint esversion: 6 */

const LOG$1 = new coreutil_v1.Logger("XmlCdata");

class XmlCdata{

	constructor(value){
        this.value = value;
    }

    setValue(value) {
        this.value = value;
    }

    getValue() {
        return this.value;
    }

    dump(){
        this.dumpLevel(0);
    }

    dumpLevel(level){
        let spacer = ':';
        for(let space = 0 ; space < level*2 ; space ++){
            spacer = spacer + ' ';
        }

        LOG$1.info(spacer + this.value);
        return;
    }

    read(){
        return this.value;
    }
}

/* jshint esversion: 6 */

const LOG$2 = new coreutil_v1.Logger("XmlElement");

class XmlElement{

	constructor(name, namespace, namespaceUri, selfClosing){
        this.name = name;
        this.namespace = namespace;
        this.selfClosing = selfClosing;
        this.childElements = new coreutil_v1.List();
        this.attributes = new coreutil_v1.Map();
        this.namespaceUri = namespaceUri;
    }

    getName() {
        return this.name;
    }

    getNamespace() {
        return this.namespace;
    }

    getNamespaceUri(){
        return this.namespaceUri;
    }

    getFullName() {
        if(this.namespace === null){
            return this.name;
        }

        return this.namespace + ':' + this.name;
    }

    getAttributes(){
        return this.attributes;
    }

    setAttributes(attributes){
        this.attributes = attributes;
    }

    setAttribute(key,value) {
		this.attributes.set(key,value);
	}

	getAttribute(key) {
		return this.attributes.get(key);
	}

    containsAttribute(key){
        return this.attributes.contains(key);
    }

	clearAttribute(){
		this.attributes = new coreutil_v1.Map();
	}

    getChildElements(){
        return this.childElements;
    }

    setChildElements(elements) {
        this.childElements = elements;
    }

    setText(text){
        this.childElements = new coreutil_v1.List();
        this.addText(text);
    }

    addText(text){
        let textElement = new XmlCdata(text);
        this.childElements.add(textElement);
    }

    dump(){
        this.dumpLevel(0);
    }

    dumpLevel(level){
        let spacer = ':';
        for(let space = 0 ; space < level*2 ; space ++){
            spacer = spacer + ' ';
        }

        if(this.selfClosing){
            LOG$2.info(spacer + '<' + this.getFullName() + this.readAttributes() + '/>');
            return;
        }
        LOG$2.info(spacer + '<' + this.getFullName() + this.readAttributes() + '>');
        this.childElements.forEach(function(childElement){
            childElement.dumpLevel(level+1);
            return true;
        });
        LOG$2.info(spacer + '</' + this.getFullName() + '>');
    }

    read(){
        let result = '';
        if(this.selfClosing){
            result = result + '<' + this.getFullName() + this.readAttributes() + '/>';
            return result;
        }
        result = result + '<' + this.getFullName() + this.readAttributes() + '>';
        this.childElements.forEach(function(childElement){
            result = result + childElement.read();
            return true;
        });
        result = result + '</' + this.getFullName() + '>';
        return result;
    }

    readAttributes(){
        let result = '';
        this.attributes.forEach(function (key,attribute,parent) {
            let fullname = attribute.getName();
            if(attribute.getNamespace() !== null) {
                fullname = attribute.getNamespace() + ":" + attribute.getName();
            }
            result = result + ' ' + fullname;
            if(attribute.getValue() !== null){
                result = result + '="' + attribute.getValue() + '"';
             }
             return true;
        },this);
        return result;
    }
}

/* jshint esversion: 6 */

const LOG$3 = new coreutil_v1.Logger("ElementDetector");

class ElementDetector{

    constructor(namespaceUriMap){
        this.type = 'ElementDetector';
        this.namespaceUriMap = namespaceUriMap;
        this.children = false;
        this.found = false;
        this.xmlCursor = null;
        this.element = null;
    }

    createElement() {
        return this.element;
    }

    getType() {
        return this.type;
    }

    isFound() {
        return this.found;
    }

    hasChildren() {
        return this.children;
    }

    detect(depth, xmlCursor){
        this.xmlCursor = xmlCursor;
        LOG$3.debug(depth, 'Looking for opening element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ElementDetector.detectOpenElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1) {

            let namespaceUri = null;
            if(elementBody.getNamespace() !== null && elementBody.getNamespace() !== undefined){
                namespaceUri = this.namespaceUriMap.get(elementBody.getNamespace());
            }

            this.element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), namespaceUri, false);

            elementBody.getAttributes().forEach(function(attributeName,attributeValue,parent){
                parent.element.getAttributes().set(attributeName,attributeValue);
                return true;
            },this);

            LOG$3.debug(depth, 'Found opening tag <' + this.element.getFullName() + '> from ' +  xmlCursor.cursor  + ' to ' + endpos);
            xmlCursor.cursor = endpos + 1;

            if(!this.stop(depth)){
                this.children = true;
            }
            this.found = true;
        }
    }

    stop(depth){
        LOG$3.debug(depth, 'Looking for closing element at position ' + this.xmlCursor.cursor);
        let closingElement = ElementDetector.detectEndElement(depth, this.xmlCursor.xml, this.xmlCursor.cursor);
        if(closingElement != -1){
            let closingTagName =  this.xmlCursor.xml.substring(this.xmlCursor.cursor+2,closingElement);
            LOG$3.debug(depth, 'Found closing tag </' + closingTagName + '> from ' +  this.xmlCursor.cursor  + ' to ' + closingElement);

            if(this.element.getFullName() != closingTagName){
                LOG$3.error('ERR: Mismatch between opening tag <' + this.element.getFullName() + '> and closing tag </' + closingTagName + '> When exiting to parent elemnt');
            }
            this.xmlCursor.cursor = closingElement +1;
            return true;
        }
        return false;
    }

    static detectOpenElement(depth, xml, cursor, elementBody) {
        if((cursor = ReadAhead.read(xml,'<',cursor)) == -1){
            return -1;
        }
        cursor ++;
        cursor = elementBody.detectPositions(depth+1, xml, cursor);
        if((cursor = ReadAhead.read(xml,'>',cursor, true)) == -1){
            return -1;
        }
        return cursor;
    }

    static detectEndElement(depth, xml, cursor){
        if((cursor = ReadAhead.read(xml,'</',cursor)) == -1){
            return -1;
        }
        cursor ++;
        cursor = new ElementBody().detectPositions(depth+1, xml, cursor);
        if((cursor = ReadAhead.read(xml,'>',cursor, true)) == -1){
            return -1;
        }
        return cursor;
    }

}

/* jshint esversion: 6 */

const LOG$4 = new coreutil_v1.Logger("CdataDetector");

class CdataDetector{

    constructor(){
        this.type = 'CdataDetector';
        this.value = null;
        this.found = false;
    }

    isFound() {
        return this.found;
    }

    getType() {
        return this.type;
    }

    createElement() {
        return new XmlCdata(this.value);
    }

    detect(depth, xmlCursor){
        this.found = false;
        this.value = null;

        let endPos = this.detectContent(depth, xmlCursor.xml, xmlCursor.cursor, xmlCursor.parentDomScaffold);
        if(endPos != -1) {
            this.found = true;
            this.hasChildren = false;
            this.value = xmlCursor.xml.substring(xmlCursor.cursor,endPos);
            xmlCursor.cursor = endPos;
        }
    }

    detectContent(depth, xml, cursor, parentDomScaffold) {
        LOG$4.debug(depth, 'Cdata start at ' + cursor);
        let internalStartPos = cursor;
        if(!CdataDetector.isContent(depth, xml, cursor)){
            LOG$4.debug(depth, 'No Cdata found');
            return -1;
        }
        while(CdataDetector.isContent(depth, xml, cursor) && cursor < xml.length){
            cursor ++;
        }
        LOG$4.debug(depth, 'Cdata end at ' + (cursor-1));
        if(parentDomScaffold === null){
            LOG$4.error('ERR: Content not allowed on root level in xml document');
            return -1;
        }
        LOG$4.debug(depth, 'Cdata found value is ' + xml.substring(internalStartPos,cursor));
        return cursor;
    }

    static isContent(depth, xml, cursor){
        if(ReadAhead.read(xml,'<',cursor) != -1){
            return false;
        }
        if(ReadAhead.read(xml,'>',cursor) != -1){
            return false;
        }
        return true;
    }
}

/* jshint esversion: 6 */

const LOG$5 = new coreutil_v1.Logger("ClosingElementDetector");

class ClosingElementDetector{

    constructor(namespaceUriMap){
        this.type = 'ClosingElementDetector';
        this.namespaceUriMap = namespaceUriMap;
        this.found = false;
        this.element = null;
    }

    createElement() {
        return this.element;
    }

    getType() {
        return this.type;
    }

    isFound() {
        return this.found;
    }

    detect(depth, xmlCursor) {
        LOG$5.debug(depth, 'Looking for self closing element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ClosingElementDetector.detectClosingElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1){
            this.element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), this.namespaceUriMap, true);

            elementBody.getAttributes().forEach(function(attributeName,attributeValue,parent){
                parent.element.setAttribute(attributeName,attributeValue);
                return true;
            },this);

            LOG$5.debug(depth, 'Found self closing tag <' + this.element.getFullName() + '/> from ' +  xmlCursor.cursor  + ' to ' + endpos);
            this.found = true;
            xmlCursor.cursor = endpos + 1;
        }
    }

    static detectClosingElement(depth, xml, cursor, elementBody){
        if((cursor = ReadAhead.read(xml,'<',cursor)) == -1){
            return -1;
        }
        cursor ++;
        cursor = elementBody.detectPositions(depth+1, xml, cursor);
        if((cursor = ReadAhead.read(xml,'/>',cursor)) == -1){
            return -1;
        }
        return cursor;
    }
}

/* jshint esversion: 6 */

class XmlCursor{

    constructor(xml, cursor, parentDomScaffold){
        this.xml = xml;
        this.cursor = cursor;
        this.parentDomScaffold = parentDomScaffold;
    }

    eof(){
        return this.cursor >= this.xml.length;
    }
}

/* jshint esversion: 6 */

const LOG$6 = new coreutil_v1.Logger("DomScaffold");

class DomScaffold{

    constructor(namespaceUriMap){
        this.namespaceUriMap = namespaceUriMap;
        this.element = null;
        this.childDomScaffolds = new coreutil_v1.List();
        this.detectors = new coreutil_v1.List();
        this.elementCreatedListener = null;
        this.detectors.add(new ElementDetector(this.namespaceUriMap));
        this.detectors.add(new CdataDetector());
        this.detectors.add(new ClosingElementDetector(this.namespaceUriMap));
    }

    getElement() {
        return this.element;
    }

    load(xml, cursor, elementCreatedListener){
        let xmlCursor = new XmlCursor(xml, cursor, null);
        this.loadDepth(1, xmlCursor, elementCreatedListener);
    }

    loadDepth(depth, xmlCursor, elementCreatedListener){
        LOG$6.showPos(xmlCursor.xml, xmlCursor.cursor);
        LOG$6.debug(depth, 'Starting DomScaffold');
        this.elementCreatedListener = elementCreatedListener;

        if(xmlCursor.eof()){
            LOG$6.debug(depth, 'Reached eof. Exiting');
            return false;
        }

        var elementDetector = null;
        this.detectors.forEach(function(curElementDetector,parent){
            LOG$6.debug(depth, 'Starting ' + curElementDetector.getType());
            curElementDetector.detect(depth + 1,xmlCursor);
            if(!curElementDetector.isFound()){
                return true;
            }
            elementDetector = curElementDetector;
            return false;
        },this);

        if(elementDetector === null){
            xmlCursor.cursor++;
            LOG$6.warn('WARN: No handler was found searching from position: ' + xmlCursor.cursor);
        }

        this.element = elementDetector.createElement();

        if(elementDetector instanceof ElementDetector && elementDetector.hasChildren()) {
            let namespaceUriMap = new coreutil_v1.Map();
            namespaceUriMap.addAll(this.namespaceUriMap);
            this.element.getAttributes().forEach(function(name,curAttribute,parent){
                if("xmlns" === curAttribute.getNamespace()){
                    namespaceUriMap.set(curAttribute.getName(),curAttribute.getValue());
                }
            },this);
            while(!elementDetector.stop(depth + 1) && xmlCursor.cursor < xmlCursor.xml.length){
                let previousParentScaffold = xmlCursor.parentDomScaffold;
                let childScaffold = new DomScaffold(namespaceUriMap);
                xmlCursor.parentDomScaffold = childScaffold;
                childScaffold.loadDepth(depth+1, xmlCursor, this.elementCreatedListener);
                this.childDomScaffolds.add(childScaffold);
                xmlCursor.parentDomScaffold = previousParentScaffold;
            }
        }
        LOG$6.showPos(xmlCursor.xml, xmlCursor.cursor);
    }

    getTree(parentNotifyResult){
        if(this.element === null){
            return null;
        }

        let notifyResult = this.notifyElementCreatedListener(this.element,parentNotifyResult);

        this.childDomScaffolds.forEach(function(childDomScaffold,parent) {
            let childElement = childDomScaffold.getTree(notifyResult);
            if(childElement !== null){
                parent.element.getChildElements().add(childElement);
            }
            return true;
        },this);

        return this.element;
    }

    notifyElementCreatedListener(element, parentNotifyResult) {
        if(this.elementCreatedListener !== null && this.elementCreatedListener !== undefined){
            return this.elementCreatedListener.elementCreated(element, parentNotifyResult);
        }
        return null;
    }

}

/* jshint esversion: 6 */

class DomTree{

    constructor(xml, elementCreatedListener) {
        this.elementCreatedListener = elementCreatedListener;
        this.xml = xml;
        this.rootElement = null;
    }

    setRootElement(element) {
        this.rootElement = element;
    }

    load(){
        let domScaffold = new DomScaffold(new coreutil_v1.Map());
        domScaffold.load(this.xml,0,this.elementCreatedListener);
        this.rootElement = domScaffold.getTree();
    }

    dump(){
        this.rootElement.dump();
    }

    read(){
        return this.rootElement.read();
    }
}

exports.CdataDetector = CdataDetector;
exports.ClosingElementDetector = ClosingElementDetector;
exports.DomScaffold = DomScaffold;
exports.DomTree = DomTree;
exports.ElementBody = ElementBody;
exports.ElementDetector = ElementDetector;
exports.ReadAhead = ReadAhead;
exports.XmlAttribute = XmlAttribute;
exports.XmlCdata = XmlCdata;
exports.XmlCursor = XmlCursor;
exports.XmlElement = XmlElement;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1scGFyc2VyX3YxLmpzIiwic291cmNlcyI6WyIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3JlYWRBaGVhZC5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxBdHRyaWJ1dGUuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9lbGVtZW50Qm9keS5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxDZGF0YS5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxFbGVtZW50LmpzIiwiLi4vLi4vc3JjL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yLmpzIiwiLi4vLi4vc3JjL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvY2RhdGFEZXRlY3Rvci5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvZGV0ZWN0b3JzL2Nsb3NpbmdFbGVtZW50RGV0ZWN0b3IuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3htbEN1cnNvci5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvZG9tU2NhZmZvbGQuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvZG9tVHJlZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBSZWFkQWhlYWR7XG5cbiAgICBzdGF0aWMgcmVhZCh2YWx1ZSwgbWF0Y2hlciwgY3Vyc29yLCBpZ25vcmVXaGl0ZXNwYWNlID0gZmFsc2Upe1xuICAgICAgICBsZXQgaW50ZXJuYWxDdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBtYXRjaGVyLmxlbmd0aCAmJiBpIDwgdmFsdWUubGVuZ3RoIDsgaSsrKXtcbiAgICAgICAgICAgIHdoaWxlKGlnbm9yZVdoaXRlc3BhY2UgJiYgdmFsdWUuY2hhckF0KGludGVybmFsQ3Vyc29yKSA9PSAnICcpe1xuICAgICAgICAgICAgICAgIGludGVybmFsQ3Vyc29yKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih2YWx1ZS5jaGFyQXQoaW50ZXJuYWxDdXJzb3IpID09IG1hdGNoZXIuY2hhckF0KGkpKXtcbiAgICAgICAgICAgICAgICBpbnRlcm5hbEN1cnNvcisrO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVybmFsQ3Vyc29yIC0gMTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBYbWxBdHRyaWJ1dGUge1xuXG4gIGNvbnN0cnVjdG9yKG5hbWUsbmFtZXNwYWNlLHZhbHVlKSB7XG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBnZXROYW1lKCl7XG4gICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICB9XG5cbiAgc2V0TmFtZSh2YWwpe1xuICAgICAgdGhpcy5uYW1lID0gdmFsO1xuICB9XG5cbiAgZ2V0TmFtZXNwYWNlKCl7XG4gICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlO1xuICB9XG5cbiAgc2V0TmFtZXNwYWNlKHZhbCl7XG4gICAgdGhpcy5uYW1lc3BhY2UgPSB2YWw7XG4gIH1cblxuICBnZXRWYWx1ZSgpe1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gIH1cblxuICBzZXRWYWx1ZSh2YWwpe1xuICAgICAgdGhpcy52YWx1ZSA9IHZhbDtcbiAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlciwgTWFwLCBTdHJpbmdVdGlsc30gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZC5qc1wiO1xuaW1wb3J0IHtYbWxBdHRyaWJ1dGV9IGZyb20gXCIuLi8uLi94bWxBdHRyaWJ1dGUuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkVsZW1lbnRCb2R5XCIpO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudEJvZHl7XG5cbiAgICBjb25zdHJ1Y3Rvcigpe1xuICAgICAgICB0aGlzLm5hbWUgPSBudWxsO1xuICAgICAgICB0aGlzLm5hbWVzcGFjZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBnZXROYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICAgIH1cblxuICAgIGdldE5hbWVzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlO1xuICAgIH1cblxuICAgIGdldEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgZGV0ZWN0UG9zaXRpb25zKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCBuYW1lU3RhcnRwb3MgPSBjdXJzb3I7XG4gICAgICAgIGxldCBuYW1lRW5kcG9zID0gbnVsbDtcbiAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGN1cnNvciArKztcbiAgICAgICAgfVxuICAgICAgICBpZih4bWwuY2hhckF0KGN1cnNvcikgPT0gJzonKXtcbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIG5hbWVzcGFjZScpO1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbmFtZUVuZHBvcyA9IGN1cnNvci0xO1xuICAgICAgICB0aGlzLm5hbWUgPSB4bWwuc3Vic3RyaW5nKG5hbWVTdGFydHBvcywgbmFtZUVuZHBvcysxKTtcbiAgICAgICAgaWYodGhpcy5uYW1lLmluZGV4T2YoXCI6XCIpID4gLTEpe1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZXNwYWNlID0gdGhpcy5uYW1lLnNwbGl0KFwiOlwiKVswXTtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSB0aGlzLm5hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciA9IHRoaXMuZGV0ZWN0QXR0cmlidXRlcyhkZXB0aCx4bWwsY3Vyc29yKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG5cbiAgICBkZXRlY3RBdHRyaWJ1dGVzKGRlcHRoLHhtbCxjdXJzb3Ipe1xuICAgICAgICBsZXQgZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvciA9IG51bGw7XG4gICAgICAgIHdoaWxlKChkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0U3RhcnRBdHRyaWJ1dGUoZGVwdGgsIHhtbCwgY3Vyc29yKSkgIT0gLTEpe1xuICAgICAgICAgICAgY3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGRldGVjdGVkQXR0ck5hbWVDdXJzb3IpO1xuICAgICAgICAgICAgbGV0IG5hbWVzcGFjZSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IHhtbC5zdWJzdHJpbmcoZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvcixjdXJzb3IrMSk7XG5cbiAgICAgICAgICAgIGlmKG5hbWUuaW5kZXhPZihcIjpcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlID0gbmFtZS5zcGxpdChcIjpcIilbMF07XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICAgICAgfSAgXG5cbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIGF0dHJpYnV0ZSBmcm9tICcgKyBkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yICsgJyAgdG8gJyArIGN1cnNvcik7XG4gICAgICAgICAgICBjdXJzb3IgPSB0aGlzLmRldGVjdFZhbHVlKG5hbWUsbmFtZXNwYWNlLGRlcHRoLCB4bWwsIGN1cnNvcisxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuXG4gICAgZGV0ZWN0TmV4dFN0YXJ0QXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSAnICcgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICBpZihTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSB8fCB4bWwuY2hhckF0KGN1cnNvcikgPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpIHx8IHhtbC5jaGFyQXQoY3Vyc29yKSA9PT0gXCItXCIpe1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICB9XG4gICAgICAgIGlmKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSBcIjpcIil7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB3aGlsZShTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSB8fCB4bWwuY2hhckF0KGN1cnNvcikgPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvciAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3RWYWx1ZShuYW1lLCBuYW1lc3BhY2UsIGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCB2YWx1ZVBvcyA9IGN1cnNvcjtcbiAgICAgICAgbGV0IGZ1bGxuYW1lID0gbmFtZTtcbiAgICAgICAgaWYobmFtZXNwYWNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBmdWxsbmFtZSA9IG5hbWVzcGFjZSArIFwiOlwiICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZigodmFsdWVQb3MgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz1cIicsdmFsdWVQb3MsdHJ1ZSkpID09IC0xKXtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5zZXQoZnVsbG5hbWUsbmV3IFhtbEF0dHJpYnV0ZShuYW1lLG5hbWVzcGFjZSxudWxsKSk7XG4gICAgICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlUG9zKys7XG4gICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ1Bvc3NpYmxlIGF0dHJpYnV0ZSB2YWx1ZSBzdGFydCBhdCAnICsgdmFsdWVQb3MpO1xuICAgICAgICBsZXQgdmFsdWVTdGFydFBvcyA9IHZhbHVlUG9zO1xuICAgICAgICB3aGlsZSh0aGlzLmlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCB2YWx1ZVBvcykpe1xuICAgICAgICAgICAgdmFsdWVQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBpZih2YWx1ZVBvcyA9PSBjdXJzb3Ipe1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLnNldChmdWxsbmFtZSwgbmV3IFhtbEF0dHJpYnV0ZShuYW1lLG5hbWVzcGFjZSwnJykpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5zZXQoZnVsbG5hbWUsIG5ldyBYbWxBdHRyaWJ1dGUobmFtZSxuYW1lc3BhY2UseG1sLnN1YnN0cmluZyh2YWx1ZVN0YXJ0UG9zLHZhbHVlUG9zKSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgTE9HLmRlYnVnKGRlcHRoLCAnRm91bmQgYXR0cmlidXRlIGNvbnRlbnQgZW5kaW5nIGF0ICcgKyAodmFsdWVQb3MtMSkpO1xuXG4gICAgICAgIGlmKCh2YWx1ZVBvcyA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnXCInLHZhbHVlUG9zLHRydWUpKSAhPSAtMSl7XG4gICAgICAgICAgICB2YWx1ZVBvcysrO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIExPRy5lcnJvcignTWlzc2luZyBlbmQgcXVvdGVzIG9uIGF0dHJpYnV0ZSBhdCBwb3NpdGlvbiAnICsgdmFsdWVQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZVBvcztcbiAgICB9XG5cblxuICAgIGlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCdcIicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsX3YxXCJcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlhtbENkYXRhXCIpO1xuXG5leHBvcnQgY2xhc3MgWG1sQ2RhdGF7XG5cblx0Y29uc3RydWN0b3IodmFsdWUpe1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG5cbiAgICBkdW1wKCl7XG4gICAgICAgIHRoaXMuZHVtcExldmVsKDApO1xuICAgIH1cblxuICAgIGR1bXBMZXZlbChsZXZlbCl7XG4gICAgICAgIGxldCBzcGFjZXIgPSAnOic7XG4gICAgICAgIGZvcihsZXQgc3BhY2UgPSAwIDsgc3BhY2UgPCBsZXZlbCoyIDsgc3BhY2UgKyspe1xuICAgICAgICAgICAgc3BhY2VyID0gc3BhY2VyICsgJyAnO1xuICAgICAgICB9XG5cbiAgICAgICAgTE9HLmluZm8oc3BhY2VyICsgdGhpcy52YWx1ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZWFkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXIsIExpc3QsIE1hcH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1htbENkYXRhfSBmcm9tIFwiLi94bWxDZGF0YS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiWG1sRWxlbWVudFwiKTtcblxuZXhwb3J0IGNsYXNzIFhtbEVsZW1lbnR7XG5cblx0Y29uc3RydWN0b3IobmFtZSwgbmFtZXNwYWNlLCBuYW1lc3BhY2VVcmksIHNlbGZDbG9zaW5nKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuc2VsZkNsb3NpbmcgPSBzZWxmQ2xvc2luZztcbiAgICAgICAgdGhpcy5jaGlsZEVsZW1lbnRzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLm5hbWVzcGFjZVVyaSA9IG5hbWVzcGFjZVVyaTtcbiAgICB9XG5cbiAgICBnZXROYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICAgIH1cblxuICAgIGdldE5hbWVzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlO1xuICAgIH1cblxuICAgIGdldE5hbWVzcGFjZVVyaSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lc3BhY2VVcmk7XG4gICAgfVxuXG4gICAgZ2V0RnVsbE5hbWUoKSB7XG4gICAgICAgIGlmKHRoaXMubmFtZXNwYWNlID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lc3BhY2UgKyAnOicgKyB0aGlzLm5hbWU7XG4gICAgfVxuXG4gICAgZ2V0QXR0cmlidXRlcygpe1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyl7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgc2V0QXR0cmlidXRlKGtleSx2YWx1ZSkge1xuXHRcdHRoaXMuYXR0cmlidXRlcy5zZXQoa2V5LHZhbHVlKTtcblx0fVxuXG5cdGdldEF0dHJpYnV0ZShrZXkpIHtcblx0XHRyZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmdldChrZXkpO1xuXHR9XG5cbiAgICBjb250YWluc0F0dHJpYnV0ZShrZXkpe1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmNvbnRhaW5zKGtleSk7XG4gICAgfVxuXG5cdGNsZWFyQXR0cmlidXRlKCl7XG5cdFx0dGhpcy5hdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuXHR9XG5cbiAgICBnZXRDaGlsZEVsZW1lbnRzKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkRWxlbWVudHM7XG4gICAgfVxuXG4gICAgc2V0Q2hpbGRFbGVtZW50cyhlbGVtZW50cykge1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMgPSBlbGVtZW50cztcbiAgICB9XG5cbiAgICBzZXRUZXh0KHRleHQpe1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLmFkZFRleHQodGV4dCk7XG4gICAgfVxuXG4gICAgYWRkVGV4dCh0ZXh0KXtcbiAgICAgICAgbGV0IHRleHRFbGVtZW50ID0gbmV3IFhtbENkYXRhKHRleHQpO1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMuYWRkKHRleHRFbGVtZW50KTtcbiAgICB9XG5cbiAgICBkdW1wKCl7XG4gICAgICAgIHRoaXMuZHVtcExldmVsKDApO1xuICAgIH1cblxuICAgIGR1bXBMZXZlbChsZXZlbCl7XG4gICAgICAgIGxldCBzcGFjZXIgPSAnOic7XG4gICAgICAgIGZvcihsZXQgc3BhY2UgPSAwIDsgc3BhY2UgPCBsZXZlbCoyIDsgc3BhY2UgKyspe1xuICAgICAgICAgICAgc3BhY2VyID0gc3BhY2VyICsgJyAnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodGhpcy5zZWxmQ2xvc2luZyl7XG4gICAgICAgICAgICBMT0cuaW5mbyhzcGFjZXIgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnLz4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBMT0cuaW5mbyhzcGFjZXIgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnPicpO1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpe1xuICAgICAgICAgICAgY2hpbGRFbGVtZW50LmR1bXBMZXZlbChsZXZlbCsxKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgTE9HLmluZm8oc3BhY2VyICsgJzwvJyArIHRoaXMuZ2V0RnVsbE5hbWUoKSArICc+Jyk7XG4gICAgfVxuXG4gICAgcmVhZCgpe1xuICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgICAgIGlmKHRoaXMuc2VsZkNsb3Npbmcpe1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJy8+JztcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJz4nO1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpe1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgY2hpbGRFbGVtZW50LnJlYWQoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwvJyArIHRoaXMuZ2V0RnVsbE5hbWUoKSArICc+JztcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZWFkQXR0cmlidXRlcygpe1xuICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChrZXksYXR0cmlidXRlLHBhcmVudCkge1xuICAgICAgICAgICAgbGV0IGZ1bGxuYW1lID0gYXR0cmlidXRlLmdldE5hbWUoKTtcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZS5nZXROYW1lc3BhY2UoKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZ1bGxuYW1lID0gYXR0cmlidXRlLmdldE5hbWVzcGFjZSgpICsgXCI6XCIgKyBhdHRyaWJ1dGUuZ2V0TmFtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJyAnICsgZnVsbG5hbWU7XG4gICAgICAgICAgICBpZihhdHRyaWJ1dGUuZ2V0VmFsdWUoKSAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJz1cIicgKyBhdHRyaWJ1dGUuZ2V0VmFsdWUoKSArICdcIic7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LHRoaXMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtSZWFkQWhlYWR9IGZyb20gXCIuLi9yZWFkQWhlYWQuanNcIjtcbmltcG9ydCB7RWxlbWVudEJvZHl9IGZyb20gXCIuL2VsZW1lbnRCb2R5LmpzXCI7XG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCIuLi8uLi94bWxFbGVtZW50LmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJFbGVtZW50RGV0ZWN0b3JcIik7XG5cbmV4cG9ydCBjbGFzcyBFbGVtZW50RGV0ZWN0b3J7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lc3BhY2VVcmlNYXApe1xuICAgICAgICB0aGlzLnR5cGUgPSAnRWxlbWVudERldGVjdG9yJztcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VVcmlNYXAgPSBuYW1lc3BhY2VVcmlNYXA7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5mb3VuZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnhtbEN1cnNvciA9IG51bGw7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXRUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlO1xuICAgIH1cblxuICAgIGlzRm91bmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZvdW5kO1xuICAgIH1cblxuICAgIGhhc0NoaWxkcmVuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbjtcbiAgICB9XG5cbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcil7XG4gICAgICAgIHRoaXMueG1sQ3Vyc29yID0geG1sQ3Vyc29yO1xuICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdMb29raW5nIGZvciBvcGVuaW5nIGVsZW1lbnQgYXQgcG9zaXRpb24gJyArIHhtbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBsZXQgZWxlbWVudEJvZHkgPSBuZXcgRWxlbWVudEJvZHkoKTtcbiAgICAgICAgbGV0IGVuZHBvcyA9IEVsZW1lbnREZXRlY3Rvci5kZXRlY3RPcGVuRWxlbWVudChkZXB0aCwgeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcixlbGVtZW50Qm9keSk7XG4gICAgICAgIGlmKGVuZHBvcyAhPSAtMSkge1xuXG4gICAgICAgICAgICBsZXQgbmFtZXNwYWNlVXJpID0gbnVsbDtcbiAgICAgICAgICAgIGlmKGVsZW1lbnRCb2R5LmdldE5hbWVzcGFjZSgpICE9PSBudWxsICYmIGVsZW1lbnRCb2R5LmdldE5hbWVzcGFjZSgpICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICAgIG5hbWVzcGFjZVVyaSA9IHRoaXMubmFtZXNwYWNlVXJpTWFwLmdldChlbGVtZW50Qm9keS5nZXROYW1lc3BhY2UoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnRCb2R5LmdldE5hbWUoKSwgZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCksIG5hbWVzcGFjZVVyaSwgZmFsc2UpO1xuXG4gICAgICAgICAgICBlbGVtZW50Qm9keS5nZXRBdHRyaWJ1dGVzKCkuZm9yRWFjaChmdW5jdGlvbihhdHRyaWJ1dGVOYW1lLGF0dHJpYnV0ZVZhbHVlLHBhcmVudCl7XG4gICAgICAgICAgICAgICAgcGFyZW50LmVsZW1lbnQuZ2V0QXR0cmlidXRlcygpLnNldChhdHRyaWJ1dGVOYW1lLGF0dHJpYnV0ZVZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIG9wZW5pbmcgdGFnIDwnICsgdGhpcy5lbGVtZW50LmdldEZ1bGxOYW1lKCkgKyAnPiBmcm9tICcgKyAgeG1sQ3Vyc29yLmN1cnNvciAgKyAnIHRvICcgKyBlbmRwb3MpO1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZHBvcyArIDE7XG5cbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3AoZGVwdGgpKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZm91bmQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RvcChkZXB0aCl7XG4gICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0xvb2tpbmcgZm9yIGNsb3NpbmcgZWxlbWVudCBhdCBwb3NpdGlvbiAnICsgdGhpcy54bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgbGV0IGNsb3NpbmdFbGVtZW50ID0gRWxlbWVudERldGVjdG9yLmRldGVjdEVuZEVsZW1lbnQoZGVwdGgsIHRoaXMueG1sQ3Vyc29yLnhtbCwgdGhpcy54bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgaWYoY2xvc2luZ0VsZW1lbnQgIT0gLTEpe1xuICAgICAgICAgICAgbGV0IGNsb3NpbmdUYWdOYW1lID0gIHRoaXMueG1sQ3Vyc29yLnhtbC5zdWJzdHJpbmcodGhpcy54bWxDdXJzb3IuY3Vyc29yKzIsY2xvc2luZ0VsZW1lbnQpO1xuICAgICAgICAgICAgTE9HLmRlYnVnKGRlcHRoLCAnRm91bmQgY2xvc2luZyB0YWcgPC8nICsgY2xvc2luZ1RhZ05hbWUgKyAnPiBmcm9tICcgKyAgdGhpcy54bWxDdXJzb3IuY3Vyc29yICArICcgdG8gJyArIGNsb3NpbmdFbGVtZW50KTtcblxuICAgICAgICAgICAgaWYodGhpcy5lbGVtZW50LmdldEZ1bGxOYW1lKCkgIT0gY2xvc2luZ1RhZ05hbWUpe1xuICAgICAgICAgICAgICAgIExPRy5lcnJvcignRVJSOiBNaXNtYXRjaCBiZXR3ZWVuIG9wZW5pbmcgdGFnIDwnICsgdGhpcy5lbGVtZW50LmdldEZ1bGxOYW1lKCkgKyAnPiBhbmQgY2xvc2luZyB0YWcgPC8nICsgY2xvc2luZ1RhZ05hbWUgKyAnPiBXaGVuIGV4aXRpbmcgdG8gcGFyZW50IGVsZW1udCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy54bWxDdXJzb3IuY3Vyc29yID0gY2xvc2luZ0VsZW1lbnQgKzE7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVjdE9wZW5FbGVtZW50KGRlcHRoLCB4bWwsIGN1cnNvciwgZWxlbWVudEJvZHkpIHtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPCcsY3Vyc29yKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciArKztcbiAgICAgICAgY3Vyc29yID0gZWxlbWVudEJvZHkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yLCB0cnVlKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJzb3I7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVjdEVuZEVsZW1lbnQoZGVwdGgsIHhtbCwgY3Vyc29yKXtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPC8nLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIGN1cnNvciA9IG5ldyBFbGVtZW50Qm9keSgpLmRldGVjdFBvc2l0aW9ucyhkZXB0aCsxLCB4bWwsIGN1cnNvcik7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz4nLGN1cnNvciwgdHJ1ZSkpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtYbWxDZGF0YX0gZnJvbSBcIi4uLy4uL3htbENkYXRhLmpzXCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ2RhdGFEZXRlY3RvclwiKTtcblxuZXhwb3J0IGNsYXNzIENkYXRhRGV0ZWN0b3J7XG5cbiAgICBjb25zdHJ1Y3Rvcigpe1xuICAgICAgICB0aGlzLnR5cGUgPSAnQ2RhdGFEZXRlY3Rvcic7XG4gICAgICAgIHRoaXMudmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLmZvdW5kID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaXNGb3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZm91bmQ7XG4gICAgfVxuXG4gICAgZ2V0VHlwZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFhtbENkYXRhKHRoaXMudmFsdWUpO1xuICAgIH1cblxuICAgIGRldGVjdChkZXB0aCwgeG1sQ3Vyc29yKXtcbiAgICAgICAgdGhpcy5mb3VuZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnZhbHVlID0gbnVsbDtcblxuICAgICAgICBsZXQgZW5kUG9zID0gdGhpcy5kZXRlY3RDb250ZW50KGRlcHRoLCB4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yLCB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQpO1xuICAgICAgICBpZihlbmRQb3MgIT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5oYXNDaGlsZHJlbiA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHhtbEN1cnNvci54bWwuc3Vic3RyaW5nKHhtbEN1cnNvci5jdXJzb3IsZW5kUG9zKTtcbiAgICAgICAgICAgIHhtbEN1cnNvci5jdXJzb3IgPSBlbmRQb3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZXRlY3RDb250ZW50KGRlcHRoLCB4bWwsIGN1cnNvciwgcGFyZW50RG9tU2NhZmZvbGQpIHtcbiAgICAgICAgTE9HLmRlYnVnKGRlcHRoLCAnQ2RhdGEgc3RhcnQgYXQgJyArIGN1cnNvcik7XG4gICAgICAgIGxldCBpbnRlcm5hbFN0YXJ0UG9zID0gY3Vyc29yO1xuICAgICAgICBpZighQ2RhdGFEZXRlY3Rvci5pc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKSl7XG4gICAgICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdObyBDZGF0YSBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlKENkYXRhRGV0ZWN0b3IuaXNDb250ZW50KGRlcHRoLCB4bWwsIGN1cnNvcikgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIH1cbiAgICAgICAgTE9HLmRlYnVnKGRlcHRoLCAnQ2RhdGEgZW5kIGF0ICcgKyAoY3Vyc29yLTEpKTtcbiAgICAgICAgaWYocGFyZW50RG9tU2NhZmZvbGQgPT09IG51bGwpe1xuICAgICAgICAgICAgTE9HLmVycm9yKCdFUlI6IENvbnRlbnQgbm90IGFsbG93ZWQgb24gcm9vdCBsZXZlbCBpbiB4bWwgZG9jdW1lbnQnKTtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdDZGF0YSBmb3VuZCB2YWx1ZSBpcyAnICsgeG1sLnN1YnN0cmluZyhpbnRlcm5hbFN0YXJ0UG9zLGN1cnNvcikpO1xuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuICAgIHN0YXRpYyBpc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKXtcbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCc8JyxjdXJzb3IpICE9IC0xKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJz4nLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwiLi4vLi4veG1sRWxlbWVudC5qc1wiO1xuaW1wb3J0IHtSZWFkQWhlYWR9IGZyb20gXCIuLi9yZWFkQWhlYWQuanNcIjtcbmltcG9ydCB7RWxlbWVudEJvZHl9IGZyb20gXCIuL2VsZW1lbnRCb2R5LmpzXCI7XG5pbXBvcnQge1htbEF0dHJpYnV0ZX0gZnJvbSBcIi4uLy4uL3htbEF0dHJpYnV0ZS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ2xvc2luZ0VsZW1lbnREZXRlY3RvclwiKTtcblxuZXhwb3J0IGNsYXNzIENsb3NpbmdFbGVtZW50RGV0ZWN0b3J7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lc3BhY2VVcmlNYXApe1xuICAgICAgICB0aGlzLnR5cGUgPSAnQ2xvc2luZ0VsZW1lbnREZXRlY3Rvcic7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlVXJpTWFwID0gbmFtZXNwYWNlVXJpTWFwO1xuICAgICAgICB0aGlzLmZvdW5kID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXRUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlO1xuICAgIH1cblxuICAgIGlzRm91bmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZvdW5kO1xuICAgIH1cblxuICAgIGRldGVjdChkZXB0aCwgeG1sQ3Vyc29yKSB7XG4gICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0xvb2tpbmcgZm9yIHNlbGYgY2xvc2luZyBlbGVtZW50IGF0IHBvc2l0aW9uICcgKyB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgbGV0IGVsZW1lbnRCb2R5ID0gbmV3IEVsZW1lbnRCb2R5KCk7XG4gICAgICAgIGxldCBlbmRwb3MgPSBDbG9zaW5nRWxlbWVudERldGVjdG9yLmRldGVjdENsb3NpbmdFbGVtZW50KGRlcHRoLCB4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yLGVsZW1lbnRCb2R5KTtcbiAgICAgICAgaWYoZW5kcG9zICE9IC0xKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnRCb2R5LmdldE5hbWUoKSwgZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCksIHRoaXMubmFtZXNwYWNlVXJpTWFwLCB0cnVlKTtcblxuICAgICAgICAgICAgZWxlbWVudEJvZHkuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgICAgIHBhcmVudC5lbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLGF0dHJpYnV0ZVZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIHNlbGYgY2xvc2luZyB0YWcgPCcgKyB0aGlzLmVsZW1lbnQuZ2V0RnVsbE5hbWUoKSArICcvPiBmcm9tICcgKyAgeG1sQ3Vyc29yLmN1cnNvciAgKyAnIHRvICcgKyBlbmRwb3MpO1xuICAgICAgICAgICAgdGhpcy5mb3VuZCA9IHRydWU7XG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yID0gZW5kcG9zICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlY3RDbG9zaW5nRWxlbWVudChkZXB0aCwgeG1sLCBjdXJzb3IsIGVsZW1lbnRCb2R5KXtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPCcsY3Vyc29yKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciArKztcbiAgICAgICAgY3Vyc29yID0gZWxlbWVudEJvZHkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnLz4nLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFhtbEN1cnNvcntcblxuICAgIGNvbnN0cnVjdG9yKHhtbCwgY3Vyc29yLCBwYXJlbnREb21TY2FmZm9sZCl7XG4gICAgICAgIHRoaXMueG1sID0geG1sO1xuICAgICAgICB0aGlzLmN1cnNvciA9IGN1cnNvcjtcbiAgICAgICAgdGhpcy5wYXJlbnREb21TY2FmZm9sZCA9IHBhcmVudERvbVNjYWZmb2xkO1xuICAgIH1cblxuICAgIGVvZigpe1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJzb3IgPj0gdGhpcy54bWwubGVuZ3RoO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXIsIE1hcCwgTGlzdH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge0VsZW1lbnREZXRlY3Rvcn0gZnJvbSBcIi4vZGV0ZWN0b3JzL2VsZW1lbnREZXRlY3Rvci5qc1wiO1xuaW1wb3J0IHtDZGF0YURldGVjdG9yfSBmcm9tIFwiLi9kZXRlY3RvcnMvY2RhdGFEZXRlY3Rvci5qc1wiO1xuaW1wb3J0IHtDbG9zaW5nRWxlbWVudERldGVjdG9yfSBmcm9tIFwiLi9kZXRlY3RvcnMvY2xvc2luZ0VsZW1lbnREZXRlY3Rvci5qc1wiO1xuaW1wb3J0IHtYbWxDdXJzb3J9IGZyb20gXCIuL3htbEN1cnNvci5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRG9tU2NhZmZvbGRcIik7XG5cbmV4cG9ydCBjbGFzcyBEb21TY2FmZm9sZHtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWVzcGFjZVVyaU1hcCl7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlVXJpTWFwID0gbmFtZXNwYWNlVXJpTWFwO1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmNoaWxkRG9tU2NhZmZvbGRzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5kZXRlY3RvcnMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLmVsZW1lbnRDcmVhdGVkTGlzdGVuZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmRldGVjdG9ycy5hZGQobmV3IEVsZW1lbnREZXRlY3Rvcih0aGlzLm5hbWVzcGFjZVVyaU1hcCkpO1xuICAgICAgICB0aGlzLmRldGVjdG9ycy5hZGQobmV3IENkYXRhRGV0ZWN0b3IoKSk7XG4gICAgICAgIHRoaXMuZGV0ZWN0b3JzLmFkZChuZXcgQ2xvc2luZ0VsZW1lbnREZXRlY3Rvcih0aGlzLm5hbWVzcGFjZVVyaU1hcCkpO1xuICAgIH1cblxuICAgIGdldEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG4gICAgbG9hZCh4bWwsIGN1cnNvciwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcil7XG4gICAgICAgIGxldCB4bWxDdXJzb3IgPSBuZXcgWG1sQ3Vyc29yKHhtbCwgY3Vyc29yLCBudWxsKTtcbiAgICAgICAgdGhpcy5sb2FkRGVwdGgoMSwgeG1sQ3Vyc29yLCBlbGVtZW50Q3JlYXRlZExpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBsb2FkRGVwdGgoZGVwdGgsIHhtbEN1cnNvciwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcil7XG4gICAgICAgIExPRy5zaG93UG9zKHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdTdGFydGluZyBEb21TY2FmZm9sZCcpO1xuICAgICAgICB0aGlzLmVsZW1lbnRDcmVhdGVkTGlzdGVuZXIgPSBlbGVtZW50Q3JlYXRlZExpc3RlbmVyO1xuXG4gICAgICAgIGlmKHhtbEN1cnNvci5lb2YoKSl7XG4gICAgICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdSZWFjaGVkIGVvZi4gRXhpdGluZycpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVsZW1lbnREZXRlY3RvciA9IG51bGw7XG4gICAgICAgIHRoaXMuZGV0ZWN0b3JzLmZvckVhY2goZnVuY3Rpb24oY3VyRWxlbWVudERldGVjdG9yLHBhcmVudCl7XG4gICAgICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdTdGFydGluZyAnICsgY3VyRWxlbWVudERldGVjdG9yLmdldFR5cGUoKSk7XG4gICAgICAgICAgICBjdXJFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0KGRlcHRoICsgMSx4bWxDdXJzb3IpO1xuICAgICAgICAgICAgaWYoIWN1ckVsZW1lbnREZXRlY3Rvci5pc0ZvdW5kKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudERldGVjdG9yID0gY3VyRWxlbWVudERldGVjdG9yO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgIGlmKGVsZW1lbnREZXRlY3RvciA9PT0gbnVsbCl7XG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yKys7XG4gICAgICAgICAgICBMT0cud2FybignV0FSTjogTm8gaGFuZGxlciB3YXMgZm91bmQgc2VhcmNoaW5nIGZyb20gcG9zaXRpb246ICcgKyB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnREZXRlY3Rvci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgaWYoZWxlbWVudERldGVjdG9yIGluc3RhbmNlb2YgRWxlbWVudERldGVjdG9yICYmIGVsZW1lbnREZXRlY3Rvci5oYXNDaGlsZHJlbigpKSB7XG4gICAgICAgICAgICBsZXQgbmFtZXNwYWNlVXJpTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgbmFtZXNwYWNlVXJpTWFwLmFkZEFsbCh0aGlzLm5hbWVzcGFjZVVyaU1hcCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24obmFtZSxjdXJBdHRyaWJ1dGUscGFyZW50KXtcbiAgICAgICAgICAgICAgICBpZihcInhtbG5zXCIgPT09IGN1ckF0dHJpYnV0ZS5nZXROYW1lc3BhY2UoKSl7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZVVyaU1hcC5zZXQoY3VyQXR0cmlidXRlLmdldE5hbWUoKSxjdXJBdHRyaWJ1dGUuZ2V0VmFsdWUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgICAgIHdoaWxlKCFlbGVtZW50RGV0ZWN0b3Iuc3RvcChkZXB0aCArIDEpICYmIHhtbEN1cnNvci5jdXJzb3IgPCB4bWxDdXJzb3IueG1sLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgbGV0IHByZXZpb3VzUGFyZW50U2NhZmZvbGQgPSB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQ7XG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkU2NhZmZvbGQgPSBuZXcgRG9tU2NhZmZvbGQobmFtZXNwYWNlVXJpTWFwKTtcbiAgICAgICAgICAgICAgICB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQgPSBjaGlsZFNjYWZmb2xkO1xuICAgICAgICAgICAgICAgIGNoaWxkU2NhZmZvbGQubG9hZERlcHRoKGRlcHRoKzEsIHhtbEN1cnNvciwgdGhpcy5lbGVtZW50Q3JlYXRlZExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkRG9tU2NhZmZvbGRzLmFkZChjaGlsZFNjYWZmb2xkKTtcbiAgICAgICAgICAgICAgICB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQgPSBwcmV2aW91c1BhcmVudFNjYWZmb2xkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIExPRy5zaG93UG9zKHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IpO1xuICAgIH1cblxuICAgIGdldFRyZWUocGFyZW50Tm90aWZ5UmVzdWx0KXtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50ID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vdGlmeVJlc3VsdCA9IHRoaXMubm90aWZ5RWxlbWVudENyZWF0ZWRMaXN0ZW5lcih0aGlzLmVsZW1lbnQscGFyZW50Tm90aWZ5UmVzdWx0KTtcblxuICAgICAgICB0aGlzLmNoaWxkRG9tU2NhZmZvbGRzLmZvckVhY2goZnVuY3Rpb24oY2hpbGREb21TY2FmZm9sZCxwYXJlbnQpIHtcbiAgICAgICAgICAgIGxldCBjaGlsZEVsZW1lbnQgPSBjaGlsZERvbVNjYWZmb2xkLmdldFRyZWUobm90aWZ5UmVzdWx0KTtcbiAgICAgICAgICAgIGlmKGNoaWxkRWxlbWVudCAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgcGFyZW50LmVsZW1lbnQuZ2V0Q2hpbGRFbGVtZW50cygpLmFkZChjaGlsZEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBub3RpZnlFbGVtZW50Q3JlYXRlZExpc3RlbmVyKGVsZW1lbnQsIHBhcmVudE5vdGlmeVJlc3VsdCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnRDcmVhdGVkTGlzdGVuZXIgIT09IG51bGwgJiYgdGhpcy5lbGVtZW50Q3JlYXRlZExpc3RlbmVyICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudENyZWF0ZWRMaXN0ZW5lci5lbGVtZW50Q3JlYXRlZChlbGVtZW50LCBwYXJlbnROb3RpZnlSZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0RvbVNjYWZmb2xkfSBmcm9tIFwiLi9wYXJzZXIvZG9tU2NhZmZvbGQuanNcIjtcbmltcG9ydCB7TWFwfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIERvbVRyZWV7XG5cbiAgICBjb25zdHJ1Y3Rvcih4bWwsIGVsZW1lbnRDcmVhdGVkTGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Q3JlYXRlZExpc3RlbmVyID0gZWxlbWVudENyZWF0ZWRMaXN0ZW5lcjtcbiAgICAgICAgdGhpcy54bWwgPSB4bWw7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIHNldFJvb3RFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgbG9hZCgpe1xuICAgICAgICBsZXQgZG9tU2NhZmZvbGQgPSBuZXcgRG9tU2NhZmZvbGQobmV3IE1hcCgpKTtcbiAgICAgICAgZG9tU2NhZmZvbGQubG9hZCh0aGlzLnhtbCwwLHRoaXMuZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBkb21TY2FmZm9sZC5nZXRUcmVlKCk7XG4gICAgfVxuXG4gICAgZHVtcCgpe1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LmR1bXAoKTtcbiAgICB9XG5cbiAgICByZWFkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3RFbGVtZW50LnJlYWQoKTtcbiAgICB9XG59XG4iXSwibmFtZXMiOlsiTG9nZ2VyIiwiTWFwIiwiU3RyaW5nVXRpbHMiLCJMT0ciLCJMaXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFFQSxBQUFPLE1BQU0sU0FBUzs7SUFFbEIsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1FBQ3pELElBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQztRQUM1QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFB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
