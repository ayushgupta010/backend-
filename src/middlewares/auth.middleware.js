import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js" 


export const verifyJWT = asyncHandler(async (req, res, next)=>{
   try {
      console.log("Cookies received:", req.cookies);
    const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    console.log("Token received:", token);  

    if(!token){
     throw new ApiError(401, "Unauthorized request")
    }
 
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    console.log("Decoded Token:", decodedToken);
 
    const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    console.log("User Found:", user);
 
    if(!user){
     throw new ApiError(401, "Invalid Access Token")
    }
 
    req.user = user
    next()
   } catch (error) {
      throw new ApiError(401, error?.message||"Invalid Access Token")
   }
   
})