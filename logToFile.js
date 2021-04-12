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