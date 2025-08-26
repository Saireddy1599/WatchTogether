// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "watchtogether-48c1e.firebaseapp.com",
  projectId: "watchtogether-48c1e",
  storageBucket: "watchtogether-48c1e.appspot.com",
  messagingSenderId: "1026867531849",
  appId: "1:1026867531849:web:64e02937e5df3c74927f9d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
