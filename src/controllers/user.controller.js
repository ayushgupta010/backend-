import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../models/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateRefreshandAccessToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = generateAccessToken()
        const refreshToken = generateRefreshToken()

        user.refreshToken = refreshToken 
        await user.save({validateBeforeSafe: false})

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

    if(!username||!email){
        throw new ApiError(400,"username or email is requierd")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    //check password

    const ifPasswordValid = await user.ifPasswordCorrect(password)

    if(!password){
        throw new ApiError(401, "Password is incorrect")
    }

    await generateRefreshandAccessToken(user._id )

    const logedInUser = await user.findOne(user._id)
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
              user:logedInUser, accessToken, 
            }
        ),
        "user loggedIn succesfully"
    )
})

const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
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
    .clearcookie("accessToken", options)
    .clearcookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "user loggedout"
        )
    )
})
export{
     registerUser,
     loginUser,
     logoutUser
}