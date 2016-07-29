class SelfClosingElementDetector{

    constructor(){
        this.type = 'SelfClosingElementDetector';
        this.name = null;
        this.value = null;
        this.selfClosing = false;
        this.namespace = null;
        this.hasChildren = false;
        this.found = false;
    }

    detect(depth, xmlView){
        this.found = false;
        this.name = null;
        this.namespace = null;

        let elementPos = new ElementPos();
        let endpos = SelfClosingElementDetector.detectSelfClosingElementPos(depth, xmlView.xml, xmlView.cursor,elementPos);
        if(endpos != -1){
            if(elementPos.namespaceEndpos != null){
                this.namespace = xmlView.xml.substring(elementPos.namespaceStartpos,elementPos.namespaceEndpos+1);
            }
            this.name = xmlView.xml.substring(elementPos.nameStartpos,elementPos.nameEndpos+1);

            Logger.debug(depth, 'Found self closing tag <' + this.fullName() + '/> from ' +  xmlView.cursor  + ' to ' + endpos);
            this.selfClosing = true;
            this.hasChildren = false;
            this.found = true;
            xmlView.cursor = endpos + 1;
        }
    }

    fullName(){
        if(this.namespace == null){
            return this.name;
        }
        return this.namespace + ':' + this.name;
    }

    static detectSelfClosingElementPos(depth, xml, cursor, elementPos){
        if((cursor = ReadAhead.read(xml,'<',cursor)) == -1){
            return -1;
        }
        cursor ++;
        cursor = elementPos.detectPositions(depth, xml, cursor);
        if((cursor = ReadAhead.read(xml,'/>',cursor)) == -1){
            return -1;
        }
        return cursor;
    }
}
