var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
// key not synched on git
var key = fs.readFileSync('./selfCert.key');
var cert = fs.readFileSync('./selfCert.crt')
var https = require('https');
var http = require('http');
var fs = require('fs')
var crypto = require('crypto');
var series = require('async/series')  
var IPFS = require('ipfs')

var https_options = {
        key: key,
        cert: cert
};

var PORT = 443;
var HOST = '0.0.0.0';

// Nodejs encryption of buffers
var privateKey = new Buffer('my secret');
var aes = crypto.createCipher('aes-256-cbc', privateKey);

// Upload to IPFS
// Create the File to add, a file consists of a path + content. More details on
// https://github.com/ipfs/interface-ipfs-core/tree/master/API/files


function uploadToIPFS(path='hello.txt', content=Buffer.from('Hello World 101')) {
        // asynchronous server startup and upload
        const ipfsNode = new IPFS()
        let fileMultihash
        (
                series(
                        [
                                // 1. load ipfs server
                                (cb) => ipfsNode.on('ready', cb),

                                // 2. After loading ipfs 
                                (cb) => ipfsNode.files.add({
                                        path: path,
                                        content: content
                                }, 
                                        // When file loaded
                                        (err, result) => {
                                                if (err) { return cb(err) }
                                                console.log('\nAdded file:', result[0].path, result[0].hash)
                                                fileMultihash = result[0].hash
                                                // Wait for completion
                                                cb()
                                        }
                                )
                        ]
                )
        )
        return
}

https.createServer(https_options, function (req, res) {
        if (req.url == '/fileupload' && req.method == 'POST') {
                var form = new formidable.IncomingForm();

                // form parsing
                form.parse(req, function (err, fields, files) {
                        // Move to upload directory
                        var oldpath = files.filetoupload.path;
                        var newpath = '/home/davidweisss/DNA-IDstorage/uploads/' + files.filetoupload.name;
                        fs.rename(oldpath, newpath, function (err) {
                                if (err) throw err;
                        });

                        // Encrypt and upload to ipfs
                        var rstream = fs.createReadStream(newpath);
                        uploadToIPFS('confidential.encr', rstream.pipe(aes))
                })

        }
        else {
                // Upload form
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write('<h1> Store and send encrypted content to anyone</h1>');
                res.write('<h2>Encrypt and store in always-available, non-erasable peer-to-peer storage <br> Access and share with keys on www.</h2>');
                res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
                res.write('<input type="file" name="filetoupload"><br>');
                res.write('<input type="submit">');
                res.write('</form>');
                res.write('<p>secure https server encrypting your info then uploading it to permanent peer to peer storage network (ipfs). <br> </br> Gives you a web adress (ipfs) and a password to decrypt your data</p>');
                res.write('<p>Only you, and whomever you share the key with, has access</p>');
                res.write('<p>* this service is used by https://dnavid.com through its API to upload personal DNA information while retaining control. <p>');
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
