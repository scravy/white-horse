module.exports = function (done, config) {

    setTimeout(function () {
        done(null, {
            log: console.log.bind(console),
            greet: console.log.bind(console, config.greeting)   
        });
    }, config.timeout);

};
module.exports.$inject = [ '$done', 'config/live' ];
