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
// CONFIGURAZIONE
// ==============================
const ADMIN_PASSWORD = 'admin123'; // CAMBIA QUESTA PASSWORD!

// ==============================
// FUNZIONI GALLERIA PUBBLICA
// ==============================
async function loadPhotos() {
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

// ==============================
// FUNZIONI AREA ADMIN
// ==============================

// Variabili globali admin
let filesToUpload = [];

// Login admin
async function handleAdminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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

// Logout
function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

// Gestione file input
function handleFileSelect(e) {
    const selectedFiles = document.getElementById('selectedFiles');
    const uploadBtn = document.getElementById('uploadBtn');
    
    filesToUpload = Array.from(e.target.files);
    
    if (filesToUpload.length > 0) {
        selectedFiles.innerHTML = `
            <div style="color: #001f3f; font-weight: 600; margin-bottom: 10px;">
                File selezionati: ${filesToUpload.length}
            </div>
            ${filesToUpload.map(file => `
                <div class="file-item">
                    📸 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
            `).join('')}
        `;
        selectedFiles.classList.add('show');
        uploadBtn.classList.add('show');
    } else {
        selectedFiles.classList.remove('show');
        uploadBtn.classList.remove('show');
    }
}

// Upload foto
async function uploadPhotos() {
    const uploadBtn = document.getElementById('uploadBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const successMessage = document.getElementById('successMessage');
    
    if (filesToUpload.length === 0) {
        alert('Seleziona almeno una foto!');
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Caricamento in corso...';
    progressBar.classList.add('show');
    successMessage.classList.remove('show');

    const formData = new FormData();
    filesToUpload.forEach(file => {
        formData.append('photos', file);
    });

    try {
        const xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = percentComplete + '%';
                progressFill.textContent = percentComplete + '%';
            }
        });

        // Upload completato
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                showSuccess(`✅ ${data.uploaded} foto caricate con successo!`);
                resetUpload();
                loadAdminPhotos();
            } else {
                alert('Errore durante il caricamento');
                resetUpload();
            }
        });

        xhr.addEventListener('error', () => {
            alert('Errore di rete');
            resetUpload();
        });

        xhr.open('POST', '/admin/upload');
        xhr.send(formData);

    } catch (error) {
        alert('Errore: ' + error.message);
        resetUpload();
    }
}

function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.classList.add('show');
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 5000);
}

function resetUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const selectedFiles = document.getElementById('selectedFiles');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Carica Foto';
    fileInput.value = '';
    filesToUpload = [];
    selectedFiles.classList.remove('show');
    uploadBtn.classList.remove('show');
    progressBar.classList.remove('show');
    progressFill.style.width = '0%';
    progressFill.textContent = '0%';
}

// Carica foto per admin
async function loadAdminPhotos() {
    const photosGrid = document.getElementById('photosGrid');
    const photoCount = document.getElementById('photoCount');
    
    try {
        const response = await fetch('/admin/photos');
        const photos = await response.json();

        photoCount.textContent = photos.length;

        if (photos.length === 0) {
            photosGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #001f3f; padding: 40px;">
                    📭 Nessuna foto caricata
                </div>
            `;
            return;
        }

        photosGrid.innerHTML = photos.map(photo => `
            <div class="admin-photo-card">
                <img src="/foto/${photo}" alt="${photo}" loading="lazy">
                <div class="admin-photo-info">
                    <div class="photo-filename">${photo}</div>
                    <button class="btn-delete" onclick="deletePhoto('${photo}')">
                        🗑️ Elimina
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        photosGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #dc3545;">
                ❌ Errore nel caricamento
            </div>
        `;
    }
}

// Elimina foto
async function deletePhoto(filename) {
    if (!confirm(`Sei sicuro di voler eliminare "${filename}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/admin/delete/${filename}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(`✅ Foto "${filename}" eliminata`);
            loadAdminPhotos();
        } else {
            alert('Errore durante l\'eliminazione');
        }
    } catch (error) {
        alert('Errore: ' + error.message);
    }
}

// ==============================
// INIZIALIZZAZIONE
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // Se siamo nella pagina galleria pubblica
    const gallery = document.getElementById('gallery');
    if (gallery) {
        const modal = document.getElementById('modal');
        
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
        }
        
        // Carica le foto della galleria pubblica
        loadPhotos();
    }
    
    // Se siamo nella pagina admin
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Verifica se già autenticato
        const isAuth = sessionStorage.getItem('adminAuth');
        if (isAuth === 'true') {
            showAdminPanel();
        }
        
        // Gestione login
        loginForm.addEventListener('submit', handleAdminLogin);
        
        // Gestione file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }
    }
});