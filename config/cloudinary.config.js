import { configDotenv } from 'dotenv'
configDotenv();
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';


cloudinary.v2.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

 
 
 
const uploadinCloud = (file) => {
    try {
        return new Promise((resolve, reject) => {
            
            let stream = cloudinary.v2.uploader.upload_stream(
                {
                     
                    resource_type: "auto"
                },
                (error, result) => {
                    if (result) {
                        resolve(result.secure_url);
                        console.log(result.secure_url)
                    } else {
                        reject(error);
                    }
                }
            );
    
            
            const nodeBuffer = Buffer.from(file.buffer);
    
            
            streamifier.createReadStream(nodeBuffer).pipe(stream);
        });
    } catch (error) {
        console.log(error)
    }
};


export {uploadinCloud}