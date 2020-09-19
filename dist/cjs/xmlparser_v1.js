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
}

/* jshint esversion: 6 */

const LOG = new coreutil_v1.Logger("ElementBody");

class ElementBody{

    constructor(){
        this.name = null;
        this.namespace = null;
        this.attributes = new coreutil_v1.Map();
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

    get fullName() {
        if(this.namespace === null){
            return this.name;
        }

        return this.namespace + ':' + this.name;
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
            LOG$2.info(spacer + '<' + this.fullName + this.readAttributes() + '/>');
            return;
        }
        LOG$2.info(spacer + '<' + this.fullName + this.readAttributes() + '>');
        this.childElements.forEach(function(childElement){
            childElement.dumpLevel(level+1);
            return true;
        });
        LOG$2.info(spacer + '</' + this.fullName + '>');
    }

    read(){
        let result = '';
        if(this.selfClosing){
            result = result + '<' + this.fullName + this.readAttributes() + '/>';
            return result;
        }
        result = result + '<' + this.fullName + this.readAttributes() + '>';
        this.childElements.forEach(function(childElement){
            result = result + childElement.read();
            return true;
        });
        result = result + '</' + this.fullName + '>';
        return result;
    }

    readAttributes(){
        let result = '';
        this.attributes.forEach(function (key,attribute,parent) {
            let fullname = attribute.name;
            if(attribute.namespace !== null && attribute.namespace !== undefined) {
                fullname = attribute.namespace + ":" + attribute.name;
            }
            result = result + ' ' + fullname;
            if(attribute.value !== null){
                result = result + '="' + attribute.value + '"';
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
            if(elementBody.namespace !== null && elementBody.namespace !== undefined){
                namespaceUri = this.namespaceUriMap.get(elementBody.namespace);
            }

            this.element = new XmlElement(elementBody.name, elementBody.namespace, namespaceUri, false);

            elementBody.attributes.forEach(function(attributeName,attributeValue,parent){
                parent.element.attributes.set(attributeName,attributeValue);
                return true;
            },this);

            LOG$3.debug(depth, 'Found opening tag <' + this.element.fullName + '> from ' +  xmlCursor.cursor  + ' to ' + endpos);
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

            if(this.element.fullName != closingTagName){
                LOG$3.error('ERR: Mismatch between opening tag <' + this.element.fullName + '> and closing tag </' + closingTagName + '> When exiting to parent elemnt');
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

    isFound() {
        return this.found;
    }

    detect(depth, xmlCursor) {
        LOG$5.debug(depth, 'Looking for self closing element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ClosingElementDetector.detectClosingElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1){
            this.element = new XmlElement(elementBody.name, elementBody.namespace, this.namespaceUriMap, true);

            elementBody.attributes.forEach(function(attributeName,attributeValue,parent){
                parent.element.setAttribute(attributeName,attributeValue);
                return true;
            },this);

            LOG$5.debug(depth, 'Found self closing tag <' + this.element.fullName + '/> from ' +  xmlCursor.cursor  + ' to ' + endpos);
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
            LOG$6.debug(depth, 'Starting ' + curElementDetector.type);
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
            this.element.attributes.forEach(function(name,curAttribute,parent){
                if("xmlns" === curAttribute.namespace){
                    namespaceUriMap.set(curAttribute.name,curAttribute.value);
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
                parent.element.childElements.add(childElement);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1scGFyc2VyX3YxLmpzIiwic291cmNlcyI6WyIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3JlYWRBaGVhZC5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxBdHRyaWJ1dGUuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9lbGVtZW50Qm9keS5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxDZGF0YS5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxFbGVtZW50LmpzIiwiLi4vLi4vc3JjL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yLmpzIiwiLi4vLi4vc3JjL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvY2RhdGFEZXRlY3Rvci5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvZGV0ZWN0b3JzL2Nsb3NpbmdFbGVtZW50RGV0ZWN0b3IuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3htbEN1cnNvci5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvZG9tU2NhZmZvbGQuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvZG9tVHJlZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBSZWFkQWhlYWR7XG5cbiAgICBzdGF0aWMgcmVhZCh2YWx1ZSwgbWF0Y2hlciwgY3Vyc29yLCBpZ25vcmVXaGl0ZXNwYWNlID0gZmFsc2Upe1xuICAgICAgICBsZXQgaW50ZXJuYWxDdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBtYXRjaGVyLmxlbmd0aCAmJiBpIDwgdmFsdWUubGVuZ3RoIDsgaSsrKXtcbiAgICAgICAgICAgIHdoaWxlKGlnbm9yZVdoaXRlc3BhY2UgJiYgdmFsdWUuY2hhckF0KGludGVybmFsQ3Vyc29yKSA9PSAnICcpe1xuICAgICAgICAgICAgICAgIGludGVybmFsQ3Vyc29yKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih2YWx1ZS5jaGFyQXQoaW50ZXJuYWxDdXJzb3IpID09IG1hdGNoZXIuY2hhckF0KGkpKXtcbiAgICAgICAgICAgICAgICBpbnRlcm5hbEN1cnNvcisrO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVybmFsQ3Vyc29yIC0gMTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBYbWxBdHRyaWJ1dGUge1xuXG4gIGNvbnN0cnVjdG9yKG5hbWUsbmFtZXNwYWNlLHZhbHVlKSB7XG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXIsIE1hcCwgU3RyaW5nVXRpbHN9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtSZWFkQWhlYWR9IGZyb20gXCIuLi9yZWFkQWhlYWQuanNcIjtcbmltcG9ydCB7WG1sQXR0cmlidXRlfSBmcm9tIFwiLi4vLi4veG1sQXR0cmlidXRlLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJFbGVtZW50Qm9keVwiKTtcblxuZXhwb3J0IGNsYXNzIEVsZW1lbnRCb2R5e1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbnVsbDtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSBudWxsO1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZGV0ZWN0UG9zaXRpb25zKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCBuYW1lU3RhcnRwb3MgPSBjdXJzb3I7XG4gICAgICAgIGxldCBuYW1lRW5kcG9zID0gbnVsbDtcbiAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGN1cnNvciArKztcbiAgICAgICAgfVxuICAgICAgICBpZih4bWwuY2hhckF0KGN1cnNvcikgPT0gJzonKXtcbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIG5hbWVzcGFjZScpO1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbmFtZUVuZHBvcyA9IGN1cnNvci0xO1xuICAgICAgICB0aGlzLm5hbWUgPSB4bWwuc3Vic3RyaW5nKG5hbWVTdGFydHBvcywgbmFtZUVuZHBvcysxKTtcbiAgICAgICAgaWYodGhpcy5uYW1lLmluZGV4T2YoXCI6XCIpID4gLTEpe1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZXNwYWNlID0gdGhpcy5uYW1lLnNwbGl0KFwiOlwiKVswXTtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSB0aGlzLm5hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciA9IHRoaXMuZGV0ZWN0QXR0cmlidXRlcyhkZXB0aCx4bWwsY3Vyc29yKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG5cbiAgICBkZXRlY3RBdHRyaWJ1dGVzKGRlcHRoLHhtbCxjdXJzb3Ipe1xuICAgICAgICBsZXQgZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvciA9IG51bGw7XG4gICAgICAgIHdoaWxlKChkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0U3RhcnRBdHRyaWJ1dGUoZGVwdGgsIHhtbCwgY3Vyc29yKSkgIT0gLTEpe1xuICAgICAgICAgICAgY3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGRldGVjdGVkQXR0ck5hbWVDdXJzb3IpO1xuICAgICAgICAgICAgbGV0IG5hbWVzcGFjZSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IHhtbC5zdWJzdHJpbmcoZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvcixjdXJzb3IrMSk7XG5cbiAgICAgICAgICAgIGlmKG5hbWUuaW5kZXhPZihcIjpcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlID0gbmFtZS5zcGxpdChcIjpcIilbMF07XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICAgICAgfSAgXG5cbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIGF0dHJpYnV0ZSBmcm9tICcgKyBkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yICsgJyAgdG8gJyArIGN1cnNvcik7XG4gICAgICAgICAgICBjdXJzb3IgPSB0aGlzLmRldGVjdFZhbHVlKG5hbWUsbmFtZXNwYWNlLGRlcHRoLCB4bWwsIGN1cnNvcisxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuXG4gICAgZGV0ZWN0TmV4dFN0YXJ0QXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSAnICcgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICBpZihTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSB8fCB4bWwuY2hhckF0KGN1cnNvcikgPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpIHx8IHhtbC5jaGFyQXQoY3Vyc29yKSA9PT0gXCItXCIpe1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICB9XG4gICAgICAgIGlmKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSBcIjpcIil7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB3aGlsZShTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSB8fCB4bWwuY2hhckF0KGN1cnNvcikgPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvciAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3RWYWx1ZShuYW1lLCBuYW1lc3BhY2UsIGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCB2YWx1ZVBvcyA9IGN1cnNvcjtcbiAgICAgICAgbGV0IGZ1bGxuYW1lID0gbmFtZTtcbiAgICAgICAgaWYobmFtZXNwYWNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBmdWxsbmFtZSA9IG5hbWVzcGFjZSArIFwiOlwiICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZigodmFsdWVQb3MgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz1cIicsdmFsdWVQb3MsdHJ1ZSkpID09IC0xKXtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5zZXQoZnVsbG5hbWUsbmV3IFhtbEF0dHJpYnV0ZShuYW1lLG5hbWVzcGFjZSxudWxsKSk7XG4gICAgICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlUG9zKys7XG4gICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ1Bvc3NpYmxlIGF0dHJpYnV0ZSB2YWx1ZSBzdGFydCBhdCAnICsgdmFsdWVQb3MpO1xuICAgICAgICBsZXQgdmFsdWVTdGFydFBvcyA9IHZhbHVlUG9zO1xuICAgICAgICB3aGlsZSh0aGlzLmlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCB2YWx1ZVBvcykpe1xuICAgICAgICAgICAgdmFsdWVQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBpZih2YWx1ZVBvcyA9PSBjdXJzb3Ipe1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLnNldChmdWxsbmFtZSwgbmV3IFhtbEF0dHJpYnV0ZShuYW1lLG5hbWVzcGFjZSwnJykpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5zZXQoZnVsbG5hbWUsIG5ldyBYbWxBdHRyaWJ1dGUobmFtZSxuYW1lc3BhY2UseG1sLnN1YnN0cmluZyh2YWx1ZVN0YXJ0UG9zLHZhbHVlUG9zKSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgTE9HLmRlYnVnKGRlcHRoLCAnRm91bmQgYXR0cmlidXRlIGNvbnRlbnQgZW5kaW5nIGF0ICcgKyAodmFsdWVQb3MtMSkpO1xuXG4gICAgICAgIGlmKCh2YWx1ZVBvcyA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnXCInLHZhbHVlUG9zLHRydWUpKSAhPSAtMSl7XG4gICAgICAgICAgICB2YWx1ZVBvcysrO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIExPRy5lcnJvcignTWlzc2luZyBlbmQgcXVvdGVzIG9uIGF0dHJpYnV0ZSBhdCBwb3NpdGlvbiAnICsgdmFsdWVQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZVBvcztcbiAgICB9XG5cblxuICAgIGlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCdcIicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsX3YxXCJcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlhtbENkYXRhXCIpO1xuXG5leHBvcnQgY2xhc3MgWG1sQ2RhdGF7XG5cblx0Y29uc3RydWN0b3IodmFsdWUpe1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZHVtcCgpe1xuICAgICAgICB0aGlzLmR1bXBMZXZlbCgwKTtcbiAgICB9XG5cbiAgICBkdW1wTGV2ZWwobGV2ZWwpe1xuICAgICAgICBsZXQgc3BhY2VyID0gJzonO1xuICAgICAgICBmb3IobGV0IHNwYWNlID0gMCA7IHNwYWNlIDwgbGV2ZWwqMiA7IHNwYWNlICsrKXtcbiAgICAgICAgICAgIHNwYWNlciA9IHNwYWNlciArICcgJztcbiAgICAgICAgfVxuXG4gICAgICAgIExPRy5pbmZvKHNwYWNlciArIHRoaXMudmFsdWUpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVhZCgpe1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TG9nZ2VyLCBMaXN0LCBNYXB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtYbWxDZGF0YX0gZnJvbSBcIi4veG1sQ2RhdGEuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlhtbEVsZW1lbnRcIik7XG5cbmV4cG9ydCBjbGFzcyBYbWxFbGVtZW50e1xuXG5cdGNvbnN0cnVjdG9yKG5hbWUsIG5hbWVzcGFjZSwgbmFtZXNwYWNlVXJpLCBzZWxmQ2xvc2luZyl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgICAgICB0aGlzLnNlbGZDbG9zaW5nID0gc2VsZkNsb3Npbmc7XG4gICAgICAgIHRoaXMuY2hpbGRFbGVtZW50cyA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VVcmkgPSBuYW1lc3BhY2VVcmk7XG4gICAgfVxuXG4gICAgZ2V0IGZ1bGxOYW1lKCkge1xuICAgICAgICBpZih0aGlzLm5hbWVzcGFjZSA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlICsgJzonICsgdGhpcy5uYW1lO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZShrZXksdmFsdWUpIHtcblx0XHR0aGlzLmF0dHJpYnV0ZXMuc2V0KGtleSx2YWx1ZSk7XG5cdH1cblxuXHRnZXRBdHRyaWJ1dGUoa2V5KSB7XG5cdFx0cmV0dXJuIHRoaXMuYXR0cmlidXRlcy5nZXQoa2V5KTtcblx0fVxuXG4gICAgY29udGFpbnNBdHRyaWJ1dGUoa2V5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5jb250YWlucyhrZXkpO1xuICAgIH1cblxuXHRjbGVhckF0dHJpYnV0ZSgpe1xuXHRcdHRoaXMuYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcblx0fVxuXG4gICAgc2V0VGV4dCh0ZXh0KXtcbiAgICAgICAgdGhpcy5jaGlsZEVsZW1lbnRzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5hZGRUZXh0KHRleHQpO1xuICAgIH1cblxuICAgIGFkZFRleHQodGV4dCl7XG4gICAgICAgIGxldCB0ZXh0RWxlbWVudCA9IG5ldyBYbWxDZGF0YSh0ZXh0KTtcbiAgICAgICAgdGhpcy5jaGlsZEVsZW1lbnRzLmFkZCh0ZXh0RWxlbWVudCk7XG4gICAgfVxuXG4gICAgZHVtcCgpe1xuICAgICAgICB0aGlzLmR1bXBMZXZlbCgwKTtcbiAgICB9XG5cbiAgICBkdW1wTGV2ZWwobGV2ZWwpe1xuICAgICAgICBsZXQgc3BhY2VyID0gJzonO1xuICAgICAgICBmb3IobGV0IHNwYWNlID0gMCA7IHNwYWNlIDwgbGV2ZWwqMiA7IHNwYWNlICsrKXtcbiAgICAgICAgICAgIHNwYWNlciA9IHNwYWNlciArICcgJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHRoaXMuc2VsZkNsb3Npbmcpe1xuICAgICAgICAgICAgTE9HLmluZm8oc3BhY2VyICsgJzwnICsgdGhpcy5mdWxsTmFtZSArIHRoaXMucmVhZEF0dHJpYnV0ZXMoKSArICcvPicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIExPRy5pbmZvKHNwYWNlciArICc8JyArIHRoaXMuZnVsbE5hbWUgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnPicpO1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpe1xuICAgICAgICAgICAgY2hpbGRFbGVtZW50LmR1bXBMZXZlbChsZXZlbCsxKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgTE9HLmluZm8oc3BhY2VyICsgJzwvJyArIHRoaXMuZnVsbE5hbWUgKyAnPicpO1xuICAgIH1cblxuICAgIHJlYWQoKXtcbiAgICAgICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgICAgICBpZih0aGlzLnNlbGZDbG9zaW5nKXtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICc8JyArIHRoaXMuZnVsbE5hbWUgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnLz4nO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSByZXN1bHQgKyAnPCcgKyB0aGlzLmZ1bGxOYW1lICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJz4nO1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpe1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgY2hpbGRFbGVtZW50LnJlYWQoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwvJyArIHRoaXMuZnVsbE5hbWUgKyAnPic7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmVhZEF0dHJpYnV0ZXMoKXtcbiAgICAgICAgbGV0IHJlc3VsdCA9ICcnO1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5LGF0dHJpYnV0ZSxwYXJlbnQpIHtcbiAgICAgICAgICAgIGxldCBmdWxsbmFtZSA9IGF0dHJpYnV0ZS5uYW1lO1xuICAgICAgICAgICAgaWYoYXR0cmlidXRlLm5hbWVzcGFjZSAhPT0gbnVsbCAmJiBhdHRyaWJ1dGUubmFtZXNwYWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBmdWxsbmFtZSA9IGF0dHJpYnV0ZS5uYW1lc3BhY2UgKyBcIjpcIiArIGF0dHJpYnV0ZS5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJyAnICsgZnVsbG5hbWU7XG4gICAgICAgICAgICBpZihhdHRyaWJ1dGUudmFsdWUgIT09IG51bGwpe1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArICc9XCInICsgYXR0cmlidXRlLnZhbHVlICsgJ1wiJztcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZC5qc1wiO1xuaW1wb3J0IHtFbGVtZW50Qm9keX0gZnJvbSBcIi4vZWxlbWVudEJvZHkuanNcIjtcbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcIi4uLy4uL3htbEVsZW1lbnQuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkVsZW1lbnREZXRlY3RvclwiKTtcblxuZXhwb3J0IGNsYXNzIEVsZW1lbnREZXRlY3RvcntcblxuICAgIGNvbnN0cnVjdG9yKG5hbWVzcGFjZVVyaU1hcCl7XG4gICAgICAgIHRoaXMudHlwZSA9ICdFbGVtZW50RGV0ZWN0b3InO1xuICAgICAgICB0aGlzLm5hbWVzcGFjZVVyaU1hcCA9IG5hbWVzcGFjZVVyaU1hcDtcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZvdW5kID0gZmFsc2U7XG4gICAgICAgIHRoaXMueG1sQ3Vyc29yID0gbnVsbDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIGlzRm91bmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZvdW5kO1xuICAgIH1cblxuICAgIGhhc0NoaWxkcmVuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbjtcbiAgICB9XG5cbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcil7XG4gICAgICAgIHRoaXMueG1sQ3Vyc29yID0geG1sQ3Vyc29yO1xuICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdMb29raW5nIGZvciBvcGVuaW5nIGVsZW1lbnQgYXQgcG9zaXRpb24gJyArIHhtbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBsZXQgZWxlbWVudEJvZHkgPSBuZXcgRWxlbWVudEJvZHkoKTtcbiAgICAgICAgbGV0IGVuZHBvcyA9IEVsZW1lbnREZXRlY3Rvci5kZXRlY3RPcGVuRWxlbWVudChkZXB0aCwgeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcixlbGVtZW50Qm9keSk7XG4gICAgICAgIGlmKGVuZHBvcyAhPSAtMSkge1xuXG4gICAgICAgICAgICBsZXQgbmFtZXNwYWNlVXJpID0gbnVsbDtcbiAgICAgICAgICAgIGlmKGVsZW1lbnRCb2R5Lm5hbWVzcGFjZSAhPT0gbnVsbCAmJiBlbGVtZW50Qm9keS5uYW1lc3BhY2UgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlVXJpID0gdGhpcy5uYW1lc3BhY2VVcmlNYXAuZ2V0KGVsZW1lbnRCb2R5Lm5hbWVzcGFjZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnRCb2R5Lm5hbWUsIGVsZW1lbnRCb2R5Lm5hbWVzcGFjZSwgbmFtZXNwYWNlVXJpLCBmYWxzZSk7XG5cbiAgICAgICAgICAgIGVsZW1lbnRCb2R5LmF0dHJpYnV0ZXMuZm9yRWFjaChmdW5jdGlvbihhdHRyaWJ1dGVOYW1lLGF0dHJpYnV0ZVZhbHVlLHBhcmVudCl7XG4gICAgICAgICAgICAgICAgcGFyZW50LmVsZW1lbnQuYXR0cmlidXRlcy5zZXQoYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdGb3VuZCBvcGVuaW5nIHRhZyA8JyArIHRoaXMuZWxlbWVudC5mdWxsTmFtZSArICc+IGZyb20gJyArICB4bWxDdXJzb3IuY3Vyc29yICArICcgdG8gJyArIGVuZHBvcyk7XG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yID0gZW5kcG9zICsgMTtcblxuICAgICAgICAgICAgaWYoIXRoaXMuc3RvcChkZXB0aCkpe1xuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mb3VuZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKGRlcHRoKXtcbiAgICAgICAgTE9HLmRlYnVnKGRlcHRoLCAnTG9va2luZyBmb3IgY2xvc2luZyBlbGVtZW50IGF0IHBvc2l0aW9uICcgKyB0aGlzLnhtbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBsZXQgY2xvc2luZ0VsZW1lbnQgPSBFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0RW5kRWxlbWVudChkZXB0aCwgdGhpcy54bWxDdXJzb3IueG1sLCB0aGlzLnhtbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBpZihjbG9zaW5nRWxlbWVudCAhPSAtMSl7XG4gICAgICAgICAgICBsZXQgY2xvc2luZ1RhZ05hbWUgPSAgdGhpcy54bWxDdXJzb3IueG1sLnN1YnN0cmluZyh0aGlzLnhtbEN1cnNvci5jdXJzb3IrMixjbG9zaW5nRWxlbWVudCk7XG4gICAgICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdGb3VuZCBjbG9zaW5nIHRhZyA8LycgKyBjbG9zaW5nVGFnTmFtZSArICc+IGZyb20gJyArICB0aGlzLnhtbEN1cnNvci5jdXJzb3IgICsgJyB0byAnICsgY2xvc2luZ0VsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZih0aGlzLmVsZW1lbnQuZnVsbE5hbWUgIT0gY2xvc2luZ1RhZ05hbWUpe1xuICAgICAgICAgICAgICAgIExPRy5lcnJvcignRVJSOiBNaXNtYXRjaCBiZXR3ZWVuIG9wZW5pbmcgdGFnIDwnICsgdGhpcy5lbGVtZW50LmZ1bGxOYW1lICsgJz4gYW5kIGNsb3NpbmcgdGFnIDwvJyArIGNsb3NpbmdUYWdOYW1lICsgJz4gV2hlbiBleGl0aW5nIHRvIHBhcmVudCBlbGVtbnQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMueG1sQ3Vyc29yLmN1cnNvciA9IGNsb3NpbmdFbGVtZW50ICsxO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlY3RPcGVuRWxlbWVudChkZXB0aCwgeG1sLCBjdXJzb3IsIGVsZW1lbnRCb2R5KSB7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIGN1cnNvciA9IGVsZW1lbnRCb2R5LmRldGVjdFBvc2l0aW9ucyhkZXB0aCsxLCB4bWwsIGN1cnNvcik7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz4nLGN1cnNvciwgdHJ1ZSkpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlY3RFbmRFbGVtZW50KGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJzwvJyxjdXJzb3IpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICBjdXJzb3IgPSBuZXcgRWxlbWVudEJvZHkoKS5kZXRlY3RQb3NpdGlvbnMoZGVwdGgrMSwgeG1sLCBjdXJzb3IpO1xuICAgICAgICBpZigoY3Vyc29yID0gUmVhZEFoZWFkLnJlYWQoeG1sLCc+JyxjdXJzb3IsIHRydWUpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cbmltcG9ydCB7TG9nZ2VyfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7WG1sQ2RhdGF9IGZyb20gXCIuLi8uLi94bWxDZGF0YS5qc1wiO1xuaW1wb3J0IHtSZWFkQWhlYWR9IGZyb20gXCIuLi9yZWFkQWhlYWQuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNkYXRhRGV0ZWN0b3JcIik7XG5cbmV4cG9ydCBjbGFzcyBDZGF0YURldGVjdG9ye1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgdGhpcy50eXBlID0gJ0NkYXRhRGV0ZWN0b3InO1xuICAgICAgICB0aGlzLnZhbHVlID0gbnVsbDtcbiAgICAgICAgdGhpcy5mb3VuZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlzRm91bmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZvdW5kO1xuICAgIH1cblxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgWG1sQ2RhdGEodGhpcy52YWx1ZSk7XG4gICAgfVxuXG4gICAgZGV0ZWN0KGRlcHRoLCB4bWxDdXJzb3Ipe1xuICAgICAgICB0aGlzLmZvdW5kID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmFsdWUgPSBudWxsO1xuXG4gICAgICAgIGxldCBlbmRQb3MgPSB0aGlzLmRldGVjdENvbnRlbnQoZGVwdGgsIHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IsIHhtbEN1cnNvci5wYXJlbnREb21TY2FmZm9sZCk7XG4gICAgICAgIGlmKGVuZFBvcyAhPSAtMSkge1xuICAgICAgICAgICAgdGhpcy5mb3VuZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmhhc0NoaWxkcmVuID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0geG1sQ3Vyc29yLnhtbC5zdWJzdHJpbmcoeG1sQ3Vyc29yLmN1cnNvcixlbmRQb3MpO1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZFBvcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRldGVjdENvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yLCBwYXJlbnREb21TY2FmZm9sZCkge1xuICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdDZGF0YSBzdGFydCBhdCAnICsgY3Vyc29yKTtcbiAgICAgICAgbGV0IGludGVybmFsU3RhcnRQb3MgPSBjdXJzb3I7XG4gICAgICAgIGlmKCFDZGF0YURldGVjdG9yLmlzQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3IpKXtcbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ05vIENkYXRhIGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUoQ2RhdGFEZXRlY3Rvci5pc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKSAmJiBjdXJzb3IgPCB4bWwubGVuZ3RoKXtcbiAgICAgICAgICAgIGN1cnNvciArKztcbiAgICAgICAgfVxuICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdDZGF0YSBlbmQgYXQgJyArIChjdXJzb3ItMSkpO1xuICAgICAgICBpZihwYXJlbnREb21TY2FmZm9sZCA9PT0gbnVsbCl7XG4gICAgICAgICAgICBMT0cuZXJyb3IoJ0VSUjogQ29udGVudCBub3QgYWxsb3dlZCBvbiByb290IGxldmVsIGluIHhtbCBkb2N1bWVudCcpO1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0NkYXRhIGZvdW5kIHZhbHVlIGlzICcgKyB4bWwuc3Vic3RyaW5nKGludGVybmFsU3RhcnRQb3MsY3Vyc29yKSk7XG4gICAgICAgIHJldHVybiBjdXJzb3I7XG4gICAgfVxuXG4gICAgc3RhdGljIGlzQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCIuLi8uLi94bWxFbGVtZW50LmpzXCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZC5qc1wiO1xuaW1wb3J0IHtFbGVtZW50Qm9keX0gZnJvbSBcIi4vZWxlbWVudEJvZHkuanNcIjtcbmltcG9ydCB7WG1sQXR0cmlidXRlfSBmcm9tIFwiLi4vLi4veG1sQXR0cmlidXRlLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDbG9zaW5nRWxlbWVudERldGVjdG9yXCIpO1xuXG5leHBvcnQgY2xhc3MgQ2xvc2luZ0VsZW1lbnREZXRlY3RvcntcblxuICAgIGNvbnN0cnVjdG9yKG5hbWVzcGFjZVVyaU1hcCl7XG4gICAgICAgIHRoaXMudHlwZSA9ICdDbG9zaW5nRWxlbWVudERldGVjdG9yJztcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VVcmlNYXAgPSBuYW1lc3BhY2VVcmlNYXA7XG4gICAgICAgIHRoaXMuZm91bmQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIGlzRm91bmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZvdW5kO1xuICAgIH1cblxuICAgIGRldGVjdChkZXB0aCwgeG1sQ3Vyc29yKSB7XG4gICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0xvb2tpbmcgZm9yIHNlbGYgY2xvc2luZyBlbGVtZW50IGF0IHBvc2l0aW9uICcgKyB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgbGV0IGVsZW1lbnRCb2R5ID0gbmV3IEVsZW1lbnRCb2R5KCk7XG4gICAgICAgIGxldCBlbmRwb3MgPSBDbG9zaW5nRWxlbWVudERldGVjdG9yLmRldGVjdENsb3NpbmdFbGVtZW50KGRlcHRoLCB4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yLGVsZW1lbnRCb2R5KTtcbiAgICAgICAgaWYoZW5kcG9zICE9IC0xKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnRCb2R5Lm5hbWUsIGVsZW1lbnRCb2R5Lm5hbWVzcGFjZSwgdGhpcy5uYW1lc3BhY2VVcmlNYXAsIHRydWUpO1xuXG4gICAgICAgICAgICBlbGVtZW50Qm9keS5hdHRyaWJ1dGVzLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgICAgIHBhcmVudC5lbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLGF0dHJpYnV0ZVZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIHNlbGYgY2xvc2luZyB0YWcgPCcgKyB0aGlzLmVsZW1lbnQuZnVsbE5hbWUgKyAnLz4gZnJvbSAnICsgIHhtbEN1cnNvci5jdXJzb3IgICsgJyB0byAnICsgZW5kcG9zKTtcbiAgICAgICAgICAgIHRoaXMuZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZHBvcyArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZGV0ZWN0Q2xvc2luZ0VsZW1lbnQoZGVwdGgsIHhtbCwgY3Vyc29yLCBlbGVtZW50Qm9keSl7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIGN1cnNvciA9IGVsZW1lbnRCb2R5LmRldGVjdFBvc2l0aW9ucyhkZXB0aCsxLCB4bWwsIGN1cnNvcik7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJy8+JyxjdXJzb3IpKSA9PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBYbWxDdXJzb3J7XG5cbiAgICBjb25zdHJ1Y3Rvcih4bWwsIGN1cnNvciwgcGFyZW50RG9tU2NhZmZvbGQpe1xuICAgICAgICB0aGlzLnhtbCA9IHhtbDtcbiAgICAgICAgdGhpcy5jdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgIHRoaXMucGFyZW50RG9tU2NhZmZvbGQgPSBwYXJlbnREb21TY2FmZm9sZDtcbiAgICB9XG5cbiAgICBlb2YoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3Vyc29yID49IHRoaXMueG1sLmxlbmd0aDtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TG9nZ2VyLCBNYXAsIExpc3R9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtFbGVtZW50RGV0ZWN0b3J9IGZyb20gXCIuL2RldGVjdG9ycy9lbGVtZW50RGV0ZWN0b3IuanNcIjtcbmltcG9ydCB7Q2RhdGFEZXRlY3Rvcn0gZnJvbSBcIi4vZGV0ZWN0b3JzL2NkYXRhRGV0ZWN0b3IuanNcIjtcbmltcG9ydCB7Q2xvc2luZ0VsZW1lbnREZXRlY3Rvcn0gZnJvbSBcIi4vZGV0ZWN0b3JzL2Nsb3NpbmdFbGVtZW50RGV0ZWN0b3IuanNcIjtcbmltcG9ydCB7WG1sQ3Vyc29yfSBmcm9tIFwiLi94bWxDdXJzb3IuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkRvbVNjYWZmb2xkXCIpO1xuXG5leHBvcnQgY2xhc3MgRG9tU2NhZmZvbGR7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lc3BhY2VVcmlNYXApe1xuICAgICAgICB0aGlzLm5hbWVzcGFjZVVyaU1hcCA9IG5hbWVzcGFjZVVyaU1hcDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5jaGlsZERvbVNjYWZmb2xkcyA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMuZGV0ZWN0b3JzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5lbGVtZW50Q3JlYXRlZExpc3RlbmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5kZXRlY3RvcnMuYWRkKG5ldyBFbGVtZW50RGV0ZWN0b3IodGhpcy5uYW1lc3BhY2VVcmlNYXApKTtcbiAgICAgICAgdGhpcy5kZXRlY3RvcnMuYWRkKG5ldyBDZGF0YURldGVjdG9yKCkpO1xuICAgICAgICB0aGlzLmRldGVjdG9ycy5hZGQobmV3IENsb3NpbmdFbGVtZW50RGV0ZWN0b3IodGhpcy5uYW1lc3BhY2VVcmlNYXApKTtcbiAgICB9XG5cbiAgICBsb2FkKHhtbCwgY3Vyc29yLCBlbGVtZW50Q3JlYXRlZExpc3RlbmVyKXtcbiAgICAgICAgbGV0IHhtbEN1cnNvciA9IG5ldyBYbWxDdXJzb3IoeG1sLCBjdXJzb3IsIG51bGwpO1xuICAgICAgICB0aGlzLmxvYWREZXB0aCgxLCB4bWxDdXJzb3IsIGVsZW1lbnRDcmVhdGVkTGlzdGVuZXIpO1xuICAgIH1cblxuICAgIGxvYWREZXB0aChkZXB0aCwgeG1sQ3Vyc29yLCBlbGVtZW50Q3JlYXRlZExpc3RlbmVyKXtcbiAgICAgICAgTE9HLnNob3dQb3MoeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcik7XG4gICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ1N0YXJ0aW5nIERvbVNjYWZmb2xkJyk7XG4gICAgICAgIHRoaXMuZWxlbWVudENyZWF0ZWRMaXN0ZW5lciA9IGVsZW1lbnRDcmVhdGVkTGlzdGVuZXI7XG5cbiAgICAgICAgaWYoeG1sQ3Vyc29yLmVvZigpKXtcbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ1JlYWNoZWQgZW9mLiBFeGl0aW5nJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZWxlbWVudERldGVjdG9yID0gbnVsbDtcbiAgICAgICAgdGhpcy5kZXRlY3RvcnMuZm9yRWFjaChmdW5jdGlvbihjdXJFbGVtZW50RGV0ZWN0b3IscGFyZW50KXtcbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ1N0YXJ0aW5nICcgKyBjdXJFbGVtZW50RGV0ZWN0b3IudHlwZSk7XG4gICAgICAgICAgICBjdXJFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0KGRlcHRoICsgMSx4bWxDdXJzb3IpO1xuICAgICAgICAgICAgaWYoIWN1ckVsZW1lbnREZXRlY3Rvci5pc0ZvdW5kKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudERldGVjdG9yID0gY3VyRWxlbWVudERldGVjdG9yO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgIGlmKGVsZW1lbnREZXRlY3RvciA9PT0gbnVsbCl7XG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yKys7XG4gICAgICAgICAgICBMT0cud2FybignV0FSTjogTm8gaGFuZGxlciB3YXMgZm91bmQgc2VhcmNoaW5nIGZyb20gcG9zaXRpb246ICcgKyB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnREZXRlY3Rvci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgaWYoZWxlbWVudERldGVjdG9yIGluc3RhbmNlb2YgRWxlbWVudERldGVjdG9yICYmIGVsZW1lbnREZXRlY3Rvci5oYXNDaGlsZHJlbigpKSB7XG4gICAgICAgICAgICBsZXQgbmFtZXNwYWNlVXJpTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgbmFtZXNwYWNlVXJpTWFwLmFkZEFsbCh0aGlzLm5hbWVzcGFjZVVyaU1hcCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUsY3VyQXR0cmlidXRlLHBhcmVudCl7XG4gICAgICAgICAgICAgICAgaWYoXCJ4bWxuc1wiID09PSBjdXJBdHRyaWJ1dGUubmFtZXNwYWNlKXtcbiAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlVXJpTWFwLnNldChjdXJBdHRyaWJ1dGUubmFtZSxjdXJBdHRyaWJ1dGUudmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sdGhpcyk7XG4gICAgICAgICAgICB3aGlsZSghZWxlbWVudERldGVjdG9yLnN0b3AoZGVwdGggKyAxKSAmJiB4bWxDdXJzb3IuY3Vyc29yIDwgeG1sQ3Vyc29yLnhtbC5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGxldCBwcmV2aW91c1BhcmVudFNjYWZmb2xkID0geG1sQ3Vyc29yLnBhcmVudERvbVNjYWZmb2xkO1xuICAgICAgICAgICAgICAgIGxldCBjaGlsZFNjYWZmb2xkID0gbmV3IERvbVNjYWZmb2xkKG5hbWVzcGFjZVVyaU1hcCk7XG4gICAgICAgICAgICAgICAgeG1sQ3Vyc29yLnBhcmVudERvbVNjYWZmb2xkID0gY2hpbGRTY2FmZm9sZDtcbiAgICAgICAgICAgICAgICBjaGlsZFNjYWZmb2xkLmxvYWREZXB0aChkZXB0aCsxLCB4bWxDdXJzb3IsIHRoaXMuZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZERvbVNjYWZmb2xkcy5hZGQoY2hpbGRTY2FmZm9sZCk7XG4gICAgICAgICAgICAgICAgeG1sQ3Vyc29yLnBhcmVudERvbVNjYWZmb2xkID0gcHJldmlvdXNQYXJlbnRTY2FmZm9sZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBMT0cuc2hvd1Bvcyh4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICB9XG5cbiAgICBnZXRUcmVlKHBhcmVudE5vdGlmeVJlc3VsdCl7XG4gICAgICAgIGlmKHRoaXMuZWxlbWVudCA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBub3RpZnlSZXN1bHQgPSB0aGlzLm5vdGlmeUVsZW1lbnRDcmVhdGVkTGlzdGVuZXIodGhpcy5lbGVtZW50LHBhcmVudE5vdGlmeVJlc3VsdCk7XG5cbiAgICAgICAgdGhpcy5jaGlsZERvbVNjYWZmb2xkcy5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkRG9tU2NhZmZvbGQscGFyZW50KSB7XG4gICAgICAgICAgICBsZXQgY2hpbGRFbGVtZW50ID0gY2hpbGREb21TY2FmZm9sZC5nZXRUcmVlKG5vdGlmeVJlc3VsdCk7XG4gICAgICAgICAgICBpZihjaGlsZEVsZW1lbnQgIT09IG51bGwpe1xuICAgICAgICAgICAgICAgIHBhcmVudC5lbGVtZW50LmNoaWxkRWxlbWVudHMuYWRkKGNoaWxkRWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSx0aGlzKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIG5vdGlmeUVsZW1lbnRDcmVhdGVkTGlzdGVuZXIoZWxlbWVudCwgcGFyZW50Tm90aWZ5UmVzdWx0KSB7XG4gICAgICAgIGlmKHRoaXMuZWxlbWVudENyZWF0ZWRMaXN0ZW5lciAhPT0gbnVsbCAmJiB0aGlzLmVsZW1lbnRDcmVhdGVkTGlzdGVuZXIgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Q3JlYXRlZExpc3RlbmVyLmVsZW1lbnRDcmVhdGVkKGVsZW1lbnQsIHBhcmVudE5vdGlmeVJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7RG9tU2NhZmZvbGR9IGZyb20gXCIuL3BhcnNlci9kb21TY2FmZm9sZC5qc1wiO1xuaW1wb3J0IHtNYXB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgRG9tVHJlZXtcblxuICAgIGNvbnN0cnVjdG9yKHhtbCwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcikge1xuICAgICAgICB0aGlzLmVsZW1lbnRDcmVhdGVkTGlzdGVuZXIgPSBlbGVtZW50Q3JlYXRlZExpc3RlbmVyO1xuICAgICAgICB0aGlzLnhtbCA9IHhtbDtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgbG9hZCgpe1xuICAgICAgICBsZXQgZG9tU2NhZmZvbGQgPSBuZXcgRG9tU2NhZmZvbGQobmV3IE1hcCgpKTtcbiAgICAgICAgZG9tU2NhZmZvbGQubG9hZCh0aGlzLnhtbCwwLHRoaXMuZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBkb21TY2FmZm9sZC5nZXRUcmVlKCk7XG4gICAgfVxuXG4gICAgZHVtcCgpe1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LmR1bXAoKTtcbiAgICB9XG5cbiAgICByZWFkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3RFbGVtZW50LnJlYWQoKTtcbiAgICB9XG59XG4iXSwibmFtZXMiOlsiTG9nZ2VyIiwiTWFwIiwiU3RyaW5nVXRpbHMiLCJMT0ciLCJMaXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFFQSxBQUFPLE1BQU0sU0FBUzs7SUFFbEIsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1FBQ3pELElBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQztRQUM1QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN4RCxNQUFNLGdCQUFnQixJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksR0FBRyxDQUFDO2dCQUMxRCxjQUFjLEVBQUUsQ0FBQzthQUNwQjtZQUNELEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxjQUFjLEVBQUUsQ0FBQzthQUNwQixJQUFJO2dCQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDYjtTQUNKOztRQUVELE9BQU8sY0FBYyxHQUFHLENBQUMsQ0FBQztLQUM3QjtDQUNKOztBQ25CRDs7QUFFQSxBQUFPLE1BQU0sWUFBWSxDQUFDOztFQUV4QixXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7TUFDOUIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7TUFDakIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7TUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7R0FDdEI7Q0FDRjs7QUNURDtBQUNBLEFBSUE7QUFDQSxNQUFNLEdBQUcsR0FB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
