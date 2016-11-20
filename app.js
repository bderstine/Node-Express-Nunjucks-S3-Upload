var nunjucks  = require('nunjucks');
var express   = require('express');
var app       = express();

var config = require('config');
var formidable = require('formidable');

var Upload = require('s3-uploader');
var client = new Upload('bizzar-s3-upload', {
  aws: {
    accessKeyId: config.get('S3_ACCESS_KEY'),
    secretAccessKey: config.get('S3_SECRET_KEY'),
    path: 'images/',
    region: 'us-east-1',
    acl: 'public-read'
  },
 
  cleanup: {
    versions: true,
    original: false
  },
 
  original: {
    awsImageAcl: 'private'
  },
 
  versions: [{
    maxHeight: 1040,
    maxWidth: 1040,
    format: 'jpg',
    suffix: '-large',
    quality: 80,
    awsImageExpires: 31536000,
    awsImageMaxAge: 31536000
  },{
    maxWidth: 780,
    format: 'jpg',
    aspect: '3:2!h',
    suffix: '-medium'
  },{
    maxWidth: 320,
    format: 'jpg',
    aspect: '16:9!h',
    suffix: '-small'
  },{
    maxHeight: 100,
    aspect: '1:1',
    format: 'png',
    suffix: '-thumb1'
  },{
    maxHeight: 250,
    maxWidth: 250,
    aspect: '1:1',
    format: 'png',
    suffix: '-thumb2'
  }]
});

app.listen(3000);

nunjucks.configure('views', {
  autoescape: true,
  express   : app
});

// This is the upload form on index.html
app.get('/', function(req, res) {
  res.render('index.html', {
    title : 'My First Nunjucks Page'
  });
});

// This is the form destination vi POST
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

      client.upload(files.upload.path, {}, function(err, versions, meta) {
        if (err) { throw err; }
  
        versions.forEach(function(image) {
          console.log(image.width, image.height, image.url);
          // 1024 760 https://my-bucket.s3.amazonaws.com/path/110ec58a-a0f2-4ac4-8393-c866d813b8d1.jpg 
        });
      });

      res.contentType('text/plain');
      res.send('File upload complete!');
  });

});

