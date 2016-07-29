class Logger{

    static debugEnabled(){
        return false;
    }

    static log(value){
        console.log(value);
    }

    static debug(depth, value){
        if(!Logger.debugEnabled()){
            return;
        }
        let line = '';
        line = line + depth;
        for(let i = 0 ; i < depth ; i++){
            line = line + ' ';
        }
        line = line + value;
        console.log(line);
    }

    static warn(value){
        console.warn('------------------WARN------------------');
        console.warn(value);
        console.warn('------------------/WARN------------------');
    }

    static error(value){
        console.error('------------------ERROR------------------');
        console.error(value);
        console.error('------------------/ERROR------------------');
    }

    static showPos(text,position){
        if(!Logger.debugEnabled()){
            return;
        }
        let cursorLine = '';
        for(let i = 0 ; i < text.length ; i++) {
            if(i == position){
                cursorLine = cursorLine + '+';
            }else{
                cursorLine = cursorLine + ' ';
            }
        }
        console.log(cursorLine);
        console.log(text);
        console.log(cursorLine);

    }

}
