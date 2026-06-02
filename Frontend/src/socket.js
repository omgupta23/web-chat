import { io } from "socket.io-client";

export const socket = io("https://web-chat-kwpf.onrender.com", {
  withCredentials: true,
});
