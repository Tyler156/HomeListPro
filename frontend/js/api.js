import { auth } from "./firebase-config.js";

const BACKEND = "http://localhost:5000";

export async function callApi(path, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const token = await user.getIdToken();
  const res = await fetch(BACKEND + path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body;
}
