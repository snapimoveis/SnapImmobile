
/**
 * FIREBASE CLOUD FUNCTION - SNAP IMMOBILE
 * This is the server-side code if you choose to process watermarks in the cloud.
 * Requires: npm install sharp firebase-admin firebase-functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sharp = require("sharp");
const os = require("os");
const path = require("path");
const fs = require("fs");

admin.initializeApp();

exports.applyWatermark = functions.https.onCall(async (data, context) => {
  // Check Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in."
    );
  }

  const uid = context.auth.uid;
  const { photoPath, opacity = 0.8, position = "bottom-right" } = data;

  // 1. Download Original Image
  const bucket = admin.storage().bucket();
  const fileName = path.basename(photoPath);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  
  await bucket.file(photoPath).download({ destination: tempFilePath });

  // 2. Download User Watermark
  // Assuming stored at watermarks/{uid}_wm.png
  const wmPath = `watermarks/${uid}_wm.png`;
  const tempWmPath = path.join(os.tmpdir(), `wm_${uid}.png`);
  
  const wmExists = await bucket.file(wmPath).exists();
  if (!wmExists[0]) {
      throw new functions.https.HttpsError("not-found", "Watermark not found for user.");
  }
  await bucket.file(wmPath).download({ destination: tempWmPath });

  // 3. Process with Sharp
  const originalImage = sharp(tempFilePath);
  const metadata = await originalImage.metadata();
  const width = metadata.width;
  const height = metadata.height;

  // Resize watermark to 25% of image width
  const wmWidth = Math.round(width * 0.25);
  const watermarkBuffer = await sharp(tempWmPath)
    .resize({ width: wmWidth })
    .toBuffer();

  // Calculate Position
  let top = 0, left = 0;
  const margin = Math.round(width * 0.03);
  const wmMetadata = await sharp(watermarkBuffer).metadata();
  
  switch (position) {
      case 'top-left': top = margin; left = margin; break;
      case 'top-right': top = margin; left = width - wmMetadata.width - margin; break;
      case 'bottom-left': top = height - wmMetadata.height - margin; left = margin; break;
      case 'bottom-right': top = height - wmMetadata.height - margin; left = width - wmMetadata.width - margin; break;
      case 'center': 
        top = (height - wmMetadata.height) / 2;
        left = (width - wmMetadata.width) / 2;
        break;
  }

  // Composite
  const outputBuffer = await originalImage
    .composite([{
        input: watermarkBuffer,
        top: Math.round(top),
        left: Math.round(left),
        blend: 'over',
        opacity: opacity // Sharp logic for opacity might vary, often need to manipulate alpha channel of watermark input first if sharp version < 0.30
    }])
    .jpeg({ quality: 90 })
    .toBuffer();

  // 4. Upload Processed Image to Temp Location
  const outputFileName = `processed_${fileName}`;
  const outputStoragePath = `temp/${uid}/${outputFileName}`;
  
  await bucket.file(outputStoragePath).save(outputBuffer, {
      contentType: 'image/jpeg'
  });

  // 5. Return Signed URL for Download
  const file = bucket.file(outputStoragePath);
  const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60, // 1 hour
  });

  // Cleanup temp files
  fs.unlinkSync(tempFilePath);
  fs.unlinkSync(tempWmPath);

  return { url };
});
