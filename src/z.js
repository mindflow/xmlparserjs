// C:\git\webclient>
// babel .\src\helloWorld\ --out-file .\out\helloworld\domParser.js --map-sources
// node .\out\helloworld\domParser.js

if(typeof document == 'undefined'){
    var domTree = new DomTree('<div><my:span>Hello &amp; world</my:span><br:bra/>Hello<br/> <span>World</span></div>');
    var now = new Date();
    console.log('Start parsing ' + now.getTime());
    domTree.load();
    now = new Date();
    console.log('End parsing ' + now.getTime());
    domTree.dump();
    now = new Date();
    console.log('Dumed ' + now.getTime());
}
