# 🔐 IPFS-QuickVault

A secure, blockchain-powered decentralized file sharing and storage platform using **IPFS**, **Ethereum Smart Contracts**, and **MetaMask**.  
Store, share, and access files with tamper-proof authentication and cloud integration.

---

## ⚙️ Backend Initialization

📦 `npm start` on backend (`Node.js/Express`)

- Initializes backend server on `localhost:8080`.
- Connects to:
  - MySQL DB (via XAMPP)
  - Google Drive API
  - Ethereum blockchain (via MetaMask and Web3)
- Logs confirm successful boot and readiness for requests.

---

## 🔁 Workflow

### 1️⃣ User Uploads File

![1](https://github.com/user-attachments/assets/99b32b9e-57a6-4089-85b2-462f4739775c)

- User connects MetaMask wallet (Ethereum account).
- Selects a file from the device.
- Clicks **Upload**.
- React app sends file via `POST /upload` API.

---

### 2️⃣ File Received by Backend

![2](https://github.com/user-attachments/assets/a743fa42-7c07-4194-b086-5d4b5110e03c)

- File received by Express backend.
- Backend:
  - Validates request
  - Generates **SHA256 hash**
  - Logs steps like “File Received”, “Hash Generated”, etc.

---

### 3️⃣ Upload to Google Drive

![3](https://github.com/user-attachments/assets/f0ca9c91-9bbf-49de-8ec0-efd780b58da6)

- File is pushed to linked Google Drive using OAuth.
- A **shareable link** is generated with view permission.

---

### 4️⃣ Temporary Server Storage

![4](https://github.com/user-attachments/assets/e16ef413-105c-494b-bac5-7dc38c4d435a)

- File is also saved temporarily in `backend/uploads/`.
- Can be deleted after Google Drive upload completes.

---

### 5️⃣ MySQL Entry Creation

![5](https://github.com/user-attachments/assets/e3faadd1-6f2a-4000-8733-ce1e9c073713)

- MySQL table stores metadata:
  - File Name
  - File Hash (SHA256)
  - Google Drive URL
  - Upload Timestamp
  - Wallet Address (from MetaMask)

---

### 6️⃣ Blockchain Storage

![6](https://github.com/user-attachments/assets/8989670b-486b-45e3-b7e8-7c28a75ec295)

- Smart contract is called via frontend/backend.
- MetaMask prompts transaction approval.
- File hash is stored immutably on Ethereum.
- Blockchain returns transaction hash (TxHash).

---

### 7️⃣ Success Response + Shareable Link

![7](https://github.com/user-attachments/assets/fc207c2d-3df0-4764-8274-419a2ac27e1f)

- Frontend shows success confirmation.
- Displays a **"View File"** button.
- File is now securely shareable.
- Authenticity can be verified on-chain.

---

### 8️⃣ Final UI Snapshot

![8](https://github.com/user-attachments/assets/30cd8ea9-ad4f-4294-a514-f706b5120136)

- Clean React UI with full feedback and interaction.

---

## 🚀 Features

- 🔒 **MetaMask Authentication** – Wallet-based secure login  
- 🌐 **IPFS File Storage** – Decentralized, distributed storage system  
- 📂 **Google Drive Cloud Integration** – Real-time file uploads  
- 🔗 **Instant Shareable Links** – Direct file sharing post upload  
- 🧾 **Blockchain Access Logs** – Immutable smart contract records  
- 🗃️ **MySQL Metadata Management** – Fast retrieval and indexing  

---

## 🛠️ Tech Stack

| Frontend      | Backend       | Blockchain            | Storage                | Database        |
|---------------|---------------|------------------------|------------------------|-----------------|
| React.js      | Node.js       | Solidity + Hardhat     | IPFS + Google Drive    | MySQL (XAMPP)   |

---

## 🔧 Installation & Setup

```bash
# Clone the repo
git clone https://github.com/roshanraundal15/IPFS-QuickVault.git
cd IPFS-QuickVault

# Install dependencies
npm install

# Start frontend (React)
cd frontend
npm start

# Start backend (Node)
cd ../backend
npm run dev
