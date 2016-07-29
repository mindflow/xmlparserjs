export class XmlAttribute {

  constructor(name,value) {
      this._name = name;
      this._value = value;
  }

  get name(){
      return this._name;
  }

  set name(val){
      this._name = val;
  }

  get value(){
      return this._value;
  }

  set value(val){
      this._value = val;
  }
}
