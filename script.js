/**
 * Singly Linked List Implementation - Frontend Interaction & Visualizer
 * College Mini-Project
 * Supports:
 * 1. Live C Backend Connection (http://localhost:8080) when running locally.
 * 2. In-Browser C Algorithm Simulation when hosted on GitHub Pages or static web servers.
 */

// Determine API base URL
const LOCAL_API_URL = 'http://localhost:8080';
const isHostedOnGitHub = window.location.hostname.includes('github.io');

// Operational Mode: 'backend' or 'in-browser'
let operationalMode = isHostedOnGitHub ? 'in-browser' : 'backend';

// Global state
let currentNodes = [];
let currentAddresses = [];

// =========================================================================
// IN-BROWSER C LINKED LIST ENGINE (For GitHub Pages & Static Hosting)
// Faithful simulation of struct Node { int data; struct Node *next; }
// =========================================================================
class CNode {
    constructor(data, address = null) {
        this.data = data;
        this.next = null;
        this.address = address || ('0x' + Math.floor(0x2000 + Math.random() * 0x6000).toString(16).toUpperCase());
    }
}

class SinglyLinkedListSimulator {
    constructor() {
        this.head = null;
        // Initial nodes: 10 -> 20 -> 30 -> 40
        this.insertEnd(10);
        this.insertEnd(20);
        this.insertEnd(30);
        this.insertEnd(40);
    }

    insertBeginning(data) {
        const newNode = new CNode(data);
        newNode.next = this.head;
        this.head = newNode;
        return { success: true, message: `Node ${data} inserted successfully at beginning` };
    }

    insertEnd(data) {
        const newNode = new CNode(data);
        if (this.head === null) {
            this.head = newNode;
            return { success: true, message: `Node ${data} inserted successfully at end` };
        }
        let current = this.head;
        while (current.next !== null) {
            current = current.next;
        }
        current.next = newNode;
        return { success: true, message: `Node ${data} inserted successfully at end` };
    }

    insertAtPosition(data, position) {
        if (position < 1) {
            return { success: false, message: `Invalid position ${position}! Allowed range: 1 to ${this.count() + 1}` };
        }
        if (position === 1) {
            return this.insertBeginning(data);
        }
        let current = this.head;
        for (let i = 1; current !== null && i < position - 1; i++) {
            current = current.next;
        }
        if (current === null) {
            return { success: false, message: `Invalid position ${position}! Allowed range: 1 to ${this.count() + 1}` };
        }
        const newNode = new CNode(data);
        newNode.next = current.next;
        current.next = newNode;
        return { success: true, message: `Node ${data} inserted successfully at position ${position}` };
    }

    deleteBeginning() {
        if (this.head === null) {
            return { success: false, message: `Cannot delete from empty linked list!` };
        }
        const deletedVal = this.head.data;
        this.head = this.head.next;
        return { success: true, message: `Node ${deletedVal} deleted successfully from beginning`, deletedVal };
    }

    deleteEnd() {
        if (this.head === null) {
            return { success: false, message: `Cannot delete from empty linked list!` };
        }
        if (this.head.next === null) {
            const deletedVal = this.head.data;
            this.head = null;
            return { success: true, message: `Node ${deletedVal} deleted successfully from end`, deletedVal };
        }
        let current = this.head;
        while (current.next.next !== null) {
            current = current.next;
        }
        const deletedVal = current.next.data;
        current.next = null;
        return { success: true, message: `Node ${deletedVal} deleted successfully from end`, deletedVal };
    }

    deleteAtPosition(position) {
        if (this.head === null || position < 1) {
            return { success: false, message: `Invalid position ${position}!` };
        }
        if (position === 1) {
            return this.deleteBeginning();
        }
        let current = this.head;
        for (let i = 1; current !== null && i < position - 1; i++) {
            current = current.next;
        }
        if (current === null || current.next === null) {
            return { success: false, message: `Invalid position ${position}! Current valid positions: 1 to ${this.count()}` };
        }
        const target = current.next;
        const deletedVal = target.data;
        current.next = target.next;
        return { success: true, message: `Node ${deletedVal} deleted successfully from position ${position}`, deletedVal };
    }

    search(key) {
        let current = this.head;
        let pos = 1;
        while (current !== null) {
            if (current.data === key) {
                return { found: true, position: pos, message: `Node ${key} found at position ${pos}` };
            }
            current = current.next;
            pos++;
        }
        return { found: false, position: 0, message: `Node ${key} not found in the linked list` };
    }

    count() {
        let cnt = 0;
        let current = this.head;
        while (current !== null) {
            cnt++;
            current = current.next;
        }
        return cnt;
    }

    reverse() {
        let prev = null;
        let current = this.head;
        let next = null;
        while (current !== null) {
            next = current.next;
            current.next = prev;
            prev = current;
            current = next;
        }
        this.head = prev;
        return { success: true, message: `Linked list reversed successfully` };
    }

    clear() {
        this.head = null;
        return { success: true, message: `Linked list cleared successfully (All memory freed)` };
    }

    toArray() {
        const arr = [];
        const addrs = [];
        let current = this.head;
        while (current !== null) {
            arr.push(current.data);
            addrs.push(current.address);
            current = current.next;
        }
        return { data: arr, addresses: addrs, count: arr.length };
    }
}

const localSimulator = new SinglyLinkedListSimulator();

// =========================================================================
// DOM ELEMENTS
// =========================================================================
const chainContainer = document.getElementById('linkedListChain');
const statusBanner = document.getElementById('statusBanner');
const bannerMessage = document.getElementById('bannerMessage');
const bannerIcon = document.getElementById('bannerIcon');
const connectionStatus = document.getElementById('connectionStatus');
const nodeCountBadge = document.getElementById('nodeCountBadge');
const headValBadge = document.getElementById('headValBadge');
const logContainer = document.getElementById('logContainer');

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

// Helpers
function getTimestamp() {
    return new Date().toTimeString().split(' ')[0];
}

function appendLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `
        <span class="log-time">${getTimestamp()}</span>
        <span class="log-msg">${escapeHtml(message)}</span>
    `;
    logContainer.prepend(entry);
}

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

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function updateConnectionIndicator(mode) {
    if (mode === 'backend') {
        connectionStatus.className = 'status-indicator online';
        connectionStatus.title = "Connected to local C HTTP server. Click to toggle mode.";
        connectionStatus.innerHTML = `
            <span class="pulse-dot"></span>
            <span class="status-text">C Backend: Connected (:8080)</span>
        `;
    } else {
        connectionStatus.className = 'status-indicator hosted';
        connectionStatus.title = "Running in static mode for GitHub Pages. Click to retry local C backend (:8080).";
        connectionStatus.innerHTML = `
            <span class="pulse-dot"></span>
            <span class="status-text">GitHub Pages Demo (In-Browser C Engine)</span>
        `;
    }
}

// Mode toggle on indicator click
connectionStatus.style.cursor = 'pointer';
connectionStatus.addEventListener('click', async () => {
    if (operationalMode === 'in-browser') {
        setBanner('Testing connection to local C backend on http://localhost:8080 ...', 'info');
        const online = await checkBackendHealth();
        if (online) {
            operationalMode = 'backend';
            updateConnectionIndicator('backend');
            fetchList();
            setBanner('Switched to live local C backend!', 'success');
            appendLog('Connected to local C backend on port 8080', 'success');
        } else {
            setBanner('Local C backend (:8080) is not running. Staying in GitHub Pages Demo Mode.', 'error');
            appendLog('Could not reach http://localhost:8080. Running in-browser C simulator.', 'info');
        }
    } else {
        operationalMode = 'in-browser';
        updateConnectionIndicator('in-browser');
        fetchList();
        setBanner('Switched to In-Browser C Simulator Mode.', 'info');
        appendLog('Switched to In-Browser C Simulator', 'info');
    }
});

// Render Visual List
function renderLinkedList(nodes, addresses = []) {
    currentNodes = Array.isArray(nodes) ? nodes : [];
    currentAddresses = Array.isArray(addresses) && addresses.length === currentNodes.length 
        ? addresses 
        : currentNodes.map((_, i) => '0x' + (0x1000 + i * 16).toString(16).toUpperCase());

    chainContainer.innerHTML = '';

    // HEAD Pointer Tag
    const headTag = document.createElement('div');
    headTag.className = 'pointer-tag head-tag';
    headTag.textContent = 'HEAD';
    chainContainer.appendChild(headTag);

    // Initial arrow
    chainContainer.appendChild(createArrowElement());

    // Empty list check
    if (currentNodes.length === 0) {
        const nullTag = document.createElement('div');
        nullTag.className = 'pointer-tag null-tag';
        nullTag.textContent = 'NULL';
        chainContainer.appendChild(nullTag);

        nodeCountBadge.textContent = '0';
        headValBadge.textContent = 'NULL';
        return;
    }

    // Render Nodes
    currentNodes.forEach((val, idx) => {
        const nodeItem = document.createElement('div');
        nodeItem.className = 'node-item';
        nodeItem.id = `node-${idx + 1}`;

        const addr = currentAddresses[idx];

        nodeItem.innerHTML = `
            <div class="node-box">
                <div class="node-header">
                    <span>Node #${idx + 1}</span>
                    <span>${addr}</span>
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
        chainContainer.appendChild(createArrowElement());
    });

    // NULL Tag
    const nullTag = document.createElement('div');
    nullTag.className = 'pointer-tag null-tag';
    nullTag.textContent = 'NULL';
    chainContainer.appendChild(nullTag);

    // Update stats
    nodeCountBadge.textContent = currentNodes.length;
    headValBadge.textContent = currentNodes[0];
}

function createArrowElement() {
    const arrow = document.createElement('div');
    arrow.className = 'arrow-connector';
    arrow.innerHTML = `
        <span class="arrow-line"></span>
        <span class="arrow-head">▶</span>
    `;
    return arrow;
}

// Check Backend Health
async function checkBackendHealth() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const resp = await fetch(`${LOCAL_API_URL}/api/list`, { signal: controller.signal });
        clearTimeout(timeoutId);
        return resp.ok;
    } catch {
        return false;
    }
}

// Unified API / Execution Dispatcher
async function executeOperation(endpoint, method = 'GET', body = null) {
    if (operationalMode === 'backend') {
        try {
            const options = {
                method: method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (body && method !== 'GET') {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${LOCAL_API_URL}${endpoint}`, options);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Server responded with HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            console.warn('Backend unavailable, falling back to In-Browser C Simulator:', err.message);
            operationalMode = 'in-browser';
            updateConnectionIndicator('in-browser');
            appendLog('Switched to in-browser C simulator (Local server offline)', 'info');
            // Execute locally instead
        }
    }

    // In-Browser C Simulator Execution
    if (endpoint === '/api/list') {
        const state = localSimulator.toArray();
        return { success: true, count: state.count, data: state.data, addresses: state.addresses, message: 'List fetched successfully' };
    } else if (endpoint === '/api/insert/beginning') {
        const res = localSimulator.insertBeginning(body.value);
        const state = localSimulator.toArray();
        return { success: true, count: state.count, data: state.data, addresses: state.addresses, message: res.message };
    } else if (endpoint === '/api/insert/end') {
        const res = localSimulator.insertEnd(body.value);
        const state = localSimulator.toArray();
        return { success: true, count: state.count, data: state.data, addresses: state.addresses, message: res.message };
    } else if (endpoint === '/api/insert/position') {
        const res = localSimulator.insertAtPosition(body.value, body.position);
        const state = localSimulator.toArray();
        return { success: res.success, count: state.count, data: state.data, addresses: state.addresses, message: res.message };
    } else if (endpoint === '/api/delete/beginning') {
        const res = localSimulator.deleteBeginning();
        const state = localSimulator.toArray();
        return { success: res.success, count: state.count, data: state.data, addresses: state.addresses, message: res.message };
    } else if (endpoint === '/api/delete/end') {
        const res = localSimulator.deleteEnd();
        const state = localSimulator.toArray();
        return { success: res.success, count: state.count, data: state.data, addresses: state.addresses, message: res.message };
    } else if (endpoint === '/api/delete/position') {
        const res = localSimulator.deleteAtPosition(body.position);
        const state = localSimulator.toArray();
        return { success: res.success, count: state.count, data: state.data, addresses: state.addresses, message: res.message };
    } else if (endpoint === '/api/search') {
        const res = localSimulator.search(body.value);
        return { success: true, found: res.found, value: body.value, position: res.position, message: res.message };
    } else if (endpoint === '/api/count') {
        const cnt = localSimulator.count();
        return { success: true, count: cnt, message: `Total number of nodes: ${cnt}` };
    } else if (endpoint === '/api/reverse') {
        const res = localSimulator.reverse();
        const state = localSimulator.toArray();
        return { success: true, count: state.count, data: state.data, addresses: state.addresses, message: res.message };
    } else if (endpoint === '/api/clear') {
        const res = localSimulator.clear();
        const state = localSimulator.toArray();
        return { success: true, count: state.count, data: state.data, addresses: state.addresses, message: res.message };
    }
    return null;
}

async function fetchList() {
    const res = await executeOperation('/api/list');
    if (res && res.success) {
        renderLinkedList(res.data, res.addresses);
    }
}

// Search Traversal Animation
async function animateSearch(targetValue, targetPos) {
    const totalNodes = currentNodes.length;
    const maxSteps = targetPos > 0 ? targetPos : totalNodes;

    for (let i = 1; i <= maxSteps; i++) {
        const el = document.getElementById(`node-${i}`);
        if (el) {
            el.classList.add('highlight-traverse');
            await new Promise(r => setTimeout(r, 280));
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

// =========================================================================
// EVENT LISTENERS FOR ALL OPERATIONS
// =========================================================================

// 1. Insert Beginning
btnInsertBeg.addEventListener('click', async () => {
    const val = parseInt(valInsertBeg.value, 10);
    if (isNaN(val)) {
        setBanner('Please enter a valid integer for insertion!', 'error');
        return;
    }
    const res = await executeOperation('/api/insert/beginning', 'POST', { value: val });
    if (res && res.success) {
        renderLinkedList(res.data, res.addresses);
        const msg = res.message || `Node ${val} inserted successfully at beginning`;
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
    const res = await executeOperation('/api/insert/end', 'POST', { value: val });
    if (res && res.success) {
        renderLinkedList(res.data, res.addresses);
        const msg = res.message || `Node ${val} inserted successfully at end`;
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

    const res = await executeOperation('/api/insert/position', 'POST', { value: val, position: pos });
    if (res) {
        if (res.success) {
            renderLinkedList(res.data, res.addresses);
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
    const res = await executeOperation('/api/delete/beginning', 'POST');
    if (res) {
        if (res.success) {
            renderLinkedList(res.data, res.addresses);
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
    const res = await executeOperation('/api/delete/end', 'POST');
    if (res) {
        if (res.success) {
            renderLinkedList(res.data, res.addresses);
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

    const res = await executeOperation('/api/delete/position', 'POST', { position: pos });
    if (res) {
        if (res.success) {
            renderLinkedList(res.data, res.addresses);
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

    const res = await executeOperation('/api/search', 'POST', { value: val });
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
    const res = await executeOperation('/api/count');
    if (res) {
        const msg = res.message || `Total nodes: ${res.count}`;
        setBanner(msg, 'info');
        appendLog(msg, 'info');
        nodeCountBadge.textContent = res.count;
    }
});

// 9. Reverse
btnReverse.addEventListener('click', async () => {
    const res = await executeOperation('/api/reverse', 'POST');
    if (res && res.success) {
        renderLinkedList(res.data, res.addresses);
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
    const res = await executeOperation('/api/clear', 'POST');
    if (res && res.success) {
        renderLinkedList(res.data, res.addresses);
        const msg = res.message || 'Linked list cleared successfully';
        setBanner(msg, 'info');
        appendLog(msg, 'info');
    }
});

// Refresh & Clear Log
btnRefresh.addEventListener('click', () => {
    fetchList();
    setBanner('State refreshed', 'info');
    appendLog('Refreshed linked list state', 'info');
});

btnClearLog.addEventListener('click', () => {
    logContainer.innerHTML = '';
});

// Enter key support
valInsertBeg.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnInsertBeg.click(); });
valInsertEnd.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnInsertEnd.click(); });
valInsertPos.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnInsertPos.click(); });
posInsertPos.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnInsertPos.click(); });
posDeletePos.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnDeletePos.click(); });
valSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnSearch.click(); });

// Initialization
window.addEventListener('DOMContentLoaded', async () => {
    if (!isHostedOnGitHub) {
        const online = await checkBackendHealth();
        if (online) {
            operationalMode = 'backend';
            updateConnectionIndicator('backend');
            appendLog('Connected to local C backend (:8080)', 'success');
        } else {
            operationalMode = 'in-browser';
            updateConnectionIndicator('in-browser');
            appendLog('Local C backend offline. Running in-browser C simulator.', 'info');
        }
    } else {
        operationalMode = 'in-browser';
        updateConnectionIndicator('in-browser');
        appendLog('Initialized on GitHub Pages with In-Browser C Engine.', 'info');
    }
    fetchList();
});
