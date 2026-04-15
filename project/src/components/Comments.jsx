import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function Comments({ postId, collectionName = "posts" }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, collectionName, postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [postId, collectionName]);

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addDoc(collection(db, collectionName, postId, "comments"), {
      text: newComment,
      userId: user.uid,
      userName: user.displayName,
      userPhoto: user.photoURL,
      createdAt: serverTimestamp(),
    });
    setNewComment("");
  };

  return (
    <div style={{ marginTop: 15 }}>
      {comments.map((c) => (
        <div
          key={c.id}
          style={{
            marginBottom: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <img
            src={c.userPhoto}
            alt=""
            width={24}
            height={24}
            style={{ borderRadius: "50%" }}
          />
          <strong>{c.userName}</strong> {c.text}
        </div>
      ))}
      <form onSubmit={addComment}>
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Написати коментар..."
          style={{ width: "80%", padding: 5 }}
        />
        <button type="submit">→</button>
      </form>
    </div>
  );
}
