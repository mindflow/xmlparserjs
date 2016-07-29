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
        this.detectors.push(new ElementDetector(), new ContentDetector(), new ClosingElementDetector());
    }

    load(xml, cursor){
        let xmlView = new XmlView(xml, cursor, null);
        this.loadDepth(1, xmlView);
    }

    fullName(){
        if(this.namespace == null){
            return this.name;
        }
        return this.namespace + ':' + this.name;
    }

    loadDepth(depth, xmlView){
        Logger.debug(depth, 'Starting DomScaffold');

        Logger.showPos(xmlView.xml, xmlView.cursor);
        for(let elementDetector of this.detectors) {
            if(xmlView.eof()){
                Logger.debug(depth, 'Reached eof. Exiting');
                return;
            }
            Logger.debug(depth, 'Starting ' + elementDetector.type);
            elementDetector.detect(depth + 1,xmlView);
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

            while(!elementDetector.stop(depth + 1) && xmlView.cursor < xmlView.xml.length){
                let previousParentScaffold = xmlView.parentDomScaffold;

                let childScaffold = new DomScaffold();
                xmlView.parentDomScaffold = childScaffold;
                childScaffold.loadDepth(depth+1, xmlView );
                this.childDomScaffolds.push(childScaffold);

                xmlView.parentDomScaffold = previousParentScaffold;
            }
            Logger.showPos(xmlView.xml, xmlView.cursor);
            return;
        }
        Logger.warn('WARN: No handler was found searching from position: ' + xmlView.cursor);
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

        for(let childScaffold of this.childDomScaffolds) {
            let childElement = childScaffold.getTree();
            if(childElement != null){
                element.childElements.push(childElement);
            }
        }
        return element;
    }

}
