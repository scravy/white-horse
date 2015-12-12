module.exports.$modules = {

    shared: function ($done) {
        $done(null, 13);
    },

    hello: function (shared) {
        return shared + 7;
    },

    world: function (shared) {
        return shared - 3;
    }
};
