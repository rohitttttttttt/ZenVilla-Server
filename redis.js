import { json } from 'express'
import Redis from 'ioredis'
console.log(process.env.REDIS_HOST)
console.log(process.env.REDIS_PORT)

const redis  = new Redis ({
  
    host:process.env.REDIS_HOST,
    port:process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
})

redis.on("connect" , ()=>{
    console.log("redis is connected")
})

 redis.on("error", ()=>{
    console.log("connection fail")
})
export async function addRoom(userName, title, description, url, type) {
  try {
   

    const room = { 
     
      title,
      description,
      url,
      type,
      isAvailable: "true", 
    };

    
    await redis.hset(`room:${userName}`, room);

    
    await redis.sadd(`rooms:type:${type}`, userName);
  } catch (error) {
    console.error("Error adding room:", error);
  }
}


export async function toggleAvailability(userName , flag) {
  try {
    const room = await redis.hgetall(`room:${userName}`);
    if (!room || !room.type) return "Room not found";
    let newStatus
    if(flag){
      newStatus = "true"
    }else{
      newStatus = "false"
    }
    
    await redis.hset(`room:${userName}`, "isAvailable", newStatus);

    return `Room availability updated to ${newStatus}`;
  } catch (error) {
    console.error("Error toggling availability:", error);
  }
}


export async function getRoomsByTypeAndAvailability(type, isAvailable) {
  try {
    const usernames = await redis.smembers(`rooms:type:${type}`);
    const filteredRooms = [];

    for (const userName of usernames) {
      const room = await redis.hgetall(`room:${userName}`);
      if (room && room.isAvailable === String(isAvailable)) {
        filteredRooms.push({ userName, ...room });
      }
    }

    return filteredRooms;
  } catch (error) {
    console.error("Error fetching rooms:", error);
  }
}


export async function getAllAvailableRooms() {
  try {
    
    const keys = await redis.keys("room:*");
    const availableRooms = [];
    
    for (const key of keys) {
        
      const userName = key.split(":")[1];
      const room = await redis.hgetall(key);
      if (room && room.isAvailable === "true") {
        availableRooms.push({ userName, ...room });
      }
    }

    return availableRooms;
  } catch (error) {
    console.error("Error fetching available rooms:", error);
  }
}

export async function deleteRoom (userName)  {
    await redis.del(`room:${userName}`)
}
export async function setUser (user,socket)  {
    try {
        await redis.set(user ,socket)
       
        await redis.set(socket , user)
    } catch (err) {
        console.log(err)
    }
}

export async function getRoomByUserName (username) {
    return await redis.hgetall(`room:${username}`)
}



export async function cleanUp(socket) {
    try {
        const user =   await redis.get(socket)

      await redis.del(socket)
      await redis.del(user)
      await redis.del(`room:${user}`)
    } catch (error) {
        console.log(error)
    }
      
}

export async function getSocketOrUsername(U) {

    
    return await redis.get(U);
}