class ReadAhead{
    
    static read(value, matcher, cursor){
        let internalCursor = cursor;
        
        for(let i = 0; i < matcher.length && i < value.length ; i++){
            if(value.charAt(internalCursor) == matcher.charAt(i)){
                internalCursor++;
            }else{
                return -1;
            }
        }
        
        return internalCursor - 1;
    }
}