var nunjucks  = require('nunjucks');
var express   = require('express');
var app       = express();

var sleep = require('sleep');
var im = require('imagemagick');
var fs = require('fs');
var formidable = require('formidable');
var http = require('http');
var util = require('util');
var AWS  = require('aws-sdk');
var config = require('config');
var s3 = new AWS.S3({
    accessKeyId: config.get('S3_ACCESS_KEY'),
    secretAccessKey: config.get('S3_SECRET_KEY'),
    apiVersion: '2006-03-01'
});

var myBucket = 'bizzar-s3-upload';

app.listen(3000);

nunjucks.configure('views', {
  autoescape: true,
  express   : app
});

app.get('/', function(req, res) {
  res.render('index.html', {
    title : 'My First Nunjucks Page',
    items : [
      { name : 'item #1' },
      { name : 'item #2' },
      { name : 'item #3' },
      { name : 'item #4' },
    ]
  });
});

app.post('/upload', function(req, res) {

  var form = new formidable.IncomingForm();

  form.on('error', function(err) {
      console.log('err', err);
  });

  form.on('aborted', function() {
      console.log('aborted', arguments);
  });

  form.parse(req, function(err, fields, files) {

      //console.log('Path: '+files.upload.path);
      //console.log('Type: '+files.upload.type);
      //console.log('Size: '+files.upload.size);

      im.resize({
        srcPath: files.upload.path,
        dstPath: files.upload.path+'_100',
        width: 100
      }, function(err, stdout, stderr){
        if (err) throw err;
      });

      sleep.sleep(3); //too fast, need to wait for file to save first
      var fileContents = fs.readFileSync(files.upload.path+'_100');

      s3.createBucket(function() {
        var params = {Bucket: myBucket, Key: files.upload.name, Body: fileContents};
        s3.upload(params, function(err, data) {
         if (err) {
            console.log("Error uploading data: ", err);
          } else {
            console.log("Successfully uploaded data to "+myBucket+"/"+files.upload.name);
          }
        });
      });

      res.contentType('text/plain');
      res.send(util.inspect({fields: fields, files: files}));
  });

});

