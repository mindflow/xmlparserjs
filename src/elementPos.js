class ElementPos{

    constructor(){
        this.namespaceEndpos = null;
        this.nameEndpos = null;
        this.nameStartpos = null;
        this.nameEndpos = null;
        this.attrNameStartPositions = [];
        this.attrNameEndPositions = [];
        this.attrValueStartPositions = [];
        this.attrValueEndPositions = [];
    }

    detectPositions(depth, xml, cursor){
        this.nameStartpos = cursor;
        while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
            cursor ++;
        }

        if(xml.charAt(cursor) == ':'){
            Logger.debug(depth, 'Found namespace');
            this.namespaceStartpos = this.nameStartpos;
            this.namespaceEndpos = cursor-1;
            this.nameStartpos = cursor+1;
            cursor ++;
            while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                cursor ++;
            }
        }
        this.nameEndpos = cursor-1;

        cursor = this.detectAttributes(depth,xml,cursor);

        return cursor;
    }

    detectAttributes(depth,xml,cursor){
        let detectedAttrCursor = null;
        while((detectedAttrCursor = this.detectNextStartAttribute(depth, xml, cursor)) != -1){
            cursor = detectedAttrCursor;
            this.attrNameStartPositions.push(cursor);
            cursor = this.detectNextEndAttribute(depth, xml, cursor);
            this.attrNameEndPositions.push(cursor);
            Logger.debug(depth, 'Found attribute from ' + detectedAttrCursor + '  to ' + cursor);
            cursor = this.detectValue(depth, xml, cursor+1);
        }
        return cursor;
    }

    detectNextStartAttribute(depth, xml, cursor){
        while(xml.charAt(cursor) == ' ' && cursor < xml.length){
            cursor ++;
            if(StringUtils.isInAlphabet(xml.charAt(cursor))){
                return cursor;
            }
        }
        return -1;
    }

    detectNextEndAttribute(depth, xml, cursor){
        while(StringUtils.isInAlphabet(xml.charAt(cursor))){
            cursor ++;
        }
        return cursor -1;
    }

    detectValue(depth, xml, cursor){
        let valuePos = cursor;
        if((valuePos = ReadAhead.read(xml,'="',valuePos,true)) == -1){
            return cursor;
        }
        valuePos++;
        Logger.debug(depth, 'Possible attribute value start at ' + valuePos);
        this.attrValueStartPositions.push(valuePos);
        while(this.isAttributeContent(depth, xml, valuePos)){
            valuePos++;
        }
        Logger.debug(depth, 'Found attribute content ending at ' + (valuePos-1));
        this.attrValueEndPositions.push(valuePos-1);

        if(valuePos == cursor){
            Logger.debug(depth, 'Attribute content was empty');
        }

        if((valuePos = ReadAhead.read(xml,'"',valuePos,true)) == -1){
            return -1;
        }
        return valuePos+1;
    }


    isAttributeContent(depth, xml, cursor){
        if(ReadAhead.read(xml,'<',cursor) != -1){
            return false;
        }
        if(ReadAhead.read(xml,'>',cursor) != -1){
            return false;
        }
        if(ReadAhead.read(xml,'"',cursor) != -1){
            return false;
        }
        return true;
    }
}
