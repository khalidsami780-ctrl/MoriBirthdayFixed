import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC-6i2qPerSV_G5_lANwXvd418p7soM_mg",
  authDomain: "mori-website.firebaseapp.com",
  projectId: "mori-website",
  storageBucket: "mori-website.firebasestorage.app",
  messagingSenderId: "332963458336",
  appId: "1:332963458336:web:8757ab9d12852ae320fb45",
  measurementId: "G-MHCK64RNH1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics safely (only runs in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
