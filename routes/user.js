var c = require('../lib/common')
  , models = c.models;

/*
 * GET users listing.
 */

exports.list = function(req, res){
  var users = User.find({}, function(err, docs){
    if(err) return res.send(500, err);
    res.render("user", {users:docs});
  });
  
};