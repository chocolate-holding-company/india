import { initializeApp } from "firebase/app";
import {
 getAuth,
 signInWithEmailAndPassword,
 signOut,
 onAuthStateChanged,
} from "firebase/auth";
import {
 collection,
 doc,
 getFirestore,
 addDoc,
 setDoc,
 query,
 where,
 orderBy,
 onSnapshot,
 getDocs,
 updateDoc,
 deleteDoc,
 serverTimestamp,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
const firebaseConfig = {
 apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
 authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
 projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
 storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
 messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
 appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
let db;
let auth;
try {
 const app = initializeApp(firebaseConfig);
 db = getFirestore(app);
 auth = getAuth(app);

 // By default this app does not authenticate users.
 //
 // If your Firestore rules require auth, you can either:
 // 1) enable Anonymous Auth in Firebase console (recommended for public comment forms)
 // 2) adjust rules to allow writes from unauthenticated clients with field validation.
 //
 // Example Firestore rules snippet (not in this repo):
 // rules_version = '2';
 // service cloud.firestore {
 //   match /databases/{database}/documents {
 //     match /comments/{commentId} {
 //       allow read: if true;
 //       allow create: if request.auth == null
 //         && request.resource.data.postId is string
 //         && request.resource.data.text is string
 //         && request.resource.data.text.size() >= 6
 //         && request.resource.data.text.size() <= 500
 //         && request.resource.data.isApproved == false;
 //     }
 //   }
 // }

 onAuthStateChanged(auth, (user) => {
  if (user) {
   // eslint-disable-next-line no-console
   console.log("Firebase auth user:", user.uid);

   // If this is an anonymous auth session and your Firestore rules only allow
   // unauthenticated writes (request.auth == null), sign out immediately so
   // writes use unauthenticated access.
   if (user.isAnonymous) {
    signOut(auth).catch(() => {
     // ignore
    });
   }
  }
 });
} catch (err) {
 // eslint-disable-next-line no-console
 console.warn("Firebase initialization failed", err);
}

const getPostIdFromPath = () => {
 const path = window.location.pathname || "";
 const segments = path.split("/").filter(Boolean);
 const file = segments[segments.length - 1] || "";
 const slug = file.replace(/\.html$/, "");
 return slug || "home";
};

const safeEmailKey = (email) =>
 String(email || "")
  .trim()
  .toLowerCase()
  .replace(/[@.]/g, "_");

const commentsCollection = () => collection(db, "comments");

const commentsQuery = (postId) =>
 query(
  commentsCollection(),
  where("postId", "==", postId),
  where("isApproved", "==", true),
  orderBy("createdAt", "desc"),
 );

const formatCommentDate = (createdAt) => {
 if (!createdAt) return "";

 let date;
 if (createdAt instanceof Date) {
  date = createdAt;
 } else if (typeof createdAt.toDate === "function") {
  date = createdAt.toDate();
 } else {
  date = new Date(createdAt);
 }

 if (typeof formatDistanceToNow === "function") {
  return formatDistanceToNow(date, { addSuffix: true });
 }

 return date.toLocaleDateString(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
 });
};

const listenForComments = (postId, onUpdate, onError) => {
 if (!db || !postId) {
  onUpdate([]);
  return () => {};
 }

 const unsubscribe = onSnapshot(
  commentsQuery(postId),
  (snapshot) => {
   const comments = snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return {
     id: docSnapshot.id,
     parentId: data.parentId || null,
     name: data.name || "Anonymous",
     email: data.email || "",
     text: data.content || data.text || "",
     createdAt: data.createdAt,
     formattedDate: formatCommentDate(data.createdAt),
     reply: data.reply || null,
     isApproved: !!data.isApproved,
    };
   });
   onUpdate(comments);
  },
  (error) => {
   // eslint-disable-next-line no-console
   console.error("Error listening to comments", error);
   onError?.(error);
   // Keep existing comments visible rather than clearing them.
  },
 );

 return unsubscribe;
};

const addComment = async ({ postId, name, email, text, parentId = null }) => {
 if (!db) throw new Error("Firestore not initialized");
 if (!postId) throw new Error("Missing postId");
 const ref = commentsCollection();

 const content = String(text || "").trim();
 if (content.length < 6 || content.length > 500) {
  throw new Error("Comment must be between 6 and 1000 characters.");
 }

 const docRef = await addDoc(ref, {
  postId,
  parentId: parentId || null,
  name: String(name || "").trim() || "Anonymous",
  email: String(email || "").trim(),
  text: content,
  content,
  isApproved: false,
  createdAt: serverTimestamp(),
 });
 return docRef.id;
};

const subscribeNewsletter = async (email) => {
 if (!db) throw new Error("Firestore not initialized");
 const normalized = String(email || "")
  .trim()
  .toLowerCase();
 if (!normalized) throw new Error("Missing email");
 await setDoc(doc(db, "newsletter", safeEmailKey(normalized)), {
  email: normalized,
  subscribedAt: serverTimestamp(),
 });
 return normalized;
};

const sendContactMessage = async ({ name, email, message }) => {
 if (!db) throw new Error("Firestore not initialized");
 const normalizedEmail = String(email || "").trim();
 const normalizedName = String(name || "").trim();
 const normalizedMessage = String(message || "").trim();
 if (!normalizedName || !normalizedEmail || !normalizedMessage) {
  throw new Error("Missing required fields");
 }
 const docRef = await addDoc(collection(db, "contacts"), {
  name: normalizedName,
  email: normalizedEmail,
  message: normalizedMessage,
  createdAt: serverTimestamp(),
 });
 return docRef.id;
};

const getCurrentUser = () => (auth ? auth.currentUser : null);

const signIn = async (email, password) => {
 if (!auth) throw new Error("Firebase auth not initialized");
 return await signInWithEmailAndPassword(auth, email, password);
};

const signOutUser = async () => {
 if (!auth) throw new Error("Firebase auth not initialized");
 return await signOut(auth);
};

const onAuthChanged = (callback) => {
 if (!auth) return () => {};
 return onAuthStateChanged(auth, callback);
};

const commentsQueryForAdmin = (postId, includeUnapproved = false) => {
 const clauses = [];
 if (postId) clauses.push(where("postId", "==", postId));
 if (!includeUnapproved) clauses.push(where("isApproved", "==", true));
 clauses.push(orderBy("createdAt", "desc"));
 return query(commentsCollection(), ...clauses);
};

const getComments = async ({ postId, includeUnapproved = false } = {}) => {
 if (!db) throw new Error("Firestore not initialized");
 const q = commentsQueryForAdmin(postId, includeUnapproved);
 const snapshot = await getDocs(q);
 return snapshot.docs.map((docSnapshot) => {
  const data = docSnapshot.data();
  return {
   id: docSnapshot.id,
   parentId: data.parentId || null,
   name: data.name || "Anonymous",
   email: data.email || "",
   text: data.content || data.text || "",
   createdAt: data.createdAt,
   formattedDate: formatCommentDate(data.createdAt),
   reply: data.reply || null,
   isApproved: !!data.isApproved,
   postId: data.postId || "",
  };
 });
};

const updateComment = async (commentId, updates) => {
 if (!db) throw new Error("Firestore not initialized");
 if (!commentId) throw new Error("Missing commentId");
 const ref = doc(commentsCollection(), commentId);
 await updateDoc(ref, updates);
};

const deleteComment = async (commentId) => {
 if (!db) throw new Error("Firestore not initialized");
 if (!commentId) throw new Error("Missing commentId");
 await deleteDoc(doc(commentsCollection(), commentId));
};

const getContacts = async () => {
 if (!db) throw new Error("Firestore not initialized");
 const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
 const snapshot = await getDocs(q);
 return snapshot.docs.map((docSnapshot) => {
  const data = docSnapshot.data();
  return {
   id: docSnapshot.id,
   name: data.name || "",
   email: data.email || "",
   message: data.message || "",
   createdAt: data.createdAt,
  };
 });
};

const deleteContact = async (contactId) => {
 if (!db) throw new Error("Firestore not initialized");
 if (!contactId) throw new Error("Missing contactId");
 await deleteDoc(doc(db, "contacts", contactId));
};

const getNewsletterSubscribers = async () => {
 if (!db) throw new Error("Firestore not initialized");
 const q = query(collection(db, "newsletter"), orderBy("subscribedAt", "desc"));
 const snapshot = await getDocs(q);
 return snapshot.docs.map((docSnapshot) => {
  const data = docSnapshot.data();
  return {
   id: docSnapshot.id,
   email: data.email || "",
   subscribedAt: data.subscribedAt,
  };
 });
};

const deleteSubscriber = async (subscriberId) => {
 if (!db) throw new Error("Firestore not initialized");
 if (!subscriberId) throw new Error("Missing subscriberId");
 await deleteDoc(doc(db, "newsletter", subscriberId));
};

window.FirebaseService = {
 getCurrentUser,
 onAuthStateChanged: onAuthChanged,
 signIn,
 signOut: signOutUser,

 getPostIdFromPath,
 listenForComments,
 getComments,
 addComment,
 updateComment,
 deleteComment,

 subscribeNewsletter,
 getNewsletterSubscribers,
 deleteSubscriber,

 sendContactMessage,
 getContacts,
 deleteContact,
};
