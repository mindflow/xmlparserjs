export class XmlAttribute {

  constructor(name,value) {
      this._name = name;
      this._value = value;
  }

  getName(){
      return this._name;
  }

  setName(val){
      this._name = val;
  }

  getValue(){
      return this._value;
  }

  setValue(val){
      this._value = val;
  }
}
