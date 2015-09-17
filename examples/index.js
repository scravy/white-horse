var WhiteHorse = require('../index.js');

new WhiteHorse()

.on('before_init', function (module) {
    console.log('Initializing', module);
})

.on('after_init', function (module) {
    console.log('Initialized', module);
})

.on('require', function (file) {
    console.log('Requiring', file);
})

.use(require('../package.json'))

.run(__dirname, 'modules', 'index', function (err, index) {
    if (err) {
        console.log('Aww, snap!');
        console.log(err);
        return;
    }
    index.run();
});
