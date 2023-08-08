const DataUriParser = require('datauri/parser.js')

const getDataUri = (name, content) => {

    const parser = new DataUriParser()
    console.log(name);

    return parser.format(name, content);

}

module.exports = getDataUri