/* jshint esversion: 6 */

import {Logger} from "coreutil_v1"

export class XmlCdata{

	constructor(value){
        this.value = value;
    }

    setValue(value) {
        this.value = value;
    }

    getValue() {
        return this.value;
    }

    dump(){
        this.dumpLevel(0);
    }

    dumpLevel(level){
        let spacer = ':';
        for(let space = 0 ; space < level*2 ; space ++){
            spacer = spacer + ' ';
        }

        Logger.log(spacer + this.value);
        return;
    }

    read(){
        return this.value;
    }
}
