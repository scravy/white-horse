module.exports = function ($logger, $config) {

    function run() {
        $logger($config.greeting);
    }

    return {
        run: run
    };

};
