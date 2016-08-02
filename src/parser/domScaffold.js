class DomScaffold{

    constructor(){
        this.name = null;
        this.selfClosing = false;
        this.attrNames = [];
        this.attrValues = [];
        this.childDomScaffolds = [];
        this.value = null;
        this.found = null;
        this.detectors = [];
        this.elementCreatedListener = null;
        this.detectors.push(new ElementDetector(), new ContentDetector(), new ClosingElementDetector());
    }

    load(xml, cursor, elementCreatedListener){
        let xmlCursor = new XmlCursor(xml, cursor, null);
        this.loadDepth(1, xmlCursor, elementCreatedListener);
    }

    fullName(){
        if(this.namespace == null){
            return this.name;
        }
        return this.namespace + ':' + this.name;
    }

    loadDepth(depth, xmlCursor, elementCreatedListener){
        Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
        Logger.debug(depth, 'Starting DomScaffold');
        this.elementCreatedListener = elementCreatedListener;

        for(let elementDetector of this.detectors) {
            if(xmlCursor.eof()){
                Logger.debug(depth, 'Reached eof. Exiting');
                return;
            }
            Logger.debug(depth, 'Starting ' + elementDetector.type);
            elementDetector.detect(depth + 1,xmlCursor);
            if(!elementDetector.found){
                continue;
            }

            this.found = true;
            this.name = elementDetector.name;
            this.namespace = elementDetector.namespace;
            this.value = elementDetector.value;
            this.selfClosing = elementDetector.selfClosing;
            if(elementDetector.attrNames != null){
                this.attrNames = elementDetector.attrNames;
                this.attrValues = elementDetector.attrValues;
            }

            if(elementDetector.selfClosing || !elementDetector.hasChildren){
                return;
            }

            while(!elementDetector.stop(depth + 1) && xmlCursor.cursor < xmlCursor.xml.length){
                let previousParentScaffold = xmlCursor.parentDomScaffold;

                let childScaffold = new DomScaffold();
                xmlCursor.parentDomScaffold = childScaffold;
                childScaffold.loadDepth(depth+1, xmlCursor, this.elementCreatedListener);
                this.childDomScaffolds.push(childScaffold);

                xmlCursor.parentDomScaffold = previousParentScaffold;
            }
            Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
            return;
        }
        xmlCursor.cursor++;
        Logger.warn('WARN: No handler was found searching from position: ' + xmlCursor.cursor);
    }

    getTree(){
        if(!this.found){
            return null;
        }
        let element = new XmlElement();
        element.name = this.name;
        element.namespace = this.namespace;
        element.value = this.value;
        element.selfClosing = this.selfClosing;

        for(let i=0; i< this.attrNames.length; i++){
            let attribute = new XmlAttribute(this.attrNames[i],this.attrValues[i]);
            element.attributes.push(attribute);
        }

        if(this.elementCreatedListener != null){
            this.elementCreatedListener.elementCreated(element);
        }

        for(let childScaffold of this.childDomScaffolds) {
            let childElement = childScaffold.getTree();
            if(childElement != null){
                element.childElements.push(childElement);
            }
        }

        return element;
    }

}
