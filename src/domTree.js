export class DomTree{

    constructor(xml) {
        this.xml = xml;
        this.rootElement = null;
    }

    load(){
        let domScaffold = new DomScaffold();
        domScaffold.load(this.xml,0,this.xml.length);
        this.rootElement = domScaffold.getTree();
    }

    dump(){
        this.rootElement.dump();
    }

    read(){
        return this.rootElement.read();
    }
}