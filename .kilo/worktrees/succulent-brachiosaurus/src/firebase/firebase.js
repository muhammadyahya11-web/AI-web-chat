import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {

  apiKey: "AIzaSyCRUWoY46H1lEM1JL9UsykR-l8ezfgicqc",

  authDomain: "chatapp-e47ff.firebaseapp.com",

  databaseURL: "https://chatapp-e47ff-default-rtdb.firebaseio.com",

  projectId: "chatapp-e47ff",

  storageBucket: "chatapp-e47ff.firebasestorage.app",

  messagingSenderId: "800520804934",

  appId: "1:800520804934:web:4ecc261347edaf9fe7c847",

  measurementId: "G-1R0K6QK8DM"

};



const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

