
let config = {};
let downloadHistory = [];


function showNotification(message, autoDismiss = true) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    
    if (notification.classList.contains('show')) {
        notification.classList.remove('show');
        setTimeout(() => {
            notificationText.textContent = message;
            notification.classList.add('show');
            
            
            if (autoDismiss) {
                setTimeout(() => {
                    hideNotification();
                }, 2500);
            }
        }, 400);
    } else {
        notificationText.textContent = message;
        notification.classList.add('show');
        
        
        if (autoDismiss) {
            setTimeout(() => {
                hideNotification();
            }, 2500);
        }
    }
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.add('hiding');
    
    setTimeout(() => {
        notification.classList.remove('show', 'hiding');
    }, 400);
}


if (navigator.platform.indexOf('Mac') !== -1) {
    document.body.classList.add('mac');
}


document.getElementById('minimizeBtn').addEventListener('click', () => {
    window.electronAPI.windowMinimize();
});

document.getElementById('closeBtn').addEventListener('click', () => {
    window.electronAPI.windowClose();
});


document.getElementById('notificationClose').addEventListener('click', () => {
    hideNotification();
});

window.electronAPI.loadConfig().then((loadedConfig) => {
    config = loadedConfig;
    applyTheme(config.appearance);
    
    
    if (config.downloads.defaultPath) {
        document.getElementById('pathInput').value = config.downloads.defaultPath;
    } else {
        window.electronAPI.getDefaultPath().then(path => {
            document.getElementById('pathInput').value = path;
        });
    }
    
    
    populateQualityOptions();
    
    
    loadHistory();
});

function applyTheme(appearance) {
    const root = document.documentElement;
    
    
    if (appearance.backgroundImage) {
        const bgOverlay = document.getElementById('bgOverlay');
        bgOverlay.style.backgroundImage = `url('${appearance.backgroundImage}')`;
        bgOverlay.classList.add('active');
    }
}

function populateQualityOptions() {
    const qualitySelect = document.getElementById('qualitySelect');
    const videoQualities = config.downloads.videoQualities || ["2160p", "1440p", "1080p", "720p", "480p", "360p"];
    
    qualitySelect.innerHTML = '<option value="best">best available</option>';
    
    videoQualities.forEach(quality => {
        const option = document.createElement('option');
        option.value = quality;
        
        let label = quality;
        if (quality === '2160p') label = '4K (2160p)';
        else if (quality === '1440p') label = '2K (1440p)';
        else if (quality === '1080p') label = 'Full HD (1080p)';
        else if (quality === '720p') label = 'HD (720p)';
        else if (quality === '480p') label = 'SD (480p)';
        else if (quality === '360p') label = 'Low (360p)';
        
        option.textContent = label;
        qualitySelect.appendChild(option);
    });
}


const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const mainCard = document.querySelector('.main-card');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        const targetTab = document.getElementById(`${tabName}-tab`);
        const currentActiveTab = document.querySelector('.tab-content.active');
        
        if (targetTab === currentActiveTab) return; 
        
        
        const currentHeight = mainCard.offsetHeight;
        
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => {
            c.classList.remove('active');
            c.style.display = 'none';
        });
        
        
        targetTab.style.display = 'block';
        targetTab.style.opacity = '0';
        const newHeight = mainCard.offsetHeight;
        
        
        mainCard.style.height = currentHeight + 'px';
        
        
        mainCard.offsetHeight;
        
        
        requestAnimationFrame(() => {
            mainCard.style.height = newHeight + 'px';
        });
        
        
        setTimeout(() => {
            mainCard.style.height = 'auto';
            btn.classList.add('active');
            targetTab.classList.add('active');
            targetTab.style.opacity = '1';
        }, 400);
    });
});


const formatCheckbox = document.getElementById('formatCheckbox');
const formatToggle = document.getElementById('formatToggle');
const toggleLabelLeft = document.getElementById('toggleLabelLeft');
const toggleLabelRight = document.getElementById('toggleLabelRight');
const qualityGroup = document.getElementById('qualityGroup');
const qualityLabel = document.getElementById('qualityLabel');
const qualitySelect = document.getElementById('qualitySelect');


toggleLabelLeft.classList.add('active');


formatToggle.addEventListener('click', () => {
    formatCheckbox.checked = !formatCheckbox.checked;
    updateToggleState();
});

function updateToggleState() {
    if (formatCheckbox.checked) {
        
        formatToggle.classList.add('checked');
        toggleLabelLeft.classList.remove('active');
        toggleLabelRight.classList.add('active');
        qualityLabel.textContent = 'audio quality';
        qualitySelect.innerHTML = '';
        
        const audioQualities = config.downloads.audioQualities || ["320kbps", "256kbps", "192kbps", "128kbps"];
        
        qualitySelect.innerHTML = '<option value="best">best available</option>';
        audioQualities.forEach(quality => {
            const option = document.createElement('option');
            option.value = quality;
            option.textContent = quality;
            qualitySelect.appendChild(option);
        });
    } else {
        
        formatToggle.classList.remove('checked');
        toggleLabelLeft.classList.add('active');
        toggleLabelRight.classList.remove('active');
        qualityLabel.textContent = 'video quality';
        populateQualityOptions();
    }
}


toggleLabelLeft.addEventListener('click', () => {
    if (formatCheckbox.checked) {
        formatCheckbox.checked = false;
        updateToggleState();
    }
});

toggleLabelRight.addEventListener('click', () => {
    if (!formatCheckbox.checked) {
        formatCheckbox.checked = true;
        updateToggleState();
    }
});


document.getElementById('browseBtn').addEventListener('click', async () => {
    const path = await window.electronAPI.selectFolder();
    if (path) {
        document.getElementById('pathInput').value = path;
    }
});


const downloadBtn = document.getElementById('downloadBtn');
const urlInput = document.getElementById('urlInput');
const fileNameInput = document.getElementById('fileNameInput');
const pathInput = document.getElementById('pathInput');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const statusText = document.getElementById('statusText');

downloadBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    const downloadPath = pathInput.value;
    const customFileName = fileNameInput.value.trim();
    
    if (!url) {
        await window.electronAPI.showError('Empty URL', 'Please paste a YouTube URL first ♡');
        return;
    }
    
    if (!downloadPath) {
        await window.electronAPI.showError('No Path', 'Please select a download location ♡');
        return;
    }
    
    const format = formatCheckbox.checked ? 'audio' : 'video';
    const quality = qualitySelect.value;
    
    
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'downloading...';
    progressContainer.classList.add('active');
    progressFill.style.width = '0%';
    statusText.textContent = 'starting download ♡';
    
    try {
        await window.electronAPI.downloadVideo({
            url,
            downloadPath,
            format,
            quality,
            customFileName
        });
    } catch (error) {
        console.error('Download error:', error);
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'download ♡';
    }
});


window.electronAPI.onDownloadProgress((progress) => {
    progressFill.style.width = `${progress.percent}%`;
    statusText.textContent = `downloading... ${progress.percent}%`;
});

window.electronAPI.onDownloadComplete((data) => {
    progressFill.style.width = '100%';
    statusText.textContent = 'download complete ♡';
    
    
    showNotification(`${data.title} downloaded successfully ♡`, false);
    
    
    addToHistory({
        title: data.title,
        format: data.format,
        quality: data.quality,
        url: urlInput.value.trim(),
        timestamp: new Date().toISOString()
    });
    
    
    urlInput.value = '';
    fileNameInput.value = '';
    
    setTimeout(() => {
        progressContainer.classList.remove('active');
        progressFill.style.width = '0%';
        statusText.textContent = 'ready to download ♡';
    }, 2000);
});

window.electronAPI.onDownloadError((error) => {
    progressContainer.classList.remove('active');
    statusText.textContent = 'download failed :(';
    window.electronAPI.showError('Download Failed', `Something went wrong:\n${error}`);
});


const ITEMS_PER_PAGE = 10;
let currentPage = 1;

function loadHistory() {
    const saved = localStorage.getItem('downloadHistory');
    if (saved) {
        downloadHistory = JSON.parse(saved);
        renderHistory();
    }
}

function saveHistory() {
    localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
}

function addToHistory(item) {
    
    downloadHistory.unshift(item);
    saveHistory();
    renderHistory();
}

function deleteHistoryItem(index) {
    const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
    downloadHistory.splice(actualIndex, 1);
    saveHistory();
    
    
    const totalPages = Math.ceil(downloadHistory.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && currentPage > 1) {
        currentPage = totalPages;
    }
    
    renderHistory();
    showNotification('Removed from history ♡');
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    const pagination = document.getElementById('historyPagination');
    
    if (downloadHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-history">no downloads yet ♡</p>';
        pagination.classList.remove('active');
        return;
    }
    
    
    const totalPages = Math.ceil(downloadHistory.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, downloadHistory.length);
    const pageItems = downloadHistory.slice(startIndex, endIndex);
    
    historyList.innerHTML = pageItems.map((item, index) => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        return `
            <div class="history-item" data-index="${index}" style="animation: fadeInUp 0.3s ease forwards; animation-delay: ${index * 0.05}s; opacity: 0;">
                <div class="history-item-header">
                    <div style="flex: 1; min-width: 0;">
                        <div class="history-item-title">${item.title}</div>
                        <div class="history-item-details">
                            <span>${timeStr}</span>
                            <span class="history-item-badge">${item.format === 'audio' ? 'mp3' : 'mp4'} · ${item.quality}</span>
                        </div>
                    </div>
                </div>
                <div class="history-item-actions">
                    <button class="history-action-btn copy-url" data-url="${item.url || ''}">copy link</button>
                    <button class="history-action-btn redownload" data-index="${index}">download again</button>
                    <button class="history-action-btn delete" data-index="${index}">delete</button>
                </div>
            </div>
        `;
    }).join('');
    
    
    document.querySelectorAll('.history-item').forEach(item => {
        const header = item.querySelector('.history-item-header');
        header.addEventListener('click', () => {
            
            document.querySelectorAll('.history-item').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('expanded');
                }
            });
            
            item.classList.toggle('expanded');
        });
    });
    
    
    document.querySelectorAll('.copy-url').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            if (url) {
                navigator.clipboard.writeText(url);
                showNotification('Link copied to clipboard ♡');
            }
        });
    });
    
    document.querySelectorAll('.redownload').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
            const item = downloadHistory[actualIndex];
            
            
            document.getElementById('urlInput').value = item.url || '';
            document.getElementById('qualitySelect').value = item.quality;
            
            
            if ((item.format === 'audio') !== formatCheckbox.checked) {
                formatCheckbox.checked = item.format === 'audio';
                updateToggleState();
            }
            
            
            document.querySelector('[data-tab="download"]').click();
            
            showNotification('Ready to download again ♡');
        });
    });
    
    document.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            deleteHistoryItem(index);
        });
    });
    
    
    if (totalPages > 1) {
        pagination.classList.add('active');
        
        let paginationHTML = '';
        
        
        paginationHTML += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">←</button>`;
        
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += `<span style="color: #9a8a9a; font-size: 10px;">...</span>`;
            }
        }
        
        
        paginationHTML += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">→</button>`;
        
        pagination.innerHTML = paginationHTML;
    } else {
        pagination.classList.remove('active');
    }
}

function changePage(page) {
    currentPage = page;
    renderHistory();
}


window.changePage = changePage;

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    if (downloadHistory.length === 0) return;
    
    
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.innerHTML = `
        Clear all history?
        <button style="margin-left: 8px; padding: 4px 8px; background: rgba(184, 156, 184, 0.2); border: none; border-radius: 6px; color: #7a6b7a; cursor: pointer; font-size: 14px; transition: all 0.2s ease;" 
                onmouseover="this.style.background='rgba(184, 156, 184, 0.35)'" 
                onmouseout="this.style.background='rgba(184, 156, 184, 0.2)'"
                onclick="confirmClearHistory()">✓</button>
        <button style="margin-left: 4px; padding: 4px 8px; background: rgba(214, 122, 122, 0.15); border: none; border-radius: 6px; color: #d67a7a; cursor: pointer; font-size: 14px; transition: all 0.2s ease;" 
                onmouseover="this.style.background='rgba(214, 122, 122, 0.25)'" 
                onmouseout="this.style.background='rgba(214, 122, 122, 0.15)'"
                onclick="hideNotification()">×</button>
    `;
    notification.classList.add('show');
});

function confirmClearHistory() {
    downloadHistory = [];
    localStorage.removeItem('downloadHistory');
    currentPage = 1;
    renderHistory();
    hideNotification();
    showNotification('History cleared ♡');
}

window.confirmClearHistory = confirmClearHistory;


urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !downloadBtn.disabled) {
        downloadBtn.click();
    }
});

fileNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !downloadBtn.disabled) {
        downloadBtn.click();
    }
});