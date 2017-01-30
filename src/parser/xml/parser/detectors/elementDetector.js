import {Logger} from "./coreutil"

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
        Logger.debug(depth, 'Looking for opening element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ElementDetector.detectOpenElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1) {

            this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), false);

            elementBody.getAttributes().forEach(function(attributeName,attributeValue,parent){
                parent._element.getAttributes().set(attributeName,new XmlAttribute(attributeName, attributeValue));
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
