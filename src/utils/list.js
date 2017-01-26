export class List {

    constructor() {
        this._list = [];
    }

    get(index) {
        return this._list[index];
    }

    set(index,value) {
        this._list[index] = value;
    }

    add(value) {
        this._list.push(value);
    }

    size() {
        return this._list.length;
    }

    forEach(listener,parent) {
        for(let val of this._list) {
            if(!listener(val,parent)){
                break;
            }
        }
    }

}
