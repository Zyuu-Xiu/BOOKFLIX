
import { initializeApp } from
"https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-bu0-jZFjnkZmyghv1C03Xd_pBVXdIR8",
  authDomain: "bookflix-4b7a5.firebaseapp.com",
  projectId: "bookflix-4b7a5",
  storageBucket: "bookflix-4b7a5.firebasestorage.app",
  messagingSenderId: "610198859992",
  appId: "1:610198859992:web:0c692cd9d2c15151a7e7ad",
  measurementId: "G-3G0KXNPQ27"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
};
