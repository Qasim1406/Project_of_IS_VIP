# Background Image Setup

To enable the screenshot.png as the full-site background:

## Step 1: Copy the Screenshot Image
Copy `screenshot.png` from the project root to the static images folder:

```powershell
# From project root directory:
Copy-Item .\screenshot.png .\static\images\background.png
```

Or manually:
1. Navigate to: `C:\Users\Dell\Desktop\Project_of_IS\`
2. Copy `screenshot.png`
3. Navigate to: `C:\Users\Dell\Desktop\Project_of_IS\static\images\`
4. Paste it and rename to `background.png`

## Step 2: Restart the Flask App
```powershell
python app.py
```

## Step 3: View the Site
Open http://127.0.0.1:5000/ and login with:
- Username: `admin`
- Password: `pass`

The screenshot.png will now appear as the full-site background with a semi-transparent dark overlay (55% opacity) for better text readability.

## Customization
To adjust the background overlay darkness, edit `static/css/style.css`:
- Line ~65: `background: rgba(0, 0, 0, 0.55);` 
  - Change `0.55` to a different value:
    - `0.3` = lighter overlay (more background visible)
    - `0.7` = darker overlay (better text contrast)

## Notes
- Background is fixed (doesn't scroll with page content)
- Covers full viewport
- Dark overlay ensures text remains readable
- Works on all pages (login, home, app, background)
