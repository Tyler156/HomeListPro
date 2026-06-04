import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDvPfnm6E55X-g3siNcVxe12zz1KiPZhfc",
  authDomain: "home-list-pro.firebaseapp.com",
  projectId: "home-list-pro",
  storageBucket: "home-list-pro.firebasestorage.app",
  messagingSenderId: "969799778120",
  appId: "1:969799778120:web:fd5e7179a8631dd5b7fd7d",
  measurementId: "G-E16979QLV7",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
