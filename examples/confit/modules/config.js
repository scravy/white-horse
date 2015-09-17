module.exports = function (path, root, confit, $done) {

    confit(path.join(root, 'config')).create($done);
    
};
