import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const uploadResult = await cloudinary.uploader
        .upload(
            localFilePath, {
                resource_type:"auto"
            }
        )
        console.log("file is uploaded on cloudinary", uploadResult.url)
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally temporary file
    }
}

export {uploadOnCloudinary}