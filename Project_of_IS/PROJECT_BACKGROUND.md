# CipherFrame — Project Background & Overview

**Project Name:** CipherFrame  
**Version:** 1.0  
**Date:** November 2025  
**Team Members:**
1. Muhammad Tayyab Mujtaba Khan (F24609035)
2. Owais Ismail (F24609055)
3. Qasim Usman (F24609008)

---

## 🎯 Project Summary

**CipherFrame** is a comprehensive web-based Image Encryption & Decryption System with optional image steganography. It provides a modern, secure interface for encrypting sensitive images using military-grade AES-256 encryption (with PBKDF2 key derivation) and includes LSB-based image steganography for hiding secret messages inside PNG images.

### Key Features
✅ **AES-256-GCM Encryption** — Military-grade authenticated encryption  
✅ **PBKDF2 Key Derivation** — Secure password-based key generation (100k iterations)  
✅ **Hex Preview** — View encrypted data in hexadecimal format  
✅ **Secure File Storage** — Encrypted files stored server-side in `.enc` format  
✅ **Image Steganography** — Hide and extract messages in PNG images (LSB method)  
✅ **Simple Login System** — Session-based access control  
✅ **Modern UI** — Glassmorphism design, dark theme, responsive layout  
✅ **Team Display** — Prominent team member names and IDs  

---

## 📂 Project Structure

```
Project_of_IS/
├── app.py                          # Main Flask application (453 lines)
├── requirements.txt                # Python dependencies
├── run.bat                         # Windows batch runner script
├── setup.bat                       # Setup script
├── screenshot.png                  # Project screenshot/visual
│
├── static/                         # Frontend static assets
│   ├── css/
│   │   └── style.css              # Main stylesheet (glassmorphism, animations)
│   └── js/
│       └── script.js              # Client-side logic (AJAX, file handling)
│
├── templates/                      # Jinja2 HTML templates
│   ├── login.html                 # Login page (admin/pass)
│   ├── home.html                  # Landing/home page with team info
│   └── index.html                 # Main app interface (encrypt/decrypt/stego)
│
├── encrypted_files/               # Server-side storage for encrypted images
│   └── (encrypted .enc files & stego PNGs stored here)
│
├── __pycache__/                   # Python bytecode cache
│
└── Documentation/                 # (Optional guides below)
    ├── README.md
    ├── QUICKSTART.md
    ├── START_HERE.md
    ├── QUICK_REFERENCE.md
    ├── PROJECT_SUMMARY.md
    ├── INDEX.md
    ├── CHECKLIST.md
    ├── ARCHITECTURE.md
    └── PPT_of_IS.pptx             # Presentation slides
```

---

## 🔐 Technology Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Backend** | Python Flask | Web framework, routing, session mgmt |
| **Encryption** | cryptography library | PBKDF2HMAC, AES-256-GCM |
| **Image Processing** | Pillow (PIL) | LSB steganography, PNG read/write |
| **Frontend** | Bootstrap 5, CSS | Responsive UI, glassmorphism styling |
| **Frontend Logic** | Vanilla JavaScript | AJAX requests, auto-download, form handling |
| **Storage** | Local filesystem | encrypted_files/ directory |
| **Session Management** | Flask session | Simple login (admin/pass) |

---

## 🎨 UI/UX Design

### Color Palette
- **Primary:** Purple gradient (#6c63ff → #8b82ff)
- **Secondary:** Pink/Magenta (#ff6b9d)
- **Accent:** Cyan (#00d4ff)
- **Background:** Dark navy (#0f0f23 → #0a0a15)
- **Text:** White (#ffffff) and light gray (#b0b0b0)

### Typography
- **Font Family:** Poppins (Google Fonts) + Segoe UI fallback
- **Logo/Brand:** CipherFrame with gradient text and square brand mark

### Design Patterns
- **Glassmorphism:** Semi-transparent cards with backdrop blur
- **Animations:** Fade-in, fade-out, scale, zoom effects on page load
- **Responsive:** Mobile-first, 3-column desktop to 1-column mobile
- **Team Display:** Numbered list format (1) Name (ID), vertically stacked

---

## 🔒 Security Architecture

### Encryption Flow
```
User Password
    ↓
PBKDF2HMAC (SHA-256, 100k iterations, random 16-byte salt)
    ↓
32-byte AES-256 Key
    ↓
AES-256-GCM Encryption (random 12-byte IV, 16-byte auth tag)
    ↓
File Format: [salt(16)] [iv(12)] [tag(16)] [ciphertext(...)]
    ↓
Saved as: filename_xxxx.enc
```

### Key Security Points
- **Salt:** Random per encryption; stored in `.enc` file
- **IV:** Random per encryption; prevents pattern recognition
- **Authentication Tag:** Detects tampering; GCM mode ensures authenticated encryption
- **Password Strength:** Minimum 4 chars (user responsibility for strong passwords)
- **Key Derivation:** PBKDF2 with 100,000 iterations slows brute-force attacks

---

## 🖼️ Image Steganography (LSB)

### How It Works
1. User uploads PNG image (RGBA)
2. Secret message converted to UTF-8 bytes
3. 32-bit length header prepended
4. Bits embedded in LSBs of R, G, B channels (3 bits per pixel)
5. Modified PNG saved to server
6. Auto-downloads to client

### Capacity
- **Formula:** 3 bits per pixel = message_capacity = (width × height × 3) / 8 bytes
- **Example:** 1000×1000 PNG ≈ 375 KB message capacity

---

## 📋 Routes & Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | Landing page (redirects to login if not authenticated) |
| `/app` | GET | Main app page (encrypt/decrypt/stego interface) |
| `/login` | GET/POST | Login form; credentials: admin / pass |
| `/logout` | GET | Clear session, redirect to login |
| `/encrypt` | POST | Upload image + password → returns encrypted file & hex preview |
| `/decrypt` | POST | Upload .enc file + password → returns base64 image data URL |
| `/download/<filename>` | GET | Download encrypted .enc file from server |
| `/steg/embed` | POST | Upload PNG + message → embed & save stego image |
| `/steg/extract` | POST | Upload PNG → extract hidden message |
| `/health` | GET | Health check endpoint |

---

## ✨ UI Pages Overview

### 1. **Login Page** (`/login`)
- Simple form with username & password fields
- Credentials: `admin` / `pass`
- Redirects to home on success

### 2. **Home Page** (`/`)
- Hero section with project title and subtitle
- **Team Members Section:** Numbered list (1, 2, 3) with gradient badges
  - 1) Muhammad Tayyab Mujtaba Khan (F24609035)
  - 2) Owais Ismail (F24609055)
  - 3) Qasim Usman (F24609008)
- Quick-action buttons: Encrypt, Decrypt, Steganography
- Info cards: Operation descriptions and tips

### 3. **App Page** (`/app`)
- **Navbar:** CipherFrame branding, navigation links, logout
- **Hero Section:** Project title, subtitle, **compact team list** (visible on desktop)
- **Encryption Section (left):** Form to upload image + password → download .enc + hex preview
- **Decryption Section (right):** Form to upload .enc + password → display decrypted image
- **Steganography Section (bottom, full-width):** 
  - Left: Embed message in PNG → preview + download stego image
  - Right: Extract message from PNG → display hidden message

---

## 🚀 How to Run

### Prerequisites
- Python 3.7+
- pip (Python package manager)

### Quick Start
```bash
# 1. Navigate to project directory
cd c:\Users\Dell\Desktop\Project_of_IS

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the Flask app
python app.py

# 4. Open browser
# http://127.0.0.1:5000/

# 5. Login
# Username: admin
# Password: pass
```

### Alternative Commands
```powershell
# Using py launcher (Windows)
py -3 app.py

# Using run.bat script (if configured)
.\run.bat
```

---

## 📊 Feature Checklist

- [x] AES-256-GCM encryption with PBKDF2 key derivation
- [x] Secure file storage (.enc format with salt+IV+tag+ciphertext)
- [x] Hex preview of encrypted data
- [x] Image decryption (password-protected)
- [x] LSB image steganography (PNG)
- [x] Steganography auto-download
- [x] Message extraction from stego images
- [x] Simple login system (admin/pass)
- [x] Team member display (numbered list, prominent)
- [x] Modern UI (glassmorphism, dark theme, responsive)
- [x] Mobile-responsive design
- [x] Error handling & validation
- [ ] Production hardening (HTTPS, env-based secrets, rate-limiting)
- [ ] User account system (advanced)
- [ ] Encrypt stego payloads (add extra security layer)

---

## 🎬 Demo Script

### Encryption Demo (2–3 minutes)
1. Login with `admin` / `pass`
2. Go to Encrypt section
3. Upload a test image (PNG/JPG)
4. Enter password (e.g., "MySecret123")
5. Click "Encrypt Image"
6. View hex preview
7. Download .enc file
8. Show file size increase due to salt/IV/tag

### Decryption Demo (1–2 minutes)
1. Go to Decrypt section
2. Upload the .enc file from step 7
3. Enter the same password
4. Click "Decrypt Image"
5. Show decrypted image matches original

### Steganography Demo (1–2 minutes)
1. Go to Steganography section
2. Upload a PNG image
3. Enter secret message: "This is hidden!"
4. Click "Embed Message"
5. Stego image auto-downloads
6. Upload stego image to Extract section
7. Click "Extract Message"
8. Show "This is hidden!" appears

---

## 📸 Visual Elements & Screenshots

### Key UI Components
- **Brand Mark:** Gradient square (purple → cyan) next to "CipherFrame" text
- **Hero Section:** Large title, subtitle, team member badges
- **Team Cards/Items:** Numbered badges (1, 2, 3) with purple gradient, member names, IDs
- **Form Inputs:** Glassmorphic inputs with focus glow effects
- **Buttons:** Gradient buttons (encrypt: purple, decrypt: pink, download: cyan)
- **Hex Preview:** Monospace font, cyan text on dark background
- **Cards:** Semi-transparent with blur effect, smooth hover animations

### Screenshot Path
- Existing: `screenshot.png` (project root)
- Use this as reference for visual documentation

---

## 🔧 Maintenance & Future Improvements

### Short-term (MVP)
- Add input validation feedback tooltips
- Add file size capacity check for steganography before upload
- Improve error messages (user-friendly language)

### Medium-term (Enhancement)
- Add user account system (register, login, password reset)
- Support HTTPS and environment-based secrets
- Add rate-limiting to prevent brute-force attacks
- Support more image formats for steganography (BMP, GIF)
- Encrypt stego payloads before embedding

### Long-term (Production)
- Deploy to cloud (AWS, Azure, Heroku)
- Add multi-factor authentication (MFA)
- Implement audit logging
- GDPR compliance & data retention policies
- Mobile app version (React Native, Flutter)

---

## 📞 Contact & Attribution

**Developed by:**
- Muhammad Tayyab Mujtaba Khan (F24609035)
- Owais Ismail (F24609055)
- Qasim Usman (F24609008)

**Course/Instructor:** [Information Security / Prof. Name]  
**Date Completed:** November 2025

---

## 📚 Additional Resources

### Documentation Files
- `README.md` — Quick start & overview
- `QUICKSTART.md` — Step-by-step setup
- `ARCHITECTURE.md` — Technical deep-dive
- `START_HERE.md` — First-time user guide
- `QUICK_REFERENCE.md` — Command/API reference

### Presentation
- `PPT_of_IS.pptx` — Full slide deck for presentation

---

**Last Updated:** November 22, 2025  
**Status:** ✅ Complete & Ready for Presentation
