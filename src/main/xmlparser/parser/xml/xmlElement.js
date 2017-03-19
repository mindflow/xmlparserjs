import {Logger, List, Map} from "coreutil"
import {XmlCdata} from "./xmlCdata"


export class XmlElement{

	constructor(name, namespace, selfClosing, childElements){
        this._name = name;
        this._namespace = namespace;
        this._selfClosing = selfClosing;
        this._childElements = new List();
        this._attributes = new Map();
    }

    getName() {
        return this._name;
    }

    getNamespace() {
        return this._namespace;
    }

    getFullName() {
        if(this._namespace == null){
            return this._name;
        }
        return this._namespace + ':' + this._name;
    }

    getAttributes(){
        return this._attributes;
    }

    setAttributes(attributes){
        this._attributes = attributes;
    }

    setAttribute(key,value) {
		this._attributes.set(key,value);
	}

	getAttribute(key) {
		return this._attributes.get(key);
	}

    containsAttribute(key){
        return this._attributes.contains(key);
    }

	clearAttribute(){
		this._attributes = new Map();
	}

    getChildElements(){
        return this._childElements;
    }

    setChildElements(elements) {
        this._childElements = elements;
    }

    setText(text){
        this._childElements = new List();
        this.addText(text);
    }

    addText(text){
        let textElement = new XmlCdata(text);
        this._childElements.add(textElement);
    }

    dump(){
        this.dumpLevel(0);
    }

    dumpLevel(level){
        let spacer = ':';
        for(let space = 0 ; space < level*2 ; space ++){
            spacer = spacer + ' ';
        }

        if(this._selfClosing){
            Logger.log(spacer + '<' + this.getFullName() + this.readAttributes() + '/>');
            return;
        }
        Logger.log(spacer + '<' + this.getFullName() + this.readAttributes() + '>');
        this._childElements.forEach(function(childElement){
            childElement.dumpLevel(level+1);
            return true;
        });
        Logger.log(spacer + '</' + this.getFullName() + '>');
    }

    read(){
        let result = '';
        if(this._selfClosing){
            result = result + '<' + this.getFullName() + this.readAttributes() + '/>';
            return result;
        }
        result = result + '<' + this.getFullName() + this.readAttributes() + '>';
        this._childElements.forEach(function(childElement){
            result = result + childElement.read();
            return true;
        });
        result = result + '</' + this.getFullName() + '>';
        return result;
    }

    readAttributes(){
        let result = '';
        this._attributes.forEach(function (key,attribute,parent) {
            result = result + ' ' + attribute.getName();
            if(attribute.getValue() != null){
                result = result + '="' + attribute.getValue() + '"';
             }
             return true;
        },this);
        return result;
    }
}
