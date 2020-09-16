/* jshint esversion: 6 */

import {DomScaffold} from "./parser/domScaffold.js";
import {Map} from "coreutil_v1";

export class DomTree{

    constructor(xml, elementCreatedListener) {
        this.elementCreatedListener = elementCreatedListener;
        this.xml = xml;
        this.rootElement = null;
    }

    setRootElement(element) {
        this.rootElement = element;
    }

    load(){
        let domScaffold = new DomScaffold(new Map());
        domScaffold.load(this.xml,0,this.elementCreatedListener);
        this.rootElement = domScaffold.getTree();
    }

    dump(){
        this.rootElement.dump();
    }

    read(){
        return this.rootElement.read();
    }
}
