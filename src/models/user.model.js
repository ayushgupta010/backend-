import mongoose, {schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new schema(
    {
        username:{
            type:String,
            required:true,
            unique: true,
            lowercase:true,
            trim: true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique: true,
            lowercase:true,
            trim: true,
        },
        fullname:{
            type:String,
            required:true,
            trim: true,
            index:true
        },
        avatar:{
            type:String,
            required:true, 
        },
        coverHistory:{
            type: String,
        },
        watchHistory:{
            type:schema.Types.ObjectId,
            ref:"video"
        },
        password:{
            type:String,
            required:true,
        },
        refreshToken:{
            type: String,
        }
    },
    {
        timestamps: true
    }
)
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    this.password=bcrypt.hash(this.password, 10)
    next()
})
userSchema.methods.isPasswordCorrect = async function(password) {
   return await bcrypt.compare(password, this.password)
}
userSchema.methods,generateAccessToken=function(){
    jwt.sign(
        {
           _id: this.id,
           email:this.email,
           username:this.username,
           fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods,generateRefreshToken=function(){
    jwt.sign(
        {
           _id: this.id,
           email:this.email,
           username:this.username,
           fullname:this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const user=mongoose.model("user",userSchema)