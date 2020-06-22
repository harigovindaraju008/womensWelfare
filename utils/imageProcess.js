const mongoose = require("mongoose");
/*
bucketName: serviceProviderImage
image: actual image file
fileName: the (unique) name of the file which you want to give.
        this name will be used to fetch this image
*/
const saveImage = async (bucketName, image, fileName) => {
  const gfs = () => {
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: bucketName,
    });
  };

  gfs()
    .find({
      filename: fileName,
    })
    .toArray((err, files) => {
      if (files) {
        for (let file of files) {
          gfs().delete(file._id);
        }
      }
    });

  const writeStream = gfs().openUploadStream(fileName, {
    contentType: image.mimetype,
  });

  const completion = new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve());
  });

  writeStream.end(image.data);

  await completion;
};

/*
bucketName: serviceProviderImage
image: actual image file
fileName: the (unique) name of the file which you want to give.
        this name will be used to fetch this image
*/

const loadImage = (bucketName, fileName, response) => {
  const gfs = () => {
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: bucketName,
    });
  };
  gfs()
    .find({
      filename: fileName,
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        // response.redirect("/img/sample.jpg");
      } else {
        files.map((images) => {
          response.setHeader("Content-Type", images.contentType);
          let stream = gfs().openDownloadStream(images._id);
          stream.pipe(response);
        });
      }
    });
};

module.exports = { saveImage, loadImage };
