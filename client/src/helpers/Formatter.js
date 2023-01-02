class Formatter{
    static formatImageStr = (imageStr) => {
        if (imageStr.includes("https://")) return imageStr;

        // get the image directly from the server
        return `${process.env.REACT_APP_API_URL}users/media/${imageStr}`
    }

    static formatDateTime = (datetimeToFormat) => {
        const dateInstance = new Date(datetimeToFormat);

        const currentYear = new Date().getFullYear();

        let formattedDate = "";

        if (currentYear !== dateInstance.getFullYear()) {
            formattedDate = `${dateInstance.toLocaleDateString("en-US", {day:"numeric"})} ${dateInstance.toLocaleDateString("en-US", {month: "long"})} ${dateInstance.getFullYear()} at ${dateInstance.getHours() < 9 ? "0"+dateInstance.getHours() : dateInstance.getHours() }:${dateInstance.getMinutes() < 10 ? "0"+dateInstance.getMinutes() : dateInstance.getMinutes() }`
            // Example output: 23 December 2021 at 13:18
        }else {
            // Example output: 23 December at 13:18
            formattedDate = `${dateInstance.toLocaleDateString("en-US", {day:"numeric"})} ${dateInstance.toLocaleDateString("en-US", {month: "long"})} at ${dateInstance.getHours() < 9 ? "0"+dateInstance.getHours() : dateInstance.getHours() }:${dateInstance.getMinutes() < 10 ? "0"+dateInstance.getMinutes() : dateInstance.getMinutes() }`
        };
        
        return formattedDate;
    }

    static formatNumber = (numberToFormat) => {
        let formattedNumber;

        switch (true) {
            // Example output: for instance, if the numberToFormat is 191, the formatted number will be `191` 
            case (0 <= parseInt(numberToFormat) && parseInt(numberToFormat) < 999):
                formattedNumber = numberToFormat
                break;
            
            // Example output: for instance, if the numberToFormat is 1991, the formatted number will be '1.9k'
            case (1000 <= parseInt(numberToFormat) && parseInt(numberToFormat) <= 9999):
                if ( numberToFormat.toString()[1] === "0" &&  numberToFormat.toString()[2] === "0" ) formattedNumber = `${numberToFormat.toString()[0]}.${numberToFormat.toString()[1]}k`
                if ( numberToFormat.toString()[1] === "0" && numberToFormat.toString()[2] !== "0") formattedNumber = `${numberToFormat.toString()[0]}.0${numberToFormat.toString()[2]}k`
                if ( numberToFormat.toString()[1] !== "0" ) formattedNumber = `${numberToFormat.toString()[0]}.${numberToFormat.toString()[1]}k` 

                break;

            // Example output: for instance, if the numberToFormat is 16991, the formatted number will be '16.9k'
            case (10000 <= parseInt(numberToFormat) && parseInt(numberToFormat) <= 99999):
                if ( numberToFormat.toString()[2] === "0" ) formattedNumber = `${numberToFormat.toString()[0]}${numberToFormat.toString()[1]}k`
                if ( numberToFormat.toString()[2] !== "0" ) formattedNumber = `${numberToFormat.toString()[0]}${numberToFormat.toString()[1]}.${numberToFormat.toString()[2]}k`
                
                break;
            
            // Example output: for instance, if the numberToFormat is 100991, the formatted number will be '100.9k'
            case (100000 <= parseInt(numberToFormat) && parseInt(numberToFormat) <= 999999):
                if ( numberToFormat.toString()[3] === "0" ) formattedNumber = `${numberToFormat.toString()[0]}${numberToFormat.toString()[1]}${numberToFormat.toString()[2]}k`
                if ( numberToFormat.toString()[3] !== "0" ) formattedNumber = `${numberToFormat.toString()[0]}${numberToFormat.toString()[1]}${numberToFormat.toString()[2]}.${numberToFormat.toString()[3]}k`
                
                break;

            default:
                formattedNumber = numberToFormat
                break;
        }

        return formattedNumber;
    }

    static convertBufferArrayToImageStr = (bufferArray) => {
        // returning a data url of the buffer array
        return `data:image/png;base64,${Buffer.from(bufferArray, "utf8").toString("base64")}`;
    }

    static convertFileObjectToImageStr = (fileObj) => {
        
        // returning a new promise
        return new Promise((resolve, reject) => {
            // instantiating a new object of the FileReader class to read the file object passed
            const reader = new FileReader();

            // using the object to read the file as a data url i.e 'data:image/...'
            reader.readAsDataURL(fileObj);

            // on successful read of file
            reader.onload = () => resolve(reader.result);
            
            // on error reading the file
            reader.onerror = error => reject(error);
        });
    }
}

export {Formatter};
