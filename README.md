# 🏛️ गौरादह नगरपालिका — वडा नं. १
## Digital Service & Sifarish Management Portal

> **Gauradaha Municipality, Ward No. 1**  
> Jhapa District, Koshi Province, Nepal  
> 📧 ward1.gauradaha@gmail.com

---

## 📋 Project Overview

A fully digital portal for Gauradaha Municipality Ward No. 1, providing digital sifarish (recommendation letter) generation, record management, and various public utility tools — all accessible from a single web interface.

---

## ✨ Features

### 🔐 Secure Sifarish System (Login Protected)
The sifarish section is protected by a login system. Users must authenticate before accessing any sifarish forms.

| Sifarish Type | Description |
|---|---|
| 🏠 **घर बाटो प्रमाणित** | House road access verification letter |
| 🗺️ **चार किल्ला प्रमाणित** | Four boundary (land boundary) certification |
| 🛣️ **बाटो प्रमाणित** | Road certification with land plot details |
| 👨‍👩‍👧‍👦 **पारिवारिक विवरण प्रमाणित** | Family detail verification letter |

### 🛠️ Public Utility Tools (No Login Required)
| Tool | Description |
|---|---|
| 📐 **जग्गा / क्षेत्रफल** | Land area converter (m² → Bigha, Kattha, Dhur) |
| 🏢 **व्यवसाय कर** | Business tax calculator |
| 🧮 **सिफारिस दस्तुर** | Sifarish fee calculator |
| 📜 **आर्थिक ऐन** | Economic Act & rate schedule |
| 🔍 **जग्गा वर्गीकरण** | Land classification lookup by plot number |

---

## 🗂️ Project Structure

```
Ward-1/
│
├── index.html                    # Main portal / dashboard
├── login.html                    # Standalone login page
├── auth.js                       # Authentication guard
│
├── gharbato.html                 # घर बाटो प्रमाणित form
├── charkilla.html                # चार किल्ला प्रमाणित form
├── bato-pramanit.html            # बाटो प्रमाणित form
├── pariwarik-bibaran.html        # पारिवारिक विवरण form
│
├── script.js                     # Main portal scripts
├── charkilla.js                  # Charkilla form logic
├── script-bato-pramanit.js       # Bato Pramanit form logic
├── script-pariwarik-bibaran.js   # Pariwarik Bibaran form logic
│
├── style.css                     # Global styles (Gharbato)
├── charkilla.css                 # Shared styles (Charkilla, Bato, Pariwarik)
├── gharbato.css                  # Gharbato-specific styles
│
├── aarthik-ain.html              # Economic Act viewer
├── calculator.html               # Fee calculator
├── convertcsv.json               # Land classification data
└── README.md                     # This file
```

---

## 🖥️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Fonts** | Google Fonts — Mukta (Nepali-optimized) |
| **Database** | Firebase Firestore (for sifarish records) |
| **Date Conversion** | `@sbmdkl/nepali-date-converter` (BS ↔ AD) |
| **Print** | CSS `@media print` — A4 single-page output |
| **Auth** | Session-based (`sessionStorage`) |

---

## 🔐 Login Credentials

> ⚠️ **For internal ward office use only.**

| Field | Value |
|---|---|
| **User ID** | `wada1` |
| **Password** | `wada1` |

Login is required **only** when accessing the Sifarish System from the portal. Other tools are publicly accessible.

---

## 📄 Sifarish Document Features

Each sifarish form includes:

- ✅ **Unified Letterhead** — Three-column layout (Logo + Reg/Chalani No. | Municipality Name | Date + Nepal Sambat)
- ✅ **Live Preview** — Real-time A4 document preview as you type
- ✅ **Nepali Date** — Automatic BS date and Nepal Sambat calculation
- ✅ **Firebase Records** — All sifarish saved to Firestore with edit/delete
- ✅ **Print Ready** — Single A4 page, no overflow
- ✅ **Signature Authority** — Dropdown: Ward Chair + Acting Ward Chair options

### 🖊️ Available Signature Authorities
- नगेन्द्र भण्डारी — वडा अध्यक्ष
- अन्जु निरौला — कार्यवाहक वडा अध्यक्ष
- लक्ष्मीदेवी विश्वकर्मा — कार्यवाहक वडा अध्यक्ष
- केशर बहादुर खवास — कार्यवाहक वडा अध्यक्ष
- जमुन राई — कार्यवाहक वडा अध्यक्ष
- ✍️ Custom (user-defined)

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/Sital77/Ward-1.git
cd Ward-1

# Serve locally (requires Python or any static server)
python -m http.server 8000

# Or use VS Code Live Server extension
# Then open: http://localhost:8000
```

---

## 🌐 Deployment

This project is a **static web application** — it can be hosted on:
- **GitHub Pages** → `https://sital77.github.io/Ward-1/`
- **Netlify / Vercel** — drag & drop deployment
- **Any static file server**

---

## 📸 Screenshots

| Portal Dashboard | Sifarish Login | Sifarish Form |
|---|---|---|
| Main portal with 5 tool cards | Secure login modal | Live A4 preview |

---

## 🙏 Credits

Developed for **Gauradaha Municipality Ward No. 1**  
Jhapa, Koshi Province, Nepal

© Gauradaha Municipality Ward Office — Digital Governance Initiative
