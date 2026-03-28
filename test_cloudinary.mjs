import { Cloudinary } from '@cloudinary/url-gen';
const cld = new Cloudinary({ cloud: { cloudName: 'djdktudjh' } });

const encodedId = "%D8%AD%D8%AA%D9%89_%D9%8A%D8%A3%D8%B0%D9%86_%D9%84%D9%86%D8%A7_%D8%A7%D9%84%D9%84%D9%87_tygrpx";
const decodedId = decodeURIComponent(encodedId);

const vidEncoded = cld.video(encodedId);
const vidDecoded = cld.video(decodedId);

console.log("Encoded URL:", vidEncoded.toURL());
console.log("Decoded URL:", vidDecoded.toURL());
