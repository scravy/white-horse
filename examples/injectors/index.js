var WhiteHorse = require('../../index.js');

function logger(source, message) {
    console.log(source, 'says', message);
}

var config = {
    index: {
        greeting: 'jikes'
    }
};

new WhiteHorse({
    injectors: {
        '$logger': function (module) {
            return logger.bind(null, module.$name);
        }
    }   
})

.registerInjector('$config', function (module) {
    return config[module.$name];
})

.run(__dirname, 'modules', 'index', function (err, index) {
    if (err) {
        console.log('Aww, snap!');
        console.log(err);
        return;
    }
    index.run();
});
