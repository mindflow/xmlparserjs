export class DomTree{

    constructor(xml, elementCreatedListener) {
        this._elementCreatedListener = elementCreatedListener;
        this._xml = xml;
        this._rootElement = null;
    }

    getRootElement() {
        return this._rootElement;
    }

    setRootElement(element) {
        this._rootElement = element;
    }

    load(){
        let domScaffold = new DomScaffold();
        domScaffold.load(this._xml,0,this._elementCreatedListener);
        this._rootElement = domScaffold.getTree();
    }

    dump(){
        this._rootElement.dump();
    }

    read(){
        return this._rootElement.read();
    }
}
