import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../models/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateRefreshandAccessToken = async(userId)=>{
    try {
       
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found");
        }
       
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
       
        if (!accessToken || !refreshToken) {
            console.error("Error: Failed to generate tokens");
            throw new ApiError(500, "Failed to generate tokens");
        }

    

        user.refreshToken = refreshToken 
        await user.save({validateBeforeSave: false})

        return{accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generateing refrsh and acccess token")
    }
}

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
   // console.log("email", email)
    
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
    //const coverImageLocalPath = req.files?.coverimage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverimage)
    &&req.files.coverimage.length>0) {
        coverImageLocalPath=req.files.coverimage[0].path
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

const loginUser = asyncHandler(async(req, res)=>{
    //req.body-> data
    //username or email
    //find user
    //password check
    //access and refresh token
    //send cookie

    const{email, username, password}=req.body

    if(!username && !email){
        throw new ApiError(400,"username or email is requierd")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    //check password

    const ifPasswordValid = await user.isPasswordCorrect(password)

    if(!password){
        throw new ApiError(401, "Password is incorrect")
    }

    const {accessToken, refreshToken} = await generateRefreshandAccessToken(user._id )

    const logedInUser = await User.findOne(user._id)
    .select("-password -refreshToken")

    //send token to the user

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
              user: logedInUser, accessToken, refreshToken
            },
              "user loggedIn succesfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "user loggedout"
        )
    )
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken =  req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_ACCESS_TOKEN
     )
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401, "Invalid refresh Token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "Refresh token is Expired")
     }
 
     const options = {
         httpOnly:true,
         secure:true
     }
 
     const {accessToken, newRefreshToken} =  await generateRefreshandAccessToken(user._id)
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         200,
         {accessToken, newRefreshToken},
         "access token refreshed"
     )
   } catch (error) {
     throw new ApiError(401, error?.message  || "Invalid refresh token")
   }
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(user?._id)
    const isPasswordCorrect = await isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invlid old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})
    
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched Succeefully"
    ))
})

const UpdateAccountDetalis = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email : email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .josn(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ))
})

const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400, "errror while uploading on avatar")
    }
     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar : avatar.url
            }
        },
        {new : true}
     ).select("-password")

     return res
     .status(200)
     .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
     )
})

const updateUseroverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image file is missing")
    }

    const avatar = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImageLocalPath){
        throw new ApiError(400, "errror while uploading on cover image")
    }
     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage : coverimage.url
            }
        },
        {new : true}
     ).select("-password")

     return res
     .status(200)
     .json(
        new ApiResponse(200, user, "Cover image updated successfully")
     )
})

export{
     registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     getCurrentUser,
     UpdateAccountDetalis,
     updateUserAvatar,
     updateUseroverImage,
}