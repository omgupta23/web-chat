import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { socket } from "../socket";

const API = "https://web-chat-kwpf.onrender.com";

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = useRef(null);

  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("name");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (userId) socket.emit("join", userId);
  }, [userId]);

  useEffect(() => {
    axios
      .get(`${API}/users`)
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Failed to fetch users:", err))
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    const handler = (data) => setMessages((prev) => [...prev, data]);
    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, []);

  useEffect(() => {
    const handler = (data) => setMessages((prev) => [...prev, data]);
    socket.on("messageSent", handler);
    return () => socket.off("messageSent", handler);
  }, []);

  useEffect(() => {
    const handler = ({ userId: uid, isOnline }) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === uid ? { ...u, isOnline } : u)),
      );

      setSelectedUser((prev) =>
        prev?._id === uid ? { ...prev, isOnline } : prev,
      );
    };
    socket.on("userStatusChanged", handler);
    return () => socket.off("userStatusChanged", handler);
  }, []);

  useEffect(() => {
    const handler = (onlineUserIds) => {
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          isOnline: onlineUserIds.map(String).includes(String(u._id)),
        })),
      );
    };
    socket.on("onlineUsers", handler);
    return () => socket.off("onlineUsers", handler);
  }, []);

  useEffect(() => {
    const handler = ({ message: m }) => alert(`Error: ${m}`);
    socket.on("error", handler);
    return () => socket.off("error", handler);
  }, []);

  const handleSelectUser = useCallback(
    async (user) => {
      setSelectedUser(user);
      setLoadingMsgs(true);
      try {
        const { data } = await axios.get(
          `${API}/messages/${userId}/${user._id}`,
        );
        setMessages(data);
      } catch (err) {
        console.error("Failed to load messages:", err);
        setMessages([]);
      } finally {
        setLoadingMsgs(false);
      }
    },
    [userId],
  );

  const sendMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!message.trim() || !selectedUser) return;

      socket.emit("sendMessage", {
        text: message.trim(),
        sender: username,
        senderId: userId,
        receiverId: selectedUser._id,
      });

      setMessage("");
    },
    [message, selectedUser, username, userId],
  );

  const currentUser = selectedUser;

  const filteredMessages = selectedUser
    ? messages.filter(
        (msg) =>
          (msg.senderId === userId && msg.receiverId === selectedUser._id) ||
          (msg.senderId === selectedUser._id && msg.receiverId === userId),
      )
    : [];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          width: "280px",
          borderRight: "1px solid #ddd",
          background: "#f8fafc",
          padding: "15px",
          overflowY: "auto",
        }}
      >
        <h2>Chats</h2>

        {loadingUsers ? (
          <p style={{ color: "#888" }}>Loading users…</p>
        ) : (
          users
            .filter((user) => user._id !== userId)
            .map((user) => (
              <div
                key={user._id}
                onClick={() => handleSelectUser(user)}
                style={{
                  padding: "12px",
                  marginBottom: "10px",
                  cursor: "pointer",
                  borderRadius: "10px",
                  background:
                    selectedUser?._id === user._id ? "#dbeafe" : "#ffffff",
                  border: "1px solid #ddd",
                }}
              >
                <strong>{user.Name}</strong>
                <div>
                  {user.isOnline ? (
                    <span>🟢 Online</span>
                  ) : (
                    <span>⚫ Offline</span>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "15px",
            borderBottom: "1px solid #ddd",
            background: "#fff",
          }}
        >
          {currentUser ? (
            <>
              <h2>{currentUser.Name}</h2>
              <div>{currentUser.isOnline ? "🟢 Online" : "⚫ Offline"}</div>
            </>
          ) : (
            <h2>Select a User</h2>
          )}
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            background: "#f1f5f9",
          }}
        >
          {loadingMsgs ? (
            <p style={{ textAlign: "center", color: "#888" }}>
              Loading messages…
            </p>
          ) : filteredMessages.length === 0 ? (
            <p style={{ textAlign: "center", color: "#aaa" }}>
              {selectedUser ? "No messages yet. Say hi! 👋" : ""}
            </p>
          ) : (
            filteredMessages.map((msg, index) => (
              <div
                key={msg._id ?? index}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.senderId === userId ? "flex-end" : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    background: msg.senderId === userId ? "#2563eb" : "#e5e7eb",
                    color: msg.senderId === userId ? "white" : "black",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    maxWidth: "60%",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {msg.sender}
                  </div>
                  <div>{msg.text}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            padding: "15px",
            borderTop: "1px solid #ddd",
            background: "#fff",
            gap: "10px",
          }}
        >
          <input
            type="text"
            placeholder={
              selectedUser ? "Type a message..." : "Select a user first"
            }
            value={message}
            disabled={!selectedUser}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              background: selectedUser ? "#fff" : "#f3f4f6",
            }}
          />
          <button
            type="submit"
            disabled={!selectedUser || !message.trim()}
            style={{
              padding: "12px 20px",
              background:
                selectedUser && message.trim() ? "#2563eb" : "#93c5fd",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor:
                selectedUser && message.trim() ? "pointer" : "not-allowed",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
