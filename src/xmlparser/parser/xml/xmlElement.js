/* jshint esversion: 6 */

import {Logger, List, Map} from "coreutil_v1";
import {XmlCdata} from "./xmlCdata.js";

const LOG = new Logger("XmlElement");

export class XmlElement{

	constructor(name, namespace, namespaceUri, selfClosing){
        this.name = name;
        this.namespace = namespace;
        this.selfClosing = selfClosing;
        this.childElements = new List();
        this.attributes = new Map();
        this.namespaceUri = namespaceUri;
    }

    get fullName() {
        if(this.namespace === null){
            return this.name;
        }

        return this.namespace + ':' + this.name;
    }

    setAttribute(key,value) {
		this.attributes.set(key,value);
	}

	getAttribute(key) {
		return this.attributes.get(key);
	}

    containsAttribute(key){
        return this.attributes.contains(key);
    }

	clearAttribute(){
		this.attributes = new Map();
	}

    setText(text){
        this.childElements = new List();
        this.addText(text);
    }

    addText(text){
        let textElement = new XmlCdata(text);
        this.childElements.add(textElement);
    }

    dump(){
        this.dumpLevel(0);
    }

    dumpLevel(level){
        let spacer = ':';
        for(let space = 0 ; space < level*2 ; space ++){
            spacer = spacer + ' ';
        }

        if(this.selfClosing){
            LOG.info(spacer + '<' + this.fullName + this.readAttributes() + '/>');
            return;
        }
        LOG.info(spacer + '<' + this.fullName + this.readAttributes() + '>');
        this.childElements.forEach(function(childElement){
            childElement.dumpLevel(level+1);
            return true;
        });
        LOG.info(spacer + '</' + this.fullName + '>');
    }

    read(){
        let result = '';
        if(this.selfClosing){
            result = result + '<' + this.fullName + this.readAttributes() + '/>';
            return result;
        }
        result = result + '<' + this.fullName + this.readAttributes() + '>';
        this.childElements.forEach(function(childElement){
            result = result + childElement.read();
            return true;
        });
        result = result + '</' + this.fullName + '>';
        return result;
    }

    readAttributes(){
        let result = '';
        this.attributes.forEach(function (key,attribute,parent) {
            let fullname = attribute.name;
            if(attribute.namespace !== null && attribute.namespace !== undefined) {
                fullname = attribute.namespace + ":" + attribute.name;
            }
            result = result + ' ' + fullname;
            if(attribute.value !== null){
                result = result + '="' + attribute.value + '"';
             }
             return true;
        },this);
        return result;
    }
}
