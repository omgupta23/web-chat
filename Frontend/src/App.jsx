import { BrowserRouter, Routes, Route } from "react-router-dom";

import Signup from "./componant/Signup";
import Login from "./componant/Login";
import Chat from "./componant/chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signup />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/login" element={<Login />} />

        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
