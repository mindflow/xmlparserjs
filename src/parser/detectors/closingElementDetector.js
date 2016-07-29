class ClosingElementDetector{

    constructor(){
        this.type = 'ClosingElementDetector';
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
        let elementBody = new ElementBody();
        let endpos = ClosingElementDetector.detectClosingElement(depth, xmlView.xml, xmlView.cursor,elementBody);
        if(endpos != -1){
            this.namespace = elementBody.namespace;
            this.name = elementBody.name;
            this.loadAttributes(depth, xmlView, elementBody);
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

    loadAttributes(depth, xmlView, elementBody){
        let i = 0;
        for(let attrName of elementBody.attrNames){
            this.attrNames.push(attrName);
            this.attrValues.push(elementBody.attrValues[i]);
            i++;
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
