import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Groups from "./components/Groups";
import GroupRoom from "./components/GroupRoom";
import Search from "./components/Search";
import AdminPanel from "./components/AdminPanel";
import PrivacySettings from "./components/PrivacySettings";
import Auth from "./components/Auth";

function App() {
  const { user } = useAuth();

  if (!user) return <Auth />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile/:userId?" element={<Profile />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/group/:groupId" element={<GroupRoom />} />
        <Route path="/search" element={<Search />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/privacy" element={<PrivacySettings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
