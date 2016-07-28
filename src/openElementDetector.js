class OpenElementDetector{

    constructor(){
        this.type = 'OpenElementDetector';
        this.name = null;
        this.value = null;
        this.selfClosing = false;
        this.namespace = null;
        this.hasChildren = false;
        this.nameSpaceSeparator = null;
        this.found = false;
        this.xmlView = null;
    }

    detect(depth, xmlView){
        this.found = false;
        this.name = null;
        this.namespace = null;
        this.xmlView = xmlView;

        let endPos = OpenElementDetector.detectOpenElementPos(depth, this.xmlView.xml, this.xmlView.cursor);
        if(endPos != -1) {
            if(this.nameSpaceSeparator != null){
                this.namespace = this.xmlView.xml.substring(this.xmlView.cursor+1,this.nameSpaceSeparator);
                this.name = this.xmlView.xml.substring(this.nameSpaceSeparator+1,endPos);
            }else{
                this.name = this.xmlView.xml.substring(this.xmlView.cursor+1,endPos);
            }
            Logger.debug(depth, 'Found opening tag <' + this.fullName() + '> from ' +  this.xmlView.cursor  + ' to ' + endPos);
            this.xmlView.cursor = this.xmlView.cursor + this.fullName().length + 2;

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

    static detectOpenElementPos(depth, xml, cursor) {
        if((cursor = ReadAhead.read(xml,'<',cursor)) == -1){
            return -1;
        }

        cursor ++;
        while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
            cursor ++;
        }

        if(xml.charAt(cursor) == ':'){
            Logger.debug(depth, 'Found namespace');
            this.nameSpaceSeparator = cursor;
            cursor ++;
            while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                cursor ++;
            }
        }
        if((cursor = ReadAhead.read(xml,'>',cursor)) == -1){
            return -1;
        }
        return cursor;
    }

    static detectEndElementPos(depth, xml, cursor){
        if((cursor = ReadAhead.read(xml,'</',cursor)) == -1){
            return -1;
        }

        cursor++;

        while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
            cursor ++;
        }
        if(xml.charAt(cursor) == ':'){
            Logger.debug(depth, 'Found namespace');
            this.nameSpaceSeparator = cursor;
            cursor ++;
            while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                cursor ++;
            }
        }

        if((cursor = ReadAhead.read(xml,'>',cursor)) == -1){
            return -1;
        }
        return cursor;
    }

}
