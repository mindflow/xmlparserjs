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
            this.namespace = elementPos.namespace;
            this.name = elementPos.name;
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
        let i = 0;
        for(let attrName of elementPos.attrNames){
            this.attrNames.push(attrName);
            this.attrValues.push(elementPos.attrValues[i]);
            i++;
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
