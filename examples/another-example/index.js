var WhiteHorse = require('white-horse');

var container = new WhiteHorse();

container.use(require('./package.json'));

container.register('main', function (request) {
    return {
        run: function () {
            request('http://www.google.com', function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body.length) // Show the HTML for the Google homepage. 
                }
            });
        }
    };
});

container.init(function () {
    container.get('main').run();
});
