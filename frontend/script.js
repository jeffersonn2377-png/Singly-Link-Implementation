/**
 * Singly Linked List Implementation - Frontend Interaction & Visualizer
 * College Mini-Project
 * Connects directly to the C HTTP Backend on localhost:8080
 */

// Dynamically determine API base URL (works if served by C server or opened directly)
const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? window.location.origin
    : 'http://localhost:8080';

// Global state
let currentNodes = [];

// DOM Elements
const chainContainer = document.getElementById('linkedListChain');
const statusBanner = document.getElementById('statusBanner');
const bannerMessage = document.getElementById('bannerMessage');
const bannerIcon = document.getElementById('bannerIcon');
const connectionStatus = document.getElementById('connectionStatus');
const nodeCountBadge = document.getElementById('nodeCountBadge');
const headValBadge = document.getElementById('headValBadge');
const logContainer = document.getElementById('logContainer');

// Inputs & Buttons
const valInsertBeg = document.getElementById('valInsertBeg');
const btnInsertBeg = document.getElementById('btnInsertBeg');

const valInsertEnd = document.getElementById('valInsertEnd');
const btnInsertEnd = document.getElementById('btnInsertEnd');

const valInsertPos = document.getElementById('valInsertPos');
const posInsertPos = document.getElementById('posInsertPos');
const btnInsertPos = document.getElementById('btnInsertPos');

const btnDeleteBeg = document.getElementById('btnDeleteBeg');
const btnDeleteEnd = document.getElementById('btnDeleteEnd');
const posDeletePos = document.getElementById('posDeletePos');
const btnDeletePos = document.getElementById('btnDeletePos');

const valSearch = document.getElementById('valSearch');
const btnSearch = document.getElementById('btnSearch');

const btnCount = document.getElementById('btnCount');
const btnReverse = document.getElementById('btnReverse');
const btnClear = document.getElementById('btnClear');
const btnRefresh = document.getElementById('btnRefresh');
const btnClearLog = document.getElementById('btnClearLog');

/**
 * Helper to display current time as HH:MM:SS
 */
function getTimestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

/**
 * Appends an entry to the Audit & Operation log
 */
function appendLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `
        <span class="log-time">${getTimestamp()}</span>
        <span class="log-msg">${escapeHtml(message)}</span>
    `;
    logContainer.prepend(entry);
}

/**
 * Updates the visual banner notification
 */
function setBanner(message, type = 'info') {
    statusBanner.className = `alert-banner ${type}`;
    bannerMessage.textContent = message;

    if (type === 'success') {
        bannerIcon.textContent = '✅';
    } else if (type === 'error') {
        bannerIcon.textContent = '⚠️';
    } else {
        bannerIcon.textContent = 'ℹ️';
    }
}

/**
 * HTML Escaping helper
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Updates Connection Status badge in the UI
 */
function setConnected(isOnline) {
    if (isOnline) {
        connectionStatus.className = 'status-indicator online';
        connectionStatus.innerHTML = `
            <span class="pulse-dot"></span>
            <span class="status-text">C Backend: Connected (:8080)</span>
        `;
    } else {
        connectionStatus.className = 'status-indicator offline';
        connectionStatus.innerHTML = `
            <span class="pulse-dot"></span>
            <span class="status-text">C Backend: Offline (Check server.exe)</span>
        `;
    }
}

/**
 * Renders the Visual Linked List Chain:
 * HEAD → [10] → [20] → [30] → NULL
 */
function renderLinkedList(nodes) {
    currentNodes = Array.isArray(nodes) ? nodes : [];

    // Clear previous chain
    chainContainer.innerHTML = '';

    // 1. HEAD Pointer Badge
    const headTag = document.createElement('div');
    headTag.className = 'pointer-tag head-tag';
    headTag.textContent = 'HEAD';
    chainContainer.appendChild(headTag);

    // Initial arrow from HEAD
    const initialArrow = createArrowElement();
    chainContainer.appendChild(initialArrow);

    // If list is empty
    if (currentNodes.length === 0) {
        const nullTag = document.createElement('div');
        nullTag.className = 'pointer-tag null-tag';
        nullTag.textContent = 'NULL';
        chainContainer.appendChild(nullTag);

        nodeCountBadge.textContent = '0';
        headValBadge.textContent = 'NULL';
        return;
    }

    // 2. Render each Node
    currentNodes.forEach((val, idx) => {
        const nodeItem = document.createElement('div');
        nodeItem.className = 'node-item';
        nodeItem.id = `node-${idx + 1}`;

        nodeItem.innerHTML = `
            <div class="node-box">
                <div class="node-header">
                    <span>Node #${idx + 1}</span>
                    <span>0x${(1000 + idx * 16).toString(16)}</span>
                </div>
                <div class="node-body">
                    <div class="node-data">${val}</div>
                    <div class="node-next-ptr">
                        <span>next</span>
                        <span>•</span>
                    </div>
                </div>
            </div>
        `;
        chainContainer.appendChild(nodeItem);

        // Arrow pointing to next node or NULL
        const arrow = createArrowElement();
        chainContainer.appendChild(arrow);
    });

    // 3. Terminal NULL Badge
    const nullTag = document.createElement('div');
    nullTag.className = 'pointer-tag null-tag';
    nullTag.textContent = 'NULL';
    chainContainer.appendChild(nullTag);

    // Update stats
    nodeCountBadge.textContent = currentNodes.length;
    headValBadge.textContent = currentNodes[0];
}

/**
 * Creates an arrow connector element
 */
function createArrowElement() {
    const arrow = document.createElement('div');
    arrow.className = 'arrow-connector';
    arrow.innerHTML = `
        <span class="arrow-line"></span>
        <span class="arrow-head">▶</span>
    `;
    return arrow;
}

/**
 * Generic API request dispatcher
 */
async function callApi(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server responded with HTTP ${response.status}`);
        }

        const data = await response.json();
        setConnected(true);
        return data;
    } catch (err) {
        console.error(`API Error on ${endpoint}:`, err);
        setConnected(false);
        setBanner(`Backend error: ${err.message}. Ensure C server is running on port 8080!`, 'error');
        appendLog(`Backend connection failed: ${err.message}`, 'error');
        return null;
    }
}

/**
 * Fetch and refresh the linked list from the C backend
 */
async function fetchList() {
    const res = await callApi('/api/list');
    if (res && res.success) {
        renderLinkedList(res.data);
    }
}

/**
 * Traversal animation for search operation
 */
async function animateSearch(targetValue, targetPos) {
    const totalNodes = currentNodes.length;
    const maxSteps = targetPos > 0 ? targetPos : totalNodes;

    // Traverse sequentially
    for (let i = 1; i <= maxSteps; i++) {
        const el = document.getElementById(`node-${i}`);
        if (el) {
            el.classList.add('highlight-traverse');
            await new Promise(r => setTimeout(r, 300));
            el.classList.remove('highlight-traverse');
        }
    }

    if (targetPos > 0) {
        const foundEl = document.getElementById(`node-${targetPos}`);
        if (foundEl) {
            foundEl.classList.add('highlight-found');
            setTimeout(() => {
                foundEl.classList.remove('highlight-found');
            }, 3000);
        }
    }
}

/* =========================================================================
 * OPERATION EVENT HANDLERS
 * ========================================================================= */

// 1. Insert Beginning
btnInsertBeg.addEventListener('click', async () => {
    const val = parseInt(valInsertBeg.value, 10);
    if (isNaN(val)) {
        setBanner('Please enter a valid integer for insertion!', 'error');
        return;
    }

    const res = await callApi('/api/insert/beginning', 'POST', { value: val });
    if (res && res.success) {
        renderLinkedList(res.data);
        const msg = res.message || `Node ${val} inserted successfully`;
        setBanner(msg, 'success');
        appendLog(msg, 'success');
        valInsertBeg.value = '';
    }
});

// 2. Insert End
btnInsertEnd.addEventListener('click', async () => {
    const val = parseInt(valInsertEnd.value, 10);
    if (isNaN(val)) {
        setBanner('Please enter a valid integer for insertion!', 'error');
        return;
    }

    const res = await callApi('/api/insert/end', 'POST', { value: val });
    if (res && res.success) {
        renderLinkedList(res.data);
        const msg = res.message || `Node ${val} inserted successfully`;
        setBanner(msg, 'success');
        appendLog(msg, 'success');
        valInsertEnd.value = '';
    }
});

// 3. Insert Position
btnInsertPos.addEventListener('click', async () => {
    const val = parseInt(valInsertPos.value, 10);
    const pos = parseInt(posInsertPos.value, 10);

    if (isNaN(val)) {
        setBanner('Please enter a valid integer value!', 'error');
        return;
    }
    if (isNaN(pos) || pos < 1) {
        setBanner('Please enter a valid positive position (1-based)!', 'error');
        return;
    }

    const res = await callApi('/api/insert/position', 'POST', { value: val, position: pos });
    if (res) {
        if (res.success) {
            renderLinkedList(res.data);
            const msg = res.message || `Node ${val} inserted successfully at position ${pos}`;
            setBanner(msg, 'success');
            appendLog(msg, 'success');
            valInsertPos.value = '';
            posInsertPos.value = '';
        } else {
            setBanner(res.message || 'Insert position out of bounds!', 'error');
            appendLog(res.message, 'error');
        }
    }
});

// 4. Delete Beginning
btnDeleteBeg.addEventListener('click', async () => {
    const res = await callApi('/api/delete/beginning', 'POST');
    if (res) {
        if (res.success) {
            renderLinkedList(res.data);
            const msg = res.message || 'Node deleted successfully';
            setBanner(msg, 'success');
            appendLog(msg, 'success');
        } else {
            setBanner(res.message || 'Cannot delete from empty list!', 'error');
            appendLog(res.message, 'error');
        }
    }
});

// 5. Delete End
btnDeleteEnd.addEventListener('click', async () => {
    const res = await callApi('/api/delete/end', 'POST');
    if (res) {
        if (res.success) {
            renderLinkedList(res.data);
            const msg = res.message || 'Node deleted successfully';
            setBanner(msg, 'success');
            appendLog(msg, 'success');
        } else {
            setBanner(res.message || 'Cannot delete from empty list!', 'error');
            appendLog(res.message, 'error');
        }
    }
});

// 6. Delete Position
btnDeletePos.addEventListener('click', async () => {
    const pos = parseInt(posDeletePos.value, 10);
    if (isNaN(pos) || pos < 1) {
        setBanner('Please enter a valid positive position to delete (1-based)!', 'error');
        return;
    }

    const res = await callApi('/api/delete/position', 'POST', { position: pos });
    if (res) {
        if (res.success) {
            renderLinkedList(res.data);
            const msg = res.message || `Node deleted successfully from position ${pos}`;
            setBanner(msg, 'success');
            appendLog(msg, 'success');
            posDeletePos.value = '';
        } else {
            setBanner(res.message || 'Invalid position to delete!', 'error');
            appendLog(res.message, 'error');
        }
    }
});

// 7. Search
btnSearch.addEventListener('click', async () => {
    const val = parseInt(valSearch.value, 10);
    if (isNaN(val)) {
        setBanner('Please enter a value to search!', 'error');
        return;
    }

    const res = await callApi('/api/search', 'POST', { value: val });
    if (res) {
        if (res.found) {
            const msg = res.message || `Node ${val} found at position ${res.position}`;
            setBanner(msg, 'success');
            appendLog(msg, 'success');
            animateSearch(val, res.position);
        } else {
            const msg = res.message || `Node ${val} not found in the list`;
            setBanner(msg, 'error');
            appendLog(msg, 'error');
            animateSearch(val, 0);
        }
    }
});

// 8. Count
btnCount.addEventListener('click', async () => {
    const res = await callApi('/api/count');
    if (res) {
        const msg = res.message || `Total nodes: ${res.count}`;
        setBanner(msg, 'info');
        appendLog(msg, 'info');
        nodeCountBadge.textContent = res.count;
    }
});

// 9. Reverse
btnReverse.addEventListener('click', async () => {
    const res = await callApi('/api/reverse', 'POST');
    if (res && res.success) {
        renderLinkedList(res.data);
        const msg = res.message || 'Linked list reversed successfully';
        setBanner(msg, 'success');
        appendLog(msg, 'success');
    }
});

// 10. Clear
btnClear.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear the entire linked list? (This deallocates all nodes via free())')) {
        return;
    }
    const res = await callApi('/api/clear', 'POST');
    if (res && res.success) {
        renderLinkedList(res.data);
        const msg = res.message || 'Linked list cleared successfully';
        setBanner(msg, 'info');
        appendLog(msg, 'info');
    }
});

// 11. Refresh & Clear Log
btnRefresh.addEventListener('click', () => {
    fetchList();
    setBanner('State refreshed from C backend', 'info');
    appendLog('Refreshed state from C backend', 'info');
});

btnClearLog.addEventListener('click', () => {
    logContainer.innerHTML = '';
});

// Allow 'Enter' key submission on inputs
valInsertBeg.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnInsertBeg.click(); });
valInsertEnd.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnInsertEnd.click(); });
valInsertPos.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnInsertPos.click(); });
posInsertPos.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnInsertPos.click(); });
posDeletePos.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnDeletePos.click(); });
valSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnSearch.click(); });

// Initial fetch on page load
window.addEventListener('DOMContentLoaded', () => {
    fetchList();
});
