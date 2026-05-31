const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
    },

    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email format");
        }
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Password is not strong enough");
        }
      },
    },

    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
userSchema.methods.getjwt = function () {
  const user = this;
  const token = jwt.sign({ _id: user._id }, "chat123", {
    expiresIn: "7d",
  });
  return token;
};
userSchema.methods.comparepassword = function (passwordIn) {
  const user = this;
  const passwordcheck = bcrypt.compare(passwordIn, user.password);
  return passwordcheck;
};
module.exports = mongoose.model("User", userSchema);
