var express = require('express');
var router = express.Router();
const constants = require('./constants');

/* GET builds listing. */
router.get('/', function(req, res, next) {
    console.log(constants.NAVIGATOR_BARTIFACTS);
    res.render('builds', { title: 'Builds', navigators:constants.NAVIGATOR_ARTIFACTS });
  });

module.exports = router;