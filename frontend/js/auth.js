import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

let signUpInProgress = false;

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
 // My complex technique async code 
export async function signUp(email, password, fullName) {
  signUpInProgress = true;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    if (fullName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: fullName });
    }

    return userCredential;
  } finally {
    signUpInProgress = false;
  }
}

export function signOutUser() {
  return signOut(auth);
}


// User not logged in - so retuns to the login page
export function requireAuth(redirectTo = "login.html") {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        resolve(user);
      } else {
        window.location.replace(redirectTo);
      }
    });
  });
}

// If a user is already signed in - redirect them to the Dashboard (Main Page)
export function redirectIfAuthed(target = "dashboard.html") {
  const unsub = onAuthStateChanged(auth, (user) => {
    // signup page navigates itself once the profile is written
    if (signUpInProgress) return;
    if (user) {
      unsub();
      window.location.replace(target);
    }
  });
}
