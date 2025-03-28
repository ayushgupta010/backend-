import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        comment:{
            type:string,
            required:true
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"video"
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"user"
        }
    },
    {
        timestamps:true
    }
)
commentSchema.plugin(mongooseAggregatePaginate)
export const comment=mongoose.model("Comment",commentSchema)