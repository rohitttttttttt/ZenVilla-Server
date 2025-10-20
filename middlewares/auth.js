import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js'

const auth =async (req,res,next) => {
    
   
    const accessToken = req.headers["authorization"]?.replace("Bearer","").trim()||req.cookies?.accessToken
    
    if (typeof accessToken !== "string") {
        return res.status(400).json({ message: "Invalid token format." }); 
      }
   
    if(!accessToken){
        return res.status(404).json({
            message:"error user is not registered "
        })
    }
    const decodedToken =  jwt.verify(accessToken , process.env.ATS)
   
    const user =  await User.findById(decodedToken._id);
   
    if(!user){
        return res.status(404).json({   
            message:"user is not legged in "
        }) 
    }
    req.user = user
    next();
}
export {auth}