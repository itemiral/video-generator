# AI Video Generator - GitHub Pages Frontend

A static web frontend for the AI Video Generator that can be hosted on GitHub Pages.

## Features

- 🎬 Generate educational videos from text prompts
- 📊 Real-time progress tracking
- 🎥 Video preview and download
- 📱 Responsive design for mobile and desktop
- ⚙️ Configurable backend URL
- 💾 Browser-based configuration storage

## Files

- `index.html` - Main HTML structure
- `styles.css` - CSS styling
- `script.js` - JavaScript for API communication and UI logic
- `README.md` - This file

## Deployment to GitHub Pages

### Option 1: Deploy from Repository

1. Create a new GitHub repository (or use an existing one)
2. Upload these files to the repository:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`

3. Enable GitHub Pages:
   - Go to your repository Settings
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select the branch (usually `main` or `master`)
   - Select the root directory (`/`) 
   - Click "Save"

4. Your site will be available at: `https://yourusername.github.io/your-repo-name/`

### Option 2: Deploy Using GitHub Desktop

1. Install [GitHub Desktop](https://desktop.github.com/)
2. Create a new repository
3. Add the files to the repository folder
4. Commit and push to GitHub
5. Enable GitHub Pages as described above

### Option 3: Deploy Using Git Command Line

```bash
# Initialize git repository
git init

# Add all files
git add index.html styles.css script.js README.md

# Commit files
git commit -m "Initial commit: AI Video Generator frontend"

# Add remote repository
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Then enable GitHub Pages in repository settings.

## Backend Configuration

### CORS Setup Required

For the frontend to communicate with your backend API, you need to configure CORS in your FastAPI backend.

In `backend.py`, update the CORS middleware:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourusername.github.io",  # Your GitHub Pages URL
        "http://localhost:8000",  # For local testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Setting Backend URL

When you first visit the GitHub Pages site, you'll be prompted to enter your backend API URL. This can be:

- **Production**: `https://your-backend-api.com`
- **Local Development**: `http://localhost:8000`
- **Cloud Deployment**: Your cloud provider's URL (e.g., Heroku, Railway, AWS, etc.)

The URL is saved in your browser's local storage.

## Backend Deployment Options

Your FastAPI backend needs to be hosted separately. Options include:

1. **Railway**: Easy deployment with free tier
2. **Heroku**: Popular platform with free tier
3. **AWS EC2**: Full control, requires more setup
4. **Google Cloud Run**: Serverless option
5. **DigitalOcean**: Simple VPS hosting
6. **Render**: Modern deployment platform

### Example: Deploy Backend to Railway

1. Sign up at [Railway.app](https://railway.app)
2. Create new project
3. Deploy from GitHub repository
4. Add environment variables (OPENAI_API_KEY, ELEVENLABS_API_KEY, etc.)
5. Get your deployment URL
6. Update CORS settings with your GitHub Pages URL

## Local Development

To test locally before deploying:

1. Start your FastAPI backend:
   ```bash
   python backend.py
   ```

2. Serve the frontend using Python's built-in server:
   ```bash
   python -m http.server 8080
   ```

3. Open `http://localhost:8080` in your browser

4. Configure backend URL as `http://localhost:8000`

## Usage

1. Open the GitHub Pages URL
2. If prompted, enter your backend API URL
3. Enter a prompt (e.g., "How does photosynthesis work?")
4. Click "Generate Video"
5. Wait for video generation (typically 2-5 minutes)
6. Watch or download the generated video

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### "Failed to connect to backend" Error

- Verify backend URL is correct
- Check that backend is running
- Ensure CORS is properly configured
- Check browser console for detailed errors

### Video Won't Load

- Check network tab in browser developer tools
- Verify video generation completed successfully
- Try refreshing the page

### CORS Errors

- Update `allow_origins` in backend.py
- Ensure you're using HTTPS (not HTTP) for production
- Clear browser cache and try again

## Security Notes

- **API Keys**: Never expose API keys in the frontend code
- **Backend URL**: Store sensitive backend URLs as environment variables
- **HTTPS**: Always use HTTPS in production
- **Rate Limiting**: Implement rate limiting on your backend

## Features to Add

Potential enhancements:

- [ ] Video history/gallery
- [ ] User authentication
- [ ] Custom video settings (duration, quality)
- [ ] Progress percentage calculation
- [ ] Share video functionality
- [ ] Thumbnail preview
- [ ] Multiple language support

## License

MIT License - feel free to use and modify as needed.

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify backend is running and accessible
3. Check CORS configuration
4. Review network requests in browser dev tools
