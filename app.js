// app.js

// --- Seed Data Fallback ---
const DEFAULT_DATA = {
    printers: [
        { id: '1', brand: 'Bambu Lab', model: 'X1-Carbon', status: 'idle', nozzle_temp: 0, bed_temp: 0, fan_speed: 0 },
        { id: '2', brand: 'Bambu Lab', model: 'P1S', status: 'printing', nozzle_temp: 220, bed_temp: 60, fan_speed: 80 },
        { id: '3', brand: 'Prusa Research', model: 'MK4', status: 'idle', nozzle_temp: 0, bed_temp: 0, fan_speed: 0 }
    ],
    filaments: [
        { id: 'a', brand: 'Polymaker', name: 'PolyLite Indigo Purple', type: 'PLA', color: '#4B0082', sku: 'PM-PLA-IND-01', rrp: 24.99, weight_total: 1000, weight_remaining: 850, url: '#' },
        { id: 'b', brand: 'Sunlu', name: 'High Speed Silk Rainbow', type: 'PLA', color: 'linear-gradient(90deg, red, yellow, green, blue)', sku: 'SUN-PLA-RBW-01', rrp: 27.99, weight_total: 1000, weight_remaining: 150, url: '#' },
        { id: 'c', brand: 'eSUN', name: 'Matte Black', type: 'PETG', color: '#202020', sku: 'ES-PETG-BLK-01', rrp: 22.50, weight_total: 1000, weight_remaining: 540, url: '#' }
    ],
    jobs: [
        { id: 'j1', name: 'Titan_Housing_V2', printer_id: '2', filament_id: 'a', status: 'printing', progress: 68.4, net_usage: 150 },
        { id: 'j2', name: 'NRL Phone Stand', printer_id: '1', filament_id: 'c', status: 'pending', progress: 0, net_usage: 75 }
    ]
};

// --- State ---
let db = { printers: [], filaments: [], jobs: [] };
let supabaseClient = null;
let useSupabase = false;
let currentModalJob = null;

// --- Initialization ---
function initApp() {
    setupTabs();
    setupConfigModal();
    setupCompletionModal();
    setupAddModals();
    
    // Check config
    const supaUrl = localStorage.getItem('supa_url') || 'https://buzusggqhlnxiecupmuk.supabase.co';
    const supaKey = localStorage.getItem('supa_key') || 'sb_publishable_AheL4tNgeyqB5k2di3ebpw_r0vfrYGN';
    if (supaUrl && supaKey && window.supabase) {
        supabaseClient = window.supabase.createClient(supaUrl, supaKey);
        useSupabase = true;
        fetchSupabaseData();
    } else {
        loadLocalData();
        renderAll();
        startSimulation();
    }
}

function loadLocalData() {
    const saved = localStorage.getItem('forge_data');
    if (saved) {
        db = JSON.parse(saved);
    } else {
        db = JSON.parse(JSON.stringify(DEFAULT_DATA));
        saveLocalData();
    }
}

function saveLocalData() {
    if (!useSupabase) {
        localStorage.setItem('forge_data', JSON.stringify(db));
    }
}

async function fetchSupabaseData() {
    // In a full implementation, this would fetch from actual Supabase.
    // For now, if connection fails or is empty, we fallback to local.
    try {
        const { data: pData } = await supabaseClient.from('printers').select('*');
        if (pData) db.printers = pData;
        // ... fetch filaments, jobs
        renderAll();
        startSimulation();
    } catch (e) {
        console.error('Supabase fetch failed, falling back to local data', e);
        useSupabase = false;
        loadLocalData();
        renderAll();
        startSimulation();
    }
}

// --- Rendering ---
function renderAll() {
    renderDashboard();
    renderTasks();
    renderMaterials();
}

function renderDashboard() {
    const alertsContainer = document.getElementById('dashboard-alerts');
    const queueContainer = document.getElementById('dashboard-queue');
    alertsContainer.innerHTML = '';
    queueContainer.innerHTML = '';

    // Render Alerts (Low filaments)
    db.filaments.forEach(f => {
        const pct = (f.weight_remaining / f.weight_total) * 100;
        if (pct < 20) {
            alertsContainer.innerHTML += `
            <div class="flex-shrink-0 w-64 p-md bg-surface-container-low border border-error-container/30 rounded group hover:border-error transition-all">
                <div class="flex justify-between items-start mb-sm">
                    <span class="font-data-display text-sm text-error">${f.name}</span>
                    <span class="font-label-caps text-[10px] px-xs py-[2px] bg-error-container/20 border border-error-container text-error rounded">LOW_STOCK</span>
                </div>
                <div class="space-y-xs">
                    <div class="flex justify-between font-label-caps text-[11px] text-on-surface-variant">
                        <span>REMAINING</span><span class="text-error font-data-display">${pct.toFixed(1)}%</span>
                    </div>
                    <div class="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                        <div class="h-full bg-error" style="width: ${pct}%"></div>
                    </div>
                </div>
            </div>`;
        }
    });

    // Render Active Queue
    db.jobs.filter(j => j.status === 'printing' || j.status === 'pending').forEach(job => {
        const p = db.printers.find(x => x.id === job.printer_id);
        const f = db.filaments.find(x => x.id === job.filament_id);
        const isPrinting = job.status === 'printing';
        
        queueContainer.innerHTML += `
        <div class="bg-surface-container-low border border-outline-variant p-md rounded flex flex-col gap-md relative">
            ${isPrinting ? '<div class="absolute top-0 right-0 p-xs"><span class="material-symbols-outlined text-primary-container animate-spin-slow" style="font-variation-settings: \'FILL\' 1;">settings_slow_motion</span></div>' : ''}
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-headline-md text-${isPrinting ? 'primary-container' : 'on-surface'} text-lg mb-xs">${job.name}</h3>
                    <div class="flex items-center gap-xs">
                        <span class="material-symbols-outlined text-[14px] text-on-surface-variant">inventory_2</span>
                        <span class="font-data-display text-xs text-on-surface-variant">${f ? f.name : 'Unknown'}</span>
                    </div>
                </div>
                <span class="font-label-caps text-[10px] px-sm py-[4px] border rounded ${isPrinting ? 'bg-primary-container/20 border-primary-container text-primary-container' : 'bg-surface-container-highest border-outline-variant text-on-surface-variant'}">${job.status.toUpperCase()}</span>
            </div>
            <div class="space-y-sm">
                <div class="flex justify-between font-label-caps text-[12px]">
                    <span class="text-on-surface-variant">PROGRESS</span>
                    <span class="text-${isPrinting ? 'primary-container' : 'on-surface-variant'} font-data-display">${job.progress.toFixed(1)}%</span>
                </div>
                <div class="w-full h-2 bg-surface-container-highest rounded-sm overflow-hidden">
                    <div class="h-full bg-${isPrinting ? 'primary-container' : 'surface-variant'}" style="width: ${job.progress}%"></div>
                </div>
                <div class="flex justify-between font-body-md text-xs text-on-surface">
                    <span>${p ? p.brand + ' ' + p.model : 'Unassigned'}</span>
                </div>
            </div>
            ${job.status === 'completed' ? `
            <div class="pt-2 border-t border-outline-variant flex justify-end">
                <button onclick="openCompletionModal('${job.id}')" class="text-xs font-label-caps bg-inverse-primary text-white px-2 py-1 rounded">LOG RUN</button>
            </div>` : ''}
        </div>`;
    });
}

function renderTasks() {
    const tbody = document.getElementById('tasks-table-body');
    const mlist = document.getElementById('tasks-mobile-list');
    tbody.innerHTML = '';
    mlist.innerHTML = '';

    db.jobs.forEach(job => {
        const p = db.printers.find(x => x.id === job.printer_id);
        const f = db.filaments.find(x => x.id === job.filament_id);
        const pName = p ? `${p.brand} ${p.model}` : '-';
        const fName = f ? f.name : '-';

        // Desktop
        tbody.innerHTML += `
        <tr class="hover:bg-surface-container-high transition-colors">
            <td class="p-sm border-b border-outline-variant font-data-display">${job.name}</td>
            <td class="p-sm border-b border-outline-variant">${pName}</td>
            <td class="p-sm border-b border-outline-variant">${fName}</td>
            <td class="p-sm border-b border-outline-variant">
                <span class="font-label-caps text-[10px] px-2 py-1 rounded border border-outline-variant">${job.status.toUpperCase()}</span>
            </td>
            <td class="p-sm border-b border-outline-variant text-right">
                ${job.status === 'completed' ? `<button onclick="openCompletionModal('${job.id}')" class="text-xs text-primary-container hover:underline">Log</button>` : ''}
            </td>
        </tr>`;

        // Mobile
        mlist.innerHTML += `
        <div class="p-sm flex justify-between items-center">
            <div>
                <p class="font-data-display text-sm">${job.name}</p>
                <p class="text-xs text-on-surface-variant">${pName} • ${fName}</p>
            </div>
            <div class="text-right flex flex-col items-end gap-1">
                <span class="font-label-caps text-[10px] px-2 py-1 border border-outline-variant rounded">${job.status.toUpperCase()}</span>
                ${job.status === 'completed' ? `<button onclick="openCompletionModal('${job.id}')" class="text-xs text-primary-container">Log</button>` : ''}
            </div>
        </div>`;
    });
}

function renderMaterials() {
    const list = document.getElementById('materials-list');
    list.innerHTML = '';

    db.filaments.forEach(f => {
        const pct = (f.weight_remaining / f.weight_total) * 100;
        let isCrit = pct < 20;
        let barClass = isCrit ? 'critical-gradient-progress' : 'custom-gradient-progress opacity-80';

        let swatchStyle = f.color.startsWith('linear') ? `background: ${f.color};` : `background-color: ${f.color};`;

        list.innerHTML += `
        <div class="bg-surface-container-low border border-outline-variant rounded-xl p-md">
            <div class="flex justify-between items-start mb-md">
                <div class="flex items-start gap-sm">
                    <div class="w-2 h-10 rounded-full shrink-0 border border-outline" style="${swatchStyle}"></div>
                    <div>
                        <p class="text-on-surface font-headline-md text-lg leading-tight">${f.brand} ${f.name}</p>
                        <p class="text-on-surface-variant text-xs font-data-display mt-xs">SKU: ${f.sku}</p>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-md mb-md">
                <div>
                    <p class="text-[10px] font-label-caps text-on-surface-variant mb-1">REMAINING</p>
                    <p class="font-data-display text-md">${f.weight_remaining.toFixed(1)}g</p>
                </div>
                <div>
                    <p class="text-[10px] font-label-caps text-on-surface-variant mb-1 text-right">RRP / kg</p>
                    <p class="text-right font-data-display text-md flex items-center justify-end">$${f.rrp.toFixed(2)}</p>
                </div>
            </div>
            <div class="flex flex-col gap-xs">
                <div class="flex justify-between font-label-caps text-[11px]">
                    <span class="${isCrit ? 'text-error' : 'text-on-surface-variant'}">${isCrit ? 'CRITICAL LOW' : 'NOMINAL'}</span>
                    <span class="${isCrit ? 'text-error' : 'text-secondary'} font-bold">${pct.toFixed(1)}%</span>
                </div>
                <div class="w-full h-2 bg-outline-variant rounded-full overflow-hidden">
                    <div class="h-full ${barClass}" style="width: ${pct}%"></div>
                </div>
            </div>
        </div>`;
    });
}

// --- Simulation ---
function startSimulation() {
    setInterval(() => {
        let changed = false;
        db.jobs.forEach(job => {
            if (job.status === 'printing') {
                job.progress += Math.random() * 2;
                if (job.progress >= 100) {
                    job.progress = 100;
                    job.status = 'completed';
                    // Auto popup if desired, but we'll let user click "Log Run" in Tasks or Dashboard
                }
                changed = true;
            }
        });
        if (changed) {
            saveLocalData();
            renderDashboard();
            renderTasks();
        }
    }, 3000);
}

// --- UI Interaction Setup ---
function setupTabs() {
    const btns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.tab-content');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            btns.forEach(b => {
                b.classList.remove('text-primary-container', 'active');
                if(b.parentElement.id === 'desktop-nav') b.classList.add('text-on-surface-variant');
                else b.classList.add('opacity-60');
            });
            
            document.getElementById(target).classList.add('active');
            
            // Highlight active buttons
            document.querySelectorAll(`.nav-btn[data-tab="${target}"]`).forEach(activeBtn => {
                activeBtn.classList.add('text-primary-container');
                activeBtn.classList.remove('text-on-surface-variant', 'opacity-60');
            });
        });
    });
}

function setupConfigModal() {
    const btn = document.getElementById('btn-config');
    const modal = document.getElementById('config-modal');
    const close = document.getElementById('close-config');
    const save = document.getElementById('btn-save-config');

    btn.onclick = () => modal.classList.remove('hidden');
    close.onclick = () => modal.classList.add('hidden');
    save.onclick = () => {
        const url = document.getElementById('config-url').value;
        const key = document.getElementById('config-key').value;
        if (url && key) {
            localStorage.setItem('supa_url', url);
            localStorage.setItem('supa_key', key);
            location.reload();
        } else {
            localStorage.removeItem('supa_url');
            localStorage.removeItem('supa_key');
            location.reload();
        }
    };
    
    document.getElementById('config-url').value = localStorage.getItem('supa_url') || 'https://buzusggqhlnxiecupmuk.supabase.co';
    document.getElementById('config-key').value = localStorage.getItem('supa_key') || 'sb_publishable_AheL4tNgeyqB5k2di3ebpw_r0vfrYGN';
}

// --- Completion Modal ---
function setupCompletionModal() {
    const modal = document.getElementById('completion-modal');
    const close = document.getElementById('close-modal');
    const saveBtn = document.getElementById('btn-save-log');
    const costInput = document.getElementById('modal-unit-cost');
    
    close.onclick = () => modal.classList.add('hidden');

    costInput.addEventListener('input', updateCostCalc);

    saveBtn.onclick = () => {
        if (!currentModalJob) return;
        
        // Deduct material
        const f = db.filaments.find(x => x.id === currentModalJob.filament_id);
        if (f) {
            f.weight_remaining -= currentModalJob.net_usage;
            if(f.weight_remaining < 0) f.weight_remaining = 0;
        }

        // Change job status to 'logged' (removed from active list)
        currentModalJob.status = 'logged';
        
        saveLocalData();
        renderAll();
        modal.classList.add('hidden');
    };
}

function openCompletionModal(jobId) {
    const job = db.jobs.find(j => j.id === jobId);
    if(!job) return;
    currentModalJob = job;

    const f = db.filaments.find(x => x.id === job.filament_id);

    document.getElementById('modal-job-name').innerText = job.name;
    document.getElementById('modal-filament-sku').innerText = f ? f.sku : 'Unknown';
    document.getElementById('modal-net-usage').innerText = job.net_usage;
    
    if (f) document.getElementById('modal-unit-cost').value = f.rrp;

    updateCostCalc();
    document.getElementById('completion-modal').classList.remove('hidden');
}

function updateCostCalc() {
    if(!currentModalJob) return;
    const costPerKg = parseFloat(document.getElementById('modal-unit-cost').value) || 0;
    const usageG = currentModalJob.net_usage;
    const totalCost = (costPerKg / 1000) * usageG;
    document.getElementById('modal-total-cost').innerText = '$' + totalCost.toFixed(2);
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
