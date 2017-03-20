/* jshint esversion: 6 */

import {Logger} from "coreutil"

export class XmlCdata{

	constructor(value){
        this._value = value;
    }

    setValue(value) {
        this._value = value;
    }

    getValue() {
        return this._value;
    }

    dump(){
        this.dumpLevel(0);
    }

    dumpLevel(level){
        let spacer = ':';
        for(let space = 0 ; space < level*2 ; space ++){
            spacer = spacer + ' ';
        }

        Logger.log(spacer + this._value);
        return;
    }

    read(){
        return this._value;
    }
}
