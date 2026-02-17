/*async function loadPhotos() {
    try {
        const response = await fetch('/api/photos');
        const photos = await response.json();
        
        const gallery = document.getElementById('gallery');
        
        if (photos.length === 0) {
            gallery.innerHTML = '<div class="loading">Nessuna foto trovata. Carica le tue foto nella cartella public/foto/</div>';
            return;
        }
        
        gallery.innerHTML = photos.map(photo => `
            <div class="photo-card">
                <div class="photo-container" onclick="openModal('${photo}')">
                    <img src="/foto/${photo}" alt="${photo}" loading="lazy">
                </div>
                <div class="photo-info">
                    <div class="photo-name">${photo}</div>
                    <button class="download-btn" onclick="downloadPhoto('${photo}')">
                        ⬇️ Scarica Foto
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Errore nel caricamento delle foto:', error);
        document.getElementById('gallery').innerHTML = '<div class="loading">Errore nel caricamento delle foto</div>';
    }
}

function downloadPhoto(filename) {
    window.location.href = `/download/${filename}`;
}

function openModal(filename) {
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = `/foto/${filename}`;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
}

// Aspetta che il DOM sia completamente caricato
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal');
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    // Carica le foto all'avvio
    loadPhotos();
});*/
// ==============================
// 🔹 CONFIGURAZIONE
// ==============================
const SECRET_PATH = '/laurea-Red_Richard';
let filesToUpload = [];

// ==============================
// 🔹 GALLERIA PUBBLICA
// ==============================
async function loadPhotos() {
    try {
        const response = await fetch(`${SECRET_PATH}/api/photos`);
        const photos = await response.json();

        const gallery = document.getElementById('gallery');
        if (!photos || photos.length === 0) {
            gallery.innerHTML = '<div class="loading">Nessuna foto trovata</div>';
            return;
        }

        gallery.innerHTML = photos.map(photo => `
            <div class="photo-card">
                <div class="photo-container" onclick="openModal('${photo}')">
                    <img src="${SECRET_PATH}/foto/${photo}" alt="${photo}" loading="lazy">
                </div>
                <div class="photo-info">
                    <div class="photo-name">${photo}</div>
                    <button class="download-btn" onclick="downloadPhoto('${photo}')">
                        ⬇️ Scarica Foto
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Errore nel caricamento delle foto:', error);
        document.getElementById('gallery').innerHTML =
            '<div class="loading">Errore nel caricamento delle foto</div>';
    }
}

function downloadPhoto(filename) {
    window.location.href = `${SECRET_PATH}/download/${filename}`;
}

function openModal(filename) {
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = `${SECRET_PATH}/foto/${filename}`;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// ==============================
// 🔹 ADMIN
// ==============================
async function handleAdminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;

    try {
       const response = await fetch(`${SECRET_PATH}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (data.success) {
            sessionStorage.setItem('adminAuth', 'true');
            showAdminPanel();
        } else {
            showError('Password errata!');
        }

    } catch (error) {
        showError('Errore di connessione');
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

function showAdminPanel() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminPhotos();
}

function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

// ==============================
// 🔹 FILE SELEZIONE & UPLOAD
// ==============================
function handleFileSelect(e) {
    const selectedFiles = document.getElementById('selectedFiles');
    const uploadBtn = document.getElementById('uploadBtn');

    filesToUpload = Array.from(e.target.files);

    if (filesToUpload.length > 0) {
        selectedFiles.innerHTML = `
            <div style="font-weight:600;margin-bottom:10px;">
                File selezionati: ${filesToUpload.length}
            </div>
            ${filesToUpload.map(file => `<div>📸 ${file.name}</div>`).join('')}
        `;
        selectedFiles.classList.add('show');
        uploadBtn.classList.add('show');
    } else {
        selectedFiles.classList.remove('show');
        uploadBtn.classList.remove('show');
    }
}

async function uploadPhotos() {
    if (filesToUpload.length === 0) {
        alert('Seleziona almeno una foto!');
        return;
    }

    const formData = new FormData();
    filesToUpload.forEach(file => formData.append('photos', file));

    try {
        const response = await fetch(`${SECRET_PATH}/admin/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            alert(`Caricate ${data.uploaded} foto`);
            loadAdminPhotos();
            resetUpload();
        } else {
            alert('Errore upload');
        }

    } catch (error) {
        alert('Errore: ' + error.message);
    }
}

function resetUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const selectedFiles = document.getElementById('selectedFiles');

    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Carica Foto';
    fileInput.value = '';
    filesToUpload = [];
    selectedFiles.classList.remove('show');
    uploadBtn.classList.remove('show');
}

// ==============================
// 🔹 CARICA FOTO ADMIN
// ==============================
async function loadAdminPhotos() {
    try {
        const response = await fetch(`${SECRET_PATH}/admin/photos`);
        const photos = await response.json();

        const photosGrid = document.getElementById('photosGrid');
        const photoCount = document.getElementById('photoCount');

        photoCount.textContent = photos.length;

        if (photos.length === 0) {
            photosGrid.innerHTML = '<p>Nessuna foto caricata</p>';
            return;
        }

        photosGrid.innerHTML = photos.map(photo => `
            <div class="admin-photo-card">
                <img src="${SECRET_PATH}/foto/${photo}" alt="${photo}" loading="lazy">
                <button class="btn-delete" onclick="deletePhoto('${photo}')">🗑️ Elimina</button>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
    }
}

async function deletePhoto(filename) {
    if (!confirm(`Eliminare ${filename}?`)) return;

    try {
        const response = await fetch(`${SECRET_PATH}/admin/delete/${filename}`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
            loadAdminPhotos();
        }

    } catch (error) {
        alert('Errore eliminazione');
    }
}

// ==============================
// 🔹 INIT
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    // Galleria pubblica
    if (document.getElementById('gallery')) {
        loadPhotos();
        const modal = document.getElementById('modal');
        if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    }

    // Admin
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        if (sessionStorage.getItem('adminAuth') === 'true') showAdminPanel();
        loginForm.addEventListener('submit', handleAdminLogin);

        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    }
});

