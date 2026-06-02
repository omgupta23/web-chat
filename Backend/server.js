const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const socketHandler = require("./socket/socket");

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const authrouter = require("./Route/auth");
const messageRouter = require("./Route/message");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "https://fastchating.netlify.app"],

    credentials: true,
  }),
);

app.use("/", authrouter);
app.use("/messages", messageRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://fastchating.netlify.app"],
    credentials: true,
  },
});

socketHandler(io);

connectDB()
  .then(() => {
    console.log("database connection established");
    const PORT = process.env.PORT;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
