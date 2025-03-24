import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema(
    {
        video:{
            type:Schema.Types.ObjectId,
            ref:"video"
        },
        comment:{
            type:Schema.Types.ObjectId,
            ref:"comment"
        },
        tweet:{
            type:Schema.Types.ObjectId,
            ref:"tweet"
        },
        likedBy:{
            type:Schema.Types.ObjectId,
            ref:"like"
        }
    },
    {
        timestamps:true
    }
)

export const like=mongoose.model("Like",likeSchema)