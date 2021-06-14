module.exports.logToFile = (_text, _file = 'default.log') => 
    require('fs').appendFile(
        _file, 
        `${getDateAsText()}: ${_text}\r\n`, 
        'utf8', 
        errorMessage => errorMessage && console.log(getDateAsText() + ': ' + errorMessage)
    )

const getDateAsText = (_date = new Date()) => 
        '['
        + appendZeroToLength(_date.getFullYear(),  4) + '.'
        + appendZeroToLength(_date.getMonth() + 1, 2) + '.'
        + appendZeroToLength(_date.getDate(),      2) + '  '
        + appendZeroToLength(_date.getHours(),     2) + ':'
        + appendZeroToLength(_date.getMinutes(),   2) + ':'
        + appendZeroToLength(_date.getSeconds(),   2)
        + ']'

const appendZeroToLength = (_value, _length) => `${_value}`.padStart(_length, 0)

module.exports.writeAddress = _instance => {
    let prev = undefined
    try {prev = require('./lastDeployedAddresses.json')}catch (e) {prev = {}}
    prev[_instance.constructor._json.contractName] = _instance.address
    require('fs').writeFileSync(`./lastDeployedAddresses.json`, JSON.stringify(prev, null, 4), () => console.log(`${_instance.constructor._json.contractName}@${_instance.address} stored!`))
    
    return _instance
}

module.exports.writeAddress_raw = (_address, _name) => {
    let prev = undefined
    try {prev = require('./lastDeployedAddresses.json')}catch (e) {prev = {}}
    prev[_name] = _address
    require('fs').writeFileSync(`./lastDeployedAddresses.json`, JSON.stringify(prev, null, 4), () => console.log(`${_name}@${_address} stored!`))
    
    return _address
}