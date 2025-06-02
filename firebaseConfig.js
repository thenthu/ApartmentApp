// firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyASFB3cI-z2OnQZfGGJQKvsq2QTSaAYtbw",
    authDomain: "apartmentapp-94227.firebaseapp.com",
    databaseURL: "https://apartmentapp-94227-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "apartmentapp-94227",
    storageBucket: "apartmentapp-94227.appspot.com", // sửa ".app" → ".appspot.com"
    messagingSenderId: "796162858705",
    appId: "1:796162858705:web:20cb51bccb135250f7eff0",
    measurementId: "G-HEG5MCXF4W"
};

// ✅ Kiểm tra nếu Firebase chưa được khởi tạo thì mới gọi initializeApp
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

export { database };
