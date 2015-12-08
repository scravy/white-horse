module.exports.$loaders = {
	'.json': function (filename, callback) {
		callback(null, require(filename));
	}
};