import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

// Set while signUp is running so redirectIfAuthed ignores the auth state change
// that creating the account triggers. Without this the listener navigates away
// before the display name and profile have been saved.
let signUpInProgress = false;

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

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

// Resolves with the current user once auth state is known.
// If unauthenticated, redirects to `redirectTo` and never resolves.
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

// On the login page: bounce already-signed-in users straight to the dashboard.
export function redirectIfAuthed(target = "dashboard.html") {
  const unsub = onAuthStateChanged(auth, (user) => {
    // The signup page navigates itself once the profile has been written.
    if (signUpInProgress) return;
    if (user) {
      unsub();
      window.location.replace(target);
    }
  });
}
