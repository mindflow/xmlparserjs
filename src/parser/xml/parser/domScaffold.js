class DomScaffold{

    constructor(){
        this._element = null;
        this._childDomScaffolds = new List();
        this._detectors = new List();
        this._elementCreatedListener = null;
        this._detectors.add(new ElementDetector());
        this._detectors.add(new CdataDetector());
        this._detectors.add(new ClosingElementDetector());
    }

    load(xml, cursor, elementCreatedListener){
        let xmlCursor = new XmlCursor(xml, cursor, null);
        this.loadDepth(1, xmlCursor, elementCreatedListener);
    }

    loadDepth(depth, xmlCursor, elementCreatedListener){
        Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
        Logger.debug(depth, 'Starting DomScaffold');
        this._elementCreatedListener = elementCreatedListener;

        if(xmlCursor.eof()){
            Logger.debug(depth, 'Reached eof. Exiting');
            return false;
        }

        var elementDetector = null;
        this._detectors.forEach(function(curElementDetector,parent){
            Logger.debug(depth, 'Starting ' + curElementDetector.getType());
            curElementDetector.detect(depth + 1,xmlCursor);
            if(!curElementDetector.isFound()){
                return true;
            }
            elementDetector = curElementDetector;
            return false;
        },this);

        if(elementDetector == null){
            xmlCursor.cursor++;
            Logger.warn('WARN: No handler was found searching from position: ' + xmlCursor.cursor);
        }

        this._element = elementDetector.createElement();

        if(elementDetector instanceof ElementDetector && elementDetector.hasChildren()) {
            while(!elementDetector.stop(depth + 1) && xmlCursor.cursor < xmlCursor.xml.length){
                let previousParentScaffold = xmlCursor.parentDomScaffold;
                let childScaffold = new DomScaffold();
                xmlCursor.parentDomScaffold = childScaffold;
                childScaffold.loadDepth(depth+1, xmlCursor, this._elementCreatedListener);
                this._childDomScaffolds.add(childScaffold);
                xmlCursor.parentDomScaffold = previousParentScaffold;
            }
        }
        Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
    }

    getTree(){
        if(this._element == null){
            return null;
        }

        this.notifyElementCreatedListener(this._element);

        this._childDomScaffolds.forEach(function(childScaffold,parent) {
            let childElement = childScaffold.getTree();
            if(childElement != null){
                parent._element.getChildElements().add(childElement);
            }
            return true;
        },this);

        return this._element;
    }

    notifyElementCreatedListener(element) {
        if(this._elementCreatedListener != null){
            this._elementCreatedListener.elementCreated(element);
        }
    }

}
