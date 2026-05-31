// model/message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 2000 },
    sender: { type: String, required: true },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

messageSchema.index({ senderId: 1, receiverId: 1 });

module.exports = mongoose.model("Message", messageSchema);
