var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
// key not synched on git
var key = fs.readFileSync('./selfCert.key');
var cert = fs.readFileSync('./selfCert.crt');
var https = require('https');
var http = require('http');
var fs = require('fs')
var crypto = require('crypto');
var series = require('async/series') ; 
var IPFS = require('ipfs');

var https_options = {
        key: key,
        cert: cert
};

var PORT = 443;
var HOST = '0.0.0.0';

// Nodejs encryption of buffers

var ipfsNode = new IPFS()

ipfsNode.on('ready', (err) => {
        if (err) {
                console.error(err)
                process.exit(1)
        }

        var server =  https.createServer(https_options, function (req, res) {
                if (req.url == '/fileupload' && req.method == 'POST') {
                        var form = new formidable.IncomingForm();

                        // form parsing
                        form.parse(req, function (err, fields, files) {

                                console.log('\nFileds=\n ',fields)

                                var privateKey = new Buffer(fields.secret);
                                // create read stream to encrypt and send to ipfs
                                var rstream = fs
                                        .createReadStream(files.filetoupload.path)
                                        .pipe(crypto.createCipher('aes-256-cbc', privateKey))


                                // Upload to IPFS
                                // Create the File to add, a file consists of a path + content. More details on
                                // https://github.com/ipfs/interface-ipfs-core/tree/master/API/files
                                // asynchronous server startup and upload
                                let fileMultihash

                                ipfsNode.files.add({
                                        path: 'private_data_if_no_permission_destroy.encr',
                                        content: rstream
                                }, 
                                        // When file loaded
                                        (err, result) => {
                                                if (err) { return cb(err) }
                                                console.log('\nAdded file:', result[0].path, result[0].hash)
                                                fileMultihash = result[0].hash
                                                let fossilURL = 'https://ipfs.io/ipfs/' + result[0].hash
                                                res.writeHead(200, {'Content-Type': 'text/html'});
                                                res.write(
                                                        '<h2> Your file is now stored using the interplanetary file system and will be permanently available here:</h2>' +
                                                                '<a href="'+fossilURL+ '">'+fossilURL+'</a><br>'+
                                                                'The only way to read it is with the secret you provided, it is posted here for the last time, then it will be erased forever:<br>'+fields.secret+'<br>If shared with this location, it gives access to your data. Share wisely.<br>'
                                                                +'<a href="https://dnacoinstorage.com/">Recover files here, or upload more.</a>'
                                                        ,res.end.bind(res)
                                                )
                                        }
                                )
                        })
                }
                else if (req.url == '/filedownload' && req.method == 'POST') {

                        var form = new formidable.IncomingForm();

                        // form parsing
                        form.parse(req, function (err,fields){
                                let fileMultihash = fields.fileMultihash
                                ipfsNode.files.cat(fileMultihash,
                                        (err, stream) => {
                                                if (err) { return cb(err) }
                                                var decrypt = crypto.createDecipher('aes-256-cbc', new Buffer(fields.secret))
                                                stream.pipe(decrypt).pipe(res) 
                                                stream.on('close', () => {
                                                res.write('<h1>Downloaded...</h1>',
                                                        res.end.bind(res)
                                               );
                                                        
                                                        
                                                        
                                                })
                                        }
                                )
                        })
                }

                else if (req.url == '/' && req.method == 'GET'){
                        // Upload form
                        res.writeHead(200, {'Content-Type': 'text/html'});
                        res.write('<h1> Securely store files</h1>');
                        res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
                        res.write('Secret:<br> <input type="text" name="secret"><br>');
                        res.write('<input type="file" name="filetoupload"><br>');
                        res.write('<input type="submit">');
                        res.write('</form>');
                        res.write('<h1> Recover files</h1>');
                        res.write('<h2>Enter ipfs multihash and secret</h2>');
                        res.write('<form action="/filedownload" method="post">');
                        res.write('IPFS file multihash:<br> <input type="text" name="fileMultihash"><br>');
                        res.write('Secret:<br> <input type="text" name="secret"><br>');
                        res.write('<input type="submit" >')
                        res.write('</form>');
                        res.write('<p>* this service is used by https://dnavid.com through its API to upload personal DNA information while retaining control. <p>');
                        return res.end();
                } else{

                        res.writeHead(404, {'Content-Type': 'text/html'});
                        return res.end('The page does not exist.')
                }
        }).on('listening', (err) => {
                if (err) {
                        console.error(err)
                        process.exit(1)
                }

                console.log('HTTPS Server listening on %s:%s', HOST, PORT)
        }).listen(PORT, HOST);
})
// start server
//server = https.createServer(https_options, app).listen(PORT, HOST);
console.log('HTTPS Server listening on %s:%s', HOST, PORT);

// Redirect from http port 80 to https
http.createServer(function (req, res) {
        res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
        res.end();
}).listen(80);
