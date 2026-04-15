import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Auth() {
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        // Вхід існуючого користувача
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Реєстрація нового користувача
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        const name = displayName.trim() || email.split("@")[0];
        // Оновлюємо профіль у Firebase Auth (ім'я)
        await updateProfile(user, { displayName: name });
        // Створюємо документ у колекції "users"
        await setDoc(doc(db, "users", user.uid), {
          displayName: name,
          email: user.email,
          photoURL: "https://via.placeholder.com/120", // тимчасове фото
          birthday: "",
          interests: "",
          workplace: "",
          status: "",
          coverPhoto: null,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>🌿 Тихе місце</h1>
      <button
        onClick={signInWithGoogle}
        style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
      >
        🔐 Увійти через Google
      </button>
      <hr style={{ margin: "20px 0" }} />
      <form
        onSubmit={handleEmailAuth}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {!isLogin && (
          <input
            type="text"
            placeholder="Ваше ім'я"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            style={{ padding: 8, width: 250 }}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 8, width: 250 }}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 8, width: 250 }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>
          {isLogin ? "Увійти" : "Зареєструватися"}
        </button>
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{
            background: "none",
            border: "none",
            color: "#4CAF50",
            cursor: "pointer",
          }}
        >
          {isLogin ? "Створити акаунт" : "Вже маєте акаунт? Увійти"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}
