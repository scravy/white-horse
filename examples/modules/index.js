module.exports = function (logger, esprima) {

    function run() {
        logger.greet();
        logger.log('esprima.parse', esprima.parse('var x = "Hello"'));
    }

    return {
        run: run
    };

};
