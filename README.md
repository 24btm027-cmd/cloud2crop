# Cloud2Crop (React + Bootstrap + Node/Express + MongoDB)

## Folder structure
```
cloud2crop/
  backend/   Node + Express + Mongoose  (server.js, models.js, seed.js, data/*.json)
  frontend/  React + Vite + Bootstrap   (src/App.jsx, src/i18n.js)
```

## 1. Start MongoDB
- Local: install MongoDB Community and start it (`brew services start mongodb-community` on Mac), or
- Cloud: create a free MongoDB Atlas cluster and put its connection string in `backend/.env` as MONGO_URI.

## 2. Backend (terminal 1)
```
cd backend
npm install
npm run seed     # loads the data into MongoDB
npm start        # http://localhost:5001
```

## 3. Frontend (terminal 2)
```
cd frontend
npm install
npm run dev      # http://localhost:5173  (open in Chrome)
```
Demo login: 9876543210 / farmer123 (Gujarati farmer), 9123456780 / farmer123 (Hindi farmer).
