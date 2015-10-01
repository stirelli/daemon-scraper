'use strict'

var request = require('request');
var express = require('express');
var app = express();

var parser = require('./parser.js');
var p = new parser();

var port = process.argv[2] || 3007;

app.get('*', function(req, res) {

    var options = {
        url: req.query.url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36'
        }
    };

    request(options, function (error, response, html) {
        var data;
        try {
            if (!error && response.statusCode == 200) {
                p.init();
                data = p.getPreview(html, options.url);
            } else {
                throw error.message;
            }
        } catch(err) {
            data = {error: err};
        } finally {
            res.send(data);
        }
    });
});

console.log('listening on localhost:'+port+'\n');
app.listen(port, '0.0.0.0');