import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema(
    {
        userName:{
            type:String,
            required:true,
            unique:true,
            
        },
        password:{
            type:String,
            required:true,
        },
        fullName:{
            type:String,
            required:true,
        },
        profile:{
            type:String,
            
        },
        email:{
            type:String,
            
        },
        phone:{
            type:Number,
           
        },
        refreshToken:{
            type:String,
        },
        

    },{timestamps:true}
)
userSchema.pre("save" , async function(){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password , 10)
    }
}
    
)
userSchema.methods.isPassCorrect = async function (password)  {
    return bcrypt.compare(this.password , password)
};
userSchema.methods.generateAccessToken = async function ()  {
    return jwt.sign({
        _id : this._id,
        userName : this.userName
    },process.env.ACCESS_TOKEN_SECRET )
}
userSchema.methods.generateRefreshToken = async function ()  {
    return jwt.sign({
        _id : this._id,
        userName : this.userName
    },process.env.REFRESH_TOKEN_SECRET)
}

const User = mongoose.model("User", userSchema);
export {User};