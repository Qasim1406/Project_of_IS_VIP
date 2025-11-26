// ============= GLOBAL VARIABLES & SETUP =============

document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop('encryptDropArea', 'imageFile', 'encryptFilePreview', 'encryptFileName');
    setupDragAndDrop('decryptDropArea', 'encryptedFile', 'decryptFilePreview', 'decryptFileName');
    
    // Initialize AOS-like scroll animations
    setupScrollAnimations();
});

// ============= ENCRYPTION FORM HANDLER =============

document.getElementById('encryptForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('encryptPassword').value;
    const imageFile = document.getElementById('imageFile').files[0];
    const encryptBtn = document.getElementById('encryptBtn');
    const encryptLoader = document.getElementById('encryptLoader');
    const btnText = encryptBtn.querySelector('.btn-text');
    const previewCard = document.getElementById('encryptedPreviewCard');

    // Validation
    if (!password || password.length < 4) {
        showToast('Password must be at least 4 characters', 'error');
        return;
    }

    if (!imageFile) {
        showToast('Please select an image to encrypt', 'error');
        return;
    }

    // UI Loading State
    setLoadingState(encryptBtn, true);

    try {
        const formData = new FormData();
        formData.append('password', password);
        formData.append('image', imageFile);

        const response = await fetch('/encrypt', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Encryption failed');

        // Success Handling
        displayEncryptedResult(data);
        previewCard.classList.remove('d-none');
        previewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showToast('Image encrypted successfully!', 'success');
        
        // Reset form but keep preview until new action
        document.getElementById('encryptForm').reset();
        resetFilePreview('encryptFilePreview', 'encryptDropArea');

    } catch (error) {
        showToast(error.message || 'Encryption failed', 'error');
    } finally {
        setLoadingState(encryptBtn, false);
    }
});

// ============= DECRYPTION FORM HANDLER =============

document.getElementById('decryptForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('decryptPassword').value;
    const encryptedFile = document.getElementById('encryptedFile').files[0];
    const decryptBtn = document.getElementById('decryptBtn');
    const previewCard = document.getElementById('decryptedImageCard');

    // Validation
    if (!password) {
        showToast('Please enter the decryption password', 'error');
        return;
    }

    if (!encryptedFile) {
        showToast('Please upload an encrypted (.enc) file', 'error');
        return;
    }

    // UI Loading State
    setLoadingState(decryptBtn, true);

    try {
        const formData = new FormData();
        formData.append('password', password);
        formData.append('encrypted_file', encryptedFile);

        const response = await fetch('/decrypt', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Decryption failed');

        // Success Handling
        displayDecryptedResult(data);
        previewCard.classList.remove('d-none');
        previewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showToast('Image decrypted successfully!', 'success');

        document.getElementById('decryptForm').reset();
        resetFilePreview('decryptFilePreview', 'decryptDropArea');

    } catch (error) {
        showToast(error.message || 'Decryption failed', 'error');
    } finally {
        setLoadingState(decryptBtn, false);
    }
});

// ============= STEGANOGRAPHY HANDLERS =============

document.getElementById('stegEmbedForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('stegImageEmbed');
    const message = document.getElementById('stegMessage').value;
    const resultDiv = document.getElementById('stegEmbedResult');
    const previewImg = document.getElementById('stegPreview');
    const downloadLink = document.getElementById('stegDownload');
    const btn = e.target.querySelector('button');

    if (!fileInput.files[0]) {
        showToast('Please select a PNG image', 'error');
        return;
    }

    const originalBtnText = btn.textContent;
    btn.textContent = 'Embedding...';
    btn.disabled = true;

    try {
        const fd = new FormData();
        fd.append('image', fileInput.files[0]);
        fd.append('message', message);

        const res = await fetch('/steg/embed', { method: 'POST', body: fd });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Embedding failed');

        previewImg.src = data.image_data;
        downloadLink.href = `/download/${data.stego_filename}`;
        downloadLink.download = data.stego_filename;
        resultDiv.classList.remove('d-none');
        showToast('Message embedded successfully!', 'success');
        
        e.target.reset();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.textContent = originalBtnText;
        btn.disabled = false;
    }
});

document.getElementById('stegExtractForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('stegImageExtract');
    const resultDiv = document.getElementById('stegExtractResult');
    const outPre = document.getElementById('stegMessageOut');
    const btn = e.target.querySelector('button');

    if (!fileInput.files[0]) {
        showToast('Please select a Stego PNG image', 'error');
        return;
    }

    const originalBtnText = btn.textContent;
    btn.textContent = 'Extracting...';
    btn.disabled = true;

    try {
        const fd = new FormData();
        fd.append('image', fileInput.files[0]);

        const res = await fetch('/steg/extract', { method: 'POST', body: fd });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Extraction failed');

        outPre.textContent = data.hidden_message;
        resultDiv.classList.remove('d-none');
        showToast('Message extracted successfully!', 'success');
        
        e.target.reset();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.textContent = originalBtnText;
        btn.disabled = false;
    }
});

// ============= HELPER FUNCTIONS =============

function setLoadingState(btn, isLoading) {
    const spinner = btn.querySelector('.spinner');
    const text = btn.querySelector('.btn-text');
    
    if (isLoading) {
        btn.disabled = true;
        if (spinner) spinner.classList.remove('d-none');
        if (text) text.style.opacity = '0.5';
    } else {
        btn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
        if (text) text.style.opacity = '1';
    }
}

function displayEncryptedResult(data) {
    const hexPreview = document.getElementById('hexPreview');
    hexPreview.textContent = data.hex_preview;
    
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.onclick = () => window.location.href = `/download/${data.encrypted_filename}`;
    
    // Animate hex text
    typeWriterEffect(hexPreview, data.hex_preview);
}

function displayDecryptedResult(data) {
    const img = document.getElementById('decryptedImage');
    const downloadBtn = document.getElementById('downloadDecryptedBtn');
    
    img.src = data.image_data;
    downloadBtn.href = data.image_data;
}

function typeWriterEffect(element, text) {
    element.textContent = '';
    let i = 0;
    const speed = 2; // ms
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            element.scrollTop = element.scrollHeight;
            setTimeout(type, speed);
        }
    }
    type();
}

// ============= DRAG & DROP SYSTEM =============

function setupDragAndDrop(areaId, inputId, previewId, nameId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const nameSpan = document.getElementById(nameId);

    if (!area || !input) return;

    // Click to upload
    area.addEventListener('click', () => input.click());

    // File selection change
    input.addEventListener('change', () => handleFile(input.files[0]));

    // Drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        area.addEventListener(eventName, () => area.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, () => area.classList.remove('drag-over'), false);
    });

    area.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        input.files = dt.files;
        handleFile(file);
    });

    function handleFile(file) {
        if (file) {
            nameSpan.textContent = file.name;
            preview.classList.remove('d-none');
            area.classList.add('border-primary');
        }
    }
}

function resetFilePreview(previewId, areaId) {
    document.getElementById(previewId).classList.add('d-none');
    document.getElementById(areaId).classList.remove('border-primary');
}

// ============= TOAST NOTIFICATIONS =============

function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    const color = type === 'success' ? 'text-success' : 'text-danger';
    
    toast.innerHTML = `
        <i class="fas fa-${icon} ${color} fa-lg"></i>
        <span class="fw-medium">${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-in reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============= COPY HEX FUNCTIONALITY =============

document.getElementById('copyHexBtn')?.addEventListener('click', () => {
    const hexText = document.getElementById('hexPreview').textContent;
    if (hexText) {
        navigator.clipboard.writeText(hexText).then(() => {
            showToast('Hex code copied to clipboard!', 'success');
        });
    }
});

// ============= SCROLL ANIMATIONS =============

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}

