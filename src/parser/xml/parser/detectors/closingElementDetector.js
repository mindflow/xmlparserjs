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
        Logger.debug(depth, 'Looking for self closing element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ClosingElementDetector.detectClosingElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1){
            this._element = new XmlElement(elementBody.getName(), elementBody.getNamespace(), true);
            for(var i = 0; i< elementBody.getAttributeNames().size(); i++) {
                var attributeName = elementBody.getAttributeNames().get(i);
                var attributeValue = elementBody.getAttributeValues().get(i);
                this._element.getAttributes().set(attributeName,new XmlAttribute(attributeName,attributeValue));
            }

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
