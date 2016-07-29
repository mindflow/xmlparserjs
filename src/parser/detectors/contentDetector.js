class ContentDetector{

    constructor(){
        this.type = 'ContentDetector';
        this.value = null;
        this.selfClosing = false;
        this.namespace = null;
        this.found = false;
    }

    detect(depth, xmlView){
        this.found = false;
        this.value = null;

        let endPos = this.detectContent(depth, xmlView.xml, xmlView.cursor, xmlView.parentDomScaffold);
        if(endPos != -1) {
            this.found = true;
            this.hasChildren = false;
            this.value = xmlView.xml.substring(xmlView.cursor,endPos);
            xmlView.cursor = endPos;
        }
    }

    fullName(){
        return null;
    }

    detectContent(depth, xml, cursor, parentDomScaffold) {
        Logger.debug(depth, 'Content start at ' + cursor);
        let internalStartPos = cursor;
        if(!ContentDetector.isContent(depth, xml, cursor)){
            Logger.debug(depth, 'No content found');
            return -1;
        }
        while(ContentDetector.isContent(depth, xml, cursor) && cursor < xml.length){
            cursor ++;
        }
        Logger.debug(depth, 'Content end at ' + (cursor-1));
        if(parentDomScaffold == null){
            Logger.error('ERR: Content not allowed on root level in xml document');
            return -1;
        }
        Logger.debug(depth, 'Content found value is ' + xml.substring(internalStartPos,cursor));
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
