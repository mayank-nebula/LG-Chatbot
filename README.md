const cleanDocument = (document) => {

    if (document) {
        try {
            const jsonString = document.replace(/'/g, '"').replace(/"s/g, "'s");
            const cellValueArray = JSON.parse(jsonString);
            return cellValueArray;
        } catch (error) {
            console.log(`Error parsing JSON in column: `, error);
        }
    }

}

Error parsing JSON in column:  SyntaxError: Expected ',' or '}' after property value in JSON at position 41 (line 1 column 42)
