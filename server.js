const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Verzeichnis für die hochgeladenen Bilder
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Multer-Konfiguration für das Hochladen von Dateien
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Servieren der statischen Dateien aus dem 'public'-Ordner
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// API-Endpunkt zum Hochladen der Bilder
app.post('/upload', upload.array('memoryImages', 30), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('Keine Bilder hochgeladen.');
    }
    const filePaths = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ message: 'Bilder erfolgreich hochgeladen', imagePaths: filePaths });
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});