import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getRemoteConfig } from 'firebase/remote-config';

// const firebaseConfig = {
//   // apiKey: "AIzaSyD4tyG5We6p4WnP8_OGM_3hH4KqWaIgOak",  // Replace with your actual Firebase API key
//   // authDomain: "namma-yatri.firebaseapp.com",
//   // projectId: "jp-beckn-dev",
//   // storageBucket: "namma-yatri.appspot.com",
//   // messagingSenderId: "123456789",                      
//   // appId: "1:123456789:web:abc123def456"
// };

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firebase Remote Config and get a reference to the service
export const remoteConfig = getRemoteConfig(app);
