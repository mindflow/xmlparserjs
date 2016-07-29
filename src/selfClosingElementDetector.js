class SelfClosingElementDetector{

    constructor(){
        this.type = 'SelfClosingElementDetector';
        this.name = null;
        this.value = null;
        this.attrNames = [];
        this.attrValues = [];
        this.selfClosing = false;
        this.namespace = null;
        this.hasChildren = false;
        this.found = false;
    }

    detect(depth, xmlView){
        this.found = false;
        this.name = null;
        this.namespace = null;
        Logger.debug(depth, 'Looking for self closing element at position ' + xmlView.cursor);
        let elementPos = new ElementPos();
        let endpos = SelfClosingElementDetector.detectSelfClosingElementPos(depth, xmlView.xml, xmlView.cursor,elementPos);
        if(endpos != -1){
            if(elementPos.namespaceEndpos != null){
                this.namespace = xmlView.xml.substring(elementPos.namespaceStartpos,elementPos.namespaceEndpos+1);
            }
            this.name = xmlView.xml.substring(elementPos.nameStartpos,elementPos.nameEndpos+1);
            this.loadAttributes(depth, xmlView, elementPos);
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

    static detectSelfClosingElementPos(depth, xml, cursor, elementPos){
        if((cursor = ReadAhead.read(xml,'<',cursor)) == -1){
            return -1;
        }
        cursor ++;
        cursor = elementPos.detectPositions(depth+1, xml, cursor);
        if((cursor = ReadAhead.read(xml,'/>',cursor)) == -1){
            return -1;
        }
        return cursor;
    }
}
