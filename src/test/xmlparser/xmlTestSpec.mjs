import {DomTree} from "../../../es_module/xmlparser"
import {Logger} from "../../../es_module/coreutil"

export class XmlTestSpec{
  testXmlParser() {
    Logger.enableDebug();

    var domTree = new DomTree('<my:div xmlns:my="http://www.my.com" test2 test3= "" test ="123"><span my:id="1"><my:tag/><h1 id="2">Hello &amp; world</h1></span><p><br hello = "true" hello2/>Hello<br/></p><span>World</span> </my:div>');
    var now = new Date();
    Logger.log('Start parsing ' + now.getTime());
    domTree.load();
    now = new Date();
    Logger.log('End parsing ' + now.getTime());
    domTree.dump();
    now = new Date();
    Logger.log('Dumped ' + now.getTime());
  }

}

new XmlTestSpec().testXmlParser();