import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('\n🔍 Testing Cloudinary Configuration & Connection...\n');
console.log(`Cloud Name : ${cloudName ? cloudName : '❌ Missing'}`);
console.log(`API Key    : ${apiKey ? apiKey.substring(0, 4) + '...' + apiKey.slice(-4) : '❌ Missing'}`);
console.log(`API Secret : ${apiSecret ? '••••••••••••••••' : '❌ Missing'}\n`);

if (!cloudName || !apiKey || !apiSecret || apiSecret === 'your_cloudinary_api_secret' || apiSecret === 'sample_secret_key') {
  console.error('❌ Error: Cloudinary credentials are not properly set in backend/.env');
  console.log('👉 Please open backend/.env and provide your actual CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

async function runTest() {
  try {
    // 1. Test ping
    console.log('1️⃣ Pinging Cloudinary API...');
    const pingResult = await cloudinary.api.ping();
    console.log('   ✅ Cloudinary API Ping successful:', pingResult);

    // 2. Test upload
    console.log('\n2️⃣ Testing image upload to impactlens/test folder...');
    const testSampleUrl = 'https://images.pexels.com/photos/38071557/pexels-photo-38071557.jpeg?auto=compress&cs=tinysrgb&h=400&w=600';
    
    const uploadResult = await cloudinary.uploader.upload(testSampleUrl, {
      folder: 'impactlens/test',
      public_id: `test_${Date.now()}`,
      resource_type: 'image',
    });

    console.log('   ✅ Upload Successful!');
    console.log(`   • Public ID   : ${uploadResult.public_id}`);
    console.log(`   • Secure URL  : ${uploadResult.secure_url}`);
    console.log(`   • Format      : ${uploadResult.format}`);
    console.log(`   • Dimensions  : ${uploadResult.width} x ${uploadResult.height}`);

    // 3. Test transformations
    console.log('\n3️⃣ Testing Cloudinary Transformations:');
    const thumbUrl = cloudinary.url(uploadResult.public_id, {
      width: 400,
      height: 300,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });
    console.log(`   • Thumbnail (400x300 auto-gravity) : ${thumbUrl}`);

    const socialSquareUrl = cloudinary.url(uploadResult.public_id, {
      aspect_ratio: '1:1',
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });
    console.log(`   • Social 1:1 Feed                 : ${socialSquareUrl}`);

    const storyUrl = cloudinary.url(uploadResult.public_id, {
      aspect_ratio: '9:16',
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });
    console.log(`   • Mobile Story 9:16               : ${storyUrl}`);

    console.log('\n🎉 ALL CLOUDINARY APIS ARE WORKING PERFECTLY!\n');
  } catch (error: any) {
    console.error('\n❌ Cloudinary API Test Failed:');
    console.error(`   Message: ${error.message || error}`);
    if (error.http_code) console.error(`   HTTP Code: ${error.http_code}`);
    console.log('\n👉 Check that your CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env match your Cloudinary Dashboard.');
    process.exit(1);
  }
}

runTest();
