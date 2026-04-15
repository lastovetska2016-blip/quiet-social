import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Plus,
  LogIn,
  LogOut,
  ChevronRight,
  Upload,
  Home,
  User,
  Search,
} from "lucide-react";
import axios from "axios";

export default function Groups() {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "quiet-social");
    formData.append("resource_type", "image");
    const cloudName = "dr6zvvzyj";
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );
    return response.data.secure_url;
  };

  const fetchGroups = async () => {
    const snapshot = await getDocs(collection(db, "groups"));
    const groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setAllGroups(groups);
    setMyGroups(groups.filter((g) => g.members?.includes(user.uid)));
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    let avatarUrl = null;
    if (avatarFile) {
      setUploadingAvatar(true);
      avatarUrl = await uploadToCloudinary(avatarFile);
      setUploadingAvatar(false);
    }
    await addDoc(collection(db, "groups"), {
      name: newGroupName,
      description: newGroupDesc,
      members: [user.uid],
      createdBy: user.uid,
      createdAt: new Date(),
      avatarUrl,
      isPrivate: isPrivate || false,
    });
    setNewGroupName("");
    setNewGroupDesc("");
    setAvatarFile(null);
    setIsPrivate(false);
    setShowCreate(false);
    fetchGroups();
  };

  const joinGroup = async (groupId) => {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, { members: arrayUnion(user.uid) });
    fetchGroups();
  };

  const leaveGroup = async (groupId) => {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, { members: arrayRemove(user.uid) });
    fetchGroups();
  };

  const getRandomColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
      "#00bcd4",
      "#009688",
      "#4caf50",
      "#8bc34a",
      "#ff9800",
      "#ff5722",
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const GroupAvatar = ({ group }) => {
    if (group.avatarUrl) {
      return (
        <img
          src={group.avatarUrl}
          alt=""
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      );
    }
    const color = getRandomColor(group.name);
    return (
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
      >
        {group.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  if (loading) return <div style={{ padding: 20 }}>Завантаження...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      {/* Верхнє меню */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 20,
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: 10,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: "#555",
          }}
        >
          <Home size={18} /> Стрічка
        </Link>
        <Link
          to="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: "#555",
          }}
        >
          <User size={18} /> Профіль
        </Link>
        <Link
          to="/groups"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: "#4CAF50",
            fontWeight: 500,
          }}
        >
          <Users size={18} /> Групи
        </Link>
        <Link
          to="/search"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: "#555",
          }}
        >
          <Search size={18} /> Пошук
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={28} color="#4CAF50" /> Групи (тихі кімнати)
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#4CAF50",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 40,
            cursor: "pointer",
          }}
        >
          <Plus size={18} /> Створити
        </button>
      </div>

      {showCreate && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 20,
              borderRadius: 24,
              width: 350,
              maxWidth: "90%",
            }}
          >
            <h3>Нова група</h3>
            <input
              type="text"
              placeholder="Назва"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={{
                width: "100%",
                marginBottom: 10,
                padding: 10,
                borderRadius: 12,
                border: "1px solid #ddd",
              }}
            />
            <textarea
              placeholder="Опис"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                marginBottom: 15,
                padding: 10,
                borderRadius: 12,
                border: "1px solid #ddd",
              }}
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#f0f0f0",
                padding: "8px 12px",
                borderRadius: 20,
                cursor: "pointer",
                marginBottom: 15,
              }}
            >
              <Upload size={18} /> Завантажити аватар групи
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setAvatarFile(e.target.files[0])}
              />
            </label>
            {avatarFile && (
              <p style={{ fontSize: 12, color: "green" }}>
                ✅ {avatarFile.name}
              </p>
            )}
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Закрита група (тільки за запрошенням)
              </label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={createGroup}
                disabled={uploadingAvatar}
                style={{
                  flex: 1,
                  background: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: 10,
                  borderRadius: 40,
                }}
              >
                Створити
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  flex: 1,
                  background: "#ccc",
                  border: "none",
                  padding: 10,
                  borderRadius: 40,
                }}
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 30, marginBottom: 15, fontSize: "1.2rem" }}>
        Мої кімнати
      </h3>
      {myGroups.length === 0 && (
        <p style={{ color: "#777", marginBottom: 20 }}>
          Ви ще не приєдналися до жодної групи
        </p>
      )}
      {myGroups.map((group) => (
        <Link
          key={group.id}
          to={`/group/${group.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
            background: "#fff",
            borderRadius: 20,
            padding: 12,
            marginBottom: 15,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            textDecoration: "none",
            color: "black",
          }}
        >
          <GroupAvatar group={group} />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{group.name}</h3>
            <p style={{ margin: "5px 0 0", color: "#666", fontSize: "0.9rem" }}>
              {group.description}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 15,
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "#888" }}>
                👥 {group.members?.length || 1} учасників
                {group.isPrivate && (
                  <span style={{ marginLeft: 8 }}>🔒 Приватна</span>
                )}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  leaveGroup(group.id);
                }}
                style={{
                  background: "#f0f0f0",
                  border: "none",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                <LogOut size={14} /> Вийти
              </button>
            </div>
          </div>
          <ChevronRight size={20} color="#aaa" />
        </Link>
      ))}

      <h3 style={{ marginTop: 30, marginBottom: 15, fontSize: "1.2rem" }}>
        Інші кімнати
      </h3>
      {allGroups.filter((g) => !g.members?.includes(user.uid)).length === 0 && (
        <p style={{ color: "#777" }}>Немає інших груп</p>
      )}
      {allGroups
        .filter((g) => !g.members?.includes(user.uid))
        .map((group) => (
          <div
            key={group.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              background: "#fff",
              borderRadius: 20,
              padding: 12,
              marginBottom: 15,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <GroupAvatar group={group} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{group.name}</h3>
              <p
                style={{ margin: "5px 0 0", color: "#666", fontSize: "0.9rem" }}
              >
                {group.description}
              </p>
              <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 8 }}>
                👥 {group.members?.length || 1} учасників
                {group.isPrivate && (
                  <span style={{ marginLeft: 8 }}>🔒 Приватна</span>
                )}
              </div>
            </div>
            {!group.isPrivate ? (
              <button
                onClick={() => joinGroup(group.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#2196F3",
                  color: "white",
                  border: "none",
                  borderRadius: 40,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                <LogIn size={16} /> Приєднатися
              </button>
            ) : (
              <span style={{ fontSize: "0.8rem", color: "#999" }}>
                🔒 Закрита
              </span>
            )}
          </div>
        ))}
    </div>
  );
}
