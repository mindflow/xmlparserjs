// import DomElementAttribute from 'domElementAttribute.js';

export class DomElement{

	constructor(name, namespace, selfClosing, childElements){
        this.name = name;
        this.namespace = namespace;
        this.selfClosing = false;
        this.childElements = [];
        this.attributes = [];
        this.value = null;
    }

    fullName(){
        if(this.namespace == null){
            return this.name;
        }
        return this.namespace + ':' + this.name;
    }

    dump(){
        this.dumpLevel(0);
    }

    dumpLevel(level){
        let spacer = ':';
        for(let space = 0 ; space < level*2 ; space ++){
            spacer = spacer + ' ';
        }

        if(this.value != null){
            Logger.log(spacer + this.value);
            return;
        }
        if(this.selfClosing){
            Logger.log(spacer + '<' + this.fullName() + this.readAttributes() + '/>');
            return;
        }
        Logger.log(spacer + '<' + this.fullName() + this.readAttributes() + '>');
        for(let childElement of this.childElements){
            childElement.dumpLevel(level+1);
        }
        Logger.log(spacer + '</' + this.fullName() + '>');
    }

    read(){
        let result = '';
        if(this.value != null){
            result = result + this.value;
            return result;
        }
        if(this.selfClosing){
            result = result + '<' + this.fullName() + this.readAttributes() + '/>';
            return result;
        }
        result = result + '<' + this.fullName() + this.readAttributes() + '>';
        for(let childElement of this.childElements){
            result = result + childElement.read();
        }
        result = result + '</' + this.fullName() + '>';
        return result;
    }

    readAttributes(){
        let result = '';
        for(let attribute of this.attributes){
            result = result + ' ' + attribute.name;
            if(attribute.value != null){
                result = result + '="' + attribute.value + '"';
             }
        }
        return result;
    }
}
