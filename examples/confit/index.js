var WhiteHorse = require('white-horse');

var whiteHorse = new WhiteHorse();

whiteHorse.register('root', __dirname);

whiteHorse
    .use(require('./package.json'))
    .use('path');

whiteHorse.run(__dirname, 'modules', 'main', function (err, main) {

    if (err) {
        console.log(err);
        return;
    }

    main();
});
