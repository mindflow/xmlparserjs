class ClosingElementDetector{

    constructor(){
        this.type = 'ClosingElementDetector';
        this.name = null;
        this.value = null;
        this.attrNames = [];
        this.attrValues = [];
        this.selfClosing = true;
        this.namespace = null;
        this.hasChildren = false;
        this.found = false;
    }

    detect(depth, xmlCursor){
        this.found = false;
        this.name = null;
        this.namespace = null;
        Logger.debug(depth, 'Looking for self closing element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ClosingElementDetector.detectClosingElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1){
            this.namespace = elementBody.namespace;
            this.name = elementBody.name;
            this.attrNames = elementBody.attrNames;
            this.attrValues = elementBody.attrValues;
            Logger.debug(depth, 'Found self closing tag <' + this.fullName() + '/> from ' +  xmlCursor.cursor  + ' to ' + endpos);
            this.found = true;
            xmlCursor.cursor = endpos + 1;
        }
    }

    fullName(){
        if(this.namespace == null){
            return this.name;
        }
        return this.namespace + ':' + this.name;
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
