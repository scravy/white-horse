/* vim: set et sw=2 ts=2: */
'use strict';

module.exports = function findCommonPrefix(leftString, rightString) {
	var prefix = "";
	for (var i = 0; i < Math.min(leftString.length, rightString.length) && leftString[i] == rightString[i]; i += 1) {
		prefix += leftString[i];
	}
	return prefix;
};