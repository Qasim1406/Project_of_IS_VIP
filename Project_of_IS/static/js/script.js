// ============= GLOBAL VARIABLES & SETUP =============

document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop('encryptDropArea', 'imageFile', 'encryptFilePreview', 'encryptFileName');
    setupDragAndDrop('decryptDropArea', 'encryptedFile', 'decryptFilePreview', 'decryptFileName');

    // Initialize enhanced features
    setupScrollAnimations();
    setupPasswordToggles();
    setupPasswordStrength();
    setupProgressBar();
    setupSteganographyCounter();
    setupFileSizeDisplay();
    setupFloatingActionButton();
    setupNavigationDots();
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

// ============= PASSWORD TOGGLES =============

function setupPasswordToggles() {
    // Encrypt password toggle
    const toggleEncrypt = document.getElementById('toggleEncryptPass');
    const encryptInput = document.getElementById('encryptPassword');

    if (toggleEncrypt && encryptInput) {
        toggleEncrypt.addEventListener('click', () => {
            const type = encryptInput.type === 'password' ? 'text' : 'password';
            encryptInput.type = type;
            toggleEncrypt.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }

    // Decrypt password toggle
    const toggleDecrypt = document.getElementById('toggleDecryptPass');
    const decryptInput = document.getElementById('decryptPassword');

    if (toggleDecrypt && decryptInput) {
        toggleDecrypt.addEventListener('click', () => {
            const type = decryptInput.type === 'password' ? 'text' : 'password';
            decryptInput.type = type;
            toggleDecrypt.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }
}

// ============= PASSWORD STRENGTH METER =============

function setupPasswordStrength() {
    const passwordInput = document.getElementById('encryptPassword');
    const strengthFill = document.getElementById('encryptStrengthFill');
    const strengthText = document.getElementById('encryptStrengthText');

    if (!passwordInput || !strengthFill || !strengthText) return;

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = calculatePasswordStrength(password);

        strengthFill.style.width = strength.percentage + '%';
        strengthFill.className = 'strength-fill strength-' + strength.level;

        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    });
}

function calculatePasswordStrength(password) {
    let score = 0;

    // Length check
    if (password.length >= 8) score += 25;
    else if (password.length >= 6) score += 15;
    else if (password.length >= 4) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    // Determine level
    let level, text, color;
    if (score >= 70) {
        level = 'strong';
        text = 'Strong password';
        color = '#00ff88';
    } else if (score >= 40) {
        level = 'medium';
        text = 'Medium strength';
        color = '#ffa500';
    } else {
        level = 'weak';
        text = 'Weak password';
        color = '#ff4757';
    }

    return {
        percentage: Math.min(score, 100),
        level: level,
        text: text,
        color: color
    };
}

// ============= PROGRESS BAR =============

function setupProgressBar() {
    const progressBar = document.getElementById('pageProgress');

    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        progressBar.style.width = Math.min(scrollPercent, 100) + '%';
    });
}

// ============= STEGANOGRAPHY CHARACTER COUNTER =============

function setupSteganographyCounter() {
    const textarea = document.getElementById('stegMessage');
    const counter = document.getElementById('charCount');

    if (!textarea || !counter) return;

    textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        const maxLength = textarea.getAttribute('maxlength');

        counter.textContent = `${length}/${maxLength} characters`;

        if (length > maxLength * 0.9) {
            counter.style.color = '#ff4757';
        } else if (length > maxLength * 0.7) {
            counter.style.color = '#ffa500';
        } else {
            counter.style.color = 'var(--text-muted)';
        }
    });
}

// ============= FILE SIZE DISPLAY =============

function setupFileSizeDisplay() {
    // Encrypt file size
    const encryptInput = document.getElementById('imageFile');
    const encryptSize = document.getElementById('encryptFileSize');

    if (encryptInput && encryptSize) {
        encryptInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                encryptSize.textContent = formatFileSize(file.size);
            }
        });
    }

    // Decrypt file size
    const decryptInput = document.getElementById('encryptedFile');
    const decryptSize = document.getElementById('decryptFileSize');

    if (decryptInput && decryptSize) {
        decryptInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                decryptSize.textContent = formatFileSize(file.size);
            }
        });
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

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

    document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .bounce-in, .scale-in').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}

// ============= FLOATING ACTION BUTTON =============

function setupFloatingActionButton() {
    const fabMain = document.getElementById('fabMain');
    const fabMenu = document.getElementById('fabMenu');

    if (!fabMain || !fabMenu) return;

    fabMain.addEventListener('click', () => {
        fabMain.classList.toggle('active');
        fabMenu.classList.toggle('active');
    });

    // Close FAB menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!fabMain.contains(e.target) && !fabMenu.contains(e.target)) {
            fabMain.classList.remove('active');
            fabMenu.classList.remove('active');
        }
    });
}

// ============= NAVIGATION DOTS =============

function setupNavigationDots() {
    const navDots = document.querySelectorAll('.nav-dot');

    if (navDots.length === 0) return;

    // Update active dot based on scroll position
    const updateActiveDot = () => {
        const sections = ['encrypt-section', 'decrypt-section', 'steg-section'];
        const scrollPosition = window.scrollY + window.innerHeight / 2;

        sections.forEach((sectionId, index) => {
            const section = document.getElementById(sectionId);
            if (section) {
                const sectionTop = section.offsetTop;
                const sectionBottom = sectionTop + section.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    navDots.forEach(dot => dot.classList.remove('active'));
                    navDots[index].classList.add('active');
                }
            }
        });
    };

    // Scroll to section when dot is clicked
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            const sectionId = dot.getAttribute('data-section');
            scrollToSection(sectionId);
        });
    });

    window.addEventListener('scroll', updateActiveDot);
    updateActiveDot(); // Initial call
}

// ============= SCROLL TO SECTION HELPER =============

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 100; // Account for navbar
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

