var WhiteHorse = require('../../index.js');

// synchronous example

var container = new WhiteHorse();

container.register('greeting', function () {
    return '(1) Hello World!';
});

container.init(function (err) {
    if (err) {
        console.log(err);
        return;
    }
    
    container.inject(function (greeting) {
        console.log('0', greeting);
    });
});

// asynchronous examples

var container2 = new WhiteHorse();

container2.register('greeting', function ($done) {
    setTimeout(function () {
        $done(null, '(2) Hello World!');
    }, 2000);
});

container2.init(function (err) {
    if (err) {
        console.log(err);
        return;
    }

    var result = container2.inject(function (greeting) {
        console.log('1', greeting);
        return 'A';
    });
    console.log('2', result);

    container2.inject(function (greeting, $done) {
        setTimeout(function () {
            console.log('3', greeting);
            $done(null, 'B');
        }, 2000);
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('4', result);
    });
});

