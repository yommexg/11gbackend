// const { S3 } = require("aws-sdk");

// const uuid = require("uuid").v4;

// exports.uploadAvatarS3 = async (file, username) => {
//   const s3 = new S3();

//   const param = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: `avatar/${uuid()}-${username}-${file?.originalname}`,
//     Body: file?.buffer,
//   };

//   return s3.upload(param).promise();
// };

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuid } = require("uuid");

exports.uploadAvatarS3 = async (file, username) => {
  const s3Client = new S3Client();

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `avatar/${uuid()}-${username}-${file?.originalname}`,
    Body: file?.buffer,
  };

  try {
    const command = new PutObjectCommand(param);
    await s3Client.send(command);

    const url = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${param.Key}`;

    // const command2 = new GetObjectCommand(param);
    // const url = await getSignedUrl(s3Client, command2, { Expires: 3600 }); // Expires in 1 hour
    return url;
  } catch (err) {
    console.error("Error uploading avatar or generating pre-signed URL:", err);
    throw err;
  }
};
