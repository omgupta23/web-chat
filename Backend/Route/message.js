// routes/messages.js
const express = require("express");
const router = express.Router();
const Message = require("../model/message");

router.get("/:userA/:userB", async (req, res) => {
  const { userA, userB } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not fetch messages" });
  }
});

module.exports = router;
