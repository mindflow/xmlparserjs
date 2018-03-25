/* jshint esversion: 6 */

export class XmlAttribute {

  constructor(name,namespace,value) {
      this._name = name;
      this._namespace = namespace;
      this._value = value;
  }

  getName(){
      return this._name;
  }

  setName(val){
      this._name = val;
  }

  getNamespace(){
    return this._namespace;
  }

  setNamespace(val){
    this._namespace = val;
  }

  getValue(){
      return this._value;
  }

  setValue(val){
      this._value = val;
  }
}
