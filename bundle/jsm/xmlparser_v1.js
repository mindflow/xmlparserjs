import { Logger, Map, StringUtils, List } from './coreutil_v1.js'

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
      this._name = name;
      this._namespace = namespace;
      this._value = value;
  }

  getName(){
      return this._name;
  }

  setName(val){
      this._name = val;
  }

  getNamespace(){
    return this._namespace;
  }

  setNamespace(val){
    this._namespace = val;
  }

  getValue(){
      return this._value;
  }

  setValue(val){
      this._value = val;
  }
}

/* jshint esversion: 6 */

class ElementBody{

    constructor(){
        this._name = null;
        this._namespace = null;
        this._attributes = new Map();
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
        while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
            cursor ++;
        }
        if(xml.charAt(cursor) == ':'){
            Logger.debug(depth, 'Found namespace');
            cursor ++;
            while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                cursor ++;
            }
        }
        nameEndpos = cursor-1;
        this._name = xml.substring(nameStartpos, nameEndpos+1);
        if(this._name.indexOf(":") > -1){
                this._namespace = this._name.split(":")[0];
                this._name = this._name.split(":")[1];
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

            Logger.debug(depth, 'Found attribute from ' + detectedAttrNameCursor + '  to ' + cursor);
            cursor = this.detectValue(name,namespace,depth, xml, cursor+1);
        }
        return cursor;
    }


    detectNextStartAttribute(depth, xml, cursor){
        while(xml.charAt(cursor) == ' ' && cursor < xml.length){
            cursor ++;
            if(StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-"){
                return cursor;
            }
        }
        return -1;
    }

    detectNextEndAttribute(depth, xml, cursor){
        while(StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-"){
            cursor ++;
        }
        if(xml.charAt(cursor) == ":"){
            cursor ++;
            while(StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-"){
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
            this._attributes.set(fullname,new XmlAttribute(name,namespace,null));
            return cursor;
        }
        valuePos++;
        Logger.debug(depth, 'Possible attribute value start at ' + valuePos);
        let valueStartPos = valuePos;
        while(this.isAttributeContent(depth, xml, valuePos)){
            valuePos++;
        }
        if(valuePos == cursor){
            this._attributes.set(fullname, new XmlAttribute(name,namespace,''));
        }else{
            this._attributes.set(fullname, new XmlAttribute(name,namespace,xml.substring(valueStartPos,valuePos)));
        }

        Logger.debug(depth, 'Found attribute content ending at ' + (valuePos-1));

        if((valuePos = ReadAhead.read(xml,'"',valuePos,true)) != -1){
            valuePos++;
        }else{
            Logger.error('Missing end quotes on attribute at position ' + valuePos);
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

        Logger.log(spacer + this._value);
        return;
    }

    read(){
        return this._value;
    }
}

/* jshint esversion: 6 */

class XmlElement{

	constructor(name, namespace, namespaceUri, selfClosing){
        this._name = name;
        this._namespace = namespace;
        this._selfClosing = selfClosing;
        this._childElements = new List();
        this._attributes = new Map();
        this._namespaceUri = namespaceUri;
    }

    getName() {
        return this._name;
    }

    getNamespace() {
        return this._namespace;
    }

    getNamespaceUri(){
        return this._namespaceUri;
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
		this._attributes = new Map();
	}

    getChildElements(){
        return this._childElements;
    }

    setChildElements(elements) {
        this._childElements = elements;
    }

    setText(text){
        this._childElements = new List();
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
            Logger.log(spacer + '<' + this.getFullName() + this.readAttributes() + '/>');
            return;
        }
        Logger.log(spacer + '<' + this.getFullName() + this.readAttributes() + '>');
        this._childElements.forEach(function(childElement){
            childElement.dumpLevel(level+1);
            return true;
        });
        Logger.log(spacer + '</' + this.getFullName() + '>');
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

class ElementDetector{

    constructor(namespaceUriMap){
        this._type = 'ElementDetector';
        this._namespaceUriMap = namespaceUriMap;
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
        Logger.debug(depth, 'Looking for opening element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ElementDetector.detectOpenElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1) {

            let namespaceUri = null;
            if(elementBody.getNamespace() !== null && elementBody.getNamespace() !== undefined){
                namespaceUri = this._namespaceUriMap.get(elementBody.getNamespace());
            }

            this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), namespaceUri, false);

            elementBody.getAttributes().forEach(function(attributeName,attributeValue,parent){
                parent._element.getAttributes().set(attributeName,attributeValue);
                return true;
            },this);

            Logger.debug(depth, 'Found opening tag <' + this._element.getFullName() + '> from ' +  xmlCursor.cursor  + ' to ' + endpos);
            xmlCursor.cursor = endpos + 1;

            if(!this.stop(depth)){
                this._hasChildren = true;
            }
            this._found = true;
        }
    }

    stop(depth){
        Logger.debug(depth, 'Looking for closing element at position ' + this._xmlCursor.cursor);
        let closingElement = ElementDetector.detectEndElement(depth, this._xmlCursor.xml, this._xmlCursor.cursor);
        if(closingElement != -1){
            let closingTagName =  this._xmlCursor.xml.substring(this._xmlCursor.cursor+2,closingElement);
            Logger.debug(depth, 'Found closing tag </' + closingTagName + '> from ' +  this._xmlCursor.cursor  + ' to ' + closingElement);

            if(this._element.getFullName() != closingTagName){
                Logger.error('ERR: Mismatch between opening tag <' + this._element.getFullName() + '> and closing tag </' + closingTagName + '> When exiting to parent elemnt');
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
        Logger.debug(depth, 'Cdata start at ' + cursor);
        let internalStartPos = cursor;
        if(!CdataDetector.isContent(depth, xml, cursor)){
            Logger.debug(depth, 'No Cdata found');
            return -1;
        }
        while(CdataDetector.isContent(depth, xml, cursor) && cursor < xml.length){
            cursor ++;
        }
        Logger.debug(depth, 'Cdata end at ' + (cursor-1));
        if(parentDomScaffold === null){
            Logger.error('ERR: Content not allowed on root level in xml document');
            return -1;
        }
        Logger.debug(depth, 'Cdata found value is ' + xml.substring(internalStartPos,cursor));
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

    constructor(namespaceUriMap){
        this._type = 'ClosingElementDetector';
        this._namespaceUriMap = namespaceUriMap;
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
        Logger.debug(depth, 'Looking for self closing element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ClosingElementDetector.detectClosingElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1){
            this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), this._namespaceUriMap, true);

            elementBody.getAttributes().forEach(function(attributeName,attributeValue,parent){
                parent._element.setAttribute(attributeName,attributeValue);
                return true;
            },this);

            Logger.debug(depth, 'Found self closing tag <' + this._element.getFullName() + '/> from ' +  xmlCursor.cursor  + ' to ' + endpos);
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

    constructor(namespaceUriMap){
        this._namespaceUriMap = namespaceUriMap;
        this._element = null;
        this._childDomScaffolds = new List();
        this._detectors = new List();
        this._elementCreatedListener = null;
        this._detectors.add(new ElementDetector(this._namespaceUriMap));
        this._detectors.add(new CdataDetector());
        this._detectors.add(new ClosingElementDetector(this._namespaceUriMap));
    }

    getElement() {
        return this._element;
    }

    load(xml, cursor, elementCreatedListener){
        let xmlCursor = new XmlCursor(xml, cursor, null);
        this.loadDepth(1, xmlCursor, elementCreatedListener);
    }

    loadDepth(depth, xmlCursor, elementCreatedListener){
        Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
        Logger.debug(depth, 'Starting DomScaffold');
        this._elementCreatedListener = elementCreatedListener;

        if(xmlCursor.eof()){
            Logger.debug(depth, 'Reached eof. Exiting');
            return false;
        }

        var elementDetector = null;
        this._detectors.forEach(function(curElementDetector,parent){
            Logger.debug(depth, 'Starting ' + curElementDetector.getType());
            curElementDetector.detect(depth + 1,xmlCursor);
            if(!curElementDetector.isFound()){
                return true;
            }
            elementDetector = curElementDetector;
            return false;
        },this);

        if(elementDetector === null){
            xmlCursor.cursor++;
            Logger.warn('WARN: No handler was found searching from position: ' + xmlCursor.cursor);
        }

        this._element = elementDetector.createElement();

        if(elementDetector instanceof ElementDetector && elementDetector.hasChildren()) {
            let namespaceUriMap = new Map();
            namespaceUriMap.addAll(this._namespaceUriMap);
            this._element.getAttributes().forEach(function(name,curAttribute,parent){
                if("xmlns" === curAttribute.getNamespace()){
                    namespaceUriMap.set(curAttribute.getName(),curAttribute.getValue());
                }
            },this);
            while(!elementDetector.stop(depth + 1) && xmlCursor.cursor < xmlCursor.xml.length){
                let previousParentScaffold = xmlCursor.parentDomScaffold;
                let childScaffold = new DomScaffold(namespaceUriMap);
                xmlCursor.parentDomScaffold = childScaffold;
                childScaffold.loadDepth(depth+1, xmlCursor, this._elementCreatedListener);
                this._childDomScaffolds.add(childScaffold);
                xmlCursor.parentDomScaffold = previousParentScaffold;
            }
        }
        Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
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
        if(this._elementCreatedListener !== null && this._elementCreatedListener !== undefined){
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
        let domScaffold = new DomScaffold(new Map());
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

export { DomTree, CdataDetector, ClosingElementDetector, ElementBody, ElementDetector, DomScaffold, ReadAhead, XmlCursor, XmlAttribute, XmlCdata, XmlElement };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1scGFyc2VyX3YxLmpzIiwic291cmNlcyI6WyIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3JlYWRBaGVhZC5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxBdHRyaWJ1dGUuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9lbGVtZW50Qm9keS5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxDZGF0YS5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxFbGVtZW50LmpzIiwiLi4vLi4vc3JjL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yLmpzIiwiLi4vLi4vc3JjL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvY2RhdGFEZXRlY3Rvci5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvZGV0ZWN0b3JzL2Nsb3NpbmdFbGVtZW50RGV0ZWN0b3IuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3htbEN1cnNvci5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvZG9tU2NhZmZvbGQuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvZG9tVHJlZS5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIveG1sUGFyc2VyRXhjZXB0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFJlYWRBaGVhZHtcblxuICAgIHN0YXRpYyByZWFkKHZhbHVlLCBtYXRjaGVyLCBjdXJzb3IsIGlnbm9yZVdoaXRlc3BhY2UgPSBmYWxzZSl7XG4gICAgICAgIGxldCBpbnRlcm5hbEN1cnNvciA9IGN1cnNvcjtcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG1hdGNoZXIubGVuZ3RoICYmIGkgPCB2YWx1ZS5sZW5ndGggOyBpKyspe1xuICAgICAgICAgICAgd2hpbGUoaWdub3JlV2hpdGVzcGFjZSAmJiB2YWx1ZS5jaGFyQXQoaW50ZXJuYWxDdXJzb3IpID09ICcgJyl7XG4gICAgICAgICAgICAgICAgaW50ZXJuYWxDdXJzb3IrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHZhbHVlLmNoYXJBdChpbnRlcm5hbEN1cnNvcikgPT0gbWF0Y2hlci5jaGFyQXQoaSkpe1xuICAgICAgICAgICAgICAgIGludGVybmFsQ3Vyc29yKys7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW50ZXJuYWxDdXJzb3IgLSAxO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFhtbEF0dHJpYnV0ZSB7XG5cbiAgY29uc3RydWN0b3IobmFtZSxuYW1lc3BhY2UsdmFsdWUpIHtcbiAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgdGhpcy5fbmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldE5hbWUoKXtcbiAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG5cbiAgc2V0TmFtZSh2YWwpe1xuICAgICAgdGhpcy5fbmFtZSA9IHZhbDtcbiAgfVxuXG4gIGdldE5hbWVzcGFjZSgpe1xuICAgIHJldHVybiB0aGlzLl9uYW1lc3BhY2U7XG4gIH1cblxuICBzZXROYW1lc3BhY2UodmFsKXtcbiAgICB0aGlzLl9uYW1lc3BhY2UgPSB2YWw7XG4gIH1cblxuICBnZXRWYWx1ZSgpe1xuICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICB9XG5cbiAgc2V0VmFsdWUodmFsKXtcbiAgICAgIHRoaXMuX3ZhbHVlID0gdmFsO1xuICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TG9nZ2VyLCBNYXAsIFN0cmluZ1V0aWxzfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkLmpzXCI7XG5pbXBvcnQge1htbEF0dHJpYnV0ZX0gZnJvbSBcIi4uLy4uL3htbEF0dHJpYnV0ZS5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudEJvZHl7XG5cbiAgICBjb25zdHJ1Y3Rvcigpe1xuICAgICAgICB0aGlzLl9uYW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBnZXROYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgICB9XG5cbiAgICBnZXROYW1lc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9uYW1lc3BhY2U7XG4gICAgfVxuXG4gICAgZ2V0QXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgZGV0ZWN0UG9zaXRpb25zKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCBuYW1lU3RhcnRwb3MgPSBjdXJzb3I7XG4gICAgICAgIGxldCBuYW1lRW5kcG9zID0gbnVsbDtcbiAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGN1cnNvciArKztcbiAgICAgICAgfVxuICAgICAgICBpZih4bWwuY2hhckF0KGN1cnNvcikgPT0gJzonKXtcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIG5hbWVzcGFjZScpO1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbmFtZUVuZHBvcyA9IGN1cnNvci0xO1xuICAgICAgICB0aGlzLl9uYW1lID0geG1sLnN1YnN0cmluZyhuYW1lU3RhcnRwb3MsIG5hbWVFbmRwb3MrMSk7XG4gICAgICAgIGlmKHRoaXMuX25hbWUuaW5kZXhPZihcIjpcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gdGhpcy5fbmFtZS5zcGxpdChcIjpcIilbMF07XG4gICAgICAgICAgICAgICAgdGhpcy5fbmFtZSA9IHRoaXMuX25hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciA9IHRoaXMuZGV0ZWN0QXR0cmlidXRlcyhkZXB0aCx4bWwsY3Vyc29yKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG5cbiAgICBkZXRlY3RBdHRyaWJ1dGVzKGRlcHRoLHhtbCxjdXJzb3Ipe1xuICAgICAgICBsZXQgZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvciA9IG51bGw7XG4gICAgICAgIHdoaWxlKChkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0U3RhcnRBdHRyaWJ1dGUoZGVwdGgsIHhtbCwgY3Vyc29yKSkgIT0gLTEpe1xuICAgICAgICAgICAgY3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGRldGVjdGVkQXR0ck5hbWVDdXJzb3IpO1xuICAgICAgICAgICAgbGV0IG5hbWVzcGFjZSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IHhtbC5zdWJzdHJpbmcoZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvcixjdXJzb3IrMSk7XG5cbiAgICAgICAgICAgIGlmKG5hbWUuaW5kZXhPZihcIjpcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlID0gbmFtZS5zcGxpdChcIjpcIilbMF07XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICAgICAgfSAgXG5cbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIGF0dHJpYnV0ZSBmcm9tICcgKyBkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yICsgJyAgdG8gJyArIGN1cnNvcik7XG4gICAgICAgICAgICBjdXJzb3IgPSB0aGlzLmRldGVjdFZhbHVlKG5hbWUsbmFtZXNwYWNlLGRlcHRoLCB4bWwsIGN1cnNvcisxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuXG4gICAgZGV0ZWN0TmV4dFN0YXJ0QXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSAnICcgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICBpZihTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSB8fCB4bWwuY2hhckF0KGN1cnNvcikgPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpIHx8IHhtbC5jaGFyQXQoY3Vyc29yKSA9PT0gXCItXCIpe1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICB9XG4gICAgICAgIGlmKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSBcIjpcIil7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB3aGlsZShTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSB8fCB4bWwuY2hhckF0KGN1cnNvcikgPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvciAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3RWYWx1ZShuYW1lLCBuYW1lc3BhY2UsIGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCB2YWx1ZVBvcyA9IGN1cnNvcjtcbiAgICAgICAgbGV0IGZ1bGxuYW1lID0gbmFtZTtcbiAgICAgICAgaWYobmFtZXNwYWNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBmdWxsbmFtZSA9IG5hbWVzcGFjZSArIFwiOlwiICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZigodmFsdWVQb3MgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz1cIicsdmFsdWVQb3MsdHJ1ZSkpID09IC0xKXtcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMuc2V0KGZ1bGxuYW1lLG5ldyBYbWxBdHRyaWJ1dGUobmFtZSxuYW1lc3BhY2UsbnVsbCkpO1xuICAgICAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZVBvcysrO1xuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdQb3NzaWJsZSBhdHRyaWJ1dGUgdmFsdWUgc3RhcnQgYXQgJyArIHZhbHVlUG9zKTtcbiAgICAgICAgbGV0IHZhbHVlU3RhcnRQb3MgPSB2YWx1ZVBvcztcbiAgICAgICAgd2hpbGUodGhpcy5pc0F0dHJpYnV0ZUNvbnRlbnQoZGVwdGgsIHhtbCwgdmFsdWVQb3MpKXtcbiAgICAgICAgICAgIHZhbHVlUG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYodmFsdWVQb3MgPT0gY3Vyc29yKXtcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMuc2V0KGZ1bGxuYW1lLCBuZXcgWG1sQXR0cmlidXRlKG5hbWUsbmFtZXNwYWNlLCcnKSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhpcy5fYXR0cmlidXRlcy5zZXQoZnVsbG5hbWUsIG5ldyBYbWxBdHRyaWJ1dGUobmFtZSxuYW1lc3BhY2UseG1sLnN1YnN0cmluZyh2YWx1ZVN0YXJ0UG9zLHZhbHVlUG9zKSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgYXR0cmlidXRlIGNvbnRlbnQgZW5kaW5nIGF0ICcgKyAodmFsdWVQb3MtMSkpO1xuXG4gICAgICAgIGlmKCh2YWx1ZVBvcyA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnXCInLHZhbHVlUG9zLHRydWUpKSAhPSAtMSl7XG4gICAgICAgICAgICB2YWx1ZVBvcysrO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIExvZ2dlci5lcnJvcignTWlzc2luZyBlbmQgcXVvdGVzIG9uIGF0dHJpYnV0ZSBhdCBwb3NpdGlvbiAnICsgdmFsdWVQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZVBvcztcbiAgICB9XG5cblxuICAgIGlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCdcIicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsX3YxXCJcblxuZXhwb3J0IGNsYXNzIFhtbENkYXRhe1xuXG5cdGNvbnN0cnVjdG9yKHZhbHVlKXtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBzZXRWYWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuXG4gICAgZHVtcCgpe1xuICAgICAgICB0aGlzLmR1bXBMZXZlbCgwKTtcbiAgICB9XG5cbiAgICBkdW1wTGV2ZWwobGV2ZWwpe1xuICAgICAgICBsZXQgc3BhY2VyID0gJzonO1xuICAgICAgICBmb3IobGV0IHNwYWNlID0gMCA7IHNwYWNlIDwgbGV2ZWwqMiA7IHNwYWNlICsrKXtcbiAgICAgICAgICAgIHNwYWNlciA9IHNwYWNlciArICcgJztcbiAgICAgICAgfVxuXG4gICAgICAgIExvZ2dlci5sb2coc3BhY2VyICsgdGhpcy5fdmFsdWUpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVhZCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlciwgTGlzdCwgTWFwfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7WG1sQ2RhdGF9IGZyb20gXCIuL3htbENkYXRhLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBYbWxFbGVtZW50e1xuXG5cdGNvbnN0cnVjdG9yKG5hbWUsIG5hbWVzcGFjZSwgbmFtZXNwYWNlVXJpLCBzZWxmQ2xvc2luZyl7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLl9uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuX3NlbGZDbG9zaW5nID0gc2VsZkNsb3Npbmc7XG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9uYW1lc3BhY2VVcmkgPSBuYW1lc3BhY2VVcmk7XG4gICAgfVxuXG4gICAgZ2V0TmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgfVxuXG4gICAgZ2V0TmFtZXNwYWNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlO1xuICAgIH1cblxuICAgIGdldE5hbWVzcGFjZVVyaSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlVXJpO1xuICAgIH1cblxuICAgIGdldEZ1bGxOYW1lKCkge1xuICAgICAgICBpZih0aGlzLl9uYW1lc3BhY2UgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlICsgJzonICsgdGhpcy5fbmFtZTtcbiAgICB9XG5cbiAgICBnZXRBdHRyaWJ1dGVzKCl7XG4gICAgICAgIHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyl7XG4gICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZShrZXksdmFsdWUpIHtcblx0XHR0aGlzLl9hdHRyaWJ1dGVzLnNldChrZXksdmFsdWUpO1xuXHR9XG5cblx0Z2V0QXR0cmlidXRlKGtleSkge1xuXHRcdHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzLmdldChrZXkpO1xuXHR9XG5cbiAgICBjb250YWluc0F0dHJpYnV0ZShrZXkpe1xuICAgICAgICByZXR1cm4gdGhpcy5fYXR0cmlidXRlcy5jb250YWlucyhrZXkpO1xuICAgIH1cblxuXHRjbGVhckF0dHJpYnV0ZSgpe1xuXHRcdHRoaXMuX2F0dHJpYnV0ZXMgPSBuZXcgTWFwKCk7XG5cdH1cblxuICAgIGdldENoaWxkRWxlbWVudHMoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkRWxlbWVudHM7XG4gICAgfVxuXG4gICAgc2V0Q2hpbGRFbGVtZW50cyhlbGVtZW50cykge1xuICAgICAgICB0aGlzLl9jaGlsZEVsZW1lbnRzID0gZWxlbWVudHM7XG4gICAgfVxuXG4gICAgc2V0VGV4dCh0ZXh0KXtcbiAgICAgICAgdGhpcy5fY2hpbGRFbGVtZW50cyA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMuYWRkVGV4dCh0ZXh0KTtcbiAgICB9XG5cbiAgICBhZGRUZXh0KHRleHQpe1xuICAgICAgICBsZXQgdGV4dEVsZW1lbnQgPSBuZXcgWG1sQ2RhdGEodGV4dCk7XG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMuYWRkKHRleHRFbGVtZW50KTtcbiAgICB9XG5cbiAgICBkdW1wKCl7XG4gICAgICAgIHRoaXMuZHVtcExldmVsKDApO1xuICAgIH1cblxuICAgIGR1bXBMZXZlbChsZXZlbCl7XG4gICAgICAgIGxldCBzcGFjZXIgPSAnOic7XG4gICAgICAgIGZvcihsZXQgc3BhY2UgPSAwIDsgc3BhY2UgPCBsZXZlbCoyIDsgc3BhY2UgKyspe1xuICAgICAgICAgICAgc3BhY2VyID0gc3BhY2VyICsgJyAnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodGhpcy5fc2VsZkNsb3Npbmcpe1xuICAgICAgICAgICAgTG9nZ2VyLmxvZyhzcGFjZXIgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnLz4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBMb2dnZXIubG9nKHNwYWNlciArICc8JyArIHRoaXMuZ2V0RnVsbE5hbWUoKSArIHRoaXMucmVhZEF0dHJpYnV0ZXMoKSArICc+Jyk7XG4gICAgICAgIHRoaXMuX2NoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpe1xuICAgICAgICAgICAgY2hpbGRFbGVtZW50LmR1bXBMZXZlbChsZXZlbCsxKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgTG9nZ2VyLmxvZyhzcGFjZXIgKyAnPC8nICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgJz4nKTtcbiAgICB9XG5cbiAgICByZWFkKCl7XG4gICAgICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAgICAgaWYodGhpcy5fc2VsZkNsb3Npbmcpe1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJy8+JztcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJz4nO1xuICAgICAgICB0aGlzLl9jaGlsZEVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24oY2hpbGRFbGVtZW50KXtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArIGNoaWxkRWxlbWVudC5yZWFkKCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICc8LycgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyAnPic7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmVhZEF0dHJpYnV0ZXMoKXtcbiAgICAgICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzLmZvckVhY2goZnVuY3Rpb24gKGtleSxhdHRyaWJ1dGUscGFyZW50KSB7XG4gICAgICAgICAgICBsZXQgZnVsbG5hbWUgPSBhdHRyaWJ1dGUuZ2V0TmFtZSgpO1xuICAgICAgICAgICAgaWYoYXR0cmlidXRlLmdldE5hbWVzcGFjZSgpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZnVsbG5hbWUgPSBhdHRyaWJ1dGUuZ2V0TmFtZXNwYWNlKCkgKyBcIjpcIiArIGF0dHJpYnV0ZS5nZXROYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnICcgKyBmdWxsbmFtZTtcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZS5nZXRWYWx1ZSgpICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnPVwiJyArIGF0dHJpYnV0ZS5nZXRWYWx1ZSgpICsgJ1wiJztcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZC5qc1wiO1xuaW1wb3J0IHtFbGVtZW50Qm9keX0gZnJvbSBcIi4vZWxlbWVudEJvZHkuanNcIjtcbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcIi4uLy4uL3htbEVsZW1lbnQuanNcIjtcbmltcG9ydCB7WG1sQXR0cmlidXRlfSBmcm9tIFwiLi4vLi4veG1sQXR0cmlidXRlLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBFbGVtZW50RGV0ZWN0b3J7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lc3BhY2VVcmlNYXApe1xuICAgICAgICB0aGlzLl90eXBlID0gJ0VsZW1lbnREZXRlY3Rvcic7XG4gICAgICAgIHRoaXMuX25hbWVzcGFjZVVyaU1hcCA9IG5hbWVzcGFjZVVyaU1hcDtcbiAgICAgICAgdGhpcy5faGFzQ2hpbGRyZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZm91bmQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5feG1sQ3Vyc29yID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XG4gICAgfVxuXG4gICAgZ2V0VHlwZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XG4gICAgfVxuXG4gICAgaXNGb3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvdW5kO1xuICAgIH1cblxuICAgIGhhc0NoaWxkcmVuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFzQ2hpbGRyZW47XG4gICAgfVxuXG4gICAgZGV0ZWN0KGRlcHRoLCB4bWxDdXJzb3Ipe1xuICAgICAgICB0aGlzLl94bWxDdXJzb3IgPSB4bWxDdXJzb3I7XG4gICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0xvb2tpbmcgZm9yIG9wZW5pbmcgZWxlbWVudCBhdCBwb3NpdGlvbiAnICsgeG1sQ3Vyc29yLmN1cnNvcik7XG4gICAgICAgIGxldCBlbGVtZW50Qm9keSA9IG5ldyBFbGVtZW50Qm9keSgpO1xuICAgICAgICBsZXQgZW5kcG9zID0gRWxlbWVudERldGVjdG9yLmRldGVjdE9wZW5FbGVtZW50KGRlcHRoLCB4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yLGVsZW1lbnRCb2R5KTtcbiAgICAgICAgaWYoZW5kcG9zICE9IC0xKSB7XG5cbiAgICAgICAgICAgIGxldCBuYW1lc3BhY2VVcmkgPSBudWxsO1xuICAgICAgICAgICAgaWYoZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCkgIT09IG51bGwgJiYgZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCkgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlVXJpID0gdGhpcy5fbmFtZXNwYWNlVXJpTWFwLmdldChlbGVtZW50Qm9keS5nZXROYW1lc3BhY2UoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQgPSBuZXcgWG1sRWxlbWVudChlbGVtZW50Qm9keS5nZXROYW1lKCksIGVsZW1lbnRCb2R5LmdldE5hbWVzcGFjZSgpLCBuYW1lc3BhY2VVcmksIGZhbHNlKTtcblxuICAgICAgICAgICAgZWxlbWVudEJvZHkuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgICAgIHBhcmVudC5fZWxlbWVudC5nZXRBdHRyaWJ1dGVzKCkuc2V0KGF0dHJpYnV0ZU5hbWUsYXR0cmlidXRlVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSx0aGlzKTtcblxuICAgICAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgb3BlbmluZyB0YWcgPCcgKyB0aGlzLl9lbGVtZW50LmdldEZ1bGxOYW1lKCkgKyAnPiBmcm9tICcgKyAgeG1sQ3Vyc29yLmN1cnNvciAgKyAnIHRvICcgKyBlbmRwb3MpO1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZHBvcyArIDE7XG5cbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3AoZGVwdGgpKXtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYXNDaGlsZHJlbiA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9mb3VuZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKGRlcHRoKXtcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnTG9va2luZyBmb3IgY2xvc2luZyBlbGVtZW50IGF0IHBvc2l0aW9uICcgKyB0aGlzLl94bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgbGV0IGNsb3NpbmdFbGVtZW50ID0gRWxlbWVudERldGVjdG9yLmRldGVjdEVuZEVsZW1lbnQoZGVwdGgsIHRoaXMuX3htbEN1cnNvci54bWwsIHRoaXMuX3htbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBpZihjbG9zaW5nRWxlbWVudCAhPSAtMSl7XG4gICAgICAgICAgICBsZXQgY2xvc2luZ1RhZ05hbWUgPSAgdGhpcy5feG1sQ3Vyc29yLnhtbC5zdWJzdHJpbmcodGhpcy5feG1sQ3Vyc29yLmN1cnNvcisyLGNsb3NpbmdFbGVtZW50KTtcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIGNsb3NpbmcgdGFnIDwvJyArIGNsb3NpbmdUYWdOYW1lICsgJz4gZnJvbSAnICsgIHRoaXMuX3htbEN1cnNvci5jdXJzb3IgICsgJyB0byAnICsgY2xvc2luZ0VsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZih0aGlzLl9lbGVtZW50LmdldEZ1bGxOYW1lKCkgIT0gY2xvc2luZ1RhZ05hbWUpe1xuICAgICAgICAgICAgICAgIExvZ2dlci5lcnJvcignRVJSOiBNaXNtYXRjaCBiZXR3ZWVuIG9wZW5pbmcgdGFnIDwnICsgdGhpcy5fZWxlbWVudC5nZXRGdWxsTmFtZSgpICsgJz4gYW5kIGNsb3NpbmcgdGFnIDwvJyArIGNsb3NpbmdUYWdOYW1lICsgJz4gV2hlbiBleGl0aW5nIHRvIHBhcmVudCBlbGVtbnQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3htbEN1cnNvci5jdXJzb3IgPSBjbG9zaW5nRWxlbWVudCArMTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZGV0ZWN0T3BlbkVsZW1lbnQoZGVwdGgsIHhtbCwgY3Vyc29yLCBlbGVtZW50Qm9keSkge1xuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc8JyxjdXJzb3IpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICBjdXJzb3IgPSBlbGVtZW50Qm9keS5kZXRlY3RQb3NpdGlvbnMoZGVwdGgrMSwgeG1sLCBjdXJzb3IpO1xuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc+JyxjdXJzb3IsIHRydWUpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG5cbiAgICBzdGF0aWMgZGV0ZWN0RW5kRWxlbWVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc8LycsY3Vyc29yKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciArKztcbiAgICAgICAgY3Vyc29yID0gbmV3IEVsZW1lbnRCb2R5KCkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yLCB0cnVlKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJzb3I7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1htbENkYXRhfSBmcm9tIFwiLi4vLi4veG1sQ2RhdGEuanNcIjtcbmltcG9ydCB7UmVhZEFoZWFkfSBmcm9tIFwiLi4vcmVhZEFoZWFkLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBDZGF0YURldGVjdG9ye1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgdGhpcy5fdHlwZSA9ICdDZGF0YURldGVjdG9yJztcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLl9mb3VuZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlzRm91bmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9mb3VuZDtcbiAgICB9XG5cbiAgICBnZXRUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdHlwZTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFhtbENkYXRhKHRoaXMuX3ZhbHVlKTtcbiAgICB9XG5cbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcil7XG4gICAgICAgIHRoaXMuX2ZvdW5kID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVsbDtcblxuICAgICAgICBsZXQgZW5kUG9zID0gdGhpcy5kZXRlY3RDb250ZW50KGRlcHRoLCB4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yLCB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQpO1xuICAgICAgICBpZihlbmRQb3MgIT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuX2ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaGFzQ2hpbGRyZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0geG1sQ3Vyc29yLnhtbC5zdWJzdHJpbmcoeG1sQ3Vyc29yLmN1cnNvcixlbmRQb3MpO1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZFBvcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRldGVjdENvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yLCBwYXJlbnREb21TY2FmZm9sZCkge1xuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdDZGF0YSBzdGFydCBhdCAnICsgY3Vyc29yKTtcbiAgICAgICAgbGV0IGludGVybmFsU3RhcnRQb3MgPSBjdXJzb3I7XG4gICAgICAgIGlmKCFDZGF0YURldGVjdG9yLmlzQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3IpKXtcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ05vIENkYXRhIGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUoQ2RhdGFEZXRlY3Rvci5pc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKSAmJiBjdXJzb3IgPCB4bWwubGVuZ3RoKXtcbiAgICAgICAgICAgIGN1cnNvciArKztcbiAgICAgICAgfVxuICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdDZGF0YSBlbmQgYXQgJyArIChjdXJzb3ItMSkpO1xuICAgICAgICBpZihwYXJlbnREb21TY2FmZm9sZCA9PT0gbnVsbCl7XG4gICAgICAgICAgICBMb2dnZXIuZXJyb3IoJ0VSUjogQ29udGVudCBub3QgYWxsb3dlZCBvbiByb290IGxldmVsIGluIHhtbCBkb2N1bWVudCcpO1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ0NkYXRhIGZvdW5kIHZhbHVlIGlzICcgKyB4bWwuc3Vic3RyaW5nKGludGVybmFsU3RhcnRQb3MsY3Vyc29yKSk7XG4gICAgICAgIHJldHVybiBjdXJzb3I7XG4gICAgfVxuXG4gICAgc3RhdGljIGlzQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCIuLi8uLi94bWxFbGVtZW50LmpzXCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZC5qc1wiO1xuaW1wb3J0IHtFbGVtZW50Qm9keX0gZnJvbSBcIi4vZWxlbWVudEJvZHkuanNcIjtcbmltcG9ydCB7WG1sQXR0cmlidXRlfSBmcm9tIFwiLi4vLi4veG1sQXR0cmlidXRlLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBDbG9zaW5nRWxlbWVudERldGVjdG9ye1xuXG4gICAgY29uc3RydWN0b3IobmFtZXNwYWNlVXJpTWFwKXtcbiAgICAgICAgdGhpcy5fdHlwZSA9ICdDbG9zaW5nRWxlbWVudERldGVjdG9yJztcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlVXJpTWFwID0gbmFtZXNwYWNlVXJpTWFwO1xuICAgICAgICB0aGlzLl9mb3VuZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXRUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdHlwZTtcbiAgICB9XG5cbiAgICBpc0ZvdW5kKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZm91bmQ7XG4gICAgfVxuXG4gICAgZGV0ZWN0KGRlcHRoLCB4bWxDdXJzb3IpIHtcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnTG9va2luZyBmb3Igc2VsZiBjbG9zaW5nIGVsZW1lbnQgYXQgcG9zaXRpb24gJyArIHhtbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBsZXQgZWxlbWVudEJvZHkgPSBuZXcgRWxlbWVudEJvZHkoKTtcbiAgICAgICAgbGV0IGVuZHBvcyA9IENsb3NpbmdFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0Q2xvc2luZ0VsZW1lbnQoZGVwdGgsIHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IsZWxlbWVudEJvZHkpO1xuICAgICAgICBpZihlbmRwb3MgIT0gLTEpe1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnRCb2R5LmdldE5hbWUoKSwgZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCksIHRoaXMuX25hbWVzcGFjZVVyaU1hcCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnRCb2R5LmdldEF0dHJpYnV0ZXMoKS5mb3JFYWNoKGZ1bmN0aW9uKGF0dHJpYnV0ZU5hbWUsYXR0cmlidXRlVmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgICAgICBwYXJlbnQuX2VsZW1lbnQuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsYXR0cmlidXRlVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSx0aGlzKTtcblxuICAgICAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnRm91bmQgc2VsZiBjbG9zaW5nIHRhZyA8JyArIHRoaXMuX2VsZW1lbnQuZ2V0RnVsbE5hbWUoKSArICcvPiBmcm9tICcgKyAgeG1sQ3Vyc29yLmN1cnNvciAgKyAnIHRvICcgKyBlbmRwb3MpO1xuICAgICAgICAgICAgdGhpcy5fZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZHBvcyArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZGV0ZWN0Q2xvc2luZ0VsZW1lbnQoZGVwdGgsIHhtbCwgY3Vyc29yLCBlbGVtZW50Qm9keSl7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIGN1cnNvciA9IGVsZW1lbnRCb2R5LmRldGVjdFBvc2l0aW9ucyhkZXB0aCsxLCB4bWwsIGN1cnNvcik7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJy8+JyxjdXJzb3IpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBYbWxDdXJzb3J7XG5cbiAgICBjb25zdHJ1Y3Rvcih4bWwsIGN1cnNvciwgcGFyZW50RG9tU2NhZmZvbGQpe1xuICAgICAgICB0aGlzLnhtbCA9IHhtbDtcbiAgICAgICAgdGhpcy5jdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgIHRoaXMucGFyZW50RG9tU2NhZmZvbGQgPSBwYXJlbnREb21TY2FmZm9sZDtcbiAgICB9XG5cbiAgICBlb2YoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3Vyc29yID49IHRoaXMueG1sLmxlbmd0aDtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TG9nZ2VyLCBNYXAsIExpc3R9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtFbGVtZW50RGV0ZWN0b3J9IGZyb20gXCIuL2RldGVjdG9ycy9lbGVtZW50RGV0ZWN0b3IuanNcIjtcbmltcG9ydCB7Q2RhdGFEZXRlY3Rvcn0gZnJvbSBcIi4vZGV0ZWN0b3JzL2NkYXRhRGV0ZWN0b3IuanNcIjtcbmltcG9ydCB7Q2xvc2luZ0VsZW1lbnREZXRlY3Rvcn0gZnJvbSBcIi4vZGV0ZWN0b3JzL2Nsb3NpbmdFbGVtZW50RGV0ZWN0b3IuanNcIjtcbmltcG9ydCB7WG1sQ3Vyc29yfSBmcm9tIFwiLi94bWxDdXJzb3IuanNcIjtcblxuZXhwb3J0IGNsYXNzIERvbVNjYWZmb2xke1xuXG4gICAgY29uc3RydWN0b3IobmFtZXNwYWNlVXJpTWFwKXtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlVXJpTWFwID0gbmFtZXNwYWNlVXJpTWFwO1xuICAgICAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY2hpbGREb21TY2FmZm9sZHMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLl9kZXRlY3RvcnMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzLmFkZChuZXcgRWxlbWVudERldGVjdG9yKHRoaXMuX25hbWVzcGFjZVVyaU1hcCkpO1xuICAgICAgICB0aGlzLl9kZXRlY3RvcnMuYWRkKG5ldyBDZGF0YURldGVjdG9yKCkpO1xuICAgICAgICB0aGlzLl9kZXRlY3RvcnMuYWRkKG5ldyBDbG9zaW5nRWxlbWVudERldGVjdG9yKHRoaXMuX25hbWVzcGFjZVVyaU1hcCkpO1xuICAgIH1cblxuICAgIGdldEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50O1xuICAgIH1cblxuICAgIGxvYWQoeG1sLCBjdXJzb3IsIGVsZW1lbnRDcmVhdGVkTGlzdGVuZXIpe1xuICAgICAgICBsZXQgeG1sQ3Vyc29yID0gbmV3IFhtbEN1cnNvcih4bWwsIGN1cnNvciwgbnVsbCk7XG4gICAgICAgIHRoaXMubG9hZERlcHRoKDEsIHhtbEN1cnNvciwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgbG9hZERlcHRoKGRlcHRoLCB4bWxDdXJzb3IsIGVsZW1lbnRDcmVhdGVkTGlzdGVuZXIpe1xuICAgICAgICBMb2dnZXIuc2hvd1Bvcyh4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgTG9nZ2VyLmRlYnVnKGRlcHRoLCAnU3RhcnRpbmcgRG9tU2NhZmZvbGQnKTtcbiAgICAgICAgdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lciA9IGVsZW1lbnRDcmVhdGVkTGlzdGVuZXI7XG5cbiAgICAgICAgaWYoeG1sQ3Vyc29yLmVvZigpKXtcbiAgICAgICAgICAgIExvZ2dlci5kZWJ1ZyhkZXB0aCwgJ1JlYWNoZWQgZW9mLiBFeGl0aW5nJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZWxlbWVudERldGVjdG9yID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZGV0ZWN0b3JzLmZvckVhY2goZnVuY3Rpb24oY3VyRWxlbWVudERldGVjdG9yLHBhcmVudCl7XG4gICAgICAgICAgICBMb2dnZXIuZGVidWcoZGVwdGgsICdTdGFydGluZyAnICsgY3VyRWxlbWVudERldGVjdG9yLmdldFR5cGUoKSk7XG4gICAgICAgICAgICBjdXJFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0KGRlcHRoICsgMSx4bWxDdXJzb3IpO1xuICAgICAgICAgICAgaWYoIWN1ckVsZW1lbnREZXRlY3Rvci5pc0ZvdW5kKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudERldGVjdG9yID0gY3VyRWxlbWVudERldGVjdG9yO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgIGlmKGVsZW1lbnREZXRlY3RvciA9PT0gbnVsbCl7XG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yKys7XG4gICAgICAgICAgICBMb2dnZXIud2FybignV0FSTjogTm8gaGFuZGxlciB3YXMgZm91bmQgc2VhcmNoaW5nIGZyb20gcG9zaXRpb246ICcgKyB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2VsZW1lbnQgPSBlbGVtZW50RGV0ZWN0b3IuY3JlYXRlRWxlbWVudCgpO1xuXG4gICAgICAgIGlmKGVsZW1lbnREZXRlY3RvciBpbnN0YW5jZW9mIEVsZW1lbnREZXRlY3RvciAmJiBlbGVtZW50RGV0ZWN0b3IuaGFzQ2hpbGRyZW4oKSkge1xuICAgICAgICAgICAgbGV0IG5hbWVzcGFjZVVyaU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIG5hbWVzcGFjZVVyaU1hcC5hZGRBbGwodGhpcy5fbmFtZXNwYWNlVXJpTWFwKTtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24obmFtZSxjdXJBdHRyaWJ1dGUscGFyZW50KXtcbiAgICAgICAgICAgICAgICBpZihcInhtbG5zXCIgPT09IGN1ckF0dHJpYnV0ZS5nZXROYW1lc3BhY2UoKSl7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZVVyaU1hcC5zZXQoY3VyQXR0cmlidXRlLmdldE5hbWUoKSxjdXJBdHRyaWJ1dGUuZ2V0VmFsdWUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgICAgIHdoaWxlKCFlbGVtZW50RGV0ZWN0b3Iuc3RvcChkZXB0aCArIDEpICYmIHhtbEN1cnNvci5jdXJzb3IgPCB4bWxDdXJzb3IueG1sLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgbGV0IHByZXZpb3VzUGFyZW50U2NhZmZvbGQgPSB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQ7XG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkU2NhZmZvbGQgPSBuZXcgRG9tU2NhZmZvbGQobmFtZXNwYWNlVXJpTWFwKTtcbiAgICAgICAgICAgICAgICB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQgPSBjaGlsZFNjYWZmb2xkO1xuICAgICAgICAgICAgICAgIGNoaWxkU2NhZmZvbGQubG9hZERlcHRoKGRlcHRoKzEsIHhtbEN1cnNvciwgdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2hpbGREb21TY2FmZm9sZHMuYWRkKGNoaWxkU2NhZmZvbGQpO1xuICAgICAgICAgICAgICAgIHhtbEN1cnNvci5wYXJlbnREb21TY2FmZm9sZCA9IHByZXZpb3VzUGFyZW50U2NhZmZvbGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgTG9nZ2VyLnNob3dQb3MoeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcik7XG4gICAgfVxuXG4gICAgZ2V0VHJlZShwYXJlbnROb3RpZnlSZXN1bHQpe1xuICAgICAgICBpZih0aGlzLl9lbGVtZW50ID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vdGlmeVJlc3VsdCA9IHRoaXMubm90aWZ5RWxlbWVudENyZWF0ZWRMaXN0ZW5lcih0aGlzLl9lbGVtZW50LHBhcmVudE5vdGlmeVJlc3VsdCk7XG5cbiAgICAgICAgdGhpcy5fY2hpbGREb21TY2FmZm9sZHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZERvbVNjYWZmb2xkLHBhcmVudCkge1xuICAgICAgICAgICAgbGV0IGNoaWxkRWxlbWVudCA9IGNoaWxkRG9tU2NhZmZvbGQuZ2V0VHJlZShub3RpZnlSZXN1bHQpO1xuICAgICAgICAgICAgaWYoY2hpbGRFbGVtZW50ICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICBwYXJlbnQuX2VsZW1lbnQuZ2V0Q2hpbGRFbGVtZW50cygpLmFkZChjaGlsZEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XG4gICAgfVxuXG4gICAgbm90aWZ5RWxlbWVudENyZWF0ZWRMaXN0ZW5lcihlbGVtZW50LCBwYXJlbnROb3RpZnlSZXN1bHQpIHtcbiAgICAgICAgaWYodGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lciAhPT0gbnVsbCAmJiB0aGlzLl9lbGVtZW50Q3JlYXRlZExpc3RlbmVyICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIuZWxlbWVudENyZWF0ZWQoZWxlbWVudCwgcGFyZW50Tm90aWZ5UmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtEb21TY2FmZm9sZH0gZnJvbSBcIi4vcGFyc2VyL2RvbVNjYWZmb2xkLmpzXCI7XG5pbXBvcnQge01hcH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBEb21UcmVle1xuXG4gICAgY29uc3RydWN0b3IoeG1sLCBlbGVtZW50Q3JlYXRlZExpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2VsZW1lbnRDcmVhdGVkTGlzdGVuZXIgPSBlbGVtZW50Q3JlYXRlZExpc3RlbmVyO1xuICAgICAgICB0aGlzLl94bWwgPSB4bWw7XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXRSb290RWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50O1xuICAgIH1cblxuICAgIHNldFJvb3RFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQgPSBlbGVtZW50O1xuICAgIH1cblxuICAgIGxvYWQoKXtcbiAgICAgICAgbGV0IGRvbVNjYWZmb2xkID0gbmV3IERvbVNjYWZmb2xkKG5ldyBNYXAoKSk7XG4gICAgICAgIGRvbVNjYWZmb2xkLmxvYWQodGhpcy5feG1sLDAsdGhpcy5fZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gZG9tU2NhZmZvbGQuZ2V0VHJlZSgpO1xuICAgIH1cblxuICAgIGR1bXAoKXtcbiAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQuZHVtcCgpO1xuICAgIH1cblxuICAgIHJlYWQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50LnJlYWQoKTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmNsYXNzIFhtbFBhcnNlckV4Y2VwdGlvbiB7XG5cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSl7XG4gICAgfVxuXG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFFQSxNQUFhLFNBQVM7O0lBRWxCLE9BQU8sSUFBSSxD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