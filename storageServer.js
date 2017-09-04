const express = require('express');
const formidable = require('formidable');
var fs = require('fs');
// key not synched on git
var key = fs.readFileSync('./selfCert.key');
var cert = fs.readFileSync('./selfCert.crt')
var https = require('https');
var http = require('http');
var fs = require('fs')
var https_options = {
        key: key,
        cert: cert
};
var PORT = 443;
var HOST = '0.0.0.0';


https.createServer(https_options, function (req, res) {
        if (req.url == '/fileupload') {
                var form = new formidable.IncomingForm();
                form.parse(req, function (err, fields, files) {
                        var oldpath = files.filetoupload.path;
                        var newpath = '/home/davidweisss/DNA-IDstorage/uploads/' + files.filetoupload.name;
                        fs.rename(oldpath, newpath, function (err) {
                                if (err) throw err;
                                res.write('File uploaded and moved!');
                                res.end();
                        });
                });
        } else {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
                res.write('<input type="file" name="filetoupload"><br>');
                res.write('<input type="submit">');
                res.write('</form>');
                return res.end();
        }
}).listen(PORT, HOST);

// start server
//server = https.createServer(https_options, app).listen(PORT, HOST);
console.log('HTTPS Server listening on %s:%s', HOST, PORT);

// Redirect from http port 80 to https
http.createServer(function (req, res) {
        res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
        res.end();
}).listen(80);
