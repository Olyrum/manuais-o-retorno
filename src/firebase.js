import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA_po9hvJqFPri_AI4uw73AiYb5BbspNjs",
  authDomain: "thomas-teste-d7a3d.firebaseapp.com",
  databaseURL: "https://thomas-teste-d7a3d-default-rtdb.firebaseio.com",
  projectId: "thomas-teste-d7a3d",
  storageBucket: "thomas-teste-d7a3d.firebasestorage.app",
  messagingSenderId: "280109049625",
  appId: "1:280109049625:web:487874357d0173797d0788"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
