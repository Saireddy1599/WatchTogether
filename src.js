import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvTQaROh0coXcv51bqT0qdfn0echG_m_A",
  authDomain: "watchtogether-48c1e.firebaseapp.com",
  projectId: "watchtogether-48c1e",
  storageBucket: "watchtogether-48c1e.appspot.com",
  messagingSenderId: "707592941078",
  appId: "1:707592941078:web:73d3b308e59b0e0c284f37"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
