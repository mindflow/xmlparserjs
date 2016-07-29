class ElementPos{

    constructor(){
        this.namespaceEndpos = null;
        this.nameEndpos = null;
        this.nameStartpos = null;
        this.nameEndpos = null;
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
        return cursor;
    }

}
