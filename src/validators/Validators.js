const validateEmail = (email) => {
    //eslint-disable-next-line
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

const checkIfItemInList = (list, item, itemProperty) => {
    let check = false;
    
    // if the list passed to this function is a array of strings, numbers, ...
    if (!itemProperty){
        list.forEach((listItem) => {
            if (item === listItem) check = true;
        });
        return check;
    }

    // if the list passed is a array of objects
    list.forEach((listItem) => {
        if (item === listItem[itemProperty]) check = true;
    });

    return check;
}

const checkImageFile = (fileToCheck) =>{
    const imageExtensions = ["jpg", "jpeg", "png"]; // list of accepted image file types
    let check = false

    // check if the file type contains any of the accepted extensions in the `imageExtensions` list above
    imageExtensions.forEach((extension) => {
        if (fileToCheck.includes(extension)) check = true;
    });

    return check;
};


// function to check if there are currently no items in a list
const checkIfListIsEmpty = (listToCheck) => {
    if (listToCheck.length < 1){
      return true;
    }else{
      return false;
    }
};


export {validateEmail, checkImageFile, checkIfItemInList, checkIfListIsEmpty};
