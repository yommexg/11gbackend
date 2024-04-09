const { S3 } = require("aws-sdk");

const uuid = require("uuid").v4;

exports.uploadAvatarS3 = async (file, username) => {
  const s3 = new S3();

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `avatar/${uuid()}-${username}-${file?.originalname}`,
    Body: file?.buffer,
  };

  return s3.upload(param).promise();
};
