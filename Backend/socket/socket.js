const User = require("../model/user");
const Message = require("../model/message");

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

const validateMessage = ({ text, senderId, receiverId }) => {
  if (!text || typeof text !== "string" || !text.trim()) return "Empty message";
  if (text.length > 2000) return "Message too long";
  if (!isValidObjectId(senderId)) return "Invalid senderId";
  if (!isValidObjectId(receiverId)) return "Invalid receiverId";
  if (senderId === receiverId) return "Cannot message yourself";
  return null;
};

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join", async (userId) => {
      if (!isValidObjectId(userId)) {
        socket.emit("error", { message: "Invalid userId" });
        return;
      }

      try {
        socket.userId = userId;
        socket.join(userId);

        await User.findByIdAndUpdate(userId, { isOnline: true });

        socket.broadcast.emit("userStatusChanged", { userId, isOnline: true });

        const onlineUsers = await User.find({ isOnline: true }, "_id");
        socket.emit(
          "onlineUsers",
          onlineUsers.map((u) => u._id),
        );

        console.log(`${userId} joined`);
      } catch (err) {
        console.error("join error:", err.message);
        socket.emit("error", { message: "Could not join" });
      }
    });

    socket.on("sendMessage", async (data) => {
      const validationError = validateMessage(data);
      if (validationError) {
        socket.emit("error", { message: validationError });
        return;
      }

      const { text, sender, senderId, receiverId } = data;

      try {
        const saved = await Message.create({
          text: text.trim(),
          sender,
          senderId,
          receiverId,
        });

        const messageData = {
          _id: saved._id,
          text: saved.text,
          sender: saved.sender,
          senderId: saved.senderId,
          receiverId: saved.receiverId,
          createdAt: saved.createdAt,
        };

        io.to(receiverId).emit("receiveMessage", messageData);

        socket.emit("messageSent", messageData);

        console.log(`Message from ${senderId} → ${receiverId}`);
      } catch (err) {
        console.error("sendMessage error:", err.message);
        socket.emit("error", { message: "Message could not be sent" });
      }
    });

    socket.on("disconnect", async () => {
      if (!socket.userId) return;

      try {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });

        socket.broadcast.emit("userStatusChanged", {
          userId: socket.userId,
          isOnline: false,
        });

        console.log(`${socket.userId} disconnected`);
      } catch (err) {
        console.error("disconnect error:", err.message);
      }
    });
  });
};

module.exports = socketHandler;
