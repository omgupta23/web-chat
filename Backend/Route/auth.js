const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../model/user");
const jwt = require("jsonwebtoken");

const authrouter = express.Router();

authrouter.post("/signup", async (req, res) => {
  try {
    const { Name, emailId, password } = req.body;
    const hashpassword = await bcrypt.hash(password, 10);
    const user = new User({
      Name,
      emailId,
      password: hashpassword,
    });
    await user.save();
    res.status(200).json({
      message: "SignUp Successully",
      user,
    });
  } catch (err) {
    res.status(400).send("ERROR" + err.message);
  }
});

authrouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });

    if (!user) {
      res.status(400).json({
        message: "User Not Find Or Password Not correct",
      });
    }

    const ispasswordvalid = await user.comparepassword(password);

    if (ispasswordvalid) {
      const token = user.getjwt();
      res.cookie("token", token, {
        httpOnly: true,
      });
    }

    res.status(200).json({ message: "login Succesfully", user });
  } catch (err) {
    res.status(400).send("Message" + err.message);
  }
});

authrouter.get("/users", async (req, res) => {
  const users = await User.find().select("Name emailId");

  res.json(users);
});

module.exports = authrouter;
