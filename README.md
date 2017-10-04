# DNA-IDstorage
A small "glue" nodejs package as endpoint for decentralized storage with ipfs and native crypto.

Secure end-to-end:
- https
- node native crypto aes 
- storage in public ipfs encrypted

Ultra-low footprint:
- Streaming end-to-end
- RAM-based, only touches filesystem through ipfs node connection

- upload
in: unencrypted file + password
out: ipfs url
- download
in: password + ipfs url
out: unencrypted file

The only trusted point remaining is the https server administrator and (certificates authority). If you wish to operate your own server, you need your own certificates for https.
