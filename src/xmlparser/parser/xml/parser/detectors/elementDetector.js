/* jshint esversion: 6 */

import {Logger} from "coreutil_v1";
import {ReadAhead} from "../readAhead.js";
import {ElementBody} from "./elementBody.js";
import {XmlElement} from "../../xmlElement.js";

const LOG = new Logger("ElementDetector");

export class ElementDetector{

    constructor(namespaceUriMap){
        this.type = 'ElementDetector';
        this.namespaceUriMap = namespaceUriMap;
        this.children = false;
        this.found = false;
        this.xmlCursor = null;
        this.element = null;
    }

    createElement() {
        return this.element;
    }

    isFound() {
        return this.found;
    }

    hasChildren() {
        return this.children;
    }

    detect(depth, xmlCursor){
        this.xmlCursor = xmlCursor;
        LOG.debug(depth, 'Looking for opening element at position ' + xmlCursor.cursor);
        let elementBody = new ElementBody();
        let endpos = ElementDetector.detectOpenElement(depth, xmlCursor.xml, xmlCursor.cursor,elementBody);
        if(endpos != -1) {

            let namespaceUri = null;
            if(elementBody.namespace !== null && elementBody.namespace !== undefined){
                namespaceUri = this.namespaceUriMap.get(elementBody.namespace);
            }

            this.element = new XmlElement(elementBody.name, elementBody.namespace, namespaceUri, false);

            elementBody.attributes.forEach(function(attributeName,attributeValue,parent){
                parent.element.attributes.set(attributeName,attributeValue);
                return true;
            },this);

            LOG.debug(depth, 'Found opening tag <' + this.element.fullName + '> from ' +  xmlCursor.cursor  + ' to ' + endpos);
            xmlCursor.cursor = endpos + 1;

            if(!this.stop(depth)){
                this.children = true;
            }
            this.found = true;
        }
    }

    stop(depth){
        LOG.debug(depth, 'Looking for closing element at position ' + this.xmlCursor.cursor);
        let closingElement = ElementDetector.detectEndElement(depth, this.xmlCursor.xml, this.xmlCursor.cursor);
        if(closingElement != -1){
            let closingTagName =  this.xmlCursor.xml.substring(this.xmlCursor.cursor+2,closingElement);
            LOG.debug(depth, 'Found closing tag </' + closingTagName + '> from ' +  this.xmlCursor.cursor  + ' to ' + closingElement);

            if(this.element.fullName != closingTagName){
                LOG.error('ERR: Mismatch between opening tag <' + this.element.fullName + '> and closing tag </' + closingTagName + '> When exiting to parent elemnt');
            }
            this.xmlCursor.cursor = closingElement +1;
            return true;
        }
        return false;
    }

    static detectOpenElement(depth, xml, cursor, elementBody) {
        if((cursor = ReadAhead.read(xml,'<',cursor)) == -1){
            return -1;
        }
        cursor ++;
        cursor = elementBody.detectPositions(depth+1, xml, cursor);
        if((cursor = ReadAhead.read(xml,'>',cursor, true)) == -1){
            return -1;
        }
        return cursor;
    }

    static detectEndElement(depth, xml, cursor){
        if((cursor = ReadAhead.read(xml,'</',cursor)) == -1){
            return -1;
        }
        cursor ++;
        cursor = new ElementBody().detectPositions(depth+1, xml, cursor);
        if((cursor = ReadAhead.read(xml,'>',cursor, true)) == -1){
            return -1;
        }
        return cursor;
    }

}
