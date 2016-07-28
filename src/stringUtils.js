class StringUtils{

    static isInAlphabet(character) {
        if (character.charCodeAt(0) >= 65 && character.charCodeAt(0) <= 90) {
            return true;
        }
        if ( character.charCodeAt(0) >= 97 && character.charCodeAt(0) <= 122 ) {
            return true;
        }
        if ( character.charCodeAt(0) >= 48 && character.charCodeAt(0) <= 57 ) {
            return true;
        }
        return false;
    }
}