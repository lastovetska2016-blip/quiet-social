// src/components/AdminPanel.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (user?.email !== "your-admin@email.com") return; // заміни на свій email
    const fetchData = async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const postsSnap = await getDocs(collection(db, "posts"));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPosts(postsSnap.docs.map(p => ({ id: p.id, ...p.data() })));
    };
    fetchData();
  }, [user]);

  const deletePost = async (postId) => {
    await deleteDoc(doc(db, "posts", postId));
    setPosts(posts.filter(p => p.id !== postId));
  };

  if (user?.email !== "your-admin@email.com") return <div>Немає доступу</div>;

  return (
    <div>
      <h2>Адмін-панель</h2>
      <h3>Користувачі</h3>
      {users.map(u => <div key={u.id}>{u.email}</div>)}
      <h3>Пости</h3>
      {posts.map(p => (
        <div key={p.id}>
          {p.text} <button onClick={() => deletePost(p.id)}>Видалити</button>
        </div>
      ))}
    </div>
  );
}
