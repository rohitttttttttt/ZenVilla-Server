import { configDotenv } from 'dotenv'
configDotenv();

import express from 'express'
import http  from'http'
import { Server } from 'socket.io'
import {  
          addRoom ,
          toggleAvailability, 
          getRoomsByTypeAndAvailability , 
          getAllAvailableRooms , 
          setUser,
          cleanUp ,
          deleteRoom ,
          getSocketOrUsername,
          getRoomByUserName,
        } from'./redis.js'
import cors  from 'cors'

import mongoose from 'mongoose'
import userRouter from './routes/user.route.js'
import { fileHandler } from './middlewares/multer.middleware.js';
import { uploadinCloud } from './config/cloudinary.config.js';
import { Router } from 'express'
const app = express();
const server = http.createServer(app);



const dbConnection = async () => {
    try {
       await mongoose.connect(process.env.MongoUrl)
       
        console.log("Db conected")
    } catch (error) {
        console.log( "Db error:"+ error);
        
    }
}

dbConnection()
.then(
   console.log("trying to connect with db ")
)


const io = new Server(server, {
  cors: { origin: process.env.URL , 
     methods:["GET" , "POST"],
  credentials: false
   },
 
});
app.use(express.json());
app.use(cors({
  origin:  process.env.URL ,
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}) 
)

app.get("/",(req,res)=>{
  return res.send("hello world")
})
app.use("/user", userRouter)

app.post("/upload" ,fileHandler("thumbNail", "single") , async(req , res)=>{
  console.log("got the req ")
   const {  title , type , userName   } = req.body;
    const thumbNail = req.file;

    if (  !title || !type || !thumbNail || !userName ) {
      console.log("All fields are required, including a thumbnail.")
        return res.status(400).json({ message: "All fields are required, including a thumbnail." });
    }
  const url = await uploadinCloud(thumbNail, "thumbNail");
   
  
    const description = " no  description for now "
    addRoom(userName,  title, description, url, type)

    await broadcastUpdatedRooms()
    return res.status(200).json({
      message:"room created successfully"
    })
})


const broadcastUpdatedRooms = async () => {
    const allRooms = await getAllAvailableRooms();
    io.emit("update_room_list", allRooms); 
};

const broadcastUpdatedRoomsToOne = async (id) => {
    const allRooms = await getAllAvailableRooms();
    io.to(id).emit("update_room_list", allRooms); 
};

io.on('connection', socket => {
  
  socket.on("register"  , async (username) => {
    if(username){
      await setUser(username , socket.id)
    console.log(username , socket.id)
    }
   
  })
  
  
  socket.on('offer',async (offer, userName ,  title ,  description , url ,type) => {
    const rooms =  [{room:offer, userName ,  title ,  description , url ,type}]
    
    await addRoom(userName, offer, title, description, url, type)

    await broadcastUpdatedRooms()

    
  });

  
  
  socket.on('ice-candidate', async (candidate , userName)  => {
    io.to(await getSocketOrUsername(userName)).emit("ice-candidate",candidate)
  });

  
  socket.on("All_Unjoined_rooms" ,async ()=>{
     await broadcastUpdatedRoomsToOne(socket.id)
  })

  socket.on("get_rooms_with_type", async  (type)=>{
    let rooms =  await getRoomsByTypeAndAvailability(type , true)
    io.to(socket.id).emit(`all_rooms_oftype`,rooms);
  })
  socket.on("want_to_join", async (userName , offer ) => {
    
    const ownerSocketId  = await getSocketOrUsername(userName);
    const joineeUserName = await getSocketOrUsername(socket.id)
   
    io.to(ownerSocketId).emit("want_to_join_my_room", joineeUserName , offer)
  })
  socket.on("joining_room", async (userName , answer) => {
   

    const ownerSocketId  = await getSocketOrUsername(userName);
    const joineeUserName = await getSocketOrUsername(socket.id)
     await toggleAvailability(joineeUserName);
    io.to(ownerSocketId).emit("joining_my_room",answer , joineeUserName)
    
    await broadcastUpdatedRooms()
  })

  socket.on("owner_leaving_room", async (userName) => {
      const ownerUserName =  await getSocketOrUsername(socket.id) 
      await deleteRoom(ownerUserName);
      if(userName){
        io.to(await getSocketOrUsername(userName)).emit("owner_leaved_room" , true)
      }
      await broadcastUpdatedRooms()
  })

  socket.on("joinee_Leaving_rooms" , async (userName) => {
    await toggleAvailability(userName )
    io.to(await getSocketOrUsername(userName)).emit("joinee_leaved_room" , true)
    await broadcastUpdatedRooms()
  })

  socket.on("owner_removing_joinee" , async (userName)=>{
    const ownerUserName =  await getSocketOrUsername(socket.id) 
    await toggleAvailability(ownerUserName )
    
    io.to(await getSocketOrUsername(userName)).emit("owner_Removed_joinee" , true)
    await broadcastUpdatedRooms()
  })

  socket.on("disconnect" ,async () => {
    await cleanUp(socket.id)
  } )
  
  

});



server.listen(5000,'0.0.0.0',() => console.log('Signaling server running on port 5000'));
