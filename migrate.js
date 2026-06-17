import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push } from "firebase/database";
import * as xlsx from 'xlsx';
import fs from 'fs';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_po9hvJqFPri_AI4uw73AiYb5BbspNjs",
  authDomain: "thomas-teste-d7a3d.firebaseapp.com",
  databaseURL: "https://thomas-teste-d7a3d-default-rtdb.firebaseio.com",
  projectId: "thomas-teste-d7a3d",
  storageBucket: "thomas-teste-d7a3d.firebasestorage.app",
  messagingSenderId: "280109049625",
  appId: "1:280109049625:web:487874357d0173797d0788"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const importData = async () => {
  try {
    const filePath = 'Manuais a serem revisados..xlsx';
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    const targetRef = ref(database, 'site_manuais_v1/manuals');
    
    // Convert array to object with unique push IDs
    const uploadData = {};
    for (const item of data) {
      // Create a unique key for each manual
      const newRef = push(targetRef);
      uploadData[newRef.key] = {
        capitulo: item.CAPITULO || 'Geral',
        manual: item.MANUAL || 'Sem nome',
        status: item.STATUS || 'Pendente',
        print_atualizado: item['PRINT ATUALIZADO?'] || 'NÃO',
        revisao: item['REVISÃO?'] || 'NÃO',
      };
    }

    await set(targetRef, uploadData);
    console.log('Data successfully imported to site_manuais_v1/manuals!');
    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

importData();
