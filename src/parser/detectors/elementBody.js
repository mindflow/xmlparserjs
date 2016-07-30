class ElementBody{

    constructor(){
        this.name = null;
        this.namespace = null;
        this.attrNames = [];
        this.attrValues = [];
    }

    detectPositions(depth, xml, cursor){
        let nameStartpos = cursor;
        let nameEndpos = null;
        let namespaceEndpos = null;
        let namespaceStartpos = null;
        while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
            cursor ++;
        }
        if(xml.charAt(cursor) == ':'){
            Logger.debug(depth, 'Found namespace');
            namespaceStartpos = nameStartpos;
            namespaceEndpos = cursor-1;
            nameStartpos = cursor+1;
            cursor ++;
            while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                cursor ++;
            }
        }
        nameEndpos = cursor-1;
        this.name = xml.substring(nameStartpos, nameEndpos+1);
        if(namespaceStartpos != null && namespaceEndpos != null){
                this.namespace = xml.substring(namespaceStartpos, namespaceEndpos+1);
        }
        cursor = this.detectAttributes(depth,xml,cursor);
        return cursor;
    }

    detectAttributes(depth,xml,cursor){
        let detectedAttrNameCursor = null;
        while((detectedAttrNameCursor = this.detectNextStartAttribute(depth, xml, cursor)) != -1){
            cursor = this.detectNextEndAttribute(depth, xml, detectedAttrNameCursor);
            this.attrNames.push(xml.substring(detectedAttrNameCursor,cursor+1));
            Logger.debug(depth, 'Found attribute from ' + detectedAttrNameCursor + '  to ' + cursor);
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
            this.attrValues.push(null);
            return cursor;
        }
        valuePos++;
        Logger.debug(depth, 'Possible attribute value start at ' + valuePos);
        let valueStartPos = valuePos;
        while(this.isAttributeContent(depth, xml, valuePos)){
            valuePos++;
        }
        if(valuePos == cursor){
            this.attrValues.push('');
        }else{
            this.attrValues.push(xml.substring(valueStartPos,valuePos));
        }

        Logger.debug(depth, 'Found attribute content ending at ' + (valuePos-1));

        if((valuePos = ReadAhead.read(xml,'"',valuePos,true)) != -1){
            valuePos++;
        }else{
            Logger.error('Missing end quotes on attribute at position ' + valuePos);
        }
        return valuePos;
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
