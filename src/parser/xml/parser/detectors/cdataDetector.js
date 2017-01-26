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
        if(parentDomScaffold == null){
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
