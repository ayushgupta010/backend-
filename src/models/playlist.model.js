import mongoose, {Schema} from "mongoose";

const playlistSchema = new Schema(
    {
        name:{
            type:string,
            required:true
        },
        videos:[
            {
                type:Schema.Types.ObjectId,
                ref:"video"
            }
        ],
        owner:{
            type:Schema.Types.ObjectId,
            ref:"user"
        },
        description:{
            type:string,
            required:true
        }
    },
    {
        timestamps:true
    }
)

export const playlist=mongoose.model("Playlist",playlistSchema)