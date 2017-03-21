(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('coreutil')) :
	typeof define === 'function' && define.amd ? define(['exports', 'coreutil'], factory) :
	(factory((global.xmlparser = global.xmlparser || {}),global.coreutil));
}(this, (function (exports,coreutil$1) { 'use strict';

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

class ElementBody{

    constructor(){
        this._name = null;
        this._namespace = null;
        this._attributes = new coreutil$1.Map();
    }

    getName() {
        return this._name;
    }

    getNamespace() {
        return this._namespace;
    }

    getAttributes() {
        return this._attributes;
    }

    detectPositions(depth, xml, cursor){
        let nameStartpos = cursor;
        let nameEndpos = null;
        let namespaceEndpos = null;
        let namespaceStartpos = null;
        while (coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
            cursor ++;
        }
        if(xml.charAt(cursor) == ':'){
            coreutil$1.Logger.debug(depth, 'Found namespace');
            namespaceStartpos = nameStartpos;
            namespaceEndpos = cursor-1;
            nameStartpos = cursor+1;
            cursor ++;
            while (coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                cursor ++;
            }
        }
        nameEndpos = cursor-1;
        this._name = xml.substring(nameStartpos, nameEndpos+1);
        if(namespaceStartpos !== null && namespaceEndpos !== null){
                this._namespace = xml.substring(namespaceStartpos, namespaceEndpos+1);
        }
        cursor = this.detectAttributes(depth,xml,cursor);
        return cursor;
    }

    detectAttributes(depth,xml,cursor){
        let detectedAttrNameCursor = null;
        while((detectedAttrNameCursor = this.detectNextStartAttribute(depth, xml, cursor)) != -1){
            cursor = this.detectNextEndAttribute(depth, xml, detectedAttrNameCursor);
            var name = xml.substring(detectedAttrNameCursor,cursor+1);
            coreutil$1.Logger.debug(depth, 'Found attribute from ' + detectedAttrNameCursor + '  to ' + cursor);
            cursor = this.detectValue(name,depth, xml, cursor+1);
        }
        return cursor;
    }


    detectNextStartAttribute(depth, xml, cursor){
        while(xml.charAt(cursor) == ' ' && cursor < xml.length){
            cursor ++;
            if(coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor))){
                return cursor;
            }
        }
        return -1;
    }

    detectNextEndAttribute(depth, xml, cursor){
        while(coreutil$1.StringUtils.isInAlphabet(xml.charAt(cursor))){
            cursor ++;
        }
        return cursor -1;
    }

    detectValue(name, depth, xml, cursor){
        let valuePos = cursor;
        if((valuePos = ReadAhead.read(xml,'="',valuePos,true)) == -1){
            this._attributes.set(name,null);
            return cursor;
        }
        valuePos++;
        coreutil$1.Logger.debug(depth, 'Possible attribute value start at ' + valuePos);
        let valueStartPos = valuePos;
        while(this.isAttributeContent(depth, xml, valuePos)){
            valuePos++;
        }
        if(valuePos == cursor){
            this._attributes.set(name, '');
        }else{
            this._attributes.set(name, xml.substring(valueStartPos,valuePos));
        }

        coreutil$1.Logger.debug(depth, 'Found attribute content ending at ' + (valuePos-1));

        if((valuePos = ReadAhead.read(xml,'"',valuePos,true)) != -1){
            valuePos++;
        }else{
            coreutil$1.Logger.error('Missing end quotes on attribute at position ' + valuePos);
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

class XmlCdata{

	constructor(value){
        this._value = value;
    }

    setValue(value) {
        this._value = value;
    }

    getValue() {
        return this._value;
    }

    dump(){
        this.dumpLevel(0);
    }

    dumpLevel(level){
        let spacer = ':';
        for(let space = 0 ; space < level*2 ; space ++){
            spacer = spacer + ' ';
        }

        coreutil$1.Logger.log(spacer + this._value);
        return;
    }

    read(){
        return this._value;
    }
}

/* jshint esversion: 6 */

class XmlElement{

	constructor(name, namespace, selfClosing, childElements){
        this._name = name;
        this._namespace = namespace;
        this._selfClosing = selfClosing;
        this._childElements = new coreutil$1.List();
        this._attributes = new coreutil$1.Map();
    }

    getName() {
        return this._name;
    }

    getNamespace() {
        return this._namespace;
    }

    getFullName() {
        if(this._namespace === null){
            return this._name;
        }
        return this._namespace + ':' + this._name;
    }

    getAttributes(){
        return this._attributes;
    }

    setAttributes(attributes){
        this._attributes = attributes;
    }

    setAttribute(key,value) {
		this._attributes.set(key,value);
	}

	getAttribute(key) {
		return this._attributes.get(key);
	}

    containsAttribute(key){
        return this._attributes.contains(key);
    }

	clearAttribute(){
		this._attributes = new coreutil$1.Map();
	}

    getChildElements(){
        return this._childElements;
    }

    setChildElements(elements) {
        this._childElements = elements;
    }

    setText(text){
        this._childElements = new coreutil$1.List();
        this.addText(text);
    }

    addText(text){
        let textElement = new XmlCdata(text);
        this._childElements.add(textElement);
    }

    dump(){
        this.dumpLevel(0);
    }

    dumpLevel(level){
        let spacer = ':';
        for(let space = 0 ; space < level*2 ; space ++){
            spacer = spacer + ' ';
        }

        if(this._selfClosing){
            coreutil$1.Logger.log(spacer + '<' + this.getFullName() + this.readAttributes() + '/>');
            return;
        }
        coreutil$1.Logger.log(spacer + '<' + this.getFullName() + this.readAttributes() + '>');
        this._childElements.forEach(function(childElement){
            childElement.dumpLevel(level+1);
            return true;
        });
        coreutil$1.Logger.log(spacer + '</' + this.getFullName() + '>');
    }

    read(){
        let result = '';
        if(this._selfClosing){
            result = result + '<' + this.getFullName() + this.readAttributes() + '/>';
            return result;
        }
        result = result + '<' + this.getFullName() + this.readAttributes() + '>';
        this._childElements.forEach(function(childElement){
            result = result + childElement.read();
            return true;
        });
        result = result + '</' + this.getFullName() + '>';
        return result;
    }

    readAttributes(){
        let result = '';
        this._attributes.forEach(function (key,attribute,parent) {
            result = result + ' ' + attribute.getName();
            if(attribute.getValue() !== null){
                result = result + '="' + attribute.getValue() + '"';
             }
             return true;
        },this);
        return result;
    }
}

/* jshint esversion: 6 */

class XmlAttribute {

  constructor(name,value) {
      this._name = name;
      this._value = value;
  }

  getName(){
      return this._name;
  }

  setName(val){
      this._name = val;
  }

  getValue(){
      return this._value;
  }

  setValue(val){
      this._value = val;
  }
}

/* jshint esversion: 6 */

class ElementDetector{

    constructor(){
        this._type = 'ElementDetector';
        this._hasChildren = false;
        this._found = false;
        this._xmlCursor = null;
        this._element = null;
    }

    createElement() {
        return this._element;
    }

    getType() {
        return this._type;
    }

    isFound() {
        return this._found;
    }

    hasChildren() {
        return this._hasChildren;
    }

    detect(depth, xmlCursor){
        this._xmlCursor = xmlCursor;
        coreutil$1.Logger.debug(depth, 'Looking for opening element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ElementDetector.detectOpenElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1) {

            this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), false);

            elementBody.getAttributes().forEach(function(attributeName,attributeValue,parent){
                parent._element.getAttributes().set(attributeName,new XmlAttribute(attributeName, attributeValue));
                return true;
            },this);

            coreutil$1.Logger.debug(depth, 'Found opening tag <' + this._element.getFullName() + '> from ' +  xmlCursor.cursor  + ' to ' + endpos);
            xmlCursor.cursor = endpos + 1;

            if(!this.stop(depth)){
                this._hasChildren = true;
            }
            this._found = true;
        }
    }

    stop(depth){
        coreutil$1.Logger.debug(depth, 'Looking for closing element at position ' + this._xmlCursor.cursor);
        let closingElement = ElementDetector.detectEndElement(depth, this._xmlCursor.xml, this._xmlCursor.cursor);
        if(closingElement != -1){
            let closingTagName =  this._xmlCursor.xml.substring(this._xmlCursor.cursor+2,closingElement);
            coreutil$1.Logger.debug(depth, 'Found closing tag </' + closingTagName + '> from ' +  this._xmlCursor.cursor  + ' to ' + closingElement);

            if(this._element.getFullName() != closingTagName){
                coreutil$1.Logger.error('ERR: Mismatch between opening tag <' + this._element.getFullName() + '> and closing tag </' + closingTagName + '> When exiting to parent elemnt');
            }
            this._xmlCursor.cursor = closingElement +1;
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
        if((cursor = ReadAhead.read(xml,'>',cursor)) == -1){
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
        if((cursor = ReadAhead.read(xml,'>',cursor)) == -1){
            return -1;
        }
        return cursor;
    }

}

/* jshint esversion: 6 */
class CdataDetector{

    constructor(){
        this._type = 'CdataDetector';
        this._value = null;
        this._found = false;
    }

    isFound() {
        return this._found;
    }

    getType() {
        return this._type;
    }

    createElement() {
        return new XmlCdata(this._value);
    }

    detect(depth, xmlCursor){
        this._found = false;
        this._value = null;

        let endPos = this.detectContent(depth, xmlCursor.xml, xmlCursor.cursor, xmlCursor.parentDomScaffold);
        if(endPos != -1) {
            this._found = true;
            this.hasChildren = false;
            this._value = xmlCursor.xml.substring(xmlCursor.cursor,endPos);
            xmlCursor.cursor = endPos;
        }
    }

    detectContent(depth, xml, cursor, parentDomScaffold) {
        coreutil$1.Logger.debug(depth, 'Cdata start at ' + cursor);
        let internalStartPos = cursor;
        if(!CdataDetector.isContent(depth, xml, cursor)){
            coreutil$1.Logger.debug(depth, 'No Cdata found');
            return -1;
        }
        while(CdataDetector.isContent(depth, xml, cursor) && cursor < xml.length){
            cursor ++;
        }
        coreutil$1.Logger.debug(depth, 'Cdata end at ' + (cursor-1));
        if(parentDomScaffold === null){
            coreutil$1.Logger.error('ERR: Content not allowed on root level in xml document');
            return -1;
        }
        coreutil$1.Logger.debug(depth, 'Cdata found value is ' + xml.substring(internalStartPos,cursor));
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

class ClosingElementDetector{

    constructor(){
        this._type = 'ClosingElementDetector';
        this._found = false;
        this._element = null;
    }

    createElement() {
        return this._element;
    }

    getType() {
        return this._type;
    }

    isFound() {
        return this._found;
    }

    detect(depth, xmlCursor) {
        coreutil$1.Logger.debug(depth, 'Looking for self closing element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ClosingElementDetector.detectClosingElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1){
            this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), true);

            elementBody.getAttributes().forEach(function(attributeName,attributeValue,parent){
                parent._element.setAttribute(attributeName,new XmlAttribute(attributeName, attributeValue));
                return true;
            },this);

            coreutil$1.Logger.debug(depth, 'Found self closing tag <' + this._element.getFullName() + '/> from ' +  xmlCursor.cursor  + ' to ' + endpos);
            this._found = true;
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

class DomScaffold{

    constructor(){
        this._element = null;
        this._childDomScaffolds = new coreutil$1.List();
        this._detectors = new coreutil$1.List();
        this._elementCreatedListener = null;
        this._detectors.add(new ElementDetector());
        this._detectors.add(new CdataDetector());
        this._detectors.add(new ClosingElementDetector());
    }

    getElement() {
        return this._element;
    }

    load(xml, cursor, elementCreatedListener){
        let xmlCursor = new XmlCursor(xml, cursor, null);
        this.loadDepth(1, xmlCursor, elementCreatedListener);
    }

    loadDepth(depth, xmlCursor, elementCreatedListener){
        coreutil.Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
        coreutil.Logger.debug(depth, 'Starting DomScaffold');
        this._elementCreatedListener = elementCreatedListener;

        if(xmlCursor.eof()){
            coreutil.Logger.debug(depth, 'Reached eof. Exiting');
            return false;
        }

        var elementDetector = null;
        this._detectors.forEach(function(curElementDetector,parent){
            coreutil.Logger.debug(depth, 'Starting ' + curElementDetector.getType());
            curElementDetector.detect(depth + 1,xmlCursor);
            if(!curElementDetector.isFound()){
                return true;
            }
            elementDetector = curElementDetector;
            return false;
        },this);

        if(elementDetector === null){
            xmlCursor.cursor++;
            coreutil.Logger.warn('WARN: No handler was found searching from position: ' + xmlCursor.cursor);
        }

        this._element = elementDetector.createElement();

        if(elementDetector instanceof ElementDetector && elementDetector.hasChildren()) {
            while(!elementDetector.stop(depth + 1) && xmlCursor.cursor < xmlCursor.xml.length){
                let previousParentScaffold = xmlCursor.parentDomScaffold;
                let childScaffold = new DomScaffold();
                xmlCursor.parentDomScaffold = childScaffold;
                childScaffold.loadDepth(depth+1, xmlCursor, this._elementCreatedListener);
                this._childDomScaffolds.add(childScaffold);
                xmlCursor.parentDomScaffold = previousParentScaffold;
            }
        }
        coreutil.Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
    }

    getTree(parentNotifyResult){
        if(this._element === null){
            return null;
        }

        let notifyResult = this.notifyElementCreatedListener(this._element,parentNotifyResult);

        this._childDomScaffolds.forEach(function(childDomScaffold,parent) {
            let childElement = childDomScaffold.getTree(notifyResult);
            if(childElement !== null){
                parent._element.getChildElements().add(childElement);
            }
            return true;
        },this);

        return this._element;
    }

    notifyElementCreatedListener(element, parentNotifyResult) {
        if(this._elementCreatedListener !== null){
            return this._elementCreatedListener.elementCreated(element, parentNotifyResult);
        }
        return null;
    }

}

/* jshint esversion: 6 */

class DomTree{

    constructor(xml, elementCreatedListener) {
        this._elementCreatedListener = elementCreatedListener;
        this._xml = xml;
        this._rootElement = null;
    }

    getRootElement() {
        return this._rootElement;
    }

    setRootElement(element) {
        this._rootElement = element;
    }

    load(){
        let domScaffold = new DomScaffold();
        domScaffold.load(this._xml,0,this._elementCreatedListener);
        this._rootElement = domScaffold.getTree();
    }

    dump(){
        this._rootElement.dump();
    }

    read(){
        return this._rootElement.read();
    }
}

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1scGFyc2VyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi94bWxwYXJzZXJqcy9zcmMvbWFpbi94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvcmVhZEFoZWFkLmpzIiwiLi4vLi4vLi4veG1scGFyc2VyanMvc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9lbGVtZW50Qm9keS5qcyIsIi4uLy4uLy4uL3htbHBhcnNlcmpzL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3htbENkYXRhLmpzIiwiLi4vLi4vLi4veG1scGFyc2VyanMvc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwveG1sRWxlbWVudC5qcyIsIi4uLy4uLy4uL3htbHBhcnNlcmpzL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3htbEF0dHJpYnV0ZS5qcyIsIi4uLy4uLy4uL3htbHBhcnNlcmpzL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yLmpzIiwiLi4vLi4vLi4veG1scGFyc2VyanMvc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9jZGF0YURldGVjdG9yLmpzIiwiLi4vLi4vLi4veG1scGFyc2VyanMvc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9jbG9zaW5nRWxlbWVudERldGVjdG9yLmpzIiwiLi4vLi4vLi4veG1scGFyc2VyanMvc3JjL21haW4veG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3htbEN1cnNvci5qcyIsIi4uLy4uLy4uL3htbHBhcnNlcmpzL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kb21TY2FmZm9sZC5qcyIsIi4uLy4uLy4uL3htbHBhcnNlcmpzL3NyYy9tYWluL3htbHBhcnNlci9wYXJzZXIveG1sL2RvbVRyZWUuanMiLCIuLi8uLi8uLi94bWxwYXJzZXJqcy9zcmMvbWFpbi94bWxwYXJzZXIveG1sUGFyc2VyRXhjZXB0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBSZWFkQWhlYWR7XHJcblxyXG4gICAgc3RhdGljIHJlYWQodmFsdWUsIG1hdGNoZXIsIGN1cnNvciwgaWdub3JlV2hpdGVzcGFjZSA9IGZhbHNlKXtcclxuICAgICAgICBsZXQgaW50ZXJuYWxDdXJzb3IgPSBjdXJzb3I7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG1hdGNoZXIubGVuZ3RoICYmIGkgPCB2YWx1ZS5sZW5ndGggOyBpKyspe1xyXG4gICAgICAgICAgICB3aGlsZShpZ25vcmVXaGl0ZXNwYWNlICYmIHZhbHVlLmNoYXJBdChpbnRlcm5hbEN1cnNvcikgPT0gJyAnKXtcclxuICAgICAgICAgICAgICAgIGludGVybmFsQ3Vyc29yKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYodmFsdWUuY2hhckF0KGludGVybmFsQ3Vyc29yKSA9PSBtYXRjaGVyLmNoYXJBdChpKSl7XHJcbiAgICAgICAgICAgICAgICBpbnRlcm5hbEN1cnNvcisrO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGludGVybmFsQ3Vyc29yIC0gMTtcclxuICAgIH1cclxufVxyXG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXHJcblxyXG5pbXBvcnQge0xvZ2dlciwgTWFwLCBTdHJpbmdVdGlsc30gZnJvbSBcImNvcmV1dGlsXCI7XHJcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRWxlbWVudEJvZHl7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICB0aGlzLl9uYW1lID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9uYW1lc3BhY2UgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TmFtZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXROYW1lc3BhY2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWVzcGFjZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRBdHRyaWJ1dGVzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzO1xyXG4gICAgfVxyXG5cclxuICAgIGRldGVjdFBvc2l0aW9ucyhkZXB0aCwgeG1sLCBjdXJzb3Ipe1xyXG4gICAgICAgIGxldCBuYW1lU3RhcnRwb3MgPSBjdXJzb3I7XHJcbiAgICAgICAgbGV0IG5hbWVFbmRwb3MgPSBudWxsO1xyXG4gICAgICAgIGxldCBuYW1lc3BhY2VFbmRwb3MgPSBudWxsO1xyXG4gICAgICAgIGxldCBuYW1lc3BhY2VTdGFydHBvcyA9IG51bGw7XHJcbiAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY3Vyc29yICsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih4bWwuY2hhckF0KGN1cnNvcikgPT0gJzonKXtcclxuICAgICAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgbmFtZXNwYWNlJyk7XHJcbiAgICAgICAgICAgIG5hbWVzcGFjZVN0YXJ0cG9zID0gbmFtZVN0YXJ0cG9zO1xyXG4gICAgICAgICAgICBuYW1lc3BhY2VFbmRwb3MgPSBjdXJzb3ItMTtcclxuICAgICAgICAgICAgbmFtZVN0YXJ0cG9zID0gY3Vyc29yKzE7XHJcbiAgICAgICAgICAgIGN1cnNvciArKztcclxuICAgICAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGN1cnNvciArKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBuYW1lRW5kcG9zID0gY3Vyc29yLTE7XHJcbiAgICAgICAgdGhpcy5fbmFtZSA9IHhtbC5zdWJzdHJpbmcobmFtZVN0YXJ0cG9zLCBuYW1lRW5kcG9zKzEpO1xyXG4gICAgICAgIGlmKG5hbWVzcGFjZVN0YXJ0cG9zICE9PSBudWxsICYmIG5hbWVzcGFjZUVuZHBvcyAhPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9uYW1lc3BhY2UgPSB4bWwuc3Vic3RyaW5nKG5hbWVzcGFjZVN0YXJ0cG9zLCBuYW1lc3BhY2VFbmRwb3MrMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN1cnNvciA9IHRoaXMuZGV0ZWN0QXR0cmlidXRlcyhkZXB0aCx4bWwsY3Vyc29yKTtcclxuICAgICAgICByZXR1cm4gY3Vyc29yO1xyXG4gICAgfVxyXG5cclxuICAgIGRldGVjdEF0dHJpYnV0ZXMoZGVwdGgseG1sLGN1cnNvcil7XHJcbiAgICAgICAgbGV0IGRldGVjdGVkQXR0ck5hbWVDdXJzb3IgPSBudWxsO1xyXG4gICAgICAgIHdoaWxlKChkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0U3RhcnRBdHRyaWJ1dGUoZGVwdGgsIHhtbCwgY3Vyc29yKSkgIT0gLTEpe1xyXG4gICAgICAgICAgICBjdXJzb3IgPSB0aGlzLmRldGVjdE5leHRFbmRBdHRyaWJ1dGUoZGVwdGgsIHhtbCwgZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvcik7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0geG1sLnN1YnN0cmluZyhkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yLGN1cnNvcisxKTtcclxuICAgICAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgYXR0cmlidXRlIGZyb20gJyArIGRldGVjdGVkQXR0ck5hbWVDdXJzb3IgKyAnICB0byAnICsgY3Vyc29yKTtcclxuICAgICAgICAgICAgY3Vyc29yID0gdGhpcy5kZXRlY3RWYWx1ZShuYW1lLGRlcHRoLCB4bWwsIGN1cnNvcisxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZGV0ZWN0TmV4dFN0YXJ0QXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XHJcbiAgICAgICAgd2hpbGUoeG1sLmNoYXJBdChjdXJzb3IpID09ICcgJyAmJiBjdXJzb3IgPCB4bWwubGVuZ3RoKXtcclxuICAgICAgICAgICAgY3Vyc29yICsrO1xyXG4gICAgICAgICAgICBpZihTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIH1cclxuXHJcbiAgICBkZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XHJcbiAgICAgICAgd2hpbGUoU3RyaW5nVXRpbHMuaXNJbkFscGhhYmV0KHhtbC5jaGFyQXQoY3Vyc29yKSkpe1xyXG4gICAgICAgICAgICBjdXJzb3IgKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjdXJzb3IgLTE7XHJcbiAgICB9XHJcblxyXG4gICAgZGV0ZWN0VmFsdWUobmFtZSwgZGVwdGgsIHhtbCwgY3Vyc29yKXtcclxuICAgICAgICBsZXQgdmFsdWVQb3MgPSBjdXJzb3I7XHJcbiAgICAgICAgaWYoKHZhbHVlUG9zID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc9XCInLHZhbHVlUG9zLHRydWUpKSA9PSAtMSl7XHJcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMuc2V0KG5hbWUsbnVsbCk7XHJcbiAgICAgICAgICAgIHJldHVybiBjdXJzb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhbHVlUG9zKys7XHJcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnUG9zc2libGUgYXR0cmlidXRlIHZhbHVlIHN0YXJ0IGF0ICcgKyB2YWx1ZVBvcyk7XHJcbiAgICAgICAgbGV0IHZhbHVlU3RhcnRQb3MgPSB2YWx1ZVBvcztcclxuICAgICAgICB3aGlsZSh0aGlzLmlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCB2YWx1ZVBvcykpe1xyXG4gICAgICAgICAgICB2YWx1ZVBvcysrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih2YWx1ZVBvcyA9PSBjdXJzb3Ipe1xyXG4gICAgICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzLnNldChuYW1lLCAnJyk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMuc2V0KG5hbWUsIHhtbC5zdWJzdHJpbmcodmFsdWVTdGFydFBvcyx2YWx1ZVBvcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgYXR0cmlidXRlIGNvbnRlbnQgZW5kaW5nIGF0ICcgKyAodmFsdWVQb3MtMSkpO1xyXG5cclxuICAgICAgICBpZigodmFsdWVQb3MgPSBSZWFkQWhlYWQucmVhZCh4bWwsJ1wiJyx2YWx1ZVBvcyx0cnVlKSkgIT0gLTEpe1xyXG4gICAgICAgICAgICB2YWx1ZVBvcysrO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBMb2dnZXIuZXJyb3IoJ01pc3NpbmcgZW5kIHF1b3RlcyBvbiBhdHRyaWJ1dGUgYXQgcG9zaXRpb24gJyArIHZhbHVlUG9zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlUG9zO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBpc0F0dHJpYnV0ZUNvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKXtcclxuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCdcIicsY3Vyc29yKSAhPSAtMSl7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbFwiXHJcblxyXG5leHBvcnQgY2xhc3MgWG1sQ2RhdGF7XHJcblxyXG5cdGNvbnN0cnVjdG9yKHZhbHVlKXtcclxuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFZhbHVlKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRWYWx1ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZHVtcCgpe1xyXG4gICAgICAgIHRoaXMuZHVtcExldmVsKDApO1xyXG4gICAgfVxyXG5cclxuICAgIGR1bXBMZXZlbChsZXZlbCl7XHJcbiAgICAgICAgbGV0IHNwYWNlciA9ICc6JztcclxuICAgICAgICBmb3IobGV0IHNwYWNlID0gMCA7IHNwYWNlIDwgbGV2ZWwqMiA7IHNwYWNlICsrKXtcclxuICAgICAgICAgICAgc3BhY2VyID0gc3BhY2VyICsgJyAnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgTG9nZ2VyLmxvZyhzcGFjZXIgKyB0aGlzLl92YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWQoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XHJcbiAgICB9XHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuaW1wb3J0IHtMb2dnZXIsIExpc3QsIE1hcH0gZnJvbSBcImNvcmV1dGlsXCI7XHJcbmltcG9ydCB7WG1sQ2RhdGF9IGZyb20gXCIuL3htbENkYXRhXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgWG1sRWxlbWVudHtcclxuXHJcblx0Y29uc3RydWN0b3IobmFtZSwgbmFtZXNwYWNlLCBzZWxmQ2xvc2luZywgY2hpbGRFbGVtZW50cyl7XHJcbiAgICAgICAgdGhpcy5fbmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gbmFtZXNwYWNlO1xyXG4gICAgICAgIHRoaXMuX3NlbGZDbG9zaW5nID0gc2VsZkNsb3Npbmc7XHJcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cyA9IG5ldyBMaXN0KCk7XHJcbiAgICAgICAgdGhpcy5fYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXROYW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE5hbWVzcGFjZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEZ1bGxOYW1lKCkge1xyXG4gICAgICAgIGlmKHRoaXMuX25hbWVzcGFjZSA9PT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlICsgJzonICsgdGhpcy5fbmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRBdHRyaWJ1dGVzKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKXtcclxuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcclxuICAgIH1cclxuXHJcbiAgICBzZXRBdHRyaWJ1dGUoa2V5LHZhbHVlKSB7XHJcblx0XHR0aGlzLl9hdHRyaWJ1dGVzLnNldChrZXksdmFsdWUpO1xyXG5cdH1cclxuXHJcblx0Z2V0QXR0cmlidXRlKGtleSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXMuZ2V0KGtleSk7XHJcblx0fVxyXG5cclxuICAgIGNvbnRhaW5zQXR0cmlidXRlKGtleSl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXMuY29udGFpbnMoa2V5KTtcclxuICAgIH1cclxuXHJcblx0Y2xlYXJBdHRyaWJ1dGUoKXtcclxuXHRcdHRoaXMuX2F0dHJpYnV0ZXMgPSBuZXcgTWFwKCk7XHJcblx0fVxyXG5cclxuICAgIGdldENoaWxkRWxlbWVudHMoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRFbGVtZW50cztcclxuICAgIH1cclxuXHJcbiAgICBzZXRDaGlsZEVsZW1lbnRzKGVsZW1lbnRzKSB7XHJcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cyA9IGVsZW1lbnRzO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRleHQodGV4dCl7XHJcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cyA9IG5ldyBMaXN0KCk7XHJcbiAgICAgICAgdGhpcy5hZGRUZXh0KHRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRleHQodGV4dCl7XHJcbiAgICAgICAgbGV0IHRleHRFbGVtZW50ID0gbmV3IFhtbENkYXRhKHRleHQpO1xyXG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMuYWRkKHRleHRFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBkdW1wKCl7XHJcbiAgICAgICAgdGhpcy5kdW1wTGV2ZWwoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgZHVtcExldmVsKGxldmVsKXtcclxuICAgICAgICBsZXQgc3BhY2VyID0gJzonO1xyXG4gICAgICAgIGZvcihsZXQgc3BhY2UgPSAwIDsgc3BhY2UgPCBsZXZlbCoyIDsgc3BhY2UgKyspe1xyXG4gICAgICAgICAgICBzcGFjZXIgPSBzcGFjZXIgKyAnICc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLl9zZWxmQ2xvc2luZyl7XHJcbiAgICAgICAgICAgIExvZ2dlci5sb2coc3BhY2VyICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJy8+Jyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgTG9nZ2VyLmxvZyhzcGFjZXIgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnPicpO1xyXG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpe1xyXG4gICAgICAgICAgICBjaGlsZEVsZW1lbnQuZHVtcExldmVsKGxldmVsKzEpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBMb2dnZXIubG9nKHNwYWNlciArICc8LycgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyAnPicpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWQoKXtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XHJcbiAgICAgICAgaWYodGhpcy5fc2VsZkNsb3Npbmcpe1xyXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnLz4nO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnPic7XHJcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkRWxlbWVudCl7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArIGNoaWxkRWxlbWVudC5yZWFkKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICc8LycgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyAnPic7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICByZWFkQXR0cmlidXRlcygpe1xyXG4gICAgICAgIGxldCByZXN1bHQgPSAnJztcclxuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzLmZvckVhY2goZnVuY3Rpb24gKGtleSxhdHRyaWJ1dGUscGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICcgJyArIGF0dHJpYnV0ZS5nZXROYW1lKCk7XHJcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZS5nZXRWYWx1ZSgpICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICc9XCInICsgYXR0cmlidXRlLmdldFZhbHVlKCkgKyAnXCInO1xyXG4gICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSx0aGlzKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59XHJcbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBYbWxBdHRyaWJ1dGUge1xyXG5cclxuICBjb25zdHJ1Y3RvcihuYW1lLHZhbHVlKSB7XHJcbiAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xyXG4gICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgZ2V0TmFtZSgpe1xyXG4gICAgICByZXR1cm4gdGhpcy5fbmFtZTtcclxuICB9XHJcblxyXG4gIHNldE5hbWUodmFsKXtcclxuICAgICAgdGhpcy5fbmFtZSA9IHZhbDtcclxuICB9XHJcblxyXG4gIGdldFZhbHVlKCl7XHJcbiAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcclxuICB9XHJcblxyXG4gIHNldFZhbHVlKHZhbCl7XHJcbiAgICAgIHRoaXMuX3ZhbHVlID0gdmFsO1xyXG4gIH1cclxufVxyXG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXHJcblxyXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsXCI7XHJcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkXCI7XHJcbmltcG9ydCB7RWxlbWVudEJvZHl9IGZyb20gXCIuL2VsZW1lbnRCb2R5XCI7XHJcbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcIi4uLy4uL3htbEVsZW1lbnRcIjtcclxuaW1wb3J0IHtYbWxBdHRyaWJ1dGV9IGZyb20gXCIuLi8uLi94bWxBdHRyaWJ1dGVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFbGVtZW50RGV0ZWN0b3J7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICB0aGlzLl90eXBlID0gJ0VsZW1lbnREZXRlY3Rvcic7XHJcbiAgICAgICAgdGhpcy5faGFzQ2hpbGRyZW4gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9mb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX3htbEN1cnNvciA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fZWxlbWVudCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUeXBlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90eXBlO1xyXG4gICAgfVxyXG5cclxuICAgIGlzRm91bmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvdW5kO1xyXG4gICAgfVxyXG5cclxuICAgIGhhc0NoaWxkcmVuKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9oYXNDaGlsZHJlbjtcclxuICAgIH1cclxuXHJcbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcil7XHJcbiAgICAgICAgdGhpcy5feG1sQ3Vyc29yID0geG1sQ3Vyc29yO1xyXG4gICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0xvb2tpbmcgZm9yIG9wZW5pbmcgZWxlbWVudCBhdCBwb3NpdGlvbiAnICsgeG1sQ3Vyc29yLmN1cnNvcik7XHJcbiAgICAgICAgbGV0IGVsZW1lbnRCb2R5ID0gbmV3IEVsZW1lbnRCb2R5KCk7XHJcbiAgICAgICAgbGV0IGVuZHBvcyA9IEVsZW1lbnREZXRlY3Rvci5kZXRlY3RPcGVuRWxlbWVudChkZXB0aCwgeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcixlbGVtZW50Qm9keSk7XHJcbiAgICAgICAgaWYoZW5kcG9zICE9IC0xKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50ID0gbmV3IFhtbEVsZW1lbnQoZWxlbWVudEJvZHkuZ2V0TmFtZSgpLCBlbGVtZW50Qm9keS5nZXROYW1lc3BhY2UoKSwgZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgZWxlbWVudEJvZHkuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSxwYXJlbnQpe1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Ll9lbGVtZW50LmdldEF0dHJpYnV0ZXMoKS5zZXQoYXR0cmlidXRlTmFtZSxuZXcgWG1sQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSx0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIG9wZW5pbmcgdGFnIDwnICsgdGhpcy5fZWxlbWVudC5nZXRGdWxsTmFtZSgpICsgJz4gZnJvbSAnICsgIHhtbEN1cnNvci5jdXJzb3IgICsgJyB0byAnICsgZW5kcG9zKTtcclxuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZHBvcyArIDE7XHJcblxyXG4gICAgICAgICAgICBpZighdGhpcy5zdG9wKGRlcHRoKSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9oYXNDaGlsZHJlbiA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fZm91bmQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdG9wKGRlcHRoKXtcclxuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdMb29raW5nIGZvciBjbG9zaW5nIGVsZW1lbnQgYXQgcG9zaXRpb24gJyArIHRoaXMuX3htbEN1cnNvci5jdXJzb3IpO1xyXG4gICAgICAgIGxldCBjbG9zaW5nRWxlbWVudCA9IEVsZW1lbnREZXRlY3Rvci5kZXRlY3RFbmRFbGVtZW50KGRlcHRoLCB0aGlzLl94bWxDdXJzb3IueG1sLCB0aGlzLl94bWxDdXJzb3IuY3Vyc29yKTtcclxuICAgICAgICBpZihjbG9zaW5nRWxlbWVudCAhPSAtMSl7XHJcbiAgICAgICAgICAgIGxldCBjbG9zaW5nVGFnTmFtZSA9ICB0aGlzLl94bWxDdXJzb3IueG1sLnN1YnN0cmluZyh0aGlzLl94bWxDdXJzb3IuY3Vyc29yKzIsY2xvc2luZ0VsZW1lbnQpO1xyXG4gICAgICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdGb3VuZCBjbG9zaW5nIHRhZyA8LycgKyBjbG9zaW5nVGFnTmFtZSArICc+IGZyb20gJyArICB0aGlzLl94bWxDdXJzb3IuY3Vyc29yICArICcgdG8gJyArIGNsb3NpbmdFbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgIGlmKHRoaXMuX2VsZW1lbnQuZ2V0RnVsbE5hbWUoKSAhPSBjbG9zaW5nVGFnTmFtZSl7XHJcbiAgICAgICAgICAgICAgICBMb2dnZXIuZXJyb3IoJ0VSUjogTWlzbWF0Y2ggYmV0d2VlbiBvcGVuaW5nIHRhZyA8JyArIHRoaXMuX2VsZW1lbnQuZ2V0RnVsbE5hbWUoKSArICc+IGFuZCBjbG9zaW5nIHRhZyA8LycgKyBjbG9zaW5nVGFnTmFtZSArICc+IFdoZW4gZXhpdGluZyB0byBwYXJlbnQgZWxlbW50Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5feG1sQ3Vyc29yLmN1cnNvciA9IGNsb3NpbmdFbGVtZW50ICsxO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBkZXRlY3RPcGVuRWxlbWVudChkZXB0aCwgeG1sLCBjdXJzb3IsIGVsZW1lbnRCb2R5KSB7XHJcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPCcsY3Vyc29yKSkgPT0gLTEpe1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN1cnNvciArKztcclxuICAgICAgICBjdXJzb3IgPSBlbGVtZW50Qm9keS5kZXRlY3RQb3NpdGlvbnMoZGVwdGgrMSwgeG1sLCBjdXJzb3IpO1xyXG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz4nLGN1cnNvcikpID09IC0xKXtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3Vyc29yO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBkZXRlY3RFbmRFbGVtZW50KGRlcHRoLCB4bWwsIGN1cnNvcil7XHJcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPC8nLGN1cnNvcikpID09IC0xKXtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjdXJzb3IgKys7XHJcbiAgICAgICAgY3Vyc29yID0gbmV3IEVsZW1lbnRCb2R5KCkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcclxuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc+JyxjdXJzb3IpKSA9PSAtMSl7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsXCI7XHJcbmltcG9ydCB7WG1sQ2RhdGF9IGZyb20gXCIuLi8uLi94bWxDZGF0YVwiO1xyXG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENkYXRhRGV0ZWN0b3J7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICB0aGlzLl90eXBlID0gJ0NkYXRhRGV0ZWN0b3InO1xyXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9mb3VuZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlzRm91bmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvdW5kO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFR5cGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFhtbENkYXRhKHRoaXMuX3ZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcil7XHJcbiAgICAgICAgdGhpcy5fZm91bmQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bGw7XHJcblxyXG4gICAgICAgIGxldCBlbmRQb3MgPSB0aGlzLmRldGVjdENvbnRlbnQoZGVwdGgsIHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IsIHhtbEN1cnNvci5wYXJlbnREb21TY2FmZm9sZCk7XHJcbiAgICAgICAgaWYoZW5kUG9zICE9IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5oYXNDaGlsZHJlbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IHhtbEN1cnNvci54bWwuc3Vic3RyaW5nKHhtbEN1cnNvci5jdXJzb3IsZW5kUG9zKTtcclxuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZFBvcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZGV0ZWN0Q29udGVudChkZXB0aCwgeG1sLCBjdXJzb3IsIHBhcmVudERvbVNjYWZmb2xkKSB7XHJcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnQ2RhdGEgc3RhcnQgYXQgJyArIGN1cnNvcik7XHJcbiAgICAgICAgbGV0IGludGVybmFsU3RhcnRQb3MgPSBjdXJzb3I7XHJcbiAgICAgICAgaWYoIUNkYXRhRGV0ZWN0b3IuaXNDb250ZW50KGRlcHRoLCB4bWwsIGN1cnNvcikpe1xyXG4gICAgICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdObyBDZGF0YSBmb3VuZCcpO1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoaWxlKENkYXRhRGV0ZWN0b3IuaXNDb250ZW50KGRlcHRoLCB4bWwsIGN1cnNvcikgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XHJcbiAgICAgICAgICAgIGN1cnNvciArKztcclxuICAgICAgICB9XHJcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnQ2RhdGEgZW5kIGF0ICcgKyAoY3Vyc29yLTEpKTtcclxuICAgICAgICBpZihwYXJlbnREb21TY2FmZm9sZCA9PT0gbnVsbCl7XHJcbiAgICAgICAgICAgIExvZ2dlci5lcnJvcignRVJSOiBDb250ZW50IG5vdCBhbGxvd2VkIG9uIHJvb3QgbGV2ZWwgaW4geG1sIGRvY3VtZW50Jyk7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnQ2RhdGEgZm91bmQgdmFsdWUgaXMgJyArIHhtbC5zdWJzdHJpbmcoaW50ZXJuYWxTdGFydFBvcyxjdXJzb3IpKTtcclxuICAgICAgICByZXR1cm4gY3Vyc29yO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBpc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKXtcclxuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbFwiO1xyXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCIuLi8uLi94bWxFbGVtZW50XCI7XHJcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkXCI7XHJcbmltcG9ydCB7RWxlbWVudEJvZHl9IGZyb20gXCIuL2VsZW1lbnRCb2R5XCI7XHJcbmltcG9ydCB7WG1sQXR0cmlidXRlfSBmcm9tIFwiLi4vLi4veG1sQXR0cmlidXRlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2xvc2luZ0VsZW1lbnREZXRlY3RvcntcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIHRoaXMuX3R5cGUgPSAnQ2xvc2luZ0VsZW1lbnREZXRlY3Rvcic7XHJcbiAgICAgICAgdGhpcy5fZm91bmQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVFbGVtZW50KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIGdldFR5cGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XHJcbiAgICB9XHJcblxyXG4gICAgaXNGb3VuZCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZm91bmQ7XHJcbiAgICB9XHJcblxyXG4gICAgZGV0ZWN0KGRlcHRoLCB4bWxDdXJzb3IpIHtcclxuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdMb29raW5nIGZvciBzZWxmIGNsb3NpbmcgZWxlbWVudCBhdCBwb3NpdGlvbiAnICsgeG1sQ3Vyc29yLmN1cnNvcik7XHJcbiAgICAgICAgbGV0IGVsZW1lbnRCb2R5ID0gbmV3IEVsZW1lbnRCb2R5KCk7XHJcbiAgICAgICAgbGV0IGVuZHBvcyA9IENsb3NpbmdFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0Q2xvc2luZ0VsZW1lbnQoZGVwdGgsIHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IsZWxlbWVudEJvZHkpO1xyXG4gICAgICAgIGlmKGVuZHBvcyAhPSAtMSl7XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBuZXcgWG1sRWxlbWVudChlbGVtZW50Qm9keS5nZXROYW1lKCksIGVsZW1lbnRCb2R5LmdldE5hbWVzcGFjZSgpLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnRCb2R5LmdldEF0dHJpYnV0ZXMoKS5mb3JFYWNoKGZ1bmN0aW9uKGF0dHJpYnV0ZU5hbWUsYXR0cmlidXRlVmFsdWUscGFyZW50KXtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5fZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSxuZXcgWG1sQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSx0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIHNlbGYgY2xvc2luZyB0YWcgPCcgKyB0aGlzLl9lbGVtZW50LmdldEZ1bGxOYW1lKCkgKyAnLz4gZnJvbSAnICsgIHhtbEN1cnNvci5jdXJzb3IgICsgJyB0byAnICsgZW5kcG9zKTtcclxuICAgICAgICAgICAgdGhpcy5fZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yID0gZW5kcG9zICsgMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGRldGVjdENsb3NpbmdFbGVtZW50KGRlcHRoLCB4bWwsIGN1cnNvciwgZWxlbWVudEJvZHkpe1xyXG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikpID09IC0xKXtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjdXJzb3IgKys7XHJcbiAgICAgICAgY3Vyc29yID0gZWxlbWVudEJvZHkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcclxuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCcvPicsY3Vyc29yKSkgPT0gLTEpe1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjdXJzb3I7XHJcbiAgICB9XHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuZXhwb3J0IGNsYXNzIFhtbEN1cnNvcntcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih4bWwsIGN1cnNvciwgcGFyZW50RG9tU2NhZmZvbGQpe1xyXG4gICAgICAgIHRoaXMueG1sID0geG1sO1xyXG4gICAgICAgIHRoaXMuY3Vyc29yID0gY3Vyc29yO1xyXG4gICAgICAgIHRoaXMucGFyZW50RG9tU2NhZmZvbGQgPSBwYXJlbnREb21TY2FmZm9sZDtcclxuICAgIH1cclxuXHJcbiAgICBlb2YoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJzb3IgPj0gdGhpcy54bWwubGVuZ3RoO1xyXG4gICAgfVxyXG59XHJcbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmltcG9ydCB7TGlzdH0gZnJvbSBcImNvcmV1dGlsXCI7XHJcbmltcG9ydCB7RWxlbWVudERldGVjdG9yfSBmcm9tIFwiLi9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yXCI7XHJcbmltcG9ydCB7Q2RhdGFEZXRlY3Rvcn0gZnJvbSBcIi4vZGV0ZWN0b3JzL2NkYXRhRGV0ZWN0b3JcIjtcclxuaW1wb3J0IHtDbG9zaW5nRWxlbWVudERldGVjdG9yfSBmcm9tIFwiLi9kZXRlY3RvcnMvY2xvc2luZ0VsZW1lbnREZXRlY3RvclwiO1xyXG5pbXBvcnQge1htbEN1cnNvcn0gZnJvbSBcIi4veG1sQ3Vyc29yXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRG9tU2NhZmZvbGR7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9jaGlsZERvbVNjYWZmb2xkcyA9IG5ldyBMaXN0KCk7XHJcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzID0gbmV3IExpc3QoKTtcclxuICAgICAgICB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9kZXRlY3RvcnMuYWRkKG5ldyBFbGVtZW50RGV0ZWN0b3IoKSk7XHJcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzLmFkZChuZXcgQ2RhdGFEZXRlY3RvcigpKTtcclxuICAgICAgICB0aGlzLl9kZXRlY3RvcnMuYWRkKG5ldyBDbG9zaW5nRWxlbWVudERldGVjdG9yKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEVsZW1lbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZCh4bWwsIGN1cnNvciwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcil7XHJcbiAgICAgICAgbGV0IHhtbEN1cnNvciA9IG5ldyBYbWxDdXJzb3IoeG1sLCBjdXJzb3IsIG51bGwpO1xyXG4gICAgICAgIHRoaXMubG9hZERlcHRoKDEsIHhtbEN1cnNvciwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZERlcHRoKGRlcHRoLCB4bWxDdXJzb3IsIGVsZW1lbnRDcmVhdGVkTGlzdGVuZXIpe1xyXG4gICAgICAgIGNvcmV1dGlsLkxvZ2dlci5zaG93UG9zKHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IpO1xyXG4gICAgICAgIGNvcmV1dGlsLkxvZ2dlci5kZWJ1ZyhkZXB0aCwgJ1N0YXJ0aW5nIERvbVNjYWZmb2xkJyk7XHJcbiAgICAgICAgdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lciA9IGVsZW1lbnRDcmVhdGVkTGlzdGVuZXI7XHJcblxyXG4gICAgICAgIGlmKHhtbEN1cnNvci5lb2YoKSl7XHJcbiAgICAgICAgICAgIGNvcmV1dGlsLkxvZ2dlci5kZWJ1ZyhkZXB0aCwgJ1JlYWNoZWQgZW9mLiBFeGl0aW5nJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBlbGVtZW50RGV0ZWN0b3IgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2RldGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uKGN1ckVsZW1lbnREZXRlY3RvcixwYXJlbnQpe1xyXG4gICAgICAgICAgICBjb3JldXRpbC5Mb2dnZXIuZGVidWcoZGVwdGgsICdTdGFydGluZyAnICsgY3VyRWxlbWVudERldGVjdG9yLmdldFR5cGUoKSk7XHJcbiAgICAgICAgICAgIGN1ckVsZW1lbnREZXRlY3Rvci5kZXRlY3QoZGVwdGggKyAxLHhtbEN1cnNvcik7XHJcbiAgICAgICAgICAgIGlmKCFjdXJFbGVtZW50RGV0ZWN0b3IuaXNGb3VuZCgpKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsZW1lbnREZXRlY3RvciA9IGN1ckVsZW1lbnREZXRlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sdGhpcyk7XHJcblxyXG4gICAgICAgIGlmKGVsZW1lbnREZXRlY3RvciA9PT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHhtbEN1cnNvci5jdXJzb3IrKztcclxuICAgICAgICAgICAgY29yZXV0aWwuTG9nZ2VyLndhcm4oJ1dBUk46IE5vIGhhbmRsZXIgd2FzIGZvdW5kIHNlYXJjaGluZyBmcm9tIHBvc2l0aW9uOiAnICsgeG1sQ3Vyc29yLmN1cnNvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9lbGVtZW50ID0gZWxlbWVudERldGVjdG9yLmNyZWF0ZUVsZW1lbnQoKTtcclxuXHJcbiAgICAgICAgaWYoZWxlbWVudERldGVjdG9yIGluc3RhbmNlb2YgRWxlbWVudERldGVjdG9yICYmIGVsZW1lbnREZXRlY3Rvci5oYXNDaGlsZHJlbigpKSB7XHJcbiAgICAgICAgICAgIHdoaWxlKCFlbGVtZW50RGV0ZWN0b3Iuc3RvcChkZXB0aCArIDEpICYmIHhtbEN1cnNvci5jdXJzb3IgPCB4bWxDdXJzb3IueG1sLmxlbmd0aCl7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHJldmlvdXNQYXJlbnRTY2FmZm9sZCA9IHhtbEN1cnNvci5wYXJlbnREb21TY2FmZm9sZDtcclxuICAgICAgICAgICAgICAgIGxldCBjaGlsZFNjYWZmb2xkID0gbmV3IERvbVNjYWZmb2xkKCk7XHJcbiAgICAgICAgICAgICAgICB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQgPSBjaGlsZFNjYWZmb2xkO1xyXG4gICAgICAgICAgICAgICAgY2hpbGRTY2FmZm9sZC5sb2FkRGVwdGgoZGVwdGgrMSwgeG1sQ3Vyc29yLCB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NoaWxkRG9tU2NhZmZvbGRzLmFkZChjaGlsZFNjYWZmb2xkKTtcclxuICAgICAgICAgICAgICAgIHhtbEN1cnNvci5wYXJlbnREb21TY2FmZm9sZCA9IHByZXZpb3VzUGFyZW50U2NhZmZvbGQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29yZXV0aWwuTG9nZ2VyLnNob3dQb3MoeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VHJlZShwYXJlbnROb3RpZnlSZXN1bHQpe1xyXG4gICAgICAgIGlmKHRoaXMuX2VsZW1lbnQgPT09IG51bGwpe1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBub3RpZnlSZXN1bHQgPSB0aGlzLm5vdGlmeUVsZW1lbnRDcmVhdGVkTGlzdGVuZXIodGhpcy5fZWxlbWVudCxwYXJlbnROb3RpZnlSZXN1bHQpO1xyXG5cclxuICAgICAgICB0aGlzLl9jaGlsZERvbVNjYWZmb2xkcy5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkRG9tU2NhZmZvbGQscGFyZW50KSB7XHJcbiAgICAgICAgICAgIGxldCBjaGlsZEVsZW1lbnQgPSBjaGlsZERvbVNjYWZmb2xkLmdldFRyZWUobm90aWZ5UmVzdWx0KTtcclxuICAgICAgICAgICAgaWYoY2hpbGRFbGVtZW50ICE9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5fZWxlbWVudC5nZXRDaGlsZEVsZW1lbnRzKCkuYWRkKGNoaWxkRWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSx0aGlzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgbm90aWZ5RWxlbWVudENyZWF0ZWRMaXN0ZW5lcihlbGVtZW50LCBwYXJlbnROb3RpZnlSZXN1bHQpIHtcclxuICAgICAgICBpZih0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyICE9PSBudWxsKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIuZWxlbWVudENyZWF0ZWQoZWxlbWVudCwgcGFyZW50Tm90aWZ5UmVzdWx0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmltcG9ydCB7RG9tU2NhZmZvbGR9IGZyb20gXCIuL3BhcnNlci9kb21TY2FmZm9sZFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERvbVRyZWV7XHJcblxyXG4gICAgY29uc3RydWN0b3IoeG1sLCBlbGVtZW50Q3JlYXRlZExpc3RlbmVyKSB7XHJcbiAgICAgICAgdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lciA9IGVsZW1lbnRDcmVhdGVkTGlzdGVuZXI7XHJcbiAgICAgICAgdGhpcy5feG1sID0geG1sO1xyXG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb290RWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcm9vdEVsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Um9vdEVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBsb2FkKCl7XHJcbiAgICAgICAgbGV0IGRvbVNjYWZmb2xkID0gbmV3IERvbVNjYWZmb2xkKCk7XHJcbiAgICAgICAgZG9tU2NhZmZvbGQubG9hZCh0aGlzLl94bWwsMCx0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyKTtcclxuICAgICAgICB0aGlzLl9yb290RWxlbWVudCA9IGRvbVNjYWZmb2xkLmdldFRyZWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBkdW1wKCl7XHJcbiAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQuZHVtcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWQoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcm9vdEVsZW1lbnQucmVhZCgpO1xyXG4gICAgfVxyXG59XHJcbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmNsYXNzIFhtbFBhcnNlckV4Y2VwdGlvbiB7XHJcblxyXG4gICAgY29uc3RydWN0b3IodmFsdWUpe1xyXG4gICAgfVxyXG5cclxufVxyXG4iXSwibmFtZXMiOlsiTWFwIiwiU3RyaW5nVXRpbHMiLCJMb2dnZXIiLCJMaXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFFQSxBQUFPLE1BQU0sU0FBUzs7SUFFbEIsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1FBQ3pELElBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQztRQUM1QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN4RCxNQUFNLGdCQUFnQixJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksR0FBRyxDQUFDO2dCQUMxRCxjQUFjLEVBQUUsQ0FBQzthQUNwQjtZQUNELEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLENB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
