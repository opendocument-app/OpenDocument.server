'use strict';

const libre = require('libreoffice-convert');
libre.convertAsync = require('util').promisify(libre.convert);

const {Storage} = require('@google-cloud/storage');
const storage = new Storage({keyFilename: 'service-account.json'});

const crypto = require('crypto');

const mmm = require('mmmagic');
const Magic = mmm.Magic;
const magic = new Magic(mmm.MAGIC_MIME_TYPE);

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const fileUpload = require('express-fileupload');
app.use(fileUpload());

app.use(express.static('public'));

async function detectType(buffer) {
  return new Promise((resolve, reject) => {
    magic.detect(buffer, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

app.post('/upload', async function(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const inputFile = req.files.document;
  const inputBuffer = inputFile.data;

  let outputBuffer;

  const type = await detectType(inputBuffer);
  if (type !== 'application/pdf') {
    outputBuffer = await libre.convertAsync(inputBuffer, '.pdf', undefined);
  } else {
    outputBuffer = inputBuffer;
  }

  const filename = crypto.randomUUID() + ".pdf";

  const remoteFile = storage.bucket('odr-eu-converter').file(filename);
  await remoteFile.save(outputBuffer);

  const fileUrl = await remoteFile.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000,
  });

  res.redirect("/viewer.html?file=" + encodeURIComponent(fileUrl.pop()));
});

app.listen(port)
