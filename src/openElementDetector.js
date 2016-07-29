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
            this.namespace = elementPos.namespace;
            this.name = elementPos.name;

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
        let i = 0;
        for(let attrName of elementPos.attrNames){
            this.attrNames.push(attrName);
            this.attrValues.push(elementPos.attrValues[i]);
            i++;
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
