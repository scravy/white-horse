module.exports = function (config) {

    return function () {
        console.log(config.get('greeting'));
    };

};
