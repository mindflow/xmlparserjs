class ElementDetector{

    constructor(){
        this.type = 'ElementDetector';
        this.name = null;
        this.value = null;
        this.attrNames = [];
        this.attrValues = [];
        this.selfClosing = false;
        this.namespace = null;
        this.hasChildren = false;
        this.found = false;
        this.xmlCursor = null;
    }

    detect(depth, xmlCursor){
        this.found = false;
        this.name = null;
        this.namespace = null;
        this.xmlCursor = xmlCursor;
        Logger.debug(depth, 'Looking for opening element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ElementDetector.detectOpenElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1) {
            this.namespace = elementBody.namespace;
            this.name = elementBody.name;
            this.attrNames = elementBody.attrNames;
            this.attrValues = elementBody.attrValues;
            Logger.debug(depth, 'Found opening tag <' + this.fullName() + '> from ' +  xmlCursor.cursor  + ' to ' + endpos);
            xmlCursor.cursor = endpos + 1;

            if(!this.stop(depth)){
                this.hasChildren = true;
            }
            this.found = true;
        }
    }

    fullName(){
        if(this.namespace == null){
            return this.name;
        }
        return this.namespace + ':' + this.name;
    }

    stop(depth){
        Logger.debug(depth, 'Looking for closing element at position ' + this.xmlCursor.cursor);
        let closingElement = ElementDetector.detectEndElement(depth, this.xmlCursor.xml, this.xmlCursor.cursor);
        if(closingElement != -1){
            let closingTagName =  this.xmlCursor.xml.substring(this.xmlCursor.cursor+2,closingElement);
            Logger.debug(depth, 'Found closing tag </' + closingTagName + '> from ' +  this.xmlCursor.cursor  + ' to ' + closingElement);

            if(this.fullName() != closingTagName){
                Logger.error('ERR: Mismatch between opening tag <' + this.fullName() + '> and closing tag </' + closingTagName + '> When exiting to parent elemnt');
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
