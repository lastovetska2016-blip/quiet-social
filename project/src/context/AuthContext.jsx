import { createContext, useContext, useEffect, useState } from "react";
import { auth, provider, db } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // Новий користувач – створюємо профіль з усіма полями
          await setDoc(userRef, {
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            birthday: "",
            interests: "",
            workplace: "",
            status: "",
            coverPhoto: null,
            createdAt: new Date(),
          });
        } else {
          // Якщо користувач існує, але якихось полів немає – додаємо їх
          const data = userSnap.data();
          const updates = {};
          if (data.birthday === undefined) updates.birthday = "";
          if (data.interests === undefined) updates.interests = "";
          if (data.workplace === undefined) updates.workplace = "";
          if (data.status === undefined) updates.status = "";
          if (Object.keys(updates).length) {
            await updateDoc(userRef, updates);
          }
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Помилка входу:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (uid, data) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, data);
  };

  const value = { user, signInWithGoogle, logout, updateUserProfile };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
