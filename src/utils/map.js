export class Map {

    constructor() {
        this._map = {};
    }

    get(name) {
        return this._map[name];
    }

    set(name,value) {
        this._map[name] = value;
    }

    forEach(listener,parent) {
        for(let key in this._map) {
            if(!listener(key,this._map[key],parent)){
                break;
            }
        }
    }

}
