const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");

exports.uploadNewCarImages = async (files, carName, carBrand) => {
  const s3Client = new S3Client();

  const uploadPromises = files.map(async (file) => {
    const param = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `New Cars/${carName}-${carBrand}/${uuid()}-${file?.originalname}`,
      Body: file?.buffer,
    };

    try {
      const command = new PutObjectCommand(param);
      await s3Client.send(command);
      const url = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${param.Key}`;
      return url;
    } catch (err) {
      console.error("Error uploading file:", err);
      throw err;
    }
  });

  return Promise.all(uploadPromises);
};
