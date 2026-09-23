# Run PARA in VS Code

## 1. Open the correct folder

In VS Code choose **File → Open Folder** and select the extracted PARA project folder itself — the folder that directly contains `package.json`.

Do not run npm from a parent folder.

## 2. Verify the terminal location

Open **Terminal → New Terminal** and run:

```powershell
dir package.json
```

If `package.json` is displayed, you are in the correct folder.

## 3. Install and run

```powershell
npm install
npm run typecheck
npm run dev
```

Open the Vite URL, normally `http://localhost:5173/`.

## Demo login

- Email: `admin@para.local`
- Password: `password123`

## Main UI controls

- **Hide menu / Show menu**: slides the sidebar away or back.
- **Full screen**: enters browser fullscreen; press `Esc` to exit.
- **Dark / Light**: switches and remembers the theme.
- **Ask PARA AI**: opens the assistant. Shortcut: `Ctrl + /`.
