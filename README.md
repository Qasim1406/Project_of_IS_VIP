# Flask App Deployment on Vercel

This is a Flask application that has been configured for deployment on Vercel using serverless functions and Vercel Blob storage.

## Project Structure

```
/Project_of_IS/
├── api/
│   └── index.py          # Vercel serverless function wrapper
├── Project_of_IS/
│   ├── app.py           # Main Flask application
│   ├── templates/       # Jinja2 templates
│   ├── static/          # CSS, JS, images
│   ├── encrypted_files/ # Local storage (not used on Vercel)
│   └── requirements.txt # Python dependencies
├── vercel.json          # Vercel configuration
└── README.md           # This file
```

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   Follow the prompts to configure your deployment.

4. **For production deployment**:
   ```bash
   vercel --prod
   ```

## Features

- **Image Encryption/Decryption**: AES-256-GCM encryption with PBKDF2 key derivation
- **Steganography**: LSB steganography for hiding messages in PNG images
- **User Authentication**: Simple login system
- **File Storage**: Uses Vercel Blob storage for file uploads on Vercel, local filesystem for development

## Environment Variables

The app automatically detects if it's running on Vercel via the `VERCEL` environment variable and switches to blob storage accordingly.

## Local Development

To run locally:

```bash
cd Project_of_IS
python app.py
```

For local development, the app will use the local filesystem for file storage.

## API Endpoints

- `GET /` - Home page (requires login)
- `GET /login` - Login page
- `POST /login` - Process login
- `POST /encrypt` - Encrypt image
- `POST /decrypt` - Decrypt image
- `GET /download/<filename>` - Download encrypted file
- `POST /steg/embed` - Embed message in image
- `POST /steg/extract` - Extract message from image

## Notes

- All file uploads are stored in Vercel Blob storage when deployed
- The app maintains backward compatibility with local filesystem storage for development
- Static files are served directly by Vercel for better performance
