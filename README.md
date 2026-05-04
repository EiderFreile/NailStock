# ✨ Nail Stock — App de inventario para manicura

Una PWA (Progressive Web App) que puedes instalar en tu iPhone como si fuera una app nativa. Los datos se guardan en Firebase Firestore en tiempo real.

---

## 🚀 Configuración paso a paso

### 1. Crear proyecto en Firebase

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Haz clic en **"Añadir proyecto"**
3. Dale un nombre (ej: `nail-stock`) y sigue los pasos
4. Desactiva Google Analytics si no lo necesitas

### 2. Crear base de datos Firestore

1. En el menú lateral de Firebase → **Firestore Database**
2. Haz clic en **"Crear base de datos"**
3. Elige **Modo producción**
4. Selecciona región: `europe-west` (más cercana a España)
5. Una vez creada, ve a **Reglas** y pega esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Estas reglas permiten acceso sin login. Para uso personal está bien, pero si quieres más seguridad, añade autenticación más adelante.

### 3. Obtener las credenciales de Firebase

1. En Firebase → **Configuración del proyecto** (⚙️ en el menú lateral)
2. Scroll hacia abajo → **"Tus aplicaciones"**
3. Haz clic en el icono **"</>"** (web)
4. Registra la app con cualquier nombre (ej: `nail-stock-web`)
5. Copia el objeto `firebaseConfig`

### 4. Configurar el archivo `js/firebase-config.js`

Abre el archivo `js/firebase-config.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← tu valor
  authDomain: "nail-stock.firebaseapp.com",
  projectId: "nail-stock",
  storageBucket: "nail-stock.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 📤 Subir a GitHub Pages

### 1. Crear repositorio en GitHub

1. Ve a [https://github.com/new](https://github.com/new)
2. Nombre: `nail-stock` (o el que quieras)
3. **Público** (necesario para GitHub Pages gratuito)
4. Haz clic en **"Create repository"**

### 2. Subir el código

Desde tu ordenador (con Git instalado):

```bash
cd nail-stock
git init
git add .
git commit -m "Initial commit - Nail Stock app"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/nail-stock.git
git push -u origin main
```

### 3. Activar GitHub Pages

1. En tu repositorio → **Settings**
2. En el menú lateral → **Pages**
3. En "Source" → selecciona **"Deploy from a branch"**
4. Branch: **main** / Folder: **/ (root)**
5. Haz clic en **Save**

En unos minutos tendrás la app en:
`https://TU_USUARIO.github.io/nail-stock/`

---

## 📱 Instalar en iPhone como app

1. Abre la URL de tu app en **Safari** (obligatoriamente Safari)
2. Toca el botón de **compartir** (el cuadrado con flecha hacia arriba)
3. Desplázate y toca **"Añadir a pantalla de inicio"**
4. Dale el nombre que quieras y toca **"Añadir"**

¡Listo! Ahora tienes el icono en tu pantalla de inicio y se abre como una app nativa, sin barra de Safari. 🎉

---

## 📁 Estructura del proyecto

```
nail-stock/
├── index.html          # App principal
├── manifest.json       # Configuración PWA
├── sw.js               # Service Worker (offline)
├── css/
│   └── style.css       # Estilos
├── js/
│   ├── firebase-config.js  # ⚠️ Configura aquí tus credenciales
│   └── app.js          # Lógica de la app
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## 🔧 Funcionalidades

- ✅ Crear categorías de producto
- ✅ Añadir productos con: nombre, marca, color, precio, cantidad, ubicación, un solo uso
- ✅ Filtrar por categoría, marca y ubicación
- ✅ Buscador en tiempo real
- ✅ Pestaña "Un solo uso" ordenada por cantidad (menor a mayor)
- ✅ Tarjetas de colores según nivel de stock (rojo / naranja / verde)
- ✅ Límites de stock configurables
- ✅ Datos sincronizados en Firebase (tiempo real)
- ✅ Funciona offline (Service Worker)
- ✅ Instalable en iPhone como app nativa (PWA)
