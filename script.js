// Configuration
const CONFIG_KEY = 'ai_video_generator_backend_url';
let BACKEND_URL = localStorage.getItem(CONFIG_KEY) || 'https://calcarate-denny-vogie.ngrok-free.dev';

// DOM Elements
const promptInput = document.getElementById('prompt-input');
const generateBtn = document.getElementById('generate-btn');
const statusSection = document.getElementById('status-section');
const statusMessage = document.getElementById('status-message');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const videoSection = document.getElementById('video-section');
const videoPlayer = document.getElementById('video-player');
const videoSource = document.getElementById('video-source');
const downloadBtn = document.getElementById('download-btn');
const errorSection = document.getElementById('error-section');
const errorText = document.getElementById('error-text');
const configModal = document.getElementById('config-modal');
const apiUrlInput = document.getElementById('api-url-input');
const saveConfigBtn = document.getElementById('save-config-btn');

// State
let currentJobId = null;
let pollingInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!BACKEND_URL) {
        showConfigModal();
    }
    
    // Load example videos from backend
    loadExampleVideos();
    
    // Event Listeners
    generateBtn.addEventListener('click', handleGenerate);
    downloadBtn.addEventListener('click', handleDownload);
    saveConfigBtn.addEventListener('click', saveConfiguration);
    
    // Enter key support
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !generateBtn.disabled) {
            handleGenerate();
        }
    });
});

// Show/Hide Configuration Modal
function showConfigModal() {
    configModal.classList.add('show');
    apiUrlInput.value = BACKEND_URL || 'http://localhost:8000';
}

function hideConfigModal() {
    configModal.classList.remove('show');
}

// Save Backend URL Configuration
function saveConfiguration() {
    const url = apiUrlInput.value.trim();
    
    if (!url) {
        showError('Please enter a valid backend URL');
        return;
    }
    
    // Remove trailing slash if present
    BACKEND_URL = url.endsWith('/') ? url.slice(0, -1) : url;
    localStorage.setItem(CONFIG_KEY, BACKEND_URL);
    
    // Load example videos with new backend URL
    loadExampleVideos();
    
    hideConfigModal();
    showSuccess('Configuration saved successfully!');
}

// Load Example Videos from Backend
function loadExampleVideos() {
    if (!BACKEND_URL) return;
    
    // Load first example video (final.mp4) with first frame as thumbnail
    const video1Source = document.getElementById('example-video-1');
    if (video1Source) {
        // Add #t=0.1 to load first frame as thumbnail
        video1Source.src = `${BACKEND_URL}/api/example-video/final.mp4#t=0.1`;
        video1Source.parentElement.load();
    }
    
    // Load second example video (2.mp4) with first frame as thumbnail
    const video2Source = document.getElementById('example-video-2');
    if (video2Source) {
        // Add #t=0.1 to load first frame as thumbnail
        video2Source.src = `${BACKEND_URL}/api/example-video/2.mp4#t=0.1`;
        video2Source.parentElement.load();
    }
}

// Main Generate Handler
async function handleGenerate() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        showError('Please enter a prompt first!');
        return;
    }
    
    if (!BACKEND_URL) {
        showConfigModal();
        return;
    }
    
    // Reset UI
    hideError();
    hideVideo();
    showStatus();
    disableInput();
    
    try {
        // Start video generation
        const response = await fetch(`${BACKEND_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentJobId = data.job_id;
        
        updateStatus('success', '✅ Job started!', `Job ID: ${data.job_id}`, 10);
        
        // Start polling for status
        startPolling();
        
    } catch (error) {
        console.error('Generation error:', error);
        showError(`Failed to start video generation: ${error.message}`);
        enableInput();
        hideStatus();
    }
}

// Start Polling for Job Status
function startPolling() {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    
    pollingInterval = setInterval(async () => {
        attempts++;
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/status/${currentJobId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to get status: ${response.status}`);
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('Non-JSON response received, skipping this poll...');
                return; // Skip this poll, try again next interval
            }
            
            const statusData = await response.json();
            handleStatusUpdate(statusData, attempts, maxAttempts);
            
        } catch (error) {
            console.error('Polling error:', error);
            // Only stop polling and show error if it's not a parsing issue
            if (error.message.includes('JSON') || error.message.includes('pattern')) {
                console.warn('JSON parse error, will retry on next poll...');
                return; // Don't stop polling, just skip this attempt
            }
            stopPolling();
            showError(`Error checking status: ${error.message}`);
            enableInput();
            hideStatus();
        }
    }, 5000); // Poll every 5 seconds
}

// Stop Polling
function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// Handle Status Update
function handleStatusUpdate(statusData, attempts, maxAttempts) {
    const { status, progress, error } = statusData;
    
    switch (status) {
        case 'pending':
            updateStatus('info', '⏳ Queued', progress || 'Waiting to start...', 10);
            break;
            
        case 'processing':
            // Estimate progress based on time
            const estimatedProgress = Math.min(10 + (attempts * 2), 90);
            updateStatus('info', '🎬 Processing', progress || 'Generating video...', estimatedProgress);
            break;
            
        case 'completed':
            stopPolling();
            updateStatus('success', '✅ Complete!', 'Video generated successfully!', 100);
            setTimeout(() => {
                loadVideo();
            }, 1000);
            break;
            
        case 'failed':
            stopPolling();
            showError(`Generation failed: ${error || 'Unknown error'}`);
            enableInput();
            hideStatus();
            break;
            
        default:
            console.warn('Unknown status:', status);
    }
    
    // Check timeout
    if (attempts >= maxAttempts && status !== 'completed') {
        stopPolling();
        showError('Video generation timed out. Please try again.');
        enableInput();
        hideStatus();
    }
}

// Load Generated Video
async function loadVideo() {
    try {
        const videoUrl = `${BACKEND_URL}/api/video/${currentJobId}`;
        
        // Fetch the video
        const response = await fetch(videoUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to load video: ${response.status}`);
        }
        
        // Create blob URL
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Set video source
        videoSource.src = blobUrl;
        videoPlayer.load();
        
        // Show video section
        showVideo();
        hideStatus();
        enableInput();
        
    } catch (error) {
        console.error('Video loading error:', error);
        showError(`Failed to load video: ${error.message}`);
        enableInput();
        hideStatus();
    }
}

// Download Video
async function handleDownload() {
    try {
        const videoUrl = `${BACKEND_URL}/api/video/${currentJobId}`;
        
        const response = await fetch(videoUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated_video_${currentJobId}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        showSuccess('Video download started!');
        
    } catch (error) {
        console.error('Download error:', error);
        showError(`Failed to download video: ${error.message}`);
    }
}

// UI Helper Functions
function updateStatus(type, message, progressMsg, percentage) {
    statusMessage.textContent = message;
    progressText.textContent = progressMsg;
    progressBar.style.width = `${percentage}%`;
    
    // Update colors based on type
    if (type === 'success') {
        statusMessage.style.color = '#2ecc71';
    } else if (type === 'error') {
        statusMessage.style.color = '#e74c3c';
    } else {
        statusMessage.style.color = '#1f77b4';
    }
}

function showStatus() {
    statusSection.classList.remove('hidden');
}

function hideStatus() {
    statusSection.classList.add('hidden');
}

function showVideo() {
    videoSection.classList.remove('hidden');
}

function hideVideo() {
    videoSection.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorSection.classList.remove('hidden');
}

function hideError() {
    errorSection.classList.add('hidden');
}

function showSuccess(message) {
    // Temporarily show success message in status
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #2ecc71; color: white; padding: 15px 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1001;';
    tempDiv.textContent = message;
    document.body.appendChild(tempDiv);
    
    setTimeout(() => {
        tempDiv.remove();
    }, 3000);
}

function disableInput() {
    promptInput.disabled = true;
    generateBtn.disabled = true;
}

function enableInput() {
    promptInput.disabled = false;
    generateBtn.disabled = false;
}

// Click outside modal to close
configModal.addEventListener('click', (e) => {
    if (e.target === configModal) {
        // Don't close if no backend URL is set
        if (BACKEND_URL) {
            hideConfigModal();
        }
    }
});

// Copy Citation Function
function copyCitation() {
    const citation = `@misc{temiraliev2025deepvideoresearcher,
  title        = {DeepVideoResearcher: Adaptive Agentic System 
                  for Retrieval Augmented Video Generation},
  author       = {Temiraliev, Izat and Cheng, Serene and 
                  Yang, Diji and Zhang, Yi},
  year         = {2025},
  institution  = {University of California, Santa Cruz},
  note         = {Manuscript}
}`;
    
    navigator.clipboard.writeText(citation).then(() => {
        const btn = document.querySelector('.copy-citation-btn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = '<span class="copy-icon">✓</span><span class="copy-text">Copied!</span>';
        btn.style.background = 'rgba(46, 204, 113, 1)';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = 'rgba(46, 204, 113, 0.9)';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy citation:', err);
        alert('Failed to copy citation. Please copy manually.');
    });
}
