import { useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function Search() {
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!queryText) return;
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("displayName", ">=", queryText),
      where("displayName", "<=", queryText + "\uf8ff")
    );
    const snapshot = await getDocs(q);
    setResults(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>Пошук людей</h2>
      <input
        value={queryText}
        onChange={(e) => setQueryText(e.target.value)}
        placeholder="Ім'я..."
        style={{ width: "70%", padding: 8 }}
      />
      <button onClick={handleSearch}>Знайти</button>
      {results.map((user) => (
        <div
          key={user.id}
          style={{
            marginTop: 10,
            padding: 10,
            background: "#f0f0f0",
            borderRadius: 8,
          }}
        >
          <Link
            to={`/profile/${user.id}`}
            style={{ textDecoration: "none", color: "black" }}
          >
            <img
              src={user.photoURL}
              alt=""
              width={40}
              style={{ borderRadius: "50%", marginRight: 10 }}
            />
            {user.displayName}
          </Link>
        </div>
      ))}
    </div>
  );
}
