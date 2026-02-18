document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const COMPONENTS = [
        "Processor", "Motherboard", "RAM", "SSD", "Storage", "GPU", "CPU Cooler",
        "CPU Fan", "Fan", "PSU", "CPU Case", "Chasis Fan", "M&KB", "Monitor", "Windows OS", "Software"
    ];

    const PRESET_CONFIG = {
        "CUSTOM": "Build your own",
        "Basic / Office Build": "For:\nOffice work\nBrowsing, email, POS systems\nOnline classes\n\nTypical focus:\nIntegrated graphics\nLow power consumption\nSilent & compact",
        "Home / Everyday Build": "For:\nOffice + light multitasking\nLight photo editing\nCasual games (esports on low/medium)\n\nTypical focus:\nStrong CPU with iGPU or entry GPU\nBalanced cost/performance",
        "Mid-Range Performance Build": "For:\nHeavy multitasking\nProgramming\nLight video editing\nGaming at Medium–High\n\nTypical focus:\n6–8 core CPU\nEntry–mid discrete GPU\nUpgrade-friendly platform",
        "Gaming Build": "For:\nCompetitive gaming\nAAA titles\nHigh FPS / High settings\n\nTypical focus:\nGPU-first design\nHigh-refresh stability\nGood cooling & airflow",
        "Content Creator Build": "For:\nPhoto editing\nYouTube content\nStreaming\nLight–mid video editing\n\nTypical focus:\nStrong CPU + encoder-capable GPU\nHigher RAM capacity\nFast NVMe storage",
        "Video Editing / Production Build": "For:\n4K–8K video editing\nAfter Effects\nDaVinci Resolve\nColor grading\n\nTypical focus:\nHigh core-count CPU\nHigh VRAM GPU\nLarge & fast storage\nHigh RAM capacity",
        "Workstation Build": "For:\n3D rendering\nCAD / BIM\nSimulation\nAI / ML workloads\n\nTypical focus:\nMaximum stability\nVery high RAM capacity\nStrong VRM & PCIe lanes\nMulti-GPU support (optional)",
        "Future-Proof Build": "For:\nLong-term use (5–7 years)\nEasy upgrades\nAvoiding platform dead-ends\n\nTypical focus:\nLatest CPU socket\nDDR5 memory\nPCIe Gen 4 / Gen 5 support\nOversized PSU & airflow-ready case",
        "Compact / Small Form Factor (SFF) Build": "For:\nLimited desk space\nMinimalist setups\nPortable PCs\n\nTypical focus:\nMini-ITX or mATX boards\nEfficient thermals\nGPU & cooler size awareness",
        "Budget Gaming Build": "For:\nStudents\nEntry-level gamers\nBest FPS per budget\n\nTypical focus:\nBest price-to-performance parts\nEntry or used GPUs\nMinimal but upgradeable setup"
    };

    let allItems = {}; // Master list of all items from Excel { "itemCode": { description, qty } }
    let branchStockData = {}; // Raw data for Branch Stock { "itemCode": { description, qty } }
    let whsStockData = {};    // Raw data for WHS Stock { "itemCode": { description, qty } }
    let branchFileInfo = { text: '', date: '' };
    let whsFileInfo = { text: '', date: '' };
    let categories = {}; // { "Processor": ["itemCode1", "itemCode2"], ... }
    let presets = {}; // { "Gaming Build": { "Processor": "itemcode1" }, ... }
    let buildSelections = {}; // { "Processor": "itemCode1", ... }
    let setupData = {}; // { "itemCode": { cost: "", unbundle: "", bundle: "", qty: "" }, ... }
    let activePreset = 'CUSTOM';
    let currentTheme = 'dark-amber';
    let isBundleMode = true;
    let leadsData = [];

    // --- DOM ELEMENTS ---
    const pages = {
        preview: document.getElementById('preview-page'),
        build: document.getElementById('build-page'),
        category: document.getElementById('category-page'),
        inventory: document.getElementById('inventory-page'),
        setup: document.getElementById('setup-page'),
        inquiries: document.getElementById('inquiries-page'),
    };

    const navButtons = {
        preview: document.getElementById('preview-btn'),
        build: document.getElementById('build-btn'),
        category: document.getElementById('category-btn'),
        inventory: document.getElementById('inventory-btn'),
        setup: document.getElementById('setup-btn'),
        inquiries: document.getElementById('inquiries-btn'),
    };

    const currentDateTimeEl = document.getElementById('current-datetime');
    const buildTableBody = document.getElementById('build-table-body');
    const categoryGrid = document.getElementById('category-grid');
    const summaryTextbox = document.getElementById('summary-textbox');
    const themeSelect = document.getElementById('theme-select');
    const configBtn = document.getElementById('config-btn');
    const presetDropdown = document.getElementById('preset-dropdown');
    const presetEditorContainer = document.getElementById('preset-editor-container');

    // Global Search Elements
    const globalSearchInput = document.getElementById('global-search');
    const globalSearchModal = document.getElementById('global-search-modal');
    const globalSearchInputModal = document.getElementById('global-search-input');
    const globalSearchResults = document.getElementById('global-search-results');
    const globalSearchCloseBtn = document.getElementById('global-search-close-btn');
    
    // Config History Modal Elements
    const configHistoryModal = document.getElementById('config-history-modal');
    const configHistoryList = document.getElementById('config-history-list');
    const configHistoryCloseBtn = document.getElementById('config-history-close-btn');
    const configSaveBtn = document.getElementById('config-save-btn');

    // Branch Stock Elements
    const branchImportBtn = document.getElementById('branch-import-btn');
    const branchFileInput = document.getElementById('branch-file-input');
    const branchItemCodeFilter = document.getElementById('branch-item-code-filter');
    const branchDescriptionFilter = document.getElementById('branch-description-filter');
    const branchDescriptionFilter2 = document.getElementById('branch-description-filter2');
    const branchStockTableBody = document.getElementById('branch-stock-table-body');
    const branchFileTextEl = document.getElementById('branch-file-text');
    const branchFileDateEl = document.getElementById('branch-file-date');
    
    // WHS Stock Elements
    const whsImportBtn = document.getElementById('whs-import-btn');
    const whsFileInput = document.getElementById('whs-file-input');
    const whsItemCodeFilter = document.getElementById('whs-item-code-filter');
    const whsDescriptionFilter = document.getElementById('whs-description-filter');
    const whsDescriptionFilter2 = document.getElementById('whs-description-filter2');
    const whsStockTableBody = document.getElementById('whs-stock-table-body');
    const whsFileTextEl = document.getElementById('whs-file-text');
    const whsFileDateEl = document.getElementById('whs-file-date');
    
    // Save Build Modal Elements
    const saveBuildBtn = document.getElementById('save-build-btn');
    const saveBuildModal = document.getElementById('save-build-modal');
    const presetNameInput = document.getElementById('preset-name-input');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // --- INITIALIZATION ---
    function initialize() {
        console.log('Initializing app...');
        
        // Setup navigation
        Object.keys(navButtons).forEach(key => {
            navButtons[key].addEventListener('click', () => showPage(key));
        });

        // Setup keyboard shortcuts (Ctrl+K for search)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                openGlobalSearch();
            }
        });

        // Setup theme selector
        themeSelect.addEventListener('change', (e) => {
            currentTheme = e.target.value;
            applyTheme();
            saveToLocalStorage();
        });

        // Setup global search input (nav bar)
        globalSearchInput.addEventListener('click', openGlobalSearch);

        // Setup global search modal
        globalSearchCloseBtn.addEventListener('click', closeGlobalSearch);
        globalSearchInputModal.addEventListener('input', handleGlobalSearch);
        globalSearchModal.addEventListener('click', (e) => {
            if (e.target === globalSearchModal) {
                closeGlobalSearch();
            }
        });
        globalSearchModal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeGlobalSearch();
            }
        });

        // Setup config history modal
        configHistoryCloseBtn.addEventListener('click', closeConfigHistoryModal);
        if (configSaveBtn) {
            configSaveBtn.addEventListener('click', () => {
                exportCategories();
            });
        }
        configHistoryModal.addEventListener('click', (e) => {
            if (e.target === configHistoryModal) {
                closeConfigHistoryModal();
            }
        });

        // Setup config button
        configBtn.addEventListener('click', openConfigHistoryModal);

        // Setup preset dropdown event listener
        presetDropdown.addEventListener('change', (e) => {
            handlePresetClick(e.target.value);
        });

        // Setup Branch Stock actions
        branchImportBtn.addEventListener('click', () => branchFileInput.click());
        branchFileInput.addEventListener('change', (e) => handleStockFileUpload(e, 'branch'));
        branchItemCodeFilter.addEventListener('input', () => renderBranchStockTable());
        branchDescriptionFilter.addEventListener('input', () => renderBranchStockTable());
        branchDescriptionFilter2.addEventListener('input', () => renderBranchStockTable());

        // Setup WHS Stock actions
        whsImportBtn.addEventListener('click', () => whsFileInput.click());
        whsFileInput.addEventListener('change', (e) => handleStockFileUpload(e, 'whs'));
        whsItemCodeFilter.addEventListener('input', () => renderWhsStockTable());
        whsDescriptionFilter.addEventListener('input', () => renderWhsStockTable());
        whsDescriptionFilter2.addEventListener('input', () => renderWhsStockTable());

        // Setup Save Build button and modal listeners
        saveBuildBtn.addEventListener('click', showSaveBuildModal);
        modalCancelBtn.addEventListener('click', hideSaveBuildModal);
        modalSaveBtn.addEventListener('click', handleSaveBuild);
        saveBuildModal.addEventListener('click', (e) => {
            if (e.target === saveBuildModal) {
                hideSaveBuildModal();
            }
        });

        // Setup Bundle toggle listener
        const bundleToggle = document.getElementById('bundle-toggle');
        bundleToggle.addEventListener('change', (e) => {
            isBundleMode = !e.target.checked;
            renderPreviewTable();
        });

        // Setup Lead Form
        const leadForm = document.getElementById('leadForm');
        if (leadForm) {
            leadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!window.leadDb) {
                    alert('Firebase not initialized');
                    return;
                }
                const { db, collection, addDoc, serverTimestamp, updateDoc, doc } = window.leadDb;
                const leadData = {
                    date: document.getElementById('lead-date').value,
                    name: document.getElementById('lead-name').value,
                    type: document.getElementById('lead-type').value,
                    source: document.getElementById('lead-source').value,
                    contactNumber: document.getElementById('lead-contact').value,
                    email: document.getElementById('lead-email').value,
                    inquiry: document.getElementById('lead-inquiry').value,
                    items: document.getElementById('lead-items').value,
                    priceRange: document.getElementById('lead-price').value,
                    status: document.getElementById('lead-status').value,
                    notes: document.getElementById('lead-notes').value,
                    updatedAt: serverTimestamp()
                };
                try {
                    if (currentLeadId) {
                        await updateDoc(doc(db, "leads", currentLeadId), leadData);
                        alert('Lead Updated!');
                    } else {
                        leadData.createdAt = serverTimestamp();
                        await addDoc(collection(db, "leads"), leadData);
                        alert('Lead Saved!');
                    }
                    closeLeadModal();
                    loadLeads();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error saving lead');
                }
            });
        }

        // Setup Lead filters
        const leadSearch = document.getElementById('lead-search');
        const leadFilterStatus = document.getElementById('lead-filter-status');
        if (leadSearch) leadSearch.addEventListener('input', filterLeads);
        if (leadFilterStatus) leadFilterStatus.addEventListener('change', filterLeads);

        // Setup Lead Modal
        const addLeadBtn = document.getElementById('add-lead-btn');
        const leadModal = document.getElementById('lead-modal');
        const leadCancelBtn = document.getElementById('lead-cancel-btn');
        const leadDeleteBtn = document.getElementById('lead-delete-btn');
        
        if (addLeadBtn) {
            addLeadBtn.addEventListener('click', () => openLeadModal());
        }
        if (leadCancelBtn) {
            leadCancelBtn.addEventListener('click', closeLeadModal);
        }
        if (leadModal) {
            leadModal.addEventListener('click', (e) => {
                if (e.target === leadModal) closeLeadModal();
            });
        }
        if (leadDeleteBtn) {
            leadDeleteBtn.addEventListener('click', deleteLead);
        }

        // Load leads on init
        loadLeads();

        // Start real-time clock
        setInterval(updateClock, 1000);
        updateClock();

        // Apply theme
        applyTheme();

        // Initialize categories and presets structures
        COMPONENTS.forEach(c => {
            if (!categories[c]) {
                categories[c] = [];
            }
        });
        Object.keys(PRESET_CONFIG).forEach(presetName => {
            if (presetName !== 'CUSTOM') {
                if (!presets[presetName]) {
                    presets[presetName] = {};
                }
                COMPONENTS.forEach(c => {
                    if (!presets[presetName][c]) {
                        presets[presetName][c] = '';
                    }
                });
            }
        });

        // Render initial state
        renderBuildTable();
        renderCategoryPools();
        renderPresetSelect();
        renderCategoryPresetEditors();
        updateUI();
        
        // Global click handler to close all dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.custom-dropdown')) {
                document.querySelectorAll('.dropdown-options').forEach(el => {
                    el.style.display = 'none';
                });
            }
        });
    }

    // --- THEME ---
    function applyTheme() {
        document.body.setAttribute('data-theme', currentTheme);
        themeSelect.value = currentTheme;
    }

    // --- GLOBAL SEARCH ---
    function openGlobalSearch() {
        globalSearchModal.classList.add('active');
        globalSearchInputModal.value = '';
        globalSearchResults.innerHTML = '';
        setTimeout(() => globalSearchInputModal.focus(), 100);
    }

    function closeGlobalSearch() {
        globalSearchModal.classList.remove('active');
    }

    let searchTimeout;

    function handleGlobalSearch(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim().toUpperCase();

        searchTimeout = setTimeout(() => {
            if (!query) {
                globalSearchResults.innerHTML = '';
                return;
            }

            const results = [];
            Object.keys(allItems).forEach(code => {
                const item = allItems[code];
                const description = (item.description || '').toUpperCase();
                const codeUpper = code.toUpperCase();

                if (codeUpper.includes(query) || description.includes(query)) {
                    results.push({ code, description: item.description });
                }
            });

            if (results.length === 0) {
                globalSearchResults.innerHTML = '<div class="global-search-result-item">No matching items found</div>';
                return;
            }

            globalSearchResults.innerHTML = results.slice(0, 50).map(item => `
                <div class="global-search-result-item" data-code="${item.code}">
                    <span class="result-item-code">${item.code}</span>
                    <div class="result-item-desc">${item.description}</div>
                </div>
            `).join('');

            globalSearchResults.querySelectorAll('.global-search-result-item').forEach(el => {
                el.addEventListener('click', () => {
                    const code = el.dataset.code;
                    navigator.clipboard.writeText(code).then(() => {
                        el.style.backgroundColor = 'var(--primary-color)';
                        el.style.color = 'white';
                        setTimeout(() => {
                            closeGlobalSearch();
                        }, 300);
                    });
                });
            });
        }, 150);
    }

    // --- REAL-TIME CLOCK ---
    function updateClock() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        currentDateTimeEl.textContent = now.toLocaleDateString(undefined, options);
    }

    // --- PAGE NAVIGATION ---
    function showPage(pageKey) {
        // Close any open dropdowns
        document.querySelectorAll('.dropdown-options').forEach(el => {
            el.style.display = 'none';
        });
        
        // Hide all pages and deactivate all buttons
        Object.values(pages).forEach(page => {
            if (page.classList.contains('active')) {
                page.classList.remove('active');
            }
        });
        Object.values(navButtons).forEach(btn => btn.classList.remove('active'));

        // Show the selected page and activate its button
        const targetPage = pages[pageKey];
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        const targetButton = navButtons[pageKey];
        if (targetButton) {
            targetButton.classList.add('active');
        }
    }

    // --- DATA HANDLING & PERSISTENCE ---
    function handleStockFileUpload(event, source) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });

            if (!workbook) {
                alert(`Error: Could not read the Excel file for ${source.toUpperCase()} stock. It might be corrupted or an unsupported format.`);
                return;
            }

            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
                alert(`Error: The Excel file for ${source.toUpperCase()} stock has no readable sheets.`);
                return;
            }

            const worksheet = workbook.Sheets[firstSheetName];
            if (!worksheet || Object.keys(worksheet).length === 0) {
                alert(`Error: The Excel file for ${source.toUpperCase()} stock might be corrupted, empty, or in an unsupported .xls format that cannot be parsed. Please try a different .xls file, or re-save your file as .xlsx.`);
                return;
            }

            // Extract TEXT from A1
            const textCell = worksheet['A1'];
            const fileText = textCell ? textCell.v : '';

            // Extract DATE from A4
            const dateCell = worksheet['A4'];
            const fileDate = dateCell ? (dateCell.t === 'd' ? new Date(dateCell.v).toLocaleDateString() : dateCell.v) : '';

            // sheet_to_json with header:1 and range:8 means data starts from Excel row 9
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 8 });

            const newStockData = {};
            sheetData.forEach(row => {
                const itemCode = row[0];
                const description = row[1];
                const qty = row[4];

                if (itemCode) {
                    newStockData[itemCode] = {
                        description: description || '',
                        qty: qty || 0,
                    };
                }
            });
            
            if (source === 'branch') {
                branchStockData = newStockData;
                branchFileInfo = { text: fileText, date: fileDate };
            } else if (source === 'whs') {
                whsStockData = newStockData;
                whsFileInfo = { text: fileText, date: fileDate };
            }

            updateAllItems();
            saveToLocalStorage();
            updateUI();
        };
        reader.readAsArrayBuffer(file);
    }

    function updateAllItems() {
        allItems = { ...branchStockData, ...whsStockData };
    }

    function exportCategories() {
        if (window.saveConfig) {
            const configData = JSON.stringify({ categories, presets });
            window.saveConfig(configData).then(() => {
                alert('Saved to Firebase!');
                openConfigHistoryModal();
            }).catch(err => {
                console.error('Error saving:', err);
                alert('Error saving to Firebase');
            });
        } else {
            alert('Firebase not available');
        }
    }

    async function openConfigHistoryModal() {
        if (!window.loadConfigHistory) {
            alert('Firebase not available');
            return;
        }
        
        try {
            const configs = await window.loadConfigHistory();
            configHistoryList.innerHTML = '';
            
            if (configs.length === 0) {
                configHistoryList.innerHTML = '<p>No saved configs found.</p>';
            } else {
                configs.forEach(config => {
                    const item = document.createElement('div');
                    item.className = 'config-history-item';
                    item.innerHTML = `
                        <span class="config-date"><strong>${config.date}</strong></span>
                        <div class="config-actions">
                            <button class="config-restore-btn">Restore</button>
                            <button class="config-delete-btn">Delete</button>
                        </div>
                    `;
                    
                    const restoreBtn = item.querySelector('.config-restore-btn');
                    restoreBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const configData = await window.loadConfigById(config.id);
                        if (configData) {
                            try {
                                const config = JSON.parse(configData);
                                if (config.categories) {
                                    categories = config.categories;
                                }
                                if (config.presets) {
                                    presets = config.presets;
                                }
                                COMPONENTS.forEach(c => {
                                    if (!categories[c]) {
                                        categories[c] = [];
                                    }
                                });
                                Object.keys(PRESET_CONFIG).forEach(presetName => {
                                    if (presetName !== 'CUSTOM') {
                                        if (!presets[presetName]) {
                                            presets[presetName] = {};
                                        }
                                        COMPONENTS.forEach(c => {
                                            if (!presets[presetName][c]) {
                                                presets[presetName][c] = '';
                                            }
                                        });
                                    }
                                });
                                updateUI();
                                configHistoryModal.classList.remove('active');
                                alert('Config restored!');
                            } catch (err) {
                                alert('Error parsing config');
                                console.error(err);
                            }
                        }
                    });
                    
                    const deleteBtn = item.querySelector('.config-delete-btn');
                    deleteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this config?')) {
                            try {
                                const { db, deleteDoc, doc } = window.leadDb;
                                await deleteDoc(doc(db, "configs", config.id));
                                openConfigHistoryModal();
                            } catch (err) {
                                alert('Error deleting config');
                                console.error(err);
                            }
                        }
                    });
                    
                    configHistoryList.appendChild(item);
                });
            }
            
            configHistoryModal.classList.add('active');
        } catch (err) {
            console.error('Error loading config history:', err);
            alert('Error loading config history');
        }
    }

    function closeConfigHistoryModal() {
        configHistoryModal.classList.remove('active');
    }

    function handleCategoryImport() {
        openConfigHistoryModal();
    }

    function saveToLocalStorage() {
        localStorage.setItem('pcBuilderData', JSON.stringify({ 
            allItems, branchStockData, whsStockData, branchFileInfo, whsFileInfo, 
            categories, presets, buildSelections, setupData, currentTheme, activePreset 
        }));
    }

    async function loadFromFirebase() {
        console.log('Loading from Firebase...');
        if (window.loadConfig) {
            try {
                const configStr = await window.loadConfig();
                console.log('Config string from Firebase:', configStr);
                if (configStr) {
                    const config = JSON.parse(configStr);
                    console.log('Parsed config:', config);
                    if (config.categories) {
                        categories = config.categories;
                    }
                    if (config.presets) {
                        presets = config.presets;
                    }
                    COMPONENTS.forEach(c => {
                        if (!categories[c]) {
                            categories[c] = [];
                        }
                    });
                    Object.keys(PRESET_CONFIG).forEach(presetName => {
                        if (presetName !== 'CUSTOM') {
                            if (!presets[presetName]) {
                                presets[presetName] = {};
                            }
                            COMPONENTS.forEach(c => {
                                if (!presets[presetName][c]) {
                                    presets[presetName][c] = '';
                                }
                            });
                        }
                    });
                    console.log('Config loaded from Firebase, categories:', categories);
                    updateUI();
                } else {
                    console.log('No config found in Firebase');
                }
            } catch (err) {
                console.error('Error loading config from Firebase:', err);
            }
        } else {
            console.log('window.loadConfig not available');
        }
    }

    function loadFromLocalStorage() {
        const savedData = localStorage.getItem('pcBuilderData');
        if (savedData) {
            const data = JSON.parse(savedData);
            allItems = data.allItems || {};
            branchStockData = data.branchStockData || {};
            whsStockData = data.whsStockData || {};
            branchFileInfo = data.branchFileInfo || { text: '', date: '' };
            whsFileInfo = data.whsFileInfo || { text: '', date: '' };
            categories = data.categories || {};
            presets = data.presets || {};
            buildSelections = data.buildSelections || {};
            setupData = data.setupData || {};
            setupMultiplier = data.setupMultiplier || 1;
            currentTheme = data.currentTheme || 'dark-amber';
            activePreset = data.activePreset || 'CUSTOM';
        }
        
        COMPONENTS.forEach(c => {
            if (!categories[c]) {
                categories[c] = [];
            }
        });
        
        Object.keys(PRESET_CONFIG).forEach(presetName => {
            if (presetName !== 'CUSTOM') {
                if (!presets[presetName]) {
                    presets[presetName] = {};
                }
                COMPONENTS.forEach(c => {
                    if (!presets[presetName][c]) {
                        presets[presetName][c] = '';
                    }
                });
            }
        });
        updateAllItems();
    }

    // --- PRESET UI & LOGIC ---
    function handlePresetClick(presetName) {
        activePreset = presetName;

        if (presetName === 'CUSTOM') {
            buildSelections = {};
        } else {
            buildSelections = JSON.parse(JSON.stringify(presets[presetName] || {}));
        }

        saveToLocalStorage();
        updateUI();
    }

    function renderPresetSelect() {
        presetDropdown.innerHTML = '';

        const staticPresetNames = Object.keys(PRESET_CONFIG).filter(name => name !== 'CUSTOM');
        const userDefinedPresetNames = Object.keys(presets).filter(name => !PRESET_CONFIG.hasOwnProperty(name));

        staticPresetNames.sort((a, b) => a.localeCompare(b));
        userDefinedPresetNames.sort((a, b) => a.localeCompare(b));

        const allPresetNames = ['CUSTOM', ...staticPresetNames, ...userDefinedPresetNames];

        allPresetNames.forEach(presetName => {
            const option = document.createElement('option');
            option.value = presetName;
            option.textContent = presetName;

            if (PRESET_CONFIG.hasOwnProperty(presetName)) {
                option.title = PRESET_CONFIG[presetName];
            } else {
                option.title = `User-defined preset: ${presetName}`;
            }
            
            if (presetName === activePreset) {
                option.selected = true;
            }
            presetDropdown.appendChild(option);
        });
    }

    // --- CUSTOM SEARCHABLE DROPDOWN FUNCTIONS ---
    
    function renderBuildTable() {
        buildTableBody.innerHTML = '';
        COMPONENTS.forEach(component => {
            const row = document.createElement('tr');
            
            const selectedItemCode = buildSelections[component] || '';
            const selectedItem = selectedItemCode ? allItems[selectedItemCode] : null;
            const selectedDescription = selectedItem ? selectedItem.description : '';

            row.innerHTML = `
                <td>${component}</td>
                <td class="dropdown-container">
                    <div class="custom-dropdown" data-component="${component}">
                        <div class="dropdown-selected">
                            <span class="selected-text">${selectedDescription ? `[${getItemPrefix(selectedItemCode)}] ${selectedDescription}` : '-- Select --'}</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <div class="dropdown-options" style="display: none;">
                            <div class="dropdown-search">
                                <input type="text" class="dropdown-filter" placeholder="Type to filter by code or description..." autocomplete="off">
                            </div>
                            <div class="dropdown-items-container">
                                ${getFilterableOptionsForComponent(component, '')}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="item-code-cell ${!branchStockData.hasOwnProperty(selectedItemCode) && whsStockData.hasOwnProperty(selectedItemCode) ? 'whs-item-code' : ''}">
                    ${selectedItemCode || ''}
                </td>
            `;
            
            buildTableBody.appendChild(row);

            const itemCodeCell = row.querySelector('.item-code-cell');
            if (selectedItemCode && itemCodeCell) {
                setupCopyFunctionality(itemCodeCell, selectedItemCode);
            }

            // Setup custom dropdown functionality for this row
            setupCustomDropdown(row, component, selectedItemCode);
        });
    }

    function getItemPrefix(itemCode) {
        if (branchStockData.hasOwnProperty(itemCode)) return 'SMF';
        if (whsStockData.hasOwnProperty(itemCode)) return 'WHS';
        return 'N/A';
    }

    function getFilterableOptionsForComponent(component, filterText = '') {
        const itemCodes = categories[component] || [];
        const filterUpper = filterText.toUpperCase();
        
        const filteredCodes = itemCodes
            .map(code => {
                let item = null;
                let prefix = '';
                
                const inBranch = branchStockData.hasOwnProperty(code);
                const inWHS = whsStockData.hasOwnProperty(code);
                
                if (inBranch) {
                    item = branchStockData[code];
                    prefix = '[SMF] ';
                } else if (inWHS) {
                    item = whsStockData[code];
                    prefix = '[WHS] ';
                } else {
                    item = allItems[code];
                    if (!item) return null;
                    prefix = '[N/A] ';
                }
                
                if (item) {
                    const description = item.description || '';
                    const displayText = `${prefix}${description}`;
                    
                    // Apply filter if filterText is provided - search in both code and description
                    if (filterUpper) {
                        const codeMatch = code.toUpperCase().includes(filterUpper);
                        const descMatch = description.toUpperCase().includes(filterUpper);
                        const displayMatch = displayText.toUpperCase().includes(filterUpper);
                        
                        if (!codeMatch && !descMatch && !displayMatch) {
                            return null;
                        }
                    }
                    
                    return {
                        code,
                        displayText,
                        description: item.description
                    };
                }
                return null;
            })
            .filter(item => item !== null)
            .sort((a, b) => a.displayText.localeCompare(b.displayText));
        
        if (filteredCodes.length === 0) {
            return '<div class="dropdown-item" data-value="" data-display="--SELECT--">--SELECT--</div><div class="dropdown-no-results">No matching items found</div>';
        }
        
        return '<div class="dropdown-item" data-value="" data-display="--SELECT--">--SELECT--</div>' + filteredCodes.map(item => 
            `<div class="dropdown-item" data-value="${item.code}" data-display="${item.displayText.replace(/"/g, '&quot;')}">
                ${item.displayText}
            </div>`
        ).join('');
    }

    function setupCustomDropdown(row, component, currentSelection) {
        const dropdown = row.querySelector('.custom-dropdown');
        const selectedDiv = dropdown.querySelector('.dropdown-selected');
        const optionsDiv = dropdown.querySelector('.dropdown-options');
        const filterInput = dropdown.querySelector('.dropdown-filter');
        const itemsContainer = dropdown.querySelector('.dropdown-items-container');
        const selectedTextSpan = dropdown.querySelector('.selected-text');
        
        // Toggle dropdown open/close
        selectedDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = optionsDiv.style.display === 'block';
            
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-options').forEach(el => {
                el.style.display = 'none';
            });
            
            // Toggle current one
            optionsDiv.style.display = isOpen ? 'none' : 'block';
            
            if (!isOpen) {
                filterInput.focus();
                filterInput.value = '';
                // Reset items to show all
                itemsContainer.innerHTML = getFilterableOptionsForComponent(component, '');
                // Re-attach click events to new option items
                attachOptionClickEvents(dropdown, component, selectedTextSpan);
            }
        });
        
        // Filter functionality
        filterInput.addEventListener('input', (e) => {
            const filterText = e.target.value;
            itemsContainer.innerHTML = getFilterableOptionsForComponent(component, filterText);
            attachOptionClickEvents(dropdown, component, selectedTextSpan);
        });
        
        // Prevent click on search from closing dropdown
        filterInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Initial attachment of click events to options
        attachOptionClickEvents(dropdown, component, selectedTextSpan);
    }

    function attachOptionClickEvents(dropdown, component, selectedTextSpan) {
        const items = dropdown.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const selectedValue = item.dataset.value;
                const selectedDisplay = item.dataset.display;
                
                // Update selected text
                selectedTextSpan.textContent = selectedDisplay;
                
                // Update build selection
                buildSelections[component] = selectedValue;
                
                // Update the item code cell
                const row = dropdown.closest('tr');
                const itemCodeCell = row.querySelector('.item-code-cell');
                itemCodeCell.textContent = selectedValue;
                
                // Update WHS styling
                const inBranch = branchStockData.hasOwnProperty(selectedValue);
                const inWHS = whsStockData.hasOwnProperty(selectedValue);
                if (!inBranch && inWHS) {
                    itemCodeCell.classList.add('whs-item-code');
                } else {
                    itemCodeCell.classList.remove('whs-item-code');
                }
                
                // Re-attach click-to-copy functionality
                setupCopyFunctionality(itemCodeCell, selectedValue);
                
                // Close dropdown
                dropdown.querySelector('.dropdown-options').style.display = 'none';
                
                // Update summary, setup table and save
                updateBuildSummary();
                renderSetupTable();
                saveToLocalStorage();
            });
        });
    }

    function setupCopyFunctionality(cell, text) {
        // Remove old listener by cloning and replacing
        const newCell = cell.cloneNode(true);
        cell.parentNode.replaceChild(newCell, cell);
        
        newCell.style.cursor = 'pointer';
        const originalText = newCell.textContent;
        
        newCell.addEventListener('click', () => {
            navigator.clipboard.writeText(text).then(() => {
                newCell.textContent = 'Copied!';
                setTimeout(() => {
                    newCell.textContent = originalText;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                newCell.textContent = 'Error!';
                setTimeout(() => {
                    newCell.textContent = originalText;
                }, 1500);
            });
        });
    }

    // --- END CUSTOM DROPDOWN FUNCTIONS ---

    function renderCategoryPresetEditors() {
        presetEditorContainer.innerHTML = `
            <div class="preset-header">
                <h2>Manage Presets</h2>
            </div>
        `;
        
        const allPresetNames = Object.keys(PRESET_CONFIG).concat(
            Object.keys(presets).filter(name => !PRESET_CONFIG.hasOwnProperty(name))
        );

        allPresetNames.forEach(presetName => {
            const card = document.createElement('div');
            card.className = 'category-card';
            let innerHTML = '';

            const isStaticPreset = PRESET_CONFIG.hasOwnProperty(presetName);
            const isCustomPreset = presetName === 'CUSTOM';

            innerHTML += '<div class="preset-card-header">';

            if (isStaticPreset) {
                innerHTML += `<h3>${presetName}</h3>`;
            } else {
                innerHTML += `<input type="text" class="preset-title-input" value="${presetName}" data-preset-name="${presetName}" />`;
            }

            if (!isStaticPreset && !isCustomPreset) {
                innerHTML += `<span class="delete-preset-icon" data-preset-name="${presetName}" title="Delete Preset">🗑️</span>`;
            }
            innerHTML += '</div>';

            COMPONENTS.forEach(component => {
                if (!presets[presetName]) {
                    presets[presetName] = {};
                }
                if (!presets[presetName][component]) {
                    presets[presetName][component] = '';
                }

                innerHTML += `
                    <div class="preset-editor-row">
                        <label>${component}</label>
                        <input type="text" value="${presets[presetName][component] || ''}" data-preset-name="${presetName}" data-component="${component}">
                    </div>
                `;
            });
            card.innerHTML = innerHTML;

            if (!isStaticPreset && !isCustomPreset) {
                const titleInput = card.querySelector('.preset-title-input');
                titleInput.addEventListener('change', (e) => {
                    const oldName = e.target.dataset.presetName;
                    const newName = e.target.value.trim();

                    if (!newName) {
                        alert('Preset name cannot be empty.');
                        e.target.value = oldName;
                        return;
                    }
                    if (newName === oldName) return;

                    if (presets.hasOwnProperty(newName) || PRESET_CONFIG.hasOwnProperty(newName)) {
                        alert(`Preset with name "${newName}" already exists or is reserved.`);
                        e.target.value = oldName;
                        return;
                    }
                    
                    presets[newName] = presets[oldName];
                    delete presets[oldName];
                    if (activePreset === oldName) {
                        activePreset = newName;
                    }
                    saveToLocalStorage();
                    updateUI();
                });

                const deleteIcon = card.querySelector('.delete-preset-icon');
                if (deleteIcon) {
                    deleteIcon.addEventListener('click', (e) => {
                        const presetToDelete = e.target.dataset.presetName;
                        if (confirm(`Are you sure you want to delete the preset "${presetToDelete}"?`)) {
                            deletePreset(presetToDelete);
                        }
                    });
                }
            }

            card.querySelectorAll('input[type="text"]:not(.preset-title-input)').forEach(input => {
                input.addEventListener('change', (e) => {
                    const preset = e.target.dataset.presetName;
                    const comp = e.target.dataset.component;
                    presets[preset][comp] = e.target.value;
                    saveToLocalStorage();
                });
            });

            presetEditorContainer.appendChild(card);
        });

        const addPresetCard = document.createElement('div');
        addPresetCard.className = 'category-card add-preset-card';
        addPresetCard.innerHTML = '<h3>ADD PRESET</h3>';
        addPresetCard.addEventListener('click', addPreset);
        presetEditorContainer.appendChild(addPresetCard);
    }

    // --- UI RENDERING ---
    function updateUI() {
        branchFileTextEl.textContent = branchFileInfo.text;
        branchFileDateEl.textContent = branchFileInfo.date;
        whsFileTextEl.textContent = whsFileInfo.text;
        whsFileDateEl.textContent = whsFileInfo.date;
        
        renderBranchStockTable();
        renderWhsStockTable();
        renderBuildTable();
        renderCategoryPools();
        renderCategoryPresetEditors();
        renderPresetSelect();
        renderSetupTable();
        renderPreviewTable();
        updateBuildSummary();
    }
    
    function renderBranchStockTable() {
        const codeFilter = branchItemCodeFilter.value.toUpperCase();
        const descFilter1 = branchDescriptionFilter.value.toUpperCase();
        const descFilter2 = branchDescriptionFilter2.value.toUpperCase();

        branchStockTableBody.innerHTML = '';
        Object.entries(branchStockData)
            .filter(([code, item]) => {
                const itemCode = code.toUpperCase();
                const description = (item.description || '').toUpperCase();
                
                const matchesCode = itemCode.includes(codeFilter);
                const matchesDesc1 = description.includes(descFilter1);
                const matchesDesc2 = description.includes(descFilter2);

                return matchesCode && matchesDesc1 && matchesDesc2;
            })
            .forEach(([code, item]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="item-code-cell">${code}</td>
                    <td class="description-cell"><div>${item.description}</div></td>
                    <td class="qty-cell"><div>${item.qty}</div></td>
                `;
                branchStockTableBody.appendChild(row);

                const itemCodeCell = row.querySelector('.item-code-cell');
                if (itemCodeCell) {
                    setupCopyFunctionality(itemCodeCell, code);
                }

                const descriptionCell = row.querySelector('.description-cell div');
                if (descriptionCell) {
                    setupCopyFunctionality(descriptionCell, item.description);
                }
            });
    }
    
    function renderWhsStockTable() {
        const codeFilter = whsItemCodeFilter.value.toUpperCase();
        const descFilter1 = whsDescriptionFilter.value.toUpperCase();
        const descFilter2 = whsDescriptionFilter2.value.toUpperCase();

        whsStockTableBody.innerHTML = '';
        Object.entries(whsStockData)
            .filter(([code, item]) => {
                const itemCode = code.toUpperCase();
                const description = (item.description || '').toUpperCase();
                
                const matchesCode = itemCode.includes(codeFilter);
                const matchesDesc1 = description.includes(descFilter1);
                const matchesDesc2 = description.includes(descFilter2);

                return matchesCode && matchesDesc1 && matchesDesc2;
            })
            .forEach(([code, item]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="item-code-cell">${code}</td>
                    <td class="description-cell"><div>${item.description}</div></td>
                    <td class="qty-cell"><div>${item.qty}</div></td>
                `;
                whsStockTableBody.appendChild(row);

                const itemCodeCell = row.querySelector('.item-code-cell');
                if (itemCodeCell) {
                    setupCopyFunctionality(itemCodeCell, code);
                }

                const descriptionCell = row.querySelector('.description-cell div');
                if (descriptionCell) {
                    setupCopyFunctionality(descriptionCell, item.description);
                }
            });
    }

    function updateBuildSummary() {
    const summary = COMPONENTS.map(component => {
        const itemCode = buildSelections[component];
        if (itemCode) {
            const item = allItems[itemCode];
            const description = item ? item.description : '';
            return `${component}: ${description}`;
        }
        return null;
    }).filter(Boolean).join('\n');

    summaryTextbox.value = summary;
    }

    // --- LEADS / INQUIRIES FUNCTIONS ---
    async function loadLeads() {
        if (!window.leadDb) return;
        const { db, collection, getDocs, query, orderBy } = window.leadDb;
        try {
            const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            filterLeads();
        } catch (error) {
            console.error('Error loading leads:', error);
        }
    }

    function filterLeads() {
        const search = document.getElementById('lead-search')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('lead-filter-status')?.value || '';
        
        let filtered = leadsData;
        if (search) {
            filtered = filtered.filter(lead => 
                lead.name?.toLowerCase().includes(search) ||
                lead.inquiry?.toLowerCase().includes(search) ||
                lead.items?.toLowerCase().includes(search) ||
                lead.contactNumber?.toLowerCase().includes(search)
            );
        }
        if (statusFilter) {
            filtered = filtered.filter(lead => lead.status === statusFilter);
        }
        renderLeadsTable(filtered);
    }

    function renderLeadsTable(leads) {
        const tbody = document.getElementById('leads-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        leads.forEach(lead => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            const statusClass = getStatusClass(lead.status);
            row.innerHTML = `
                <td>${lead.date || '-'}</td>
                <td>${lead.name || '-'}</td>
                <td>${lead.type || '-'}</td>
                <td>${lead.source || '-'}</td>
                <td>${lead.contactNumber || '-'}</td>
                <td>${lead.inquiry || '-'}</td>
                <td>${lead.priceRange || '-'}</td>
                <td><span class="status-badge ${statusClass}">${lead.status || '-'}</span></td>
                <td>${lead.notes || '-'}</td>
            `;
            row.addEventListener('click', () => openLeadModal(lead));
            tbody.appendChild(row);
        });
    }

    function getStatusClass(status) {
        switch(status) {
            case 'New Lead': return 'status-new';
            case 'Contacted': return 'status-contacted';
            case 'In-Progress': return 'status-progress';
            case 'Closed-Win': return 'status-win';
            case 'Closed-Lose': return 'status-lose';
            default: return '';
        }
    }

    let currentLeadId = null;

    function openLeadModal(lead = null) {
        const modal = document.getElementById('lead-modal');
        const title = document.getElementById('lead-modal-title');
        const deleteBtn = document.getElementById('lead-delete-btn');
        const form = document.getElementById('leadForm');
        
        if (lead) {
            title.textContent = 'Edit Lead';
            currentLeadId = lead.id;
            document.getElementById('lead-id').value = lead.id;
            document.getElementById('lead-date').value = lead.date || '';
            document.getElementById('lead-name').value = lead.name || '';
            document.getElementById('lead-type').value = lead.type || '';
            document.getElementById('lead-source').value = lead.source || '';
            document.getElementById('lead-contact').value = lead.contactNumber || '';
            document.getElementById('lead-email').value = lead.email || '';
            document.getElementById('lead-inquiry').value = lead.inquiry || '';
            document.getElementById('lead-items').value = lead.items || '';
            document.getElementById('lead-price').value = lead.priceRange || '';
            document.getElementById('lead-status').value = lead.status || 'New Lead';
            document.getElementById('lead-notes').value = lead.notes || '';
            deleteBtn.style.display = 'block';
        } else {
            title.textContent = 'Add New Lead';
            currentLeadId = null;
            form.reset();
            document.getElementById('lead-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('lead-type').value = '';
            document.getElementById('lead-source').value = '';
            deleteBtn.style.display = 'none';
        }
        
        modal.classList.add('active');
    }

    function closeLeadModal() {
        const modal = document.getElementById('lead-modal');
        modal.classList.remove('active');
        currentLeadId = null;
    }

    async function deleteLead() {
        if (!currentLeadId || !window.leadDb) return;
        if (!confirm('Are you sure you want to delete this lead?')) return;
        
        const { db, deleteDoc, doc } = window.leadDb;
        try {
            await deleteDoc(doc(db, "leads", currentLeadId));
            closeLeadModal();
            loadLeads();
        } catch (error) {
            console.error('Error deleting lead:', error);
            alert('Error deleting lead');
        }
    }

    function renderCategoryPools() {
        categoryGrid.innerHTML = '';
        COMPONENTS.forEach(component => {
            const card = document.createElement('div');
            card.className = 'category-card';
    
            card.innerHTML = `
                <h3>${component}</h3>
                <div class="category-item-add-section">
                    <input type="text" class="new-item-code-input" placeholder="Add new item code (one per line)">
                    <button class="nav-btn add-item-btn">Add Item</button>
                    <span class="duplicate-warning" style="display: none; color: red; font-size: 0.8em; margin-left: 10px;">Duplicate!</span>
                </div>
                <div class="category-items-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Item Code</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody class="category-items-table-body" data-component="${component}">
                            <!-- Items will be rendered here by renderCategoryItems -->
                        </tbody>
                    </table>
                </div>
            `;
    
            const newItemCodeInput = card.querySelector('.new-item-code-input');
            const addItemBtn = card.querySelector('.add-item-btn');
            const duplicateWarning = card.querySelector('.duplicate-warning');
            const tableBody = card.querySelector('.category-items-table-body');
            
            renderCategoryItems(component, tableBody);
    
            addItemBtn.addEventListener('click', () => {
                const inputText = newItemCodeInput.value.trim();
                if (!inputText) return;

                const itemCodesToAdd = inputText.split('\n').map(code => code.trim().toUpperCase()).filter(Boolean);
                let duplicatesFound = false;
                let itemsAdded = 0;

                itemCodesToAdd.forEach(itemCode => {
                    if (categories[component].includes(itemCode)) {
                        duplicatesFound = true;
                    } else {
                        categories[component].push(itemCode);
                        itemsAdded++;
                    }
                });

                newItemCodeInput.value = '';
                if (duplicatesFound) {
                    duplicateWarning.style.display = 'inline';
                    setTimeout(() => {
                        duplicateWarning.style.display = 'none';
                    }, 2000);
                }
                
                if (itemsAdded > 0 || duplicatesFound) {
                    saveToLocalStorage();
                    updateUI();
                }
            });
    
            tableBody.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-item-btn')) {
                    const itemCodeToDelete = e.target.dataset.itemCode;
                    categories[component] = categories[component].filter(code => code !== itemCodeToDelete);
                    saveToLocalStorage();
                    updateUI();
                }
            });
    
            categoryGrid.appendChild(card);
        });
    }

    function renderCategoryItems(component, tableBody) {
        tableBody.innerHTML = '';
        const itemCodes = categories[component] || [];
        itemCodes.forEach(code => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${code}</td>
                <td><button class="delete-item-btn nav-btn" data-item-code="${code}">Delete</button></td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- SETUP PAGE FUNCTIONS ---
    function renderSetupTable() {
        const setupTableBody = document.getElementById('setup-table-body');
        const multiplierInput = document.getElementById('setup-total-input');
        let multiplier = parseFloat(multiplierInput.value);
        if (!multiplier || multiplier < 1) multiplier = 1;

        setupTableBody.innerHTML = '';

        let sumCost = 0;
        let sumUnbundle = 0;
        let sumBundle = 0;
        let sumQty = 0;
        let sumTotal = 0;

        Object.entries(buildSelections).forEach(([component, itemCode]) => {
            if (!itemCode) return;

            const item = allItems[itemCode];
            const description = item ? item.description : '';

            // Get existing setup values or defaults
            const setupItem = setupData[itemCode] || { cost: '', unbundle: '', bundle: '', qty: '' };

            // Calculate values
            const cost = parseFloat(setupItem.cost) || 0;
            const unbundle = parseFloat(setupItem.unbundle) || 0;
            const bundle = parseFloat(setupItem.bundle) || 0;
            const qty = parseFloat(setupItem.qty) || 0;
            
            const total = cost * qty * multiplier;
            const unbundleTotal = unbundle * qty;
            const bundleTotal = bundle * qty;

            // Accumulate sums
            sumCost += cost * qty;
            sumUnbundle += unbundleTotal;
            sumBundle += bundleTotal;
            sumQty += qty;
            sumTotal += total;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="item-code-cell">${itemCode}</td>
                <td class="description-cell"><div>${description}</div></td>
                <td class="editable" data-item-code="${itemCode}" data-field="cost">
                    <input type="number" step="0.01" min="0" value="${setupItem.cost}" data-field="cost">
                </td>
                <td class="editable" data-item-code="${itemCode}" data-field="unbundle">
                    <input type="number" step="0.01" min="0" value="${setupItem.unbundle}" data-field="unbundle">
                </td>
                <td class="editable" data-item-code="${itemCode}" data-field="bundle">
                    <input type="number" step="0.01" min="0" value="${setupItem.bundle}" data-field="bundle">
                </td>
                <td class="editable" data-item-code="${itemCode}" data-field="qty">
                    <input type="number" step="1" min="0" value="${setupItem.qty}" data-field="qty">
                </td>
                <td>${total.toFixed(2)}</td>
            `;
            setupTableBody.appendChild(row);

            const itemCodeCell = row.querySelector('.item-code-cell');
            if (itemCodeCell) {
                setupCopyFunctionality(itemCodeCell, itemCode);
            }

            const descriptionCell = row.querySelector('.description-cell div');
            if (descriptionCell) {
                setupCopyFunctionality(descriptionCell, description);
            }
        });

        // Add totals row
        const totalsRow = document.createElement('tr');
        totalsRow.className = 'setup-totals-row';
        totalsRow.innerHTML = `
            <td colspan="2"><strong>TOTAL</strong></td>
            <td><strong>${sumCost.toFixed(2)}</strong></td>
            <td><strong>${sumUnbundle.toFixed(2)}</strong></td>
            <td><strong>${sumBundle.toFixed(2)}</strong></td>
            <td><strong>${sumQty}</strong></td>
            <td><strong>${sumTotal.toFixed(2)}</strong></td>
        `;
        setupTableBody.appendChild(totalsRow);

        // Attach input change listeners for table cells
        setupTableBody.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const td = e.target.closest('td');
                const itemCode = td.dataset.itemCode;
                const field = td.dataset.field;
                const value = e.target.value;

                if (!setupData[itemCode]) {
                    setupData[itemCode] = { cost: '', unbundle: '', bundle: '', qty: '' };
                }
                setupData[itemCode][field] = value;
                saveToLocalStorage();
                renderSetupTable();
                renderPreviewTable();
            });
        });
    }

    // Setup multiplier input listener (once)
    setTimeout(() => {
        const multiplierInput = document.getElementById('setup-total-input');
        multiplierInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                multiplierInput.blur();
                renderSetupTable();
            }
        });
    }, 100);

    // --- PREVIEW PAGE FUNCTIONS ---
    function renderPreviewTable() {
        const previewTableHeader = document.getElementById('preview-table-header');
        const previewTableBody = document.getElementById('preview-table-body');
        const previewTotalsRow = document.getElementById('preview-totals-row');

        // Setup header based on bundle mode
        if (isBundleMode) {
            previewTableHeader.innerHTML = `
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>QTY</th>
                <th>PRICE</th>
            `;
        } else {
            previewTableHeader.innerHTML = `
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>QTY</th>
            `;
        }

        previewTableBody.innerHTML = '';

        let sumTotal = 0;
        let sumBundle = 0;
        let sumQty = 0;
        let sumPrice = 0;

        // Get multiplier from setup tab
        const multiplierInput = document.getElementById('setup-total-input');
        let multiplier = parseFloat(multiplierInput.value);
        if (!multiplier || multiplier < 1) multiplier = 1;

        Object.entries(buildSelections).forEach(([component, itemCode]) => {
            if (!itemCode) return;

            const setupItem = setupData[itemCode] || { cost: '', unbundle: '', bundle: '', qty: '' };

            // Skip if no values in setup data
            if (!setupItem.cost && !setupItem.unbundle && !setupItem.bundle && !setupItem.qty) return;

            const item = allItems[itemCode];
            let description = item ? item.description : '';

            const cost = parseFloat(setupItem.cost) || 0;
            const unbundle = parseFloat(setupItem.unbundle) || 0;
            const bundle = parseFloat(setupItem.bundle) || 0;
            const qty = parseFloat(setupItem.qty) || 0;
            
            const total = cost * qty * multiplier;
            sumTotal += total;
            sumBundle += bundle * qty;
            sumQty += qty;

            let price = '';
            if (isBundleMode) {
                // Use unbundle if available, otherwise use total
                if (unbundle > 0) {
                    price = `₱${(unbundle * qty).toFixed(2)}`;
                    sumPrice += unbundle * qty;
                } else {
                    price = `₱${total.toFixed(2)}`;
                    sumPrice += total;
                }
            }

            const row = document.createElement('tr');
            if (isBundleMode) {
                row.innerHTML = `
                    <td>${component}</td>
                    <td>${description}</td>
                    <td>${qty}</td>
                    <td>${price}</td>
                `;
            } else {
                row.innerHTML = `
                    <td>${component}</td>
                    <td>${description}</td>
                    <td>${qty}</td>
                `;
            }
            previewTableBody.appendChild(row);
        });

        // Calculate totals
        const total4 = sumTotal + sumBundle;

        // Render totals row
        if (isBundleMode) {
            previewTotalsRow.innerHTML = `
                <td colspan="3"><strong>BUILD TOTAL</strong></td>
                <td><strong>₱${sumPrice.toFixed(2)}</strong></td>
            `;
        } else {
            previewTotalsRow.innerHTML = `
                <td colspan="2"><strong>BUILD TOTAL</strong></td>
                <td><strong>₱${total4.toFixed(2)}</strong></td>
            `;
        }
    }

    // --- UTILITY FUNCTIONS FOR PRESETS ---
    function generateUniquePresetName() {
        let newName = 'New Preset';
        let counter = 1;
        while (presets.hasOwnProperty(newName) || PRESET_CONFIG.hasOwnProperty(newName)) {
            newName = `New Preset ${counter++}`;
        }
        return newName;
    }

    function addPreset() {
        const newPresetName = generateUniquePresetName();
        presets[newPresetName] = {};
        COMPONENTS.forEach(c => {
            presets[newPresetName][c] = '';
        });
        saveToLocalStorage();
        updateUI();
        alert(`New preset "${newPresetName}" added. Remember to save your changes.`);
    }

    function deletePreset(presetName) {
        if (PRESET_CONFIG.hasOwnProperty(presetName)) {
            alert('Cannot delete a static preset.');
            return;
        }
        if (!presets.hasOwnProperty(presetName)) {
            alert('Preset not found.');
            return;
        }

        if (activePreset === presetName) {
            activePreset = 'CUSTOM';
        }

        delete presets[presetName];
        saveToLocalStorage();
        updateUI();
        alert(`Preset "${presetName}" deleted.`);
    }

    // --- SAVE BUILD MODAL FUNCTIONS ---
    function showSaveBuildModal() {
        presetNameInput.value = '';
        saveBuildModal.classList.add('active');
    }

    function hideSaveBuildModal() {
        saveBuildModal.classList.remove('active');
    }

    function handleSaveBuild() {
        const newPresetTitle = presetNameInput.value.trim();

        if (!newPresetTitle) {
            alert('Preset title cannot be empty.');
            return;
        }

        if (presets.hasOwnProperty(newPresetTitle) || PRESET_CONFIG.hasOwnProperty(newPresetTitle)) {
            alert(`Preset with name "${newPresetTitle}" already exists or is a reserved name.`);
            return;
        }

        saveCurrentBuildAsPreset(newPresetTitle);
        hideSaveBuildModal();
    }

    function saveCurrentBuildAsPreset(title) {
        presets[title] = JSON.parse(JSON.stringify(buildSelections));
        activePreset = title;
        saveToLocalStorage();
        updateUI();
        alert(`Build "${title}" saved as a new preset!`);
    }

    // --- START THE APP ---
    try {
        initialize();
    } catch(e) {
        console.error('Error initializing app:', e);
        alert('Error initializing app: ' + e.message);
    }
});