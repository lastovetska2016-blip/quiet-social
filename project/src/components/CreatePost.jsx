// src/components/CreatePost.jsx
import { useState } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";

export default function CreatePost() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;

    setUploading(true);
    let mediaUrl = null;
    let mediaType = null;

    if (file) {
      const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      mediaUrl = await getDownloadURL(storageRef);
      mediaType = file.type.startsWith("image/") ? "image" : "video";
    }

    await addDoc(collection(db, "posts"), {
      text: text.trim(),
      userId: user.uid,
      userName: user.displayName,
      userPhoto: user.photoURL,
      createdAt: serverTimestamp(),
      mediaUrl,
      mediaType,
      likes: [],
      commentsCount: 0,
    });

    setText("");
    setFile(null);
    setUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20, background: "#fff", padding: 15, borderRadius: 12 }}>
      <textarea
        placeholder="Що нового?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit" disabled={uploading} style={{ marginTop: 10 }}>
        {uploading ? "Публікується..." : "Опублікувати"}
      </button>
    </form>
  );
}
