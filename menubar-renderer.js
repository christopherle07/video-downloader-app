let config = {};
let downloadPath = '';


async function loadConfiguration() {
    config = await window.electronAPI.loadConfig();
    applyTheme();
    
    downloadPath = await window.electronAPI.getDefaultPath();
    document.getElementById('pathInput').value = downloadPath;

    
    setInitialToggleState();
}


function applyTheme() {
    const { appearance } = config;
    const overlay = document.getElementById('bgOverlay');
    
    if (appearance.backgroundImage) {
        overlay.style.backgroundImage = `url('${appearance.backgroundImage}')`;
        overlay.style.backgroundSize = 'cover';
        overlay.style.backgroundPosition = 'center';
    } else {
        overlay.style.background = appearance.backgroundColor;
    }
    
    document.documentElement.style.setProperty('--card-color', appearance.cardColor);
    document.documentElement.style.setProperty('--primary-color', appearance.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', appearance.secondaryColor);
    document.documentElement.style.setProperty('--text-color', appearance.textColor);
    document.documentElement.style.setProperty('--accent-color', appearance.accentColor);
}


function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}


document.getElementById('browseBtn').addEventListener('click', async () => {
    const selectedPath = await window.electronAPI.selectFolder();
    if (selectedPath) {
        downloadPath = selectedPath;
        document.getElementById('pathInput').value = downloadPath;
    }
});


const formatCheckbox = document.getElementById('formatCheckbox');
const formatToggle = document.getElementById('formatToggle');
const toggleLabelLeft = document.getElementById('toggleLabelLeft');
const toggleLabelRight = document.getElementById('toggleLabelRight');


formatToggle.addEventListener('click', () => {
    formatCheckbox.checked = !formatCheckbox.checked;
    updateToggleLabels(formatCheckbox.checked);
});


toggleLabelLeft.addEventListener('click', () => {
    formatCheckbox.checked = false;
    updateToggleLabels(false);
});

toggleLabelRight.addEventListener('click', () => {
    formatCheckbox.checked = true;
    updateToggleLabels(true);
});


formatCheckbox.addEventListener('change', function() {
    updateToggleLabels(this.checked);
});


function updateToggleLabels(isAudio) {
    if (isAudio) {
        
        toggleLabelLeft.classList.remove('active');
        toggleLabelRight.classList.add('active');
    } else {
        
        toggleLabelLeft.classList.add('active');
        toggleLabelRight.classList.remove('active');
    }
}


function setInitialToggleState() {
    const isAudio = formatCheckbox.checked;
    updateToggleLabels(isAudio);
}



document.getElementById('downloadBtn').addEventListener('click', async () => {
    const url = document.getElementById('urlInput').value.trim();
    const customFileName = document.getElementById('fileNameInput') ? document.getElementById('fileNameInput').value.trim() : '';
    const isAudio = formatCheckbox.checked; 
    
    if (!url) {
        showNotification('please enter a video url!');
        return;
    }
    
    if (!downloadPath) {
        showNotification('please select a download location!');
        return;
    }
    
    const downloadBtn = document.getElementById('downloadBtn');
    const statusText = document.getElementById('statusText');
    const progressFill = document.getElementById('progressFill');
    
    downloadBtn.disabled = true;
    downloadBtn.classList.add('downloading');
    downloadBtn.querySelector('span').textContent = 'downloading...';
    statusText.textContent = 'preparing download...';
    progressFill.style.width = '0%';
    
    try {
        await window.electronAPI.downloadVideo({
            url,
            downloadPath,
            format: isAudio ? 'audio' : 'video',
            quality: 'best', 
            customFileName
        });
    } catch (error) {
        console.error('Download error:', error);
        showNotification('download failed: ' + error.message);
        resetDownloadUI();
    }
});


window.electronAPI.onDownloadProgress((progress) => {
    const progressFill = document.getElementById('progressFill');
    const statusText = document.getElementById('statusText');
    
    progressFill.style.width = `${progress.percent}%`;
    statusText.textContent = `downloading... ${progress.percent}%`;
});


window.electronAPI.onDownloadComplete((data) => {
    const statusText = document.getElementById('statusText');
    const progressFill = document.getElementById('progressFill');
    
    progressFill.style.width = '100%';
    statusText.textContent = 'download complete! ♡';
    
    showNotification(`${data.title} downloaded successfully!`, 4000);
    
    setTimeout(() => {
        resetDownloadUI();
    }, 2000);
});


window.electronAPI.onDownloadError((error) => {
    showNotification('download failed: ' + error);
    resetDownloadUI();
});


function resetDownloadUI() {
    const downloadBtn = document.getElementById('downloadBtn');
    const statusText = document.getElementById('statusText');
    const progressFill = document.getElementById('progressFill');
    
    downloadBtn.disabled = false;
    downloadBtn.classList.remove('downloading');
    downloadBtn.querySelector('span').textContent = 'download ♡';
    statusText.textContent = 'ready ♡';
    progressFill.style.width = '0%';
}


document.getElementById('notificationClose').addEventListener('click', () => {
    document.getElementById('notification').classList.remove('show');
});


document.getElementById('openMainBtn').addEventListener('click', () => {
    window.electronAPI.openMainWindow();
});


document.getElementById('closeMenubarBtn').addEventListener('click', () => {
    window.electronAPI.closeMenubarWindow();
});


loadConfiguration();