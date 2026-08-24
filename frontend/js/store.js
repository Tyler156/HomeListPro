import {
  ref as dbRef,
  push,
  get,
  set,
  update,
  remove,
  query,
  orderByChild,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

import { db, storage, auth } from "./firebase-config.js";

// Every path below is built from the signed-in user's uid, so one agent can
// never read or write another agent's data. Throwing when nobody is signed in
// is deliberate: it fails loudly instead of writing to a wrong path.
function currentUid() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.uid;
}

// Builds a path like "users/abc123/properties/xyz789".
function userPath(...parts) {
  return ["users", currentUid(), ...parts].join("/");
}

// orderByChild only ever sorts ascending, and snapshot.val() would lose that
// order anyway, so the rows have to be collected with forEach and flipped.
function toListNewestFirst(snapshot) {
  const rows = [];
  snapshot.forEach((childSnapshot) => {
    rows.push({ id: childSnapshot.key, ...childSnapshot.val() });
  });
  return rows.reverse();
}

// ---------- Properties ----------

export async function listProperties() {
  const snapshot = await get(query(dbRef(db, userPath("properties")), orderByChild("createdAt")));
  return toListNewestFirst(snapshot);
}

export async function getProperty(propertyId) {
  const snapshot = await get(dbRef(db, userPath("properties", propertyId)));
  if (!snapshot.exists()) return null;
  return { id: snapshot.key, ...snapshot.val() };
}

// Returns the new key, which the dashboard uses for the appraisal URL.
export async function createProperty(property) {
  const created = push(dbRef(db, userPath("properties")));
  await set(created, {
    ...property,
    status: "in progress",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.key;
}

export async function updateProperty(propertyId, changes) {
  await update(dbRef(db, userPath("properties", propertyId)), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProperty(propertyId) {
  await remove(dbRef(db, userPath("properties", propertyId)));
}

// ---------- Issue photos ----------

// Photos go to Cloud Storage and only the download URL is kept in the database.
// Storing the image itself would mean re-downloading every photo of every
// appraisal just to draw the dashboard list.
export async function uploadIssuePhoto(propertyId, issueId, blob) {
  const path = `users/${currentUid()}/properties/${propertyId}/${issueId}.jpg`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(fileRef);
  return { url, path };
}

// ---------- Profile ----------

export async function getProfile() {
  const snapshot = await get(dbRef(db, userPath("profile")));
  if (!snapshot.exists()) return null;
  return snapshot.val();
}

// update() creates the profile the first time and patches it after that.
export async function saveProfile(profile) {
  await update(dbRef(db, userPath("profile")), { ...profile, updatedAt: serverTimestamp() });
}

// ---------- Trades ----------

export async function listTrades() {
  const snapshot = await get(query(dbRef(db, userPath("trades")), orderByChild("createdAt")));
  return toListNewestFirst(snapshot);
}

export async function createTrade(contact) {
  const created = push(dbRef(db, userPath("trades")));
  await set(created, { ...contact, createdAt: serverTimestamp() });
  return created.key;
}

// Gives a brand new account the default contact list. One update() call writing
// all seven children at once, so they either all appear or none do.
export async function seedTrades(contacts) {
  const updates = {};
  contacts.forEach((contact) => {
    const { id, ...fields } = contact;
    updates[id] = { ...fields, createdAt: serverTimestamp() };
  });
  await update(dbRef(db, userPath("trades")), updates);
}
