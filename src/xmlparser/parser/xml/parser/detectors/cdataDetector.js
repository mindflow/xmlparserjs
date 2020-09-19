/* jshint esversion: 6 */
import {Logger} from "coreutil_v1";
import {XmlCdata} from "../../xmlCdata.js";
import {ReadAhead} from "../readAhead.js";

const LOG = new Logger("CdataDetector");

export class CdataDetector{

    constructor(){
        this.type = 'CdataDetector';
        this.value = null;
        this.found = false;
    }

    isFound() {
        return this.found;
    }

    createElement() {
        return new XmlCdata(this.value);
    }

    detect(depth, xmlCursor){
        this.found = false;
        this.value = null;

        let endPos = this.detectContent(depth, xmlCursor.xml, xmlCursor.cursor, xmlCursor.parentDomScaffold);
        if(endPos != -1) {
            this.found = true;
            this.hasChildren = false;
            this.value = xmlCursor.xml.substring(xmlCursor.cursor,endPos);
            xmlCursor.cursor = endPos;
        }
    }

    detectContent(depth, xml, cursor, parentDomScaffold) {
        LOG.debug(depth, 'Cdata start at ' + cursor);
        let internalStartPos = cursor;
        if(!CdataDetector.isContent(depth, xml, cursor)){
            LOG.debug(depth, 'No Cdata found');
            return -1;
        }
        while(CdataDetector.isContent(depth, xml, cursor) && cursor < xml.length){
            cursor ++;
        }
        LOG.debug(depth, 'Cdata end at ' + (cursor-1));
        if(parentDomScaffold === null){
            LOG.error('ERR: Content not allowed on root level in xml document');
            return -1;
        }
        LOG.debug(depth, 'Cdata found value is ' + xml.substring(internalStartPos,cursor));
        return cursor;
    }

    static isContent(depth, xml, cursor){
        if(ReadAhead.read(xml,'<',cursor) != -1){
            return false;
        }
        if(ReadAhead.read(xml,'>',cursor) != -1){
            return false;
        }
        return true;
    }
}
