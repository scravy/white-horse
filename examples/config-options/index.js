var WhiteHorse = require('../../index.js');

var container = new WhiteHorse({
    npmPrefix: '$',
    npmPostfix: '_',
    npmNormalize: true
});

container.use('mac-address-123');

console.log(container.modules(true));
