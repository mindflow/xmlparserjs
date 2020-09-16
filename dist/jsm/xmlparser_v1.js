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

const LOG = new Logger("ElementBody");

class ElementBody{

    constructor(){
        this.name = null;
        this.namespace = null;
        this.attributes = new Map();
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
        while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
            cursor ++;
        }
        if(xml.charAt(cursor) == ':'){
            LOG.debug(depth, 'Found namespace');
            cursor ++;
            while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
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

const LOG$1 = new Logger("XmlCdata");

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

const LOG$2 = new Logger("XmlElement");

class XmlElement{

	constructor(name, namespace, namespaceUri, selfClosing){
        this.name = name;
        this.namespace = namespace;
        this.selfClosing = selfClosing;
        this.childElements = new List();
        this.attributes = new Map();
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
		this.attributes = new Map();
	}

    getChildElements(){
        return this.childElements;
    }

    setChildElements(elements) {
        this.childElements = elements;
    }

    setText(text){
        this.childElements = new List();
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

const LOG$3 = new Logger("ElementDetector");

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

const LOG$4 = new Logger("CdataDetector");

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

const LOG$5 = new Logger("ClosingElementDetector");

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

const LOG$6 = new Logger("DomScaffold");

class DomScaffold{

    constructor(namespaceUriMap){
        this.namespaceUriMap = namespaceUriMap;
        this.element = null;
        this.childDomScaffolds = new List();
        this.detectors = new List();
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
            let namespaceUriMap = new Map();
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
        let domScaffold = new DomScaffold(new Map());
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

export { CdataDetector, ClosingElementDetector, DomScaffold, DomTree, ElementBody, ElementDetector, ReadAhead, XmlAttribute, XmlCdata, XmlCursor, XmlElement };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1scGFyc2VyX3YxLmpzIiwic291cmNlcyI6WyIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3JlYWRBaGVhZC5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxBdHRyaWJ1dGUuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL2RldGVjdG9ycy9lbGVtZW50Qm9keS5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxDZGF0YS5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC94bWxFbGVtZW50LmpzIiwiLi4vLi4vc3JjL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvZWxlbWVudERldGVjdG9yLmpzIiwiLi4vLi4vc3JjL3htbHBhcnNlci9wYXJzZXIveG1sL3BhcnNlci9kZXRlY3RvcnMvY2RhdGFEZXRlY3Rvci5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvZGV0ZWN0b3JzL2Nsb3NpbmdFbGVtZW50RGV0ZWN0b3IuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvcGFyc2VyL3htbEN1cnNvci5qcyIsIi4uLy4uL3NyYy94bWxwYXJzZXIvcGFyc2VyL3htbC9wYXJzZXIvZG9tU2NhZmZvbGQuanMiLCIuLi8uLi9zcmMveG1scGFyc2VyL3BhcnNlci94bWwvZG9tVHJlZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBSZWFkQWhlYWR7XG5cbiAgICBzdGF0aWMgcmVhZCh2YWx1ZSwgbWF0Y2hlciwgY3Vyc29yLCBpZ25vcmVXaGl0ZXNwYWNlID0gZmFsc2Upe1xuICAgICAgICBsZXQgaW50ZXJuYWxDdXJzb3IgPSBjdXJzb3I7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBtYXRjaGVyLmxlbmd0aCAmJiBpIDwgdmFsdWUubGVuZ3RoIDsgaSsrKXtcbiAgICAgICAgICAgIHdoaWxlKGlnbm9yZVdoaXRlc3BhY2UgJiYgdmFsdWUuY2hhckF0KGludGVybmFsQ3Vyc29yKSA9PSAnICcpe1xuICAgICAgICAgICAgICAgIGludGVybmFsQ3Vyc29yKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih2YWx1ZS5jaGFyQXQoaW50ZXJuYWxDdXJzb3IpID09IG1hdGNoZXIuY2hhckF0KGkpKXtcbiAgICAgICAgICAgICAgICBpbnRlcm5hbEN1cnNvcisrO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVybmFsQ3Vyc29yIC0gMTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBYbWxBdHRyaWJ1dGUge1xuXG4gIGNvbnN0cnVjdG9yKG5hbWUsbmFtZXNwYWNlLHZhbHVlKSB7XG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBnZXROYW1lKCl7XG4gICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICB9XG5cbiAgc2V0TmFtZSh2YWwpe1xuICAgICAgdGhpcy5uYW1lID0gdmFsO1xuICB9XG5cbiAgZ2V0TmFtZXNwYWNlKCl7XG4gICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlO1xuICB9XG5cbiAgc2V0TmFtZXNwYWNlKHZhbCl7XG4gICAgdGhpcy5uYW1lc3BhY2UgPSB2YWw7XG4gIH1cblxuICBnZXRWYWx1ZSgpe1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gIH1cblxuICBzZXRWYWx1ZSh2YWwpe1xuICAgICAgdGhpcy52YWx1ZSA9IHZhbDtcbiAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlciwgTWFwLCBTdHJpbmdVdGlsc30gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZC5qc1wiO1xuaW1wb3J0IHtYbWxBdHRyaWJ1dGV9IGZyb20gXCIuLi8uLi94bWxBdHRyaWJ1dGUuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkVsZW1lbnRCb2R5XCIpO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudEJvZHl7XG5cbiAgICBjb25zdHJ1Y3Rvcigpe1xuICAgICAgICB0aGlzLm5hbWUgPSBudWxsO1xuICAgICAgICB0aGlzLm5hbWVzcGFjZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBnZXROYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICAgIH1cblxuICAgIGdldE5hbWVzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlO1xuICAgIH1cblxuICAgIGdldEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgZGV0ZWN0UG9zaXRpb25zKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCBuYW1lU3RhcnRwb3MgPSBjdXJzb3I7XG4gICAgICAgIGxldCBuYW1lRW5kcG9zID0gbnVsbDtcbiAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGN1cnNvciArKztcbiAgICAgICAgfVxuICAgICAgICBpZih4bWwuY2hhckF0KGN1cnNvcikgPT0gJzonKXtcbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIG5hbWVzcGFjZScpO1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICAgICAgd2hpbGUgKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpICYmIGN1cnNvciA8IHhtbC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbmFtZUVuZHBvcyA9IGN1cnNvci0xO1xuICAgICAgICB0aGlzLm5hbWUgPSB4bWwuc3Vic3RyaW5nKG5hbWVTdGFydHBvcywgbmFtZUVuZHBvcysxKTtcbiAgICAgICAgaWYodGhpcy5uYW1lLmluZGV4T2YoXCI6XCIpID4gLTEpe1xuICAgICAgICAgICAgICAgIHRoaXMubmFtZXNwYWNlID0gdGhpcy5uYW1lLnNwbGl0KFwiOlwiKVswXTtcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSB0aGlzLm5hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciA9IHRoaXMuZGV0ZWN0QXR0cmlidXRlcyhkZXB0aCx4bWwsY3Vyc29yKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvcjtcbiAgICB9XG5cbiAgICBkZXRlY3RBdHRyaWJ1dGVzKGRlcHRoLHhtbCxjdXJzb3Ipe1xuICAgICAgICBsZXQgZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvciA9IG51bGw7XG4gICAgICAgIHdoaWxlKChkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0U3RhcnRBdHRyaWJ1dGUoZGVwdGgsIHhtbCwgY3Vyc29yKSkgIT0gLTEpe1xuICAgICAgICAgICAgY3Vyc29yID0gdGhpcy5kZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGRldGVjdGVkQXR0ck5hbWVDdXJzb3IpO1xuICAgICAgICAgICAgbGV0IG5hbWVzcGFjZSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IHhtbC5zdWJzdHJpbmcoZGV0ZWN0ZWRBdHRyTmFtZUN1cnNvcixjdXJzb3IrMSk7XG5cbiAgICAgICAgICAgIGlmKG5hbWUuaW5kZXhPZihcIjpcIikgPiAtMSl7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlID0gbmFtZS5zcGxpdChcIjpcIilbMF07XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3BsaXQoXCI6XCIpWzFdO1xuICAgICAgICAgICAgfSAgXG5cbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIGF0dHJpYnV0ZSBmcm9tICcgKyBkZXRlY3RlZEF0dHJOYW1lQ3Vyc29yICsgJyAgdG8gJyArIGN1cnNvcik7XG4gICAgICAgICAgICBjdXJzb3IgPSB0aGlzLmRldGVjdFZhbHVlKG5hbWUsbmFtZXNwYWNlLGRlcHRoLCB4bWwsIGN1cnNvcisxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuXG4gICAgZGV0ZWN0TmV4dFN0YXJ0QXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSAnICcgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICBpZihTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSB8fCB4bWwuY2hhckF0KGN1cnNvcikgPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3ROZXh0RW5kQXR0cmlidXRlKGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIHdoaWxlKFN0cmluZ1V0aWxzLmlzSW5BbHBoYWJldCh4bWwuY2hhckF0KGN1cnNvcikpIHx8IHhtbC5jaGFyQXQoY3Vyc29yKSA9PT0gXCItXCIpe1xuICAgICAgICAgICAgY3Vyc29yICsrO1xuICAgICAgICB9XG4gICAgICAgIGlmKHhtbC5jaGFyQXQoY3Vyc29yKSA9PSBcIjpcIil7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB3aGlsZShTdHJpbmdVdGlscy5pc0luQWxwaGFiZXQoeG1sLmNoYXJBdChjdXJzb3IpKSB8fCB4bWwuY2hhckF0KGN1cnNvcikgPT09IFwiLVwiKXtcbiAgICAgICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnNvciAtMTtcbiAgICB9XG5cbiAgICBkZXRlY3RWYWx1ZShuYW1lLCBuYW1lc3BhY2UsIGRlcHRoLCB4bWwsIGN1cnNvcil7XG4gICAgICAgIGxldCB2YWx1ZVBvcyA9IGN1cnNvcjtcbiAgICAgICAgbGV0IGZ1bGxuYW1lID0gbmFtZTtcbiAgICAgICAgaWYobmFtZXNwYWNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBmdWxsbmFtZSA9IG5hbWVzcGFjZSArIFwiOlwiICsgbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZigodmFsdWVQb3MgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz1cIicsdmFsdWVQb3MsdHJ1ZSkpID09IC0xKXtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5zZXQoZnVsbG5hbWUsbmV3IFhtbEF0dHJpYnV0ZShuYW1lLG5hbWVzcGFjZSxudWxsKSk7XG4gICAgICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlUG9zKys7XG4gICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ1Bvc3NpYmxlIGF0dHJpYnV0ZSB2YWx1ZSBzdGFydCBhdCAnICsgdmFsdWVQb3MpO1xuICAgICAgICBsZXQgdmFsdWVTdGFydFBvcyA9IHZhbHVlUG9zO1xuICAgICAgICB3aGlsZSh0aGlzLmlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCB2YWx1ZVBvcykpe1xuICAgICAgICAgICAgdmFsdWVQb3MrKztcbiAgICAgICAgfVxuICAgICAgICBpZih2YWx1ZVBvcyA9PSBjdXJzb3Ipe1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLnNldChmdWxsbmFtZSwgbmV3IFhtbEF0dHJpYnV0ZShuYW1lLG5hbWVzcGFjZSwnJykpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5zZXQoZnVsbG5hbWUsIG5ldyBYbWxBdHRyaWJ1dGUobmFtZSxuYW1lc3BhY2UseG1sLnN1YnN0cmluZyh2YWx1ZVN0YXJ0UG9zLHZhbHVlUG9zKSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgTE9HLmRlYnVnKGRlcHRoLCAnRm91bmQgYXR0cmlidXRlIGNvbnRlbnQgZW5kaW5nIGF0ICcgKyAodmFsdWVQb3MtMSkpO1xuXG4gICAgICAgIGlmKCh2YWx1ZVBvcyA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnXCInLHZhbHVlUG9zLHRydWUpKSAhPSAtMSl7XG4gICAgICAgICAgICB2YWx1ZVBvcysrO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIExPRy5lcnJvcignTWlzc2luZyBlbmQgcXVvdGVzIG9uIGF0dHJpYnV0ZSBhdCBwb3NpdGlvbiAnICsgdmFsdWVQb3MpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZVBvcztcbiAgICB9XG5cblxuICAgIGlzQXR0cmlidXRlQ29udGVudChkZXB0aCwgeG1sLCBjdXJzb3Ipe1xuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJzwnLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCdcIicsY3Vyc29yKSAhPSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xvZ2dlcn0gZnJvbSBcImNvcmV1dGlsX3YxXCJcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlhtbENkYXRhXCIpO1xuXG5leHBvcnQgY2xhc3MgWG1sQ2RhdGF7XG5cblx0Y29uc3RydWN0b3IodmFsdWUpe1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuXG4gICAgc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG5cbiAgICBkdW1wKCl7XG4gICAgICAgIHRoaXMuZHVtcExldmVsKDApO1xuICAgIH1cblxuICAgIGR1bXBMZXZlbChsZXZlbCl7XG4gICAgICAgIGxldCBzcGFjZXIgPSAnOic7XG4gICAgICAgIGZvcihsZXQgc3BhY2UgPSAwIDsgc3BhY2UgPCBsZXZlbCoyIDsgc3BhY2UgKyspe1xuICAgICAgICAgICAgc3BhY2VyID0gc3BhY2VyICsgJyAnO1xuICAgICAgICB9XG5cbiAgICAgICAgTE9HLmluZm8oc3BhY2VyICsgdGhpcy52YWx1ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZWFkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXIsIExpc3QsIE1hcH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1htbENkYXRhfSBmcm9tIFwiLi94bWxDZGF0YS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiWG1sRWxlbWVudFwiKTtcblxuZXhwb3J0IGNsYXNzIFhtbEVsZW1lbnR7XG5cblx0Y29uc3RydWN0b3IobmFtZSwgbmFtZXNwYWNlLCBuYW1lc3BhY2VVcmksIHNlbGZDbG9zaW5nKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuc2VsZkNsb3NpbmcgPSBzZWxmQ2xvc2luZztcbiAgICAgICAgdGhpcy5jaGlsZEVsZW1lbnRzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLm5hbWVzcGFjZVVyaSA9IG5hbWVzcGFjZVVyaTtcbiAgICB9XG5cbiAgICBnZXROYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lO1xuICAgIH1cblxuICAgIGdldE5hbWVzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlO1xuICAgIH1cblxuICAgIGdldE5hbWVzcGFjZVVyaSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lc3BhY2VVcmk7XG4gICAgfVxuXG4gICAgZ2V0RnVsbE5hbWUoKSB7XG4gICAgICAgIGlmKHRoaXMubmFtZXNwYWNlID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lc3BhY2UgKyAnOicgKyB0aGlzLm5hbWU7XG4gICAgfVxuXG4gICAgZ2V0QXR0cmlidXRlcygpe1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyl7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgc2V0QXR0cmlidXRlKGtleSx2YWx1ZSkge1xuXHRcdHRoaXMuYXR0cmlidXRlcy5zZXQoa2V5LHZhbHVlKTtcblx0fVxuXG5cdGdldEF0dHJpYnV0ZShrZXkpIHtcblx0XHRyZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmdldChrZXkpO1xuXHR9XG5cbiAgICBjb250YWluc0F0dHJpYnV0ZShrZXkpe1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmNvbnRhaW5zKGtleSk7XG4gICAgfVxuXG5cdGNsZWFyQXR0cmlidXRlKCl7XG5cdFx0dGhpcy5hdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuXHR9XG5cbiAgICBnZXRDaGlsZEVsZW1lbnRzKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkRWxlbWVudHM7XG4gICAgfVxuXG4gICAgc2V0Q2hpbGRFbGVtZW50cyhlbGVtZW50cykge1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMgPSBlbGVtZW50cztcbiAgICB9XG5cbiAgICBzZXRUZXh0KHRleHQpe1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLmFkZFRleHQodGV4dCk7XG4gICAgfVxuXG4gICAgYWRkVGV4dCh0ZXh0KXtcbiAgICAgICAgbGV0IHRleHRFbGVtZW50ID0gbmV3IFhtbENkYXRhKHRleHQpO1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMuYWRkKHRleHRFbGVtZW50KTtcbiAgICB9XG5cbiAgICBkdW1wKCl7XG4gICAgICAgIHRoaXMuZHVtcExldmVsKDApO1xuICAgIH1cblxuICAgIGR1bXBMZXZlbChsZXZlbCl7XG4gICAgICAgIGxldCBzcGFjZXIgPSAnOic7XG4gICAgICAgIGZvcihsZXQgc3BhY2UgPSAwIDsgc3BhY2UgPCBsZXZlbCoyIDsgc3BhY2UgKyspe1xuICAgICAgICAgICAgc3BhY2VyID0gc3BhY2VyICsgJyAnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodGhpcy5zZWxmQ2xvc2luZyl7XG4gICAgICAgICAgICBMT0cuaW5mbyhzcGFjZXIgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnLz4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBMT0cuaW5mbyhzcGFjZXIgKyAnPCcgKyB0aGlzLmdldEZ1bGxOYW1lKCkgKyB0aGlzLnJlYWRBdHRyaWJ1dGVzKCkgKyAnPicpO1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpe1xuICAgICAgICAgICAgY2hpbGRFbGVtZW50LmR1bXBMZXZlbChsZXZlbCsxKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgTE9HLmluZm8oc3BhY2VyICsgJzwvJyArIHRoaXMuZ2V0RnVsbE5hbWUoKSArICc+Jyk7XG4gICAgfVxuXG4gICAgcmVhZCgpe1xuICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgICAgIGlmKHRoaXMuc2VsZkNsb3Npbmcpe1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJy8+JztcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwnICsgdGhpcy5nZXRGdWxsTmFtZSgpICsgdGhpcy5yZWFkQXR0cmlidXRlcygpICsgJz4nO1xuICAgICAgICB0aGlzLmNoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpe1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgY2hpbGRFbGVtZW50LnJlYWQoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzwvJyArIHRoaXMuZ2V0RnVsbE5hbWUoKSArICc+JztcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZWFkQXR0cmlidXRlcygpe1xuICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChrZXksYXR0cmlidXRlLHBhcmVudCkge1xuICAgICAgICAgICAgbGV0IGZ1bGxuYW1lID0gYXR0cmlidXRlLmdldE5hbWUoKTtcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZS5nZXROYW1lc3BhY2UoKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZ1bGxuYW1lID0gYXR0cmlidXRlLmdldE5hbWVzcGFjZSgpICsgXCI6XCIgKyBhdHRyaWJ1dGUuZ2V0TmFtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJyAnICsgZnVsbG5hbWU7XG4gICAgICAgICAgICBpZihhdHRyaWJ1dGUuZ2V0VmFsdWUoKSAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJz1cIicgKyBhdHRyaWJ1dGUuZ2V0VmFsdWUoKSArICdcIic7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LHRoaXMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtSZWFkQWhlYWR9IGZyb20gXCIuLi9yZWFkQWhlYWQuanNcIjtcbmltcG9ydCB7RWxlbWVudEJvZHl9IGZyb20gXCIuL2VsZW1lbnRCb2R5LmpzXCI7XG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCIuLi8uLi94bWxFbGVtZW50LmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJFbGVtZW50RGV0ZWN0b3JcIik7XG5cbmV4cG9ydCBjbGFzcyBFbGVtZW50RGV0ZWN0b3J7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lc3BhY2VVcmlNYXApe1xuICAgICAgICB0aGlzLnR5cGUgPSAnRWxlbWVudERldGVjdG9yJztcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VVcmlNYXAgPSBuYW1lc3BhY2VVcmlNYXA7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5mb3VuZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnhtbEN1cnNvciA9IG51bGw7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXRUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlO1xuICAgIH1cblxuICAgIGlzRm91bmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZvdW5kO1xuICAgIH1cblxuICAgIGhhc0NoaWxkcmVuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbjtcbiAgICB9XG5cbiAgICBkZXRlY3QoZGVwdGgsIHhtbEN1cnNvcil7XG4gICAgICAgIHRoaXMueG1sQ3Vyc29yID0geG1sQ3Vyc29yO1xuICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdMb29raW5nIGZvciBvcGVuaW5nIGVsZW1lbnQgYXQgcG9zaXRpb24gJyArIHhtbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBsZXQgZWxlbWVudEJvZHkgPSBuZXcgRWxlbWVudEJvZHkoKTtcbiAgICAgICAgbGV0IGVuZHBvcyA9IEVsZW1lbnREZXRlY3Rvci5kZXRlY3RPcGVuRWxlbWVudChkZXB0aCwgeG1sQ3Vyc29yLnhtbCwgeG1sQ3Vyc29yLmN1cnNvcixlbGVtZW50Qm9keSk7XG4gICAgICAgIGlmKGVuZHBvcyAhPSAtMSkge1xuXG4gICAgICAgICAgICBsZXQgbmFtZXNwYWNlVXJpID0gbnVsbDtcbiAgICAgICAgICAgIGlmKGVsZW1lbnRCb2R5LmdldE5hbWVzcGFjZSgpICE9PSBudWxsICYmIGVsZW1lbnRCb2R5LmdldE5hbWVzcGFjZSgpICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICAgIG5hbWVzcGFjZVVyaSA9IHRoaXMubmFtZXNwYWNlVXJpTWFwLmdldChlbGVtZW50Qm9keS5nZXROYW1lc3BhY2UoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnRCb2R5LmdldE5hbWUoKSwgZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCksIG5hbWVzcGFjZVVyaSwgZmFsc2UpO1xuXG4gICAgICAgICAgICBlbGVtZW50Qm9keS5nZXRBdHRyaWJ1dGVzKCkuZm9yRWFjaChmdW5jdGlvbihhdHRyaWJ1dGVOYW1lLGF0dHJpYnV0ZVZhbHVlLHBhcmVudCl7XG4gICAgICAgICAgICAgICAgcGFyZW50LmVsZW1lbnQuZ2V0QXR0cmlidXRlcygpLnNldChhdHRyaWJ1dGVOYW1lLGF0dHJpYnV0ZVZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIG9wZW5pbmcgdGFnIDwnICsgdGhpcy5lbGVtZW50LmdldEZ1bGxOYW1lKCkgKyAnPiBmcm9tICcgKyAgeG1sQ3Vyc29yLmN1cnNvciAgKyAnIHRvICcgKyBlbmRwb3MpO1xuICAgICAgICAgICAgeG1sQ3Vyc29yLmN1cnNvciA9IGVuZHBvcyArIDE7XG5cbiAgICAgICAgICAgIGlmKCF0aGlzLnN0b3AoZGVwdGgpKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZm91bmQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RvcChkZXB0aCl7XG4gICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0xvb2tpbmcgZm9yIGNsb3NpbmcgZWxlbWVudCBhdCBwb3NpdGlvbiAnICsgdGhpcy54bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgbGV0IGNsb3NpbmdFbGVtZW50ID0gRWxlbWVudERldGVjdG9yLmRldGVjdEVuZEVsZW1lbnQoZGVwdGgsIHRoaXMueG1sQ3Vyc29yLnhtbCwgdGhpcy54bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgaWYoY2xvc2luZ0VsZW1lbnQgIT0gLTEpe1xuICAgICAgICAgICAgbGV0IGNsb3NpbmdUYWdOYW1lID0gIHRoaXMueG1sQ3Vyc29yLnhtbC5zdWJzdHJpbmcodGhpcy54bWxDdXJzb3IuY3Vyc29yKzIsY2xvc2luZ0VsZW1lbnQpO1xuICAgICAgICAgICAgTE9HLmRlYnVnKGRlcHRoLCAnRm91bmQgY2xvc2luZyB0YWcgPC8nICsgY2xvc2luZ1RhZ05hbWUgKyAnPiBmcm9tICcgKyAgdGhpcy54bWxDdXJzb3IuY3Vyc29yICArICcgdG8gJyArIGNsb3NpbmdFbGVtZW50KTtcblxuICAgICAgICAgICAgaWYodGhpcy5lbGVtZW50LmdldEZ1bGxOYW1lKCkgIT0gY2xvc2luZ1RhZ05hbWUpe1xuICAgICAgICAgICAgICAgIExPRy5lcnJvcignRVJSOiBNaXNtYXRjaCBiZXR3ZWVuIG9wZW5pbmcgdGFnIDwnICsgdGhpcy5lbGVtZW50LmdldEZ1bGxOYW1lKCkgKyAnPiBhbmQgY2xvc2luZyB0YWcgPC8nICsgY2xvc2luZ1RhZ05hbWUgKyAnPiBXaGVuIGV4aXRpbmcgdG8gcGFyZW50IGVsZW1udCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy54bWxDdXJzb3IuY3Vyc29yID0gY2xvc2luZ0VsZW1lbnQgKzE7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVjdE9wZW5FbGVtZW50KGRlcHRoLCB4bWwsIGN1cnNvciwgZWxlbWVudEJvZHkpIHtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPCcsY3Vyc29yKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciArKztcbiAgICAgICAgY3Vyc29yID0gZWxlbWVudEJvZHkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPicsY3Vyc29yLCB0cnVlKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJzb3I7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVjdEVuZEVsZW1lbnQoZGVwdGgsIHhtbCwgY3Vyc29yKXtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPC8nLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIGN1cnNvciA9IG5ldyBFbGVtZW50Qm9keSgpLmRldGVjdFBvc2l0aW9ucyhkZXB0aCsxLCB4bWwsIGN1cnNvcik7XG4gICAgICAgIGlmKChjdXJzb3IgPSBSZWFkQWhlYWQucmVhZCh4bWwsJz4nLGN1cnNvciwgdHJ1ZSkpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtYbWxDZGF0YX0gZnJvbSBcIi4uLy4uL3htbENkYXRhLmpzXCI7XG5pbXBvcnQge1JlYWRBaGVhZH0gZnJvbSBcIi4uL3JlYWRBaGVhZC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ2RhdGFEZXRlY3RvclwiKTtcblxuZXhwb3J0IGNsYXNzIENkYXRhRGV0ZWN0b3J7XG5cbiAgICBjb25zdHJ1Y3Rvcigpe1xuICAgICAgICB0aGlzLnR5cGUgPSAnQ2RhdGFEZXRlY3Rvcic7XG4gICAgICAgIHRoaXMudmFsdWUgPSBudWxsO1xuICAgICAgICB0aGlzLmZvdW5kID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaXNGb3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZm91bmQ7XG4gICAgfVxuXG4gICAgZ2V0VHlwZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZTtcbiAgICB9XG5cbiAgICBjcmVhdGVFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFhtbENkYXRhKHRoaXMudmFsdWUpO1xuICAgIH1cblxuICAgIGRldGVjdChkZXB0aCwgeG1sQ3Vyc29yKXtcbiAgICAgICAgdGhpcy5mb3VuZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnZhbHVlID0gbnVsbDtcblxuICAgICAgICBsZXQgZW5kUG9zID0gdGhpcy5kZXRlY3RDb250ZW50KGRlcHRoLCB4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yLCB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQpO1xuICAgICAgICBpZihlbmRQb3MgIT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5oYXNDaGlsZHJlbiA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHhtbEN1cnNvci54bWwuc3Vic3RyaW5nKHhtbEN1cnNvci5jdXJzb3IsZW5kUG9zKTtcbiAgICAgICAgICAgIHhtbEN1cnNvci5jdXJzb3IgPSBlbmRQb3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZXRlY3RDb250ZW50KGRlcHRoLCB4bWwsIGN1cnNvciwgcGFyZW50RG9tU2NhZmZvbGQpIHtcbiAgICAgICAgTE9HLmRlYnVnKGRlcHRoLCAnQ2RhdGEgc3RhcnQgYXQgJyArIGN1cnNvcik7XG4gICAgICAgIGxldCBpbnRlcm5hbFN0YXJ0UG9zID0gY3Vyc29yO1xuICAgICAgICBpZighQ2RhdGFEZXRlY3Rvci5pc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKSl7XG4gICAgICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdObyBDZGF0YSBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlKENkYXRhRGV0ZWN0b3IuaXNDb250ZW50KGRlcHRoLCB4bWwsIGN1cnNvcikgJiYgY3Vyc29yIDwgeG1sLmxlbmd0aCl7XG4gICAgICAgICAgICBjdXJzb3IgKys7XG4gICAgICAgIH1cbiAgICAgICAgTE9HLmRlYnVnKGRlcHRoLCAnQ2RhdGEgZW5kIGF0ICcgKyAoY3Vyc29yLTEpKTtcbiAgICAgICAgaWYocGFyZW50RG9tU2NhZmZvbGQgPT09IG51bGwpe1xuICAgICAgICAgICAgTE9HLmVycm9yKCdFUlI6IENvbnRlbnQgbm90IGFsbG93ZWQgb24gcm9vdCBsZXZlbCBpbiB4bWwgZG9jdW1lbnQnKTtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdDZGF0YSBmb3VuZCB2YWx1ZSBpcyAnICsgeG1sLnN1YnN0cmluZyhpbnRlcm5hbFN0YXJ0UG9zLGN1cnNvcikpO1xuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cblxuICAgIHN0YXRpYyBpc0NvbnRlbnQoZGVwdGgsIHhtbCwgY3Vyc29yKXtcbiAgICAgICAgaWYoUmVhZEFoZWFkLnJlYWQoeG1sLCc8JyxjdXJzb3IpICE9IC0xKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZihSZWFkQWhlYWQucmVhZCh4bWwsJz4nLGN1cnNvcikgIT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXJ9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwiLi4vLi4veG1sRWxlbWVudC5qc1wiO1xuaW1wb3J0IHtSZWFkQWhlYWR9IGZyb20gXCIuLi9yZWFkQWhlYWQuanNcIjtcbmltcG9ydCB7RWxlbWVudEJvZHl9IGZyb20gXCIuL2VsZW1lbnRCb2R5LmpzXCI7XG5pbXBvcnQge1htbEF0dHJpYnV0ZX0gZnJvbSBcIi4uLy4uL3htbEF0dHJpYnV0ZS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ2xvc2luZ0VsZW1lbnREZXRlY3RvclwiKTtcblxuZXhwb3J0IGNsYXNzIENsb3NpbmdFbGVtZW50RGV0ZWN0b3J7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lc3BhY2VVcmlNYXApe1xuICAgICAgICB0aGlzLnR5cGUgPSAnQ2xvc2luZ0VsZW1lbnREZXRlY3Rvcic7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlVXJpTWFwID0gbmFtZXNwYWNlVXJpTWFwO1xuICAgICAgICB0aGlzLmZvdW5kID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgY3JlYXRlRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXRUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlO1xuICAgIH1cblxuICAgIGlzRm91bmQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZvdW5kO1xuICAgIH1cblxuICAgIGRldGVjdChkZXB0aCwgeG1sQ3Vyc29yKSB7XG4gICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0xvb2tpbmcgZm9yIHNlbGYgY2xvc2luZyBlbGVtZW50IGF0IHBvc2l0aW9uICcgKyB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgbGV0IGVsZW1lbnRCb2R5ID0gbmV3IEVsZW1lbnRCb2R5KCk7XG4gICAgICAgIGxldCBlbmRwb3MgPSBDbG9zaW5nRWxlbWVudERldGVjdG9yLmRldGVjdENsb3NpbmdFbGVtZW50KGRlcHRoLCB4bWxDdXJzb3IueG1sLCB4bWxDdXJzb3IuY3Vyc29yLGVsZW1lbnRCb2R5KTtcbiAgICAgICAgaWYoZW5kcG9zICE9IC0xKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnRCb2R5LmdldE5hbWUoKSwgZWxlbWVudEJvZHkuZ2V0TmFtZXNwYWNlKCksIHRoaXMubmFtZXNwYWNlVXJpTWFwLCB0cnVlKTtcblxuICAgICAgICAgICAgZWxlbWVudEJvZHkuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlTmFtZSxhdHRyaWJ1dGVWYWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgICAgIHBhcmVudC5lbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLGF0dHJpYnV0ZVZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgICAgIExPRy5kZWJ1ZyhkZXB0aCwgJ0ZvdW5kIHNlbGYgY2xvc2luZyB0YWcgPCcgKyB0aGlzLmVsZW1lbnQuZ2V0RnVsbE5hbWUoKSArICcvPiBmcm9tICcgKyAgeG1sQ3Vyc29yLmN1cnNvciAgKyAnIHRvICcgKyBlbmRwb3MpO1xuICAgICAgICAgICAgdGhpcy5mb3VuZCA9IHRydWU7XG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yID0gZW5kcG9zICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlY3RDbG9zaW5nRWxlbWVudChkZXB0aCwgeG1sLCBjdXJzb3IsIGVsZW1lbnRCb2R5KXtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnPCcsY3Vyc29yKSkgPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciArKztcbiAgICAgICAgY3Vyc29yID0gZWxlbWVudEJvZHkuZGV0ZWN0UG9zaXRpb25zKGRlcHRoKzEsIHhtbCwgY3Vyc29yKTtcbiAgICAgICAgaWYoKGN1cnNvciA9IFJlYWRBaGVhZC5yZWFkKHhtbCwnLz4nLGN1cnNvcikpID09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3Vyc29yO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFhtbEN1cnNvcntcblxuICAgIGNvbnN0cnVjdG9yKHhtbCwgY3Vyc29yLCBwYXJlbnREb21TY2FmZm9sZCl7XG4gICAgICAgIHRoaXMueG1sID0geG1sO1xuICAgICAgICB0aGlzLmN1cnNvciA9IGN1cnNvcjtcbiAgICAgICAgdGhpcy5wYXJlbnREb21TY2FmZm9sZCA9IHBhcmVudERvbVNjYWZmb2xkO1xuICAgIH1cblxuICAgIGVvZigpe1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJzb3IgPj0gdGhpcy54bWwubGVuZ3RoO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtMb2dnZXIsIE1hcCwgTGlzdH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge0VsZW1lbnREZXRlY3Rvcn0gZnJvbSBcIi4vZGV0ZWN0b3JzL2VsZW1lbnREZXRlY3Rvci5qc1wiO1xuaW1wb3J0IHtDZGF0YURldGVjdG9yfSBmcm9tIFwiLi9kZXRlY3RvcnMvY2RhdGFEZXRlY3Rvci5qc1wiO1xuaW1wb3J0IHtDbG9zaW5nRWxlbWVudERldGVjdG9yfSBmcm9tIFwiLi9kZXRlY3RvcnMvY2xvc2luZ0VsZW1lbnREZXRlY3Rvci5qc1wiO1xuaW1wb3J0IHtYbWxDdXJzb3J9IGZyb20gXCIuL3htbEN1cnNvci5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRG9tU2NhZmZvbGRcIik7XG5cbmV4cG9ydCBjbGFzcyBEb21TY2FmZm9sZHtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWVzcGFjZVVyaU1hcCl7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlVXJpTWFwID0gbmFtZXNwYWNlVXJpTWFwO1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmNoaWxkRG9tU2NhZmZvbGRzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5kZXRlY3RvcnMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLmVsZW1lbnRDcmVhdGVkTGlzdGVuZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmRldGVjdG9ycy5hZGQobmV3IEVsZW1lbnREZXRlY3Rvcih0aGlzLm5hbWVzcGFjZVVyaU1hcCkpO1xuICAgICAgICB0aGlzLmRldGVjdG9ycy5hZGQobmV3IENkYXRhRGV0ZWN0b3IoKSk7XG4gICAgICAgIHRoaXMuZGV0ZWN0b3JzLmFkZChuZXcgQ2xvc2luZ0VsZW1lbnREZXRlY3Rvcih0aGlzLm5hbWVzcGFjZVVyaU1hcCkpO1xuICAgIH1cblxuICAgIGdldEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG4gICAgbG9hZCh4bWwsIGN1cnNvciwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcil7XG4gICAgICAgIGxldCB4bWxDdXJzb3IgPSBuZXcgWG1sQ3Vyc29yKHhtbCwgY3Vyc29yLCBudWxsKTtcbiAgICAgICAgdGhpcy5sb2FkRGVwdGgoMSwgeG1sQ3Vyc29yLCBlbGVtZW50Q3JlYXRlZExpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBsb2FkRGVwdGgoZGVwdGgsIHhtbEN1cnNvciwgZWxlbWVudENyZWF0ZWRMaXN0ZW5lcil7XG4gICAgICAgIExPRy5zaG93UG9zKHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IpO1xuICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdTdGFydGluZyBEb21TY2FmZm9sZCcpO1xuICAgICAgICB0aGlzLmVsZW1lbnRDcmVhdGVkTGlzdGVuZXIgPSBlbGVtZW50Q3JlYXRlZExpc3RlbmVyO1xuXG4gICAgICAgIGlmKHhtbEN1cnNvci5lb2YoKSl7XG4gICAgICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdSZWFjaGVkIGVvZi4gRXhpdGluZycpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVsZW1lbnREZXRlY3RvciA9IG51bGw7XG4gICAgICAgIHRoaXMuZGV0ZWN0b3JzLmZvckVhY2goZnVuY3Rpb24oY3VyRWxlbWVudERldGVjdG9yLHBhcmVudCl7XG4gICAgICAgICAgICBMT0cuZGVidWcoZGVwdGgsICdTdGFydGluZyAnICsgY3VyRWxlbWVudERldGVjdG9yLmdldFR5cGUoKSk7XG4gICAgICAgICAgICBjdXJFbGVtZW50RGV0ZWN0b3IuZGV0ZWN0KGRlcHRoICsgMSx4bWxDdXJzb3IpO1xuICAgICAgICAgICAgaWYoIWN1ckVsZW1lbnREZXRlY3Rvci5pc0ZvdW5kKCkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudERldGVjdG9yID0gY3VyRWxlbWVudERldGVjdG9yO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgIGlmKGVsZW1lbnREZXRlY3RvciA9PT0gbnVsbCl7XG4gICAgICAgICAgICB4bWxDdXJzb3IuY3Vyc29yKys7XG4gICAgICAgICAgICBMT0cud2FybignV0FSTjogTm8gaGFuZGxlciB3YXMgZm91bmQgc2VhcmNoaW5nIGZyb20gcG9zaXRpb246ICcgKyB4bWxDdXJzb3IuY3Vyc29yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnREZXRlY3Rvci5jcmVhdGVFbGVtZW50KCk7XG5cbiAgICAgICAgaWYoZWxlbWVudERldGVjdG9yIGluc3RhbmNlb2YgRWxlbWVudERldGVjdG9yICYmIGVsZW1lbnREZXRlY3Rvci5oYXNDaGlsZHJlbigpKSB7XG4gICAgICAgICAgICBsZXQgbmFtZXNwYWNlVXJpTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgbmFtZXNwYWNlVXJpTWFwLmFkZEFsbCh0aGlzLm5hbWVzcGFjZVVyaU1hcCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuZ2V0QXR0cmlidXRlcygpLmZvckVhY2goZnVuY3Rpb24obmFtZSxjdXJBdHRyaWJ1dGUscGFyZW50KXtcbiAgICAgICAgICAgICAgICBpZihcInhtbG5zXCIgPT09IGN1ckF0dHJpYnV0ZS5nZXROYW1lc3BhY2UoKSl7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZVVyaU1hcC5zZXQoY3VyQXR0cmlidXRlLmdldE5hbWUoKSxjdXJBdHRyaWJ1dGUuZ2V0VmFsdWUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgICAgIHdoaWxlKCFlbGVtZW50RGV0ZWN0b3Iuc3RvcChkZXB0aCArIDEpICYmIHhtbEN1cnNvci5jdXJzb3IgPCB4bWxDdXJzb3IueG1sLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgbGV0IHByZXZpb3VzUGFyZW50U2NhZmZvbGQgPSB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQ7XG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkU2NhZmZvbGQgPSBuZXcgRG9tU2NhZmZvbGQobmFtZXNwYWNlVXJpTWFwKTtcbiAgICAgICAgICAgICAgICB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQgPSBjaGlsZFNjYWZmb2xkO1xuICAgICAgICAgICAgICAgIGNoaWxkU2NhZmZvbGQubG9hZERlcHRoKGRlcHRoKzEsIHhtbEN1cnNvciwgdGhpcy5lbGVtZW50Q3JlYXRlZExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkRG9tU2NhZmZvbGRzLmFkZChjaGlsZFNjYWZmb2xkKTtcbiAgICAgICAgICAgICAgICB4bWxDdXJzb3IucGFyZW50RG9tU2NhZmZvbGQgPSBwcmV2aW91c1BhcmVudFNjYWZmb2xkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIExPRy5zaG93UG9zKHhtbEN1cnNvci54bWwsIHhtbEN1cnNvci5jdXJzb3IpO1xuICAgIH1cblxuICAgIGdldFRyZWUocGFyZW50Tm90aWZ5UmVzdWx0KXtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50ID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5vdGlmeVJlc3VsdCA9IHRoaXMubm90aWZ5RWxlbWVudENyZWF0ZWRMaXN0ZW5lcih0aGlzLmVsZW1lbnQscGFyZW50Tm90aWZ5UmVzdWx0KTtcblxuICAgICAgICB0aGlzLmNoaWxkRG9tU2NhZmZvbGRzLmZvckVhY2goZnVuY3Rpb24oY2hpbGREb21TY2FmZm9sZCxwYXJlbnQpIHtcbiAgICAgICAgICAgIGxldCBjaGlsZEVsZW1lbnQgPSBjaGlsZERvbVNjYWZmb2xkLmdldFRyZWUobm90aWZ5UmVzdWx0KTtcbiAgICAgICAgICAgIGlmKGNoaWxkRWxlbWVudCAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgcGFyZW50LmVsZW1lbnQuZ2V0Q2hpbGRFbGVtZW50cygpLmFkZChjaGlsZEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBub3RpZnlFbGVtZW50Q3JlYXRlZExpc3RlbmVyKGVsZW1lbnQsIHBhcmVudE5vdGlmeVJlc3VsdCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnRDcmVhdGVkTGlzdGVuZXIgIT09IG51bGwgJiYgdGhpcy5lbGVtZW50Q3JlYXRlZExpc3RlbmVyICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudENyZWF0ZWRMaXN0ZW5lci5lbGVtZW50Q3JlYXRlZChlbGVtZW50LCBwYXJlbnROb3RpZnlSZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0RvbVNjYWZmb2xkfSBmcm9tIFwiLi9wYXJzZXIvZG9tU2NhZmZvbGQuanNcIjtcbmltcG9ydCB7TWFwfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIERvbVRyZWV7XG5cbiAgICBjb25zdHJ1Y3Rvcih4bWwsIGVsZW1lbnRDcmVhdGVkTGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Q3JlYXRlZExpc3RlbmVyID0gZWxlbWVudENyZWF0ZWRMaXN0ZW5lcjtcbiAgICAgICAgdGhpcy54bWwgPSB4bWw7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIHNldFJvb3RFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgbG9hZCgpe1xuICAgICAgICBsZXQgZG9tU2NhZmZvbGQgPSBuZXcgRG9tU2NhZmZvbGQobmV3IE1hcCgpKTtcbiAgICAgICAgZG9tU2NhZmZvbGQubG9hZCh0aGlzLnhtbCwwLHRoaXMuZWxlbWVudENyZWF0ZWRMaXN0ZW5lcik7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBkb21TY2FmZm9sZC5nZXRUcmVlKCk7XG4gICAgfVxuXG4gICAgZHVtcCgpe1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LmR1bXAoKTtcbiAgICB9XG5cbiAgICByZWFkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3RFbGVtZW50LnJlYWQoKTtcbiAgICB9XG59XG4iXSwibmFtZXMiOlsiTE9HIl0sIm1hcHBpbmdzIjoiOztBQUFBOztBQUVPLE1BQU0sU0FBUzs7SUFFbEIsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1FBQ3pELElBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQztRQUM1QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsS0FB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
