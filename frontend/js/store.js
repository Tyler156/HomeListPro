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
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

import { db, storage, auth } from "./firebase-config.js";

// every path is built from the signed-in uid, so no user can touch another user's data
function currentUid() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.uid;
}

function userPath(...parts) {
  return ["users", currentUid(), ...parts].join("/");
}

// orderByChild only sorts ascending and .val() loses the order anyway - collect and flip
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

// photo goes to Cloud Storage, only the URL is kept in the database
export async function uploadIssuePhoto(propertyId, issueId, blob) {
  const path = `users/${currentUid()}/properties/${propertyId}/${issueId}.jpg`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(fileRef);
  return { url, path };
}

// ---------- Agency logo ----------

// one fixed filename per user, so a new logo just overwrites the old one
// PNG not JPEG - logos need the transparent background
export async function uploadAgencyLogo(blob) {
  const path = `users/${currentUid()}/branding/logo.png`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, blob, { contentType: "image/png" });
  const url = await getDownloadURL(fileRef);
  return { url, path };
}

export async function deleteAgencyLogo(path) {
  await deleteObject(storageRef(storage, path));
}

// ---------- Profile ----------

export async function getProfile() {
  const snapshot = await get(dbRef(db, userPath("profile")));
  if (!snapshot.exists()) return null;
  return snapshot.val();
}

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

// one update() call so a new account gets all seven or none
export async function seedTrades(contacts) {
  const updates = {};
  contacts.forEach((contact) => {
    const { id, ...fields } = contact;
    updates[id] = { ...fields, createdAt: serverTimestamp() };
  });
  await update(dbRef(db, userPath("trades")), updates);
}

// ---------- Problems ----------

export async function listProblems() {
  const snapshot = await get(query(dbRef(db, userPath("problems")), orderByChild("createdAt")));
  return toListNewestFirst(snapshot);
}

export async function createProblem(problem) {
  const created = push(dbRef(db, userPath("problems")));
  await set(created, { ...problem, createdAt: serverTimestamp() });
  return created.key;
}

export async function updateProblem(problemId, changes) {
  await update(dbRef(db, userPath("problems", problemId)), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProblem(problemId) {
  await remove(dbRef(db, userPath("problems", problemId)));
}

// ids are slugs not push keys, so running this twice overwrites instead of duplicating
export async function seedProblems(problems) {
  const updates = {};
  problems.forEach((problem) => {
    const { id, ...fields } = problem;
    updates[id] = { ...fields, createdAt: serverTimestamp() };
  });
  await update(dbRef(db, userPath("problems")), updates);
}
