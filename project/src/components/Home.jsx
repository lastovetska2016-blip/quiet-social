import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Comments from "./Comments";
import VoiceRecorder from "./VoiceRecorder";
import {
  Heart,
  MessageCircle,
  Trash2,
  LogOut,
  Home as HomeIcon,
  User,
  Users,
  Search,
  Image,
  Video,
  FileAudio,
  Send,
} from "lucide-react";

export default function Home() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCommentsFor, setShowCommentsFor] = useState(null);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [resetVoiceKey, setResetVoiceKey] = useState(0);
  const [animatePost, setAnimatePost] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const uploadToCloudinary = async (file, resourceType = "auto") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "quiet-social");
    formData.append("resource_type", resourceType);
    const cloudName = "dr6zvvzyj";
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      formData
    );
    return response.data.secure_url;
  };

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

  const handleVoiceRecord = (blob) => {
    setVoiceBlob(blob);
  };

  const cancelVoice = () => {
    setVoiceBlob(null);
  };

  const clearAllMedia = () => {
    setSelectedFile(null);
    setVoiceBlob(null);
    setResetVoiceKey((prev) => prev + 1);
    if (document.getElementById("file-input")) {
      document.getElementById("file-input").value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedFile && !voiceBlob) return;
    setUploading(true);
    setAnimatePost(true);
    setTimeout(() => setAnimatePost(false), 500);

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (selectedFile) {
        const file = selectedFile;
        if (file.type.startsWith("image/")) {
          mediaUrl = await uploadToImgBB(file);
          mediaType = "image";
        } else if (file.type.startsWith("video/")) {
          mediaUrl = await uploadToCloudinary(file, "video");
          mediaType = "video";
        } else if (file.type.startsWith("audio/")) {
          mediaUrl = await uploadToCloudinary(file, "video");
          mediaType = "audio";
        }
      } else if (voiceBlob) {
        const audioFile = new File([voiceBlob], "voice.webm", {
          type: "audio/webm",
        });
        mediaUrl = await uploadToCloudinary(audioFile, "video");
        mediaType = "audio";
      }

      await addDoc(collection(db, "posts"), {
        text: newPostText.trim(),
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
        mediaUrl,
        mediaType,
        likes: [],
        commentsCount: 0,
      });

      setNewPostText("");
      clearAllMedia();
    } catch (error) {
      console.error(error);
      alert("Помилка: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (postId, currentLikes) => {
    const postRef = doc(db, "posts", postId);
    if (currentLikes.includes(user.uid)) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    }
  };

  const deletePost = async (postId) => {
    if (window.confirm("Видалити пост?")) {
      await deleteDoc(doc(db, "posts", postId));
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "auto",
        padding: 20,
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "1.8rem",
            background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          🌿 Тихе місце
        </h1>
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: 20,
            cursor: "pointer",
            transition: "0.2s",
          }}
        >
          <LogOut size={18} /> Вийти
        </button>
      </div>

      {/* Menu */}
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
            color: "#4CAF50",
            fontWeight: 500,
          }}
        >
          <HomeIcon size={18} /> Стрічка
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
            color: "#555",
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

      {/* Create Post Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 20,
          marginBottom: 20,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <textarea
          placeholder="Що у вас сьогодні?"
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            marginBottom: 15,
            padding: 12,
            borderRadius: 16,
            border: "1px solid #ddd",
            fontSize: "1rem",
            resize: "vertical",
          }}
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 15,
            alignItems: "center",
          }}
        >
          <label
            htmlFor="file-input"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f0f0f0",
              padding: "6px 12px",
              borderRadius: 20,
              cursor: "pointer",
            }}
          >
            <Image size={18} /> Фото
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleFileChange}
            hidden
          />
          <label
            htmlFor="file-input-video"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f0f0f0",
              padding: "6px 12px",
              borderRadius: 20,
              cursor: "pointer",
            }}
          >
            <Video size={18} /> Відео
          </label>
          <input
            id="file-input-video"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            hidden
          />
          <label
            htmlFor="file-input-audio"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f0f0f0",
              padding: "6px 12px",
              borderRadius: 20,
              cursor: "pointer",
            }}
          >
            <FileAudio size={18} /> Аудіо
          </label>
          <input
            id="file-input-audio"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            hidden
          />
        </div>
        {selectedFile && (
          <p style={{ fontSize: 12, color: "green", marginBottom: 10 }}>
            ✅ {selectedFile.name}{" "}
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              style={{
                marginLeft: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ❌
            </button>
          </p>
        )}
        <VoiceRecorder
          key={resetVoiceKey}
          onRecordingComplete={handleVoiceRecord}
          onCancel={cancelVoice}
        />
        {voiceBlob && (
          <p style={{ fontSize: 12, color: "green", marginBottom: 10 }}>
            🎤 Голосове записано
          </p>
        )}
        <button
          type="submit"
          disabled={uploading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: 40,
            fontSize: "1rem",
            cursor: "pointer",
            transition: "0.2s",
            marginTop: 20,
          }}
        >
          {uploading ? (
            "Публікується..."
          ) : (
            <>
              <Send size={18} /> Опублікувати
            </>
          )}
        </button>
      </form>

      {/* Posts */}
      {posts.map((post, idx) => (
        <div
          key={post.id}
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            transition: "all 0.3s ease",
            animation: animatePost && idx === 0 ? "fadeInUp 0.4s" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 15,
            }}
          >
            <img
              src={post.userPhoto}
              alt=""
              width={48}
              height={48}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: "1.1rem" }}>{post.userName}</strong>
            </div>
            {user.uid === post.userId && (
              <button
                onClick={() => deletePost(post.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>

          {post.text && (
            <p style={{ marginBottom: 15, lineHeight: 1.5 }}>{post.text}</p>
          )}

          {post.mediaUrl && post.mediaType === "image" && (
            <img
              src={post.mediaUrl}
              alt=""
              style={{
                width: "100%",
                maxHeight: 500,
                objectFit: "contain",
                borderRadius: 16,
                marginTop: 10,
                backgroundColor: "#f0f0f0",
              }}
            />
          )}
          {post.mediaUrl && post.mediaType === "video" && (
            <video
              src={post.mediaUrl}
              controls
              style={{
                width: "100%",
                maxHeight: 400,
                borderRadius: 16,
                marginTop: 10,
                backgroundColor: "#000",
              }}
            />
          )}
          {post.mediaUrl && post.mediaType === "audio" && (
            <audio
              src={post.mediaUrl}
              controls
              style={{ width: "100%", marginTop: 10 }}
            />
          )}

          <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
            <button
              onClick={() => toggleLike(post.id, post.likes || [])}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#e91e63",
              }}
            >
              <Heart
                size={20}
                fill={post.likes?.includes(user.uid) ? "#e91e63" : "none"}
              />{" "}
              {post.likes?.length || 0}
            </button>
            <button
              onClick={() =>
                setShowCommentsFor(showCommentsFor === post.id ? null : post.id)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#2196f3",
              }}
            >
              <MessageCircle size={20} /> {post.commentsCount || 0}
            </button>
          </div>

          {showCommentsFor === post.id && <Comments postId={post.id} />}
        </div>
      ))}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        button:hover {
          transform: scale(1.02);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
