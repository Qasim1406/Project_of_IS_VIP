from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import secrets
import base64
from io import BytesIO
from werkzeug.utils import secure_filename
from datetime import timedelta
from PIL import Image
import math

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'
app.config['SESSION_PERMANENT'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)
app.static_folder = 'static'
app.static_url_path = '/static'

# Configuration
UPLOAD_FOLDER = 'encrypted_files'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Simple team info to display after login
TEAM_NAMES = "1) Muhammad Tayyab Mujtaba Khan (F24609035)  2) Owais Ismail (F24609055)  3) Qasim Usman (F24609008)"

# ============= ENCRYPTION/DECRYPTION FUNCTIONS =============

def derive_key_from_password(password, salt):
    """
    Derive a 32-byte AES-256 key from password using PBKDF2.
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    key = kdf.derive(password.encode())
    return key

def encrypt_image(image_bytes, password):
    """
    Encrypt image bytes using AES-256-GCM with PBKDF2 key derivation.
    Returns: (encrypted_data, salt, iv, tag)
    """
    # Generate random salt and IV
    salt = secrets.token_bytes(16)  # 16 bytes salt
    iv = secrets.token_bytes(12)    # 12 bytes IV for GCM
    
    # Derive key from password
    key = derive_key_from_password(password, salt)
    
    # Encrypt using AES-256-GCM
    cipher = Cipher(
        algorithms.AES(key),
        modes.GCM(iv),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(image_bytes) + encryptor.finalize()
    tag = encryptor.tag
    
    # Combine: salt (16) + iv (12) + tag (16) + ciphertext
    encrypted_file = salt + iv + tag + ciphertext
    
    return encrypted_file, salt, iv, tag

def decrypt_image(encrypted_data, password):
    """
    Decrypt image bytes using AES-256-GCM.
    encrypted_data format: salt (16) + iv (12) + tag (16) + ciphertext
    Returns: decrypted image bytes or None if decryption fails
    """
    try:
        # Extract components
        salt = encrypted_data[:16]
        iv = encrypted_data[16:28]
        tag = encrypted_data[28:44]
        ciphertext = encrypted_data[44:]
        
        # Derive key from password
        key = derive_key_from_password(password, salt)
        
        # Decrypt using AES-256-GCM
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(iv, tag),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        
        return plaintext
    except Exception as e:
        return None


# ============= STEGANOGRAPHY (LSB) =============

def _int_to_bits(n, length):
    return [(n >> i) & 1 for i in range(length)][::-1]

def _bytes_to_bits(b):
    bits = []
    for byte in b:
        bits.extend(_int_to_bits(byte, 8))
    return bits

def _bits_to_bytes(bits):
    out = bytearray()
    for i in range(0, len(bits), 8):
        byte = 0
        for bit in bits[i:i+8]:
            byte = (byte << 1) | bit
        out.append(byte)
    return bytes(out)

def embed_message_in_png(image_bytes, message):
    """Embed message into PNG using simple LSB on RGB channels.
    Returns PNG bytes with embedded message or None if too large.
    """
    with Image.open(BytesIO(image_bytes)) as img:
        img = img.convert('RGBA')
        pixels = list(img.getdata())
        width, height = img.size

        # Prepare message bytes (utf-8) with length prefix (32-bit)
        msg_bytes = message.encode('utf-8')
        msg_len = len(msg_bytes)
        header = msg_len.to_bytes(4, 'big')
        payload = header + msg_bytes
        bits = _bytes_to_bits(payload)

        # Each pixel gives 3 bits (R,G,B LSB)
        capacity = len(pixels) * 3
        if len(bits) > capacity:
            return None

        new_pixels = []
        bit_idx = 0
        for (r, g, b, a) in pixels:
            r_l = r & ~1
            g_l = g & ~1
            b_l = b & ~1
            if bit_idx < len(bits):
                r_l |= bits[bit_idx]
                bit_idx += 1
            if bit_idx < len(bits):
                g_l |= bits[bit_idx]
                bit_idx += 1
            if bit_idx < len(bits):
                b_l |= bits[bit_idx]
                bit_idx += 1
            new_pixels.append((r_l, g_l, b_l, a))

        # Fill remaining pixels unchanged
        img_out = Image.new('RGBA', img.size)
        img_out.putdata(new_pixels)
        out_io = BytesIO()
        img_out.save(out_io, format='PNG')
        return out_io.getvalue()

def extract_message_from_png(image_bytes):
    """Extract message embedded in PNG via LSB. Returns message string or None."""
    with Image.open(BytesIO(image_bytes)) as img:
        img = img.convert('RGBA')
        pixels = list(img.getdata())

        bits = []
        for (r, g, b, a) in pixels:
            bits.append(r & 1)
            bits.append(g & 1)
            bits.append(b & 1)

        # First 32 bits = length in bytes
        if len(bits) < 32:
            return None
        header_bits = bits[:32]
        header_bytes = _bits_to_bytes(header_bits)
        msg_len = int.from_bytes(header_bytes, 'big')
        total_bits = 32 + msg_len * 8
        if total_bits > len(bits):
            return None
        msg_bits = bits[32:32 + msg_len * 8]
        msg_bytes = _bits_to_bytes(msg_bits)
        try:
            return msg_bytes.decode('utf-8')
        except Exception:
            return None

def get_hex_preview(data, max_bytes=512):
    """
    Get hexadecimal preview of encrypted data.
    """
    preview_data = data[:max_bytes]
    hex_string = preview_data.hex()
    # Format in rows of 32 hex chars (16 bytes)
    rows = [hex_string[i:i+32] for i in range(0, len(hex_string), 32)]
    return '\n'.join(rows)

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ============= FLASK ROUTES =============

@app.route('/')
def index():
    """Render landing home page."""
    # require login
    if not session.get('user'):
        return redirect(url_for('login'))
    return render_template('home.html', team_names=TEAM_NAMES)


@app.route('/app')
def app_page():
    """Render the main application page (encrypt/decrypt/steganography)."""
    if not session.get('user'):
        return redirect(url_for('login'))
    return render_template('index.html', team_names=TEAM_NAMES)

@app.route('/background')
def background():
    """Render project background page."""
    if not session.get('user'):
        return redirect(url_for('login'))
    return render_template('background.html', team_names=TEAM_NAMES)

@app.route('/encrypt', methods=['POST'])
def encrypt_route():
    """
    Encrypt uploaded image.
    Expects: image file + password
    Returns: encrypted file info + hex preview
    """
    try:
        # Validate request
        if 'image' not in request.files or 'password' not in request.form:
            return jsonify({'error': 'Missing image or password'}), 400
        
        file = request.files['image']
        password = request.form.get('password', '')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, GIF, BMP allowed'}), 400
        
        if len(password) < 4:
            return jsonify({'error': 'Password must be at least 4 characters'}), 400
        
        # Read image bytes
        image_bytes = file.read()
        
        if len(image_bytes) > MAX_FILE_SIZE:
            return jsonify({'error': f'File too large. Max {MAX_FILE_SIZE/(1024*1024)}MB'}), 400
        
        # Encrypt image
        encrypted_data, salt, iv, tag = encrypt_image(image_bytes, password)
        
        # Save encrypted file
        filename = secure_filename(file.filename)
        base_name = os.path.splitext(filename)[0]
        encrypted_filename = f"{base_name}_{secrets.token_hex(4)}.enc"
        filepath = os.path.join(UPLOAD_FOLDER, encrypted_filename)
        
        with open(filepath, 'wb') as f:
            f.write(encrypted_data)
        
        # Generate hex preview
        hex_preview = get_hex_preview(encrypted_data)
        
        # Store encrypted filename in session for download
        session['last_encrypted_file'] = encrypted_filename
        
        return jsonify({
            'success': True,
            'message': 'Image encrypted successfully',
            'encrypted_filename': encrypted_filename,
            'hex_preview': hex_preview,
            'file_size': len(encrypted_data),
            'original_name': filename
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Encryption error: {str(e)}'}), 500

@app.route('/download/<filename>')
def download_encrypted(filename):
    """Download encrypted file."""
    try:
        # Security: prevent directory traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': 'Invalid filename'}), 400
        
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(filepath, as_attachment=True, download_name=filename)
    
    except Exception as e:
        return jsonify({'error': f'Download error: {str(e)}'}), 500

@app.route('/decrypt', methods=['POST'])
def decrypt_route():
    """
    Decrypt uploaded encrypted file.
    Expects: encrypted file + password
    Returns: decrypted image (base64) or error message
    """
    try:
        # Validate request
        if 'encrypted_file' not in request.files or 'password' not in request.form:
            return jsonify({'error': 'Missing encrypted file or password'}), 400
        
        file = request.files['encrypted_file']
        password = request.form.get('password', '')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.enc'):
            return jsonify({'error': 'File must be .enc (encrypted) file'}), 400
        
        # Read encrypted file
        encrypted_data = file.read()
        
        # Decrypt
        decrypted_bytes = decrypt_image(encrypted_data, password)
        
        if decrypted_bytes is None:
            return jsonify({'error': 'Invalid password or corrupted file'}), 401
        
        # Convert to base64 for display
        image_base64 = base64.b64encode(decrypted_bytes).decode('utf-8')
        
        # Detect image type
        image_type = 'png'
        if decrypted_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            image_type = 'png'
        elif decrypted_bytes[:2] == b'\xff\xd8':
            image_type = 'jpeg'
        elif decrypted_bytes[:6] in [b'GIF87a', b'GIF89a']:
            image_type = 'gif'
        
        return jsonify({
            'success': True,
            'message': 'Image decrypted successfully',
            'image_data': f"data:image/{image_type};base64,{image_base64}",
            'image_type': image_type
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Decryption error: {str(e)}'}), 500

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok'}), 200


@app.route('/steg/embed', methods=['POST'])
def steg_embed():
    """Embed a message into an uploaded PNG image and return the stego image as downloadable file and preview."""
    if 'image' not in request.files or 'message' not in request.form:
        return jsonify({'error': 'Missing image or message'}), 400
    file = request.files['image']
    message = request.form.get('message', '')
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    # Only support PNG for reliable steganography
    if not file.filename.lower().endswith('.png'):
        return jsonify({'error': 'Steganography only supports PNG images (lossless)'}), 400
    image_bytes = file.read()
    stego_bytes = embed_message_in_png(image_bytes, message)
    if stego_bytes is None:
        return jsonify({'error': 'Message too large for image capacity'}), 400

    # Save stego image
    filename = secure_filename(file.filename)
    base_name = os.path.splitext(filename)[0]
    stego_filename = f"{base_name}_stego_{secrets.token_hex(4)}.png"
    filepath = os.path.join(UPLOAD_FOLDER, stego_filename)
    with open(filepath, 'wb') as f:
        f.write(stego_bytes)

    # Also provide base64 preview
    b64 = base64.b64encode(stego_bytes).decode('utf-8')
    return jsonify({
        'success': True,
        'message': 'Message embedded successfully',
        'stego_filename': stego_filename,
        'image_data': f"data:image/png;base64,{b64}",
    }), 200


@app.route('/steg/extract', methods=['POST'])
def steg_extract():
    """Extract hidden message from uploaded PNG image."""
    if 'image' not in request.files:
        return jsonify({'error': 'Missing image file'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not file.filename.lower().endswith('.png'):
        return jsonify({'error': 'Extraction only supports PNG images'}), 400
    image_bytes = file.read()
    message = extract_message_from_png(image_bytes)
    if message is None:
        return jsonify({'error': 'No hidden message found or file corrupted'}), 404
    return jsonify({
        'success': True,
        'message': 'Hidden message extracted',
        'hidden_message': message
    }), 200


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Simple login page. Required credentials: admin / pass"""
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        if username == 'admin' and password == 'pass':
            session['user'] = username
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error='Invalid credentials')
    else:
        return render_template('login.html')


@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

# ============= ERROR HANDLERS =============

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
