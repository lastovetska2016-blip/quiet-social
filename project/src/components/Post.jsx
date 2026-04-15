// src/components/Post.jsx
import { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Comments from "./Comments";

export default function Post({ post }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const isLiked = post.likes?.includes(user.uid);

  const toggleLike = async () => {
    const postRef = doc(db, "posts", post.id);
    if (isLiked) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    }
  };

  const deletePost = async () => {
    if (window.confirm("Видалити пост?")) {
      await deleteDoc(doc(db, "posts", post.id));
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 15, marginBottom: 15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src={post.userPhoto} alt="" width={40} height={40} style={{ borderRadius: "50%" }} />
        <strong>{post.userName}</strong>
      </div>
      <p>{post.text}</p>
      {post.mediaUrl && (
        post.mediaType === "image" ? 
          <img src={post.mediaUrl} alt="" style={{ maxWidth: "100%", borderRadius: 8 }} /> :
          <video src={post.mediaUrl} controls style={{ maxWidth: "100%" }} />
      )}
      <div style={{ display: "flex", gap: 15, marginTop: 10 }}>
        <button onClick={toggleLike}>❤️ {post.likes?.length || 0}</button>
        <button onClick={() => setShowComments(!showComments)}>💬 {post.commentsCount}</button>
        {user.uid === post.userId && <button onClick={deletePost}>🗑️</button>}
      </div>
      {showComments && <Comments postId={post.id} />}
    </div>
  );
}
