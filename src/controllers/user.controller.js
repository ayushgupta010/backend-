import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../models/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req,res)=>{
    //get user details
    //validation nnot empty
    //check if user is already esits
    //check for image and avatr
    //upload them to cloudinary
    //create user object in db
    //remove password and refresh token field from response
    //check for creation
    //return res

    const {fullName, email, username, password}=req.body
    console.log("email", email)
    
    //validation
    if(
        [fullName, email, username, password].some((field)=>
        field?.trim() === "")
    ){
        throw new ApiError(400, 'All fields are required')
    }

    //checking if user is already exists

    const exixstedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(exixstedUser){
        throw new ApiError(409, "user already existed")
    }

    //accessing other things through middleware
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverimage[0]?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image is required")
    }
    if(!avatarLocalPath){
        throw new ApiError(400, "avatar is required")
    }

    //uploading on cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "avatar is required")
    }

    if(!coverimage){
        throw new ApiError(400, "cover image is required")  
    }

    //creating user object in db and saving it to the database using mongoose model function.

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createduser){
        throw new ApiError(500, "internal server error")
    }

    return res.status(201).json(
        new ApiResponse(200, createduser, "User created successfully")
    )
})

export { registerUser }