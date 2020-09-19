/* jshint esversion: 6 */

import {Logger, Map, StringUtils} from "coreutil_v1";
import {ReadAhead} from "../readAhead.js";
import {XmlAttribute} from "../../xmlAttribute.js";

const LOG = new Logger("ElementBody");

export class ElementBody{

    constructor(){
        this.name = null;
        this.namespace = null;
        this.attributes = new Map();
    }

    detectPositions(depth, xml, cursor){
        let nameStartpos = cursor;
        let nameEndpos = null;
        while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
            cursor ++;
        }
        if(xml.charAt(cursor) == ':'){
            LOG.debug(depth, 'Found namespace');
            cursor ++;
            while (StringUtils.isInAlphabet(xml.charAt(cursor)) && cursor < xml.length) {
                cursor ++;
            }
        }
        nameEndpos = cursor-1;
        this.name = xml.substring(nameStartpos, nameEndpos+1);
        if(this.name.indexOf(":") > -1){
                this.namespace = this.name.split(":")[0];
                this.name = this.name.split(":")[1];
        }
        cursor = this.detectAttributes(depth,xml,cursor);
        return cursor;
    }

    detectAttributes(depth,xml,cursor){
        let detectedAttrNameCursor = null;
        while((detectedAttrNameCursor = this.detectNextStartAttribute(depth, xml, cursor)) != -1){
            cursor = this.detectNextEndAttribute(depth, xml, detectedAttrNameCursor);
            let namespace = null;
            let name = xml.substring(detectedAttrNameCursor,cursor+1);

            if(name.indexOf(":") > -1){
                namespace = name.split(":")[0];
                name = name.split(":")[1];
            }  

            LOG.debug(depth, 'Found attribute from ' + detectedAttrNameCursor + '  to ' + cursor);
            cursor = this.detectValue(name,namespace,depth, xml, cursor+1);
        }
        return cursor;
    }


    detectNextStartAttribute(depth, xml, cursor){
        while(xml.charAt(cursor) == ' ' && cursor < xml.length){
            cursor ++;
            if(StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-"){
                return cursor;
            }
        }
        return -1;
    }

    detectNextEndAttribute(depth, xml, cursor){
        while(StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-"){
            cursor ++;
        }
        if(xml.charAt(cursor) == ":"){
            cursor ++;
            while(StringUtils.isInAlphabet(xml.charAt(cursor)) || xml.charAt(cursor) === "-"){
                cursor ++;
            }
        }
        return cursor -1;
    }

    detectValue(name, namespace, depth, xml, cursor){
        let valuePos = cursor;
        let fullname = name;
        if(namespace !== null) {
            fullname = namespace + ":" + name;
        }
        if((valuePos = ReadAhead.read(xml,'="',valuePos,true)) == -1){
            this.attributes.set(fullname,new XmlAttribute(name,namespace,null));
            return cursor;
        }
        valuePos++;
        LOG.debug(depth, 'Possible attribute value start at ' + valuePos);
        let valueStartPos = valuePos;
        while(this.isAttributeContent(depth, xml, valuePos)){
            valuePos++;
        }
        if(valuePos == cursor){
            this.attributes.set(fullname, new XmlAttribute(name,namespace,''));
        }else{
            this.attributes.set(fullname, new XmlAttribute(name,namespace,xml.substring(valueStartPos,valuePos)));
        }

        LOG.debug(depth, 'Found attribute content ending at ' + (valuePos-1));

        if((valuePos = ReadAhead.read(xml,'"',valuePos,true)) != -1){
            valuePos++;
        }else{
            LOG.error('Missing end quotes on attribute at position ' + valuePos);
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
