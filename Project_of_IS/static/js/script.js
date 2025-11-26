// ============= ENCRYPTION FORM HANDLER =============

document.getElementById('encryptForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('encryptPassword').value;
    const imageFile = document.getElementById('imageFile').files[0];
    const encryptBtn = document.getElementById('encryptBtn');
    const encryptLoader = document.getElementById('encryptLoader');
    const encryptError = document.getElementById('encryptError');
    const encryptedPreviewCard = document.getElementById('encryptedPreviewCard');

    // Validation
    if (!password || password.length < 4) {
        showError('Password must be at least 4 characters', encryptError);
        return;
    }

    if (!imageFile) {
        showError('Please select an image', encryptError);
        return;
    }

    // Show loading state
    encryptBtn.disabled = true;
    encryptLoader.classList.remove('d-none');
    encryptError.classList.add('d-none');

    try {
        // Create FormData
        const formData = new FormData();
        formData.append('password', password);
        formData.append('image', imageFile);

        // Send request
        const response = await fetch('/encrypt', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Encryption failed');
        }

        // Display success
        displayEncryptedPreview(data);
        
        // Reset form
        document.getElementById('encryptForm').reset();
        
        // Show preview card with animation
        encryptedPreviewCard.classList.remove('d-none');
        
    } catch (error) {
        showError(error.message || 'Encryption failed', encryptError);
    } finally {
        encryptBtn.disabled = false;
        encryptLoader.classList.add('d-none');
    }
});

// ============= DECRYPTION FORM HANDLER =============

document.getElementById('decryptForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('decryptPassword').value;
    const encryptedFile = document.getElementById('encryptedFile').files[0];
    const decryptBtn = document.getElementById('decryptBtn');
    const decryptLoader = document.getElementById('decryptLoader');
    const decryptError = document.getElementById('decryptError');
    const decryptedImageCard = document.getElementById('decryptedImageCard');

    // Validation
    if (!password) {
        showError('Please enter password', decryptError, 'decryptErrorText');
        return;
    }

    if (!encryptedFile) {
        showError('Please select encrypted file', decryptError, 'decryptErrorText');
        return;
    }

    if (!encryptedFile.name.endsWith('.enc')) {
        showError('File must be .enc (encrypted file)', decryptError, 'decryptErrorText');
        return;
    }

    // Show loading state
    decryptBtn.disabled = true;
    decryptLoader.classList.remove('d-none');
    decryptError.classList.add('d-none');

    try {
        // Create FormData
        const formData = new FormData();
        formData.append('password', password);
        formData.append('encrypted_file', encryptedFile);

        // Send request
        const response = await fetch('/decrypt', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Decryption failed');
        }

        // Display decrypted image
        displayDecryptedImage(data);
        
        // Reset form
        document.getElementById('decryptForm').reset();
        
        // Show preview card with animation
        decryptedImageCard.classList.remove('d-none');
        
    } catch (error) {
        showError(error.message || 'Decryption failed', decryptError, 'decryptErrorText');
    } finally {
        decryptBtn.disabled = false;
        decryptLoader.classList.add('d-none');
    }
});

// ============= HELPER FUNCTIONS =============

function showError(message, errorElement, textElementId = 'errorText') {
    const textElement = document.getElementById(textElementId);
    if (textElement) {
        textElement.textContent = message;
    }
    errorElement.classList.remove('d-none');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorElement.classList.add('d-none');
    }, 5000);
}

function displayEncryptedPreview(data) {
    document.getElementById('encFilename').textContent = data.encrypted_filename;
    document.getElementById('encFileSize').textContent = data.file_size.toLocaleString();
    document.getElementById('hexPreview').textContent = data.hex_preview;
    
    // Update download button
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.onclick = () => {
        window.location.href = `/download/${data.encrypted_filename}`;
    };
}

function displayDecryptedImage(data) {
    const decryptedImage = document.getElementById('decryptedImage');
    decryptedImage.src = data.image_data;
    decryptedImage.onload = () => {
        // Trigger animation
        decryptedImage.style.animation = 'none';
        setTimeout(() => {
            decryptedImage.style.animation = 'zoomIn 0.6s ease-out';
        }, 10);
    };
}

// ============= FILE INPUT ENHANCEMENTS =============

document.getElementById('imageFile').addEventListener('change', function() {
    const fileName = this.files[0]?.name || 'No file selected';
    const uploadBox = this.parentElement;
    
    if (this.files[0]) {
        const fileSize = (this.files[0].size / 1024).toFixed(2);
        const label = uploadBox.querySelector('small');
        if (label) {
            label.textContent = `Selected: ${fileName} (${fileSize} KB)`;
        }
    }
});

document.getElementById('encryptedFile').addEventListener('change', function() {
    const fileName = this.files[0]?.name || 'No file selected';
    const uploadBox = this.parentElement;
    
    if (this.files[0]) {
        const fileSize = (this.files[0].size / 1024).toFixed(2);
        const label = uploadBox.querySelector('small');
        if (label) {
            label.textContent = `Selected: ${fileName} (${fileSize} KB)`;
        }
    }
});

// ============= PASSWORD VISIBILITY TOGGLE =============

function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.classList.remove('fa-eye-slash');
        if (icon) icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        if (icon) icon.classList.remove('fa-eye');
        if (icon) icon.classList.add('fa-eye-slash');
    }
}

// ============= STEGANOGRAPHY FORM HANDLERS =============

document.getElementById('stegEmbedForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('stegImageEmbed');
    const message = document.getElementById('stegMessage').value || '';
    const resultDiv = document.getElementById('stegEmbedResult');
    const previewImg = document.getElementById('stegPreview');
    const downloadLink = document.getElementById('stegDownload');

    if (!fileInput.files[0]) {
        showNotification('Please select a PNG image to embed into.', 'danger');
        return;
    }

    const fd = new FormData();
    fd.append('image', fileInput.files[0]);
    fd.append('message', message);

    try {
        const res = await fetch('/steg/embed', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Embedding failed');
        // Show preview
        previewImg.src = data.image_data;
        downloadLink.href = `/download/${data.stego_filename}`;
        downloadLink.download = data.stego_filename;
        resultDiv.classList.remove('d-none');
        showNotification('Message embedded successfully', 'success');
        document.getElementById('stegEmbedForm').reset();

        // Automatically trigger download of the stego PNG using the base64 data
        try {
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = data.image_data; // data:image/png;base64,...
            a.download = data.stego_filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            // Fallback: user can click the download button
            console.warn('Auto-download failed, manual download available', err);
        }
    } catch (err) {
        showNotification(err.message || 'Embedding failed', 'danger');
    }
});

document.getElementById('stegExtractForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('stegImageExtract');
    const resultDiv = document.getElementById('stegExtractResult');
    const outPre = document.getElementById('stegMessageOut');

    if (!fileInput.files[0]) {
        showNotification('Please select a PNG image to extract from.', 'danger');
        return;
    }

    const fd = new FormData();
    fd.append('image', fileInput.files[0]);

    try {
        const res = await fetch('/steg/extract', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Extraction failed');
        outPre.textContent = data.hidden_message;
        resultDiv.classList.remove('d-none');
        showNotification('Hidden message extracted successfully', 'success');
        document.getElementById('stegExtractForm').reset();
    } catch (err) {
        showNotification(err.message || 'Extraction failed', 'danger');
    }
});

// ============= SMOOTH SCROLL NAVIGATION =============

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#top') {
            e.preventDefault();
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ============= INTERSECTION OBSERVER FOR ANIMATIONS =============

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all glass cards
document.querySelectorAll('.glass-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(card);
});

// ============= HEX PREVIEW SCROLL ANIMATION =============

document.addEventListener('DOMContentLoaded', () => {
    const hexPreviewContainers = document.querySelectorAll('.hex-preview-container');
    
    hexPreviewContainers.forEach(container => {
        const preElement = container.querySelector('.hex-preview');
        if (preElement) {
            // Animate hex preview text character by character
            const text = preElement.textContent;
            preElement.textContent = '';
            
            let index = 0;
            const typeInterval = setInterval(() => {
                if (index < text.length) {
                    preElement.textContent += text[index];
                    index++;
                    container.scrollTop = container.scrollHeight;
                } else {
                    clearInterval(typeInterval);
                }
            }, 5);
        }
    });
});

// ============= KEYBOARD SHORTCUTS =============

document.addEventListener('keydown', (e) => {
    // Ctrl+1 or Cmd+1 to focus encrypt form
    if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        document.getElementById('encryptPassword').focus();
    }
    
    // Ctrl+2 or Cmd+2 to focus decrypt form
    if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        document.getElementById('decryptPassword').focus();
    }
    
    // Escape to close preview cards
    if (e.key === 'Escape') {
        document.getElementById('encryptedPreviewCard').classList.add('d-none');
        document.getElementById('decryptedImageCard').classList.add('d-none');
    }
});

// ============= DRAG AND DROP SUPPORT =============

function setupDragAndDrop(inputId, dropAreaId) {
    const input = document.getElementById(inputId);
    const dropArea = input?.parentElement || document.getElementById(dropAreaId);
    
    if (!dropArea) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('drag-over');
        }, false);
    });
    
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (input && files.length > 0) {
            input.files = files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, false);
}

// Initialize drag and drop
setupDragAndDrop('imageFile');
setupDragAndDrop('encryptedFile');

// ============= NOTIFICATION SYSTEM =============

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 2000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============= PAGE LOAD ANIMATIONS =============

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// ============= COPY FUNCTIONALITY FOR HEX PREVIEW =============

document.addEventListener('click', (e) => {
    if (e.target.closest('.hex-preview')) {
        const text = document.querySelector('.hex-preview').textContent;
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Hex preview copied to clipboard!', 'success');
            });
        }
    }
});

// ============= RESPONSIVE CHECKS =============

const isMobile = () => window.innerWidth < 768;
const isTablet = () => window.innerWidth < 1024;

window.addEventListener('resize', () => {
    // Handle responsive behavior changes
});

// ============= ERROR HANDLING =============

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ============= PERFORMANCE OPTIMIZATION =============

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}
