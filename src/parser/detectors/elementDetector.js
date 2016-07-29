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
        this.xmlView = null;
    }

    detect(depth, xmlView){
        this.found = false;
        this.name = null;
        this.namespace = null;
        this.xmlView = xmlView;
        Logger.debug(depth, 'Looking for opening element at position ' + xmlView.cursor);
        let elementBody = new ElementBody();
        let endpos = ElementDetector.detectOpenElementBody(depth, xmlView.xml, xmlView.cursor,elementBody);
        if(endpos != -1) {
            this.namespace = elementBody.namespace;
            this.name = elementBody.name;

            this.loadAttributes(depth, xmlView, elementBody);
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
        let closingElementBody = ElementDetector.detectEndElementBody(depth, this.xmlView.xml, this.xmlView.cursor);
        if(closingElementBody != -1){
            let closingTagName =  this.xmlView.xml.substring(this.xmlView.cursor+2,closingElementBody);
            Logger.debug(depth, 'Found closing tag </' + closingTagName + '> from ' +  this.xmlView.cursor  + ' to ' + closingElementBody);

            if(this.fullName() != closingTagName){
                Logger.error('ERR: Mismatch between opening tag <' + this.fullName() + '> and closing tag </' + closingTagName + '> When exiting to parent elemnt');
            }
            this.xmlView.cursor = closingElementBody +1;
            return true;
        }
        return false;
    }

    loadAttributes(depth, xmlView, elementBody){
        let i = 0;
        for(let attrName of elementBody.attrNames){
            this.attrNames.push(attrName);
            this.attrValues.push(elementBody.attrValues[i]);
            i++;
        }
    }

    static detectOpenElementBody(depth, xml, cursor,elementBody) {
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

    static detectEndElementBody(depth, xml, cursor){
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
