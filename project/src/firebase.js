import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBVKhzdHp1OHRugPGCm1qnDcGIRssNPw8A",
  authDomain: "quiet-social-5ed09.firebaseapp.com",
  projectId: "quiet-social-5ed09",
  storageBucket: "quiet-social-5ed09.firebasestorage.app",
  messagingSenderId: "226112317325",
  appId: "1:226112317325:web:84f920dd211b10aa687fc4",
  measurementId: "G-9YD75R4THH",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider(); // ← це було пропущено
export const db = getFirestore(app);
export const storage = getStorage(app);
