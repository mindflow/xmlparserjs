class OpenElementDetector{

    constructor(){
        this.type = 'OpenElementDetector';
        this.name = null;
        this.value = null;
        this.attrNames = [];
        this.attrValues = [];
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
        Logger.debug(depth, 'Looking for opening element at position ' + xmlView.cursor);
        let elementPos = new ElementPos();
        let endpos = OpenElementDetector.detectOpenElementPos(depth, xmlView.xml, xmlView.cursor,elementPos);
        if(endpos != -1) {
            if(elementPos.namespaceEndpos != null){
                this.namespace = xmlView.xml.substring(elementPos.namespaceStartpos,elementPos.namespaceEndpos+1);
            }
            this.name = xmlView.xml.substring(elementPos.nameStartpos,elementPos.nameEndpos+1);

            this.loadAttributes(depth, xmlView, elementPos);
            Logger.debug(depth, 'Found opening tag <' + this.fullName() + '> from ' +  xmlView.cursor  + ' to ' + endpos);
            xmlView.cursor = endpos + 1;

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

    loadAttributes(depth, xmlView, elementPos){
        for(let i = 0 ; i < elementPos.attrNameStartPositions.length; i++){
            let attrNameStartPos = elementPos.attrNameStartPositions[i];
            let attrNameEndPos = elementPos.attrNameEndPositions[i];
            let attrValueStartPos = elementPos.attrValueStartPositions[i];
            let attrValueEndPos = elementPos.attrValueEndPositions[i];
            this.attrNames.push(xmlView.xml.substring(attrNameStartPos,attrNameEndPos+1));
            if(attrValueStartPos != -1 && attrValueEndPos != -1){
                this.attrValues.push(xmlView.xml.substring(attrValueStartPos,attrValueEndPos+1));
            }else{
                this.attrValues.push(xmlView.xml.substring(attrNameStartPos,attrNameEndPos+1));
            }
        }
    }

    static detectOpenElementPos(depth, xml, cursor,elementPos) {
        if((cursor = ReadAhead.read(xml,'<',cursor)) == -1){
            return -1;
        }
        cursor ++;
        cursor = elementPos.detectPositions(depth+1, xml, cursor);
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
        cursor = new ElementPos().detectPositions(depth+1, xml, cursor);
        if((cursor = ReadAhead.read(xml,'>',cursor)) == -1){
            return -1;
        }
        return cursor;
    }

}
