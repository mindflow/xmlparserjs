class OpenElementDetector{

    constructor(){
        this.type = 'OpenElementDetector';
        this.name = null;
        this.value = null;
        this.attributeNames = [];
        this.attributeValues = [];
        this.selfClosing = false;
        this.namespace = null;
        this.hasChildren = false;
        this.found = false;
        this.xmlView = null;
    }

    detect(depth, xmlView){
        this.found = false;
        this.name = null;
        this.namespace = null;
        this.xmlView = xmlView;

        let elementPos = new ElementPos();
        let endpos = OpenElementDetector.detectOpenElementPos(depth, xmlView.xml, xmlView.cursor,elementPos);
        if(endpos != -1) {
            if(elementPos.namespaceEndpos != null){
                this.namespace = xmlView.xml.substring(elementPos.namespaceStartpos,elementPos.namespaceEndpos+1);
            }
            this.name = xmlView.xml.substring(elementPos.nameStartpos,elementPos.nameEndpos+1);
            Logger.debug(depth, 'Found opening tag <' + this.fullName() + '> from ' +  xmlView.cursor  + ' to ' + endpos);
            xmlView.cursor = xmlView.cursor + this.fullName().length + 2;

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
        Logger.debug(depth, 'Looking for closing element at position ' + this.xmlView.cursor);
        let closingElementPos = OpenElementDetector.detectEndElementPos(depth, this.xmlView.xml, this.xmlView.cursor);
        if(closingElementPos != -1){
            let closingTagName =  this.xmlView.xml.substring(this.xmlView.cursor+2,closingElementPos);
            Logger.debug(depth, 'Found closing tag </' + closingTagName + '> from ' +  this.xmlView.cursor  + ' to ' + closingElementPos);

            if(this.fullName() != closingTagName){
                Logger.error('ERR: Mismatch between opening tag <' + this.fullName() + '> and closing tag </' + closingTagName + '> When exiting to parent elemnt');
            }
            this.xmlView.cursor = closingElementPos +1;
            return true;
        }
        return false;
    }

    static detectOpenElementPos(depth, xml, cursor,elementPos) {
        if((cursor = ReadAhead.read(xml,'<',cursor)) == -1){
            return -1;
        }
        cursor ++;
        cursor = elementPos.detectPositions(depth, xml, cursor);
        if((cursor = ReadAhead.read(xml,'>',cursor)) == -1){
            return -1;
        }
        return cursor;
    }

    static detectEndElementPos(depth, xml, cursor){
        if((cursor = ReadAhead.read(xml,'</',cursor)) == -1){
            return -1;
        }
        cursor ++;
        cursor = new ElementPos().detectPositions(depth, xml, cursor);
        if((cursor = ReadAhead.read(xml,'>',cursor)) == -1){
            return -1;
        }
        return cursor;
    }

}
