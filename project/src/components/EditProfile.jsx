import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function EditProfile({ profile, onClose, onUpdate }) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [birthday, setBirthday] = useState(profile.birthday || "");
  const [interests, setInterests] = useState(profile.interests || "");
  const [workplace, setWorkplace] = useState(profile.workplace || "");
  const [status, setStatus] = useState(profile.status || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", "09a19255e428a5491a235fbb4ebe8ada");
    const response = await axios.post(
      "https://api.imgbb.com/1/upload",
      formData
    );
    return response.data.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let photoURL = profile.photoURL;
      if (avatarFile) {
        setUploading(true);
        photoURL = await uploadToImgBB(avatarFile);
        setUploading(false);
      }
      // Оновлюємо документ у колекції "users"
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName,
        birthday,
        interests,
        workplace,
        status,
        photoURL,
      });
      // Оновлюємо локальний стан (через onUpdate)
      onUpdate({
        displayName,
        birthday,
        interests,
        workplace,
        status,
        photoURL,
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Помилка оновлення: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          borderRadius: 12,
          width: 400,
          maxWidth: "90%",
        }}
      >
        <h3>Редагувати профіль</h3>
        <form onSubmit={handleSubmit}>
          <label>Аватар</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files[0])}
            style={{ marginBottom: 10 }}
          />
          {avatarFile && (
            <p style={{ fontSize: 12, color: "green" }}>✅ {avatarFile.name}</p>
          )}

          <label>Ім'я</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />

          <label>День народження</label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />

          <label>Інтереси (через кому)</label>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={2}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />

          <label>Місце роботи</label>
          <input
            type="text"
            value={workplace}
            onChange={(e) => setWorkplace(e.target.value)}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />

          <label>Статус</label>
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={loading || uploading}
              style={{
                background: "#4CAF50",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 8,
              }}
            >
              {uploading ? "Завантаження..." : "Зберегти"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#ccc",
                border: "none",
                padding: "8px 16px",
                borderRadius: 8,
              }}
            >
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
