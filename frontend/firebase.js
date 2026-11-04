import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBEepsvqkkorXbsrNSrEKzTJBIFgi50PnQ",
  authDomain: "wattapp-16238.firebaseapp.com",
  projectId: "wattapp-16238",
  storageBucket: "wattapp-16238.firebasestorage.app",
  messagingSenderId: "1099321910838",
  appId: "1:1099321910838:web:e4a0e81023c13b48279a97",
  measurementId: "G-00FDD4N7MH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();