import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Comments from "./Comments";
import VoiceRecorder from "./VoiceRecorder";
import axios from "axios";
import {
  Heart,
  MessageCircle,
  Trash2,
  ArrowLeft,
  Send,
  Image,
  Video,
  FileAudio,
  Edit,
  Home as HomeIcon,
  User,
  Users,
  Search,
} from "lucide-react";

export default function GroupRoom() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [resetVoiceKey, setResetVoiceKey] = useState(0);
  const [showCommentsFor, setShowCommentsFor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [updatingGroup, setUpdatingGroup] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists())
        setGroup({ id: groupSnap.id, ...groupSnap.data() });
    };
    fetchGroup();

    const q = query(
      collection(db, "groupPosts"),
      where("groupId", "==", groupId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [groupId]);

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

  const handleVoiceRecord = (blob) => setVoiceBlob(blob);
  const cancelVoice = () => setVoiceBlob(null);
  const handleFileChange = (e) => setSelectedFile(e.target.files[0] || null);

  const clearAllMedia = () => {
    setSelectedFile(null);
    setVoiceBlob(null);
    setResetVoiceKey((prev) => prev + 1);
    const fileInput = document.getElementById("file-input");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedFile && !voiceBlob) return;
    setUploading(true);
    try {
      let mediaUrl = null,
        mediaType = null;
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
      await addDoc(collection(db, "groupPosts"), {
        text: newPostText.trim(),
        groupId,
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
    } catch (err) {
      console.error(err);
      alert("Помилка: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (postId, currentLikes) => {
    const postRef = doc(db, "groupPosts", postId);
    if (currentLikes.includes(user.uid)) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    }
  };

  const deletePost = async (postId) => {
    if (window.confirm("Видалити пост?")) {
      await deleteDoc(doc(db, "groupPosts", postId));
    }
  };

  const updateGroup = async () => {
    setUpdatingGroup(true);
    try {
      const groupRef = doc(db, "groups", groupId);
      const updates = {};
      if (editName.trim()) updates.name = editName;
      if (editDesc.trim()) updates.description = editDesc;
      if (editAvatarFile) {
        const avatarUrl = await uploadToImgBB(editAvatarFile);
        updates.avatarUrl = avatarUrl;
      }
      await updateDoc(groupRef, updates);
      setGroup((prev) => ({ ...prev, ...updates }));
      setIsEditing(false);
      setEditAvatarFile(null);
    } catch (err) {
      console.error(err);
      alert("Помилка оновлення групи");
    } finally {
      setUpdatingGroup(false);
    }
  };

  const togglePrivacy = async () => {
    await updateDoc(doc(db, "groups", groupId), {
      isPrivate: !group.isPrivate,
    });
    setGroup((prev) => ({ ...prev, isPrivate: !prev.isPrivate }));
  };

  const deleteGroup = async () => {
    if (window.confirm("Видалити групу назавжди? Всі пости будуть втрачені!")) {
      const postsQuery = query(
        collection(db, "groupPosts"),
        where("groupId", "==", groupId)
      );
      const postsSnapshot = await getDocs(postsQuery);
      for (const postDoc of postsSnapshot.docs) {
        await deleteDoc(doc(db, "groupPosts", postDoc.id));
      }
      await deleteDoc(doc(db, "groups", groupId));
      window.location.href = "/groups";
    }
  };

  if (!group) return <div style={{ padding: 20 }}>Завантаження...</div>;

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

      <Link
        to="/groups"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 20,
          textDecoration: "none",
          color: "#4CAF50",
        }}
      >
        <ArrowLeft size={20} /> Всі групи
      </Link>

      {/* Банер групи */}
      <div
        style={{
          background: "linear-gradient(135deg, #e0f2e9, #c8e6df)",
          borderRadius: 24,
          padding: "20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {group.avatarUrl ? (
            <img
              src={group.avatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#4CAF50",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "2rem",
                fontWeight: "bold",
              }}
            >
              {group.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1b5e20" }}>
            {group.name}
          </h2>
          <p style={{ margin: "4px 0 0", color: "#2e7d32" }}>
            {group.description}
          </p>
          <div style={{ marginTop: 8, fontSize: "0.8rem", color: "#388e3c" }}>
            👥 {group.members?.length || 1} учасників{" "}
            {group.isPrivate && "🔒 Приватна"}
          </div>
        </div>
        {user.uid === group.createdBy && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setEditName(group.name);
                setEditDesc(group.description);
                setIsEditing(true);
              }}
              style={{
                background: "white",
                border: "none",
                borderRadius: 40,
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              <Edit size={18} color="#4CAF50" /> Редагувати
            </button>
            <button
              onClick={togglePrivacy}
              style={{
                background: "white",
                border: "none",
                borderRadius: 40,
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              {group.isPrivate ? "🔓 Зробити відкритою" : "🔒 Зробити закритою"}
            </button>
            <button
              onClick={deleteGroup}
              style={{
                background: "white",
                border: "none",
                borderRadius: 40,
                padding: "8px 12px",
                cursor: "pointer",
                color: "#f44336",
              }}
            >
              🗑️ Видалити групу
            </button>
          </div>
        )}
      </div>

      {/* Модалка редагування */}
      {isEditing && (
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
            <h3>Редагувати групу</h3>
            <input
              type="text"
              placeholder="Назва"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
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
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
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
              Змінити аватар
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setEditAvatarFile(e.target.files[0])}
              />
            </label>
            {editAvatarFile && (
              <p style={{ fontSize: 12, color: "green" }}>
                ✅ {editAvatarFile.name}
              </p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={updateGroup}
                disabled={updatingGroup}
                style={{
                  flex: 1,
                  background: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: 10,
                  borderRadius: 40,
                }}
              >
                Зберегти
              </button>
              <button
                onClick={() => setIsEditing(false)}
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

      {/* Форма створення поста */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <textarea
          placeholder="Що у вас в кімнаті?"
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            marginBottom: 15,
            padding: 12,
            borderRadius: 20,
            border: "1px solid #ddd",
            fontSize: "1rem",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 10,
            flexWrap: "wrap",
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
            <button type="button" onClick={() => setSelectedFile(null)}>
              ❌
            </button>
          </p>
        )}
        <div style={{ margin: "8px 0" }}>
          <VoiceRecorder
            key={resetVoiceKey}
            onRecordingComplete={handleVoiceRecord}
            onCancel={cancelVoice}
          />
        </div>
        {voiceBlob && (
          <p style={{ fontSize: 12, color: "green", marginBottom: 10 }}>
            🎤 Голосове записано
          </p>
        )}
        <button
          type="submit"
          disabled={uploading}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
            color: "white",
            border: "none",
            padding: 12,
            borderRadius: 40,
            marginTop: 10,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {uploading ? (
            "Публікується..."
          ) : (
            <>
              <Send size={18} style={{ marginRight: 8 }} /> Опублікувати
            </>
          )}
        </button>
      </form>

      {/* Пости */}
      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 15,
            marginBottom: 15,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <img
              src={post.userPhoto}
              width={40}
              height={40}
              style={{ borderRadius: "50%", objectFit: "cover" }}
              alt=""
            />
            <strong>{post.userName}</strong>
            {user.uid === post.userId && (
              <button
                onClick={() => deletePost(post.id)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <p style={{ marginBottom: 10 }}>{post.text}</p>
          {post.mediaType === "image" && (
            <img
              src={post.mediaUrl}
              alt=""
              style={{
                width: "100%",
                maxHeight: 400,
                objectFit: "contain",
                borderRadius: 16,
                marginTop: 10,
                backgroundColor: "#f0f0f0",
              }}
            />
          )}
          {post.mediaType === "video" && (
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
          {post.mediaType === "audio" && (
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
                gap: 5,
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
                gap: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#2196f3",
              }}
            >
              <MessageCircle size={20} /> {post.commentsCount || 0}
            </button>
          </div>
          {showCommentsFor === post.id && (
            <Comments postId={post.id} collectionName="groupPosts" />
          )}
        </div>
      ))}
    </div>
  );
}
