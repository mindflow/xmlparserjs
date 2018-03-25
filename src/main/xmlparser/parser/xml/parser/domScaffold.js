/* jshint esversion: 6 */

import {Map, List} from "coreutil";
import {ElementDetector} from "./detectors/elementDetector";
import {CdataDetector} from "./detectors/cdataDetector";
import {ClosingElementDetector} from "./detectors/closingElementDetector";
import {XmlCursor} from "./xmlCursor";

export class DomScaffold{

    constructor(namespaceUriMap){
        this._namespaceUriMap = namespaceUriMap;
        this._element = null;
        this._childDomScaffolds = new List();
        this._detectors = new List();
        this._elementCreatedListener = null;
        this._detectors.add(new ElementDetector(this._namespaceUriMap));
        this._detectors.add(new CdataDetector());
        this._detectors.add(new ClosingElementDetector(this._namespaceUriMap));
    }

    getElement() {
        return this._element;
    }

    load(xml, cursor, elementCreatedListener){
        let xmlCursor = new XmlCursor(xml, cursor, null);
        this.loadDepth(1, xmlCursor, elementCreatedListener);
    }

    loadDepth(depth, xmlCursor, elementCreatedListener){
        coreutil.Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
        coreutil.Logger.debug(depth, 'Starting DomScaffold');
        this._elementCreatedListener = elementCreatedListener;

        if(xmlCursor.eof()){
            coreutil.Logger.debug(depth, 'Reached eof. Exiting');
            return false;
        }

        var elementDetector = null;
        this._detectors.forEach(function(curElementDetector,parent){
            coreutil.Logger.debug(depth, 'Starting ' + curElementDetector.getType());
            curElementDetector.detect(depth + 1,xmlCursor);
            if(!curElementDetector.isFound()){
                return true;
            }
            elementDetector = curElementDetector;
            return false;
        },this);

        if(elementDetector === null){
            xmlCursor.cursor++;
            coreutil.Logger.warn('WARN: No handler was found searching from position: ' + xmlCursor.cursor);
        }

        this._element = elementDetector.createElement();

        if(elementDetector instanceof ElementDetector && elementDetector.hasChildren()) {
            let namespaceUriMap = new Map();
            namespaceUriMap.addAll(this._namespaceUriMap);
            this._element.getAttributes().forEach(function(name,curAttribute,parent){
                if("xmlns" === curAttribute.getNamespace()){
                    namespaceUriMap.set(curAttribute.getName(),curAttribute.getValue());
                }
            },this);
            while(!elementDetector.stop(depth + 1) && xmlCursor.cursor < xmlCursor.xml.length){
                let previousParentScaffold = xmlCursor.parentDomScaffold;
                let childScaffold = new DomScaffold(namespaceUriMap);
                xmlCursor.parentDomScaffold = childScaffold;
                childScaffold.loadDepth(depth+1, xmlCursor, this._elementCreatedListener);
                this._childDomScaffolds.add(childScaffold);
                xmlCursor.parentDomScaffold = previousParentScaffold;
            }
        }
        coreutil.Logger.showPos(xmlCursor.xml, xmlCursor.cursor);
    }

    getTree(parentNotifyResult){
        if(this._element === null){
            return null;
        }

        let notifyResult = this.notifyElementCreatedListener(this._element,parentNotifyResult);

        this._childDomScaffolds.forEach(function(childDomScaffold,parent) {
            let childElement = childDomScaffold.getTree(notifyResult);
            if(childElement !== null){
                parent._element.getChildElements().add(childElement);
            }
            return true;
        },this);

        return this._element;
    }

    notifyElementCreatedListener(element, parentNotifyResult) {
        if(this._elementCreatedListener !== null && this._elementCreatedListener !== undefined){
            return this._elementCreatedListener.elementCreated(element, parentNotifyResult);
        }
        return null;
    }

}
