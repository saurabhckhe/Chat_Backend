import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import  {isOffensive } from "../lib/wordFilter.js";
import analyzeTextWithGemini from "../lib/genAI.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
      const { text, image } = req.body;
      const { id: receiverId } = req.params;
      const senderId = req.user._id;

    // 1️⃣ First Layer: Check with `leo-profanity` 
      if (isOffensive(text)) {
        return res.status(400).json({ error: "Your message contains offensive words." });
      }

    // 2️⃣ Second Layer: Use Gemini AI for better accuracy
      const isSafe = await analyzeTextWithGemini(text);
      if(!isSafe){
        return res.status(400).json({error:"Message flagged by AI as inappropriate!"});
      }

      // ✅ If the message is safe, save it
      // Store message in database
      // const newMessage = await Message.create({
      //   senderId,
      //   receiverId,
      //   text,
      //   timestamp: new Date(),
      //   image: imageUrl,

      // });
      
      let imageUrl;
      if (image) {
          // Upload base64 image to cloudinary
          const uploadResponse = await cloudinary.uploader.upload(image);
          imageUrl = uploadResponse.secure_url;
      }

      //✅ If the message is safe, save it to database
      const newMessage = new Message({
          senderId,
          receiverId,
          text,
          image: imageUrl,
      });
      await newMessage.save();
    
      //Emit the message to both sender and receiver..
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", newMessage);
      }

      res.status(201).json(newMessage);
  } catch (error) {
      console.error("Error in sendMessage: ", error);
      res.status(500).json({ error: "Internal server error" });
  }
};