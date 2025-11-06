import {User} from '../models/user.model.js';
import { uploadinCloud } from '../config/cloudinary.config.js';


 const signUp = async (req, res) => {
   
    const { userName, fullName, password } = req.body;
    const profilePicFile = req.file;

    if (!userName || !fullName || !password || !profilePicFile) {
        return res.status(400).json({ message: "All fields are required, including a profile picture." });
    }

    const isUserAlreadyExist = await User.findOne({ userName });
    if (isUserAlreadyExist) {
        return res.status(510).json({ message: "Username is already taken." });
    }

    try {
       
        const avatarUrl = await uploadinCloud(profilePicFile, "profile_pictures");
        
       
        if (!avatarUrl) {
            throw new Error("Cloudinary did not return a URL.");
        }

       
        const user = await User.create({
            userName,
            fullName,
            password,
            profile: avatarUrl, 
        });

        
        const accessToken = await user.generateAccessToken();
        const Rtoken = await user.generateRefreshToken();
        user.refreshToken = Rtoken;
        await user.save();

        const safeUser = await User.findById(user._id).select("-password -refreshToken");
        
        const options = {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .json({
                message: "User registered successfully",
                user: safeUser,
                accessToken
            });

    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).json({ message: "An internal server error occurred.", error: error.message });
    }
};
const login =  async (req , res) => {
    
    const {userName , password } =  req.body;
    const user = await User.findOne({userName});
    if(!user){
        return res.status(200).json({
            message:"user is not registered"
        })
    }
    const passCorrect = user.isPassCorrect(password);
    if(!passCorrect){
        return res.status(200).json({
            message:"password is not correct"
        }) 

    }
    const accessToken =await user.generateAccessToken();
   const Rtoken =await user.generateRefreshToken();
   user.refreshToken = Rtoken
   await  user.save()

    const safeuser = await User.findById(user._id).select("-password -refreshToken")
   
   
   const options = {
     secure:false,
     httpOnly:true,
     sameSite: 'lax'
   }
   
    res.cookie("accessToken" , accessToken ,options )
   return res
   .status(200)
   .json({
    message:"user loggedin  sucessfuly", 
    user:safeuser,
    accessToken
   })



}
const getUser = async (req , res)=>{
   
    const Id = req.query.id
   
    if(!Id){
        return res.status(404).json({
            message:"id  not found "
        })
    }
    const user = await User.findById(Id).select("-password -refreshToken")
    if(!user){
        return res.status(404).json({
            message:"user is not found "
        })
    }
     return res.status(200).json({
        message:"user found successfully",
        user  
    })
}

export {login , signUp , getUser}