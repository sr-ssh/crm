var aws = require('aws-sdk')
var multer = require('multer')
var multerS3 = require('multer-s3')
 
aws.config.update({
  secretAccessKey: '95a59acb724a59f1e1d089b613de1374249b10969b2714f30211daf18bb35300',
  accessKeyId: 'acfb6f83-9844-4631-937d-a0595bc0af79',
  s3BucketEndpoint: false,
  endpoint: "https://s3.ir-thr-at1.arvanstorage.com"
});

var s3 = new aws.S3()

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'crm-doc',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})

module.exports = upload

