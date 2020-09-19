/* jshint esversion: 6 */

import {Logger} from "coreutil_v1"

const LOG = new Logger("XmlCdata");

export class XmlCdata{

	constructor(value){
        this.value = value;
    }

    dump(){
        this.dumpLevel(0);
    }

    dumpLevel(level){
        let spacer = ':';
        for(let space = 0 ; space < level*2 ; space ++){
            spacer = spacer + ' ';
        }

        LOG.info(spacer + this.value);
        return;
    }

    read(){
        return this.value;
    }
}
