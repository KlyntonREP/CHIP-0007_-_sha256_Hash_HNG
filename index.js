// ***********importing the built in file reader/writer and hashing node packages****************
const fs = require('fs')
const crypto = require('crypto')


// ****************** getting the location of the input and ouput csv file and saving them in a variable
const inputCSVFile = `${__dirname}/HNGi9 CSV FILE - Sheet1.csv`;
const outputCSVFile = `${__dirname}/HNGi9 CSV FILE - Sheet1.output.csv`;

const genAttrObj = (str) => {
    // ***********All the rows of the CSV will be converted to JSON objects which will be added to "obj" in an array
    const obj = {};

    // ************* The array[0] contains all the header columns so we store them in headers array
    const attr = str.split(", ");
    attr.forEach((Attr) => {
        newAttr = Attr.split(": ");
        obj[newAttr[0]] = newAttr[1];
    });
    return obj
};

const getSerialNum = (arr) => {
    let total = 0;
    // ***********Since headers are separated, we need to traverse remaining n-1 rows.
    for (let i = 1; i < arr.length; i++){
        if (arr[i].includes(",,,,,,")) continue;
        total += 1;
    }
    return total;
};

// ************using the fs package to read the csv file****************
fs.readFile(inputCSVFile, "utf8", (err, data) => { 
    if(err) return err;
    const array = data.split("\r");
    const series_total = getSerialNum(array);
    // ************the array[0] contains all the header columns so we store them in the headers array and add th "Hash" column. 
    // ************This is for the for the output.csv file
    array[0] = array[0] + ", Hash";
    for (let i = 1; i < array.length; i++){
        const obj = {};
        const rowstr = array[i];
        if(rowstr.includes(",,,,,,")) {
            array[i] = rowstr + ", ";
            continue;
        }
        let formattedRowStr = "";
                
        // **************By Default, we get the comma separated values of a cell in quotes " " so we use flag to keep track of quotes and
        // **************split the string accordingly If we encounter opening quote (") then we keep commas as it is otherwise
        // **************we replace them with pipe | We keep adding the characters we  traverse to a String "formattedRowStr"
        let flag = 0;
        for(let char of rowstr){
            if(char === '"' && flag === 0){
                flag = 1;
            }else if (char === '"' && flag === 1){
                flag = 0
            }
            if(char === "," && flag === 0) char = "|";
            if(char !== '"') formattedRowStr += char;
        }
        // ************Split the string using pipe delimiter | and store the values in a properties array
        const properties = formattedRowStr.split("|");
        // ***************creating the CHIP-0007 compatible JSON**************************
        obj.format = "CHIP-0007";
        obj.name = properties[1];
        obj.description = properties[3];
        obj.minting_tool = properties[-1] || "";
        obj.sensitive_content = properties[-1] || false;
        obj.series_number = properties[0].slice(1);
        obj.seeries_total = series_total;
        obj.attributes = genAttrObj(properties[5]);
        obj.collection = {
            name: properties[1],
            id: properties[6],
            attributes: [],
        };
        obj.data = {example_data: properties[-1] || ""};
        // *****************Hashing the converted csv file to a sha256 hash********************
        const hash = crypto
        .createHash("sha256").update(JSON.stringify(obj)).digest("hex");
        array[i] = rowstr + `${hash}`;
    }
    const outputData = array.join("\r");
    fs.writeFileSync(outputCSVFile, outputData, "utf8");
});