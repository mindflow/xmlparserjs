class SelfClosingElementDetector{

    constructor(){
        this.type = 'SelfClosingElementDetector';
        this.name = null;
        this.value = null;
        this.selfClosing = false;
        this.namespace = null;
        this.hasChildren = false;
        this.nameSpaceSeparator = null;
        this.found = false;
    }
    
    detect(depth, xmlView){
        this.found = false;
        this.name = null;
        this.namespace = null;
        
        let endPos = SelfClosingElementDetector.detectSelfClosingElementPos(depth, xmlView.xml, xmlView.cursor);
        if(endPos != -1){
            if(this.nameSpaceSeparator != null){
                this.namespace = xmlView.xml.substring(xmlView.cursor+1,this.nameSpaceSeparator);
                this.name = xmlView.xml.substring(this.nameSpaceSeparator+1,endPos-1);
            }else{
                this.name = xmlView.xml.substring(xmlView.cursor+1,endPos-1);
            }
            
            Logger.debug(depth, 'Found self closing tag <' + this.fullName() + '/> from ' +  xmlView.cursor  + ' to ' + endPos);
            this.selfClosing = true;
            this.hasChildren = false;
            this.found = true;
            xmlView.cursor = endPos + 1;
        }
    }

    fullName(){
        if(this.namespace == null){
            return this.name;
        }
        return this.namespace + ':' + this.name;
    }
    
    static detectSelfClosingElementPos(depth, xml, cursor){
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

        if((cursor = ReadAhead.read(xml,'/>',cursor)) == -1){
            return -1;
        }

        return cursor;
    }
}