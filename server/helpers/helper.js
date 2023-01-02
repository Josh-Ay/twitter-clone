const { isValidObjectId } = require("mongoose");

// function to shuffle an array
exports.shuffleArray = (arrayToShuffle) => {
    
    for (let i = arrayToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arrayToShuffle[i], arrayToShuffle[j]] = [arrayToShuffle[j], arrayToShuffle[i]];
    }

    return arrayToShuffle;
}

// function to get the top occurences in an array
exports.get_top_occurences_in_array = (arrayToCheck, occurenceLimit) => {
    // declaring an object to hold the name of the item in the array and the number of times it appears

    let countOfTagsObj = { count: 0, name: "" };
    const countOfTagsToCheckFor = [];

    for(let item of arrayToCheck){
        // if the current item array has not been added yet
        if (countOfTagsToCheckFor.every(tagObj => tagObj.name !== item)) {
            countOfTagsObj.name = item;
            countOfTagsObj.count = 1;
            countOfTagsToCheckFor.push(countOfTagsObj);

            countOfTagsObj = { count: 0, name: "" };

        }else{
            let existingTagIndex = countOfTagsToCheckFor.findIndex(tagObj => tagObj.name === item);
            countOfTagsToCheckFor[existingTagIndex].count += 1;
        }

    }

    // returning the count of the items in a list
    if (!occurenceLimit) return countOfTagsToCheckFor.sort((a, b) => b.count - a.count);

    // returning the count of the items in a sliced list
    return countOfTagsToCheckFor.sort((a, b) => b.count - a.count).slice(0, occurenceLimit);

}

// function to get remove dublicate items/objects in a list of objects
exports.get_unique_items_in_list_of_objects = (arrayToCheck, uniqueKey) => {
    return arrayToCheck.reduce((unique, o) => {
        if(!unique.some(obj => obj[uniqueKey].toString() === o[uniqueKey].toString() )) {
            unique.push(o);
        }
        return unique;
    }, [] )
}

// function to check if a mongoose id is valid
exports.isMongooseIdValid = (passedId) => isValidObjectId(passedId);
