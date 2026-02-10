document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    const COMPONENTS = [
        "Processor", "Motherboard", "RAM", "Storage", "GPU", "CPU Cooler",
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
    let branchFileInfo = { text: '', date: '' }; // New state for Branch file info
    let whsFileInfo = { text: '', date: '' };    // New state for WHS file info
    let categories = {}; // { "Processor": ["itemCode1", "itemCode2"], ... }
    let presets = {}; // { "Gaming Build": { "Processor": "itemcode1" }, ... }
    let buildSelections = {}; // { "Processor": "itemCode1", ... }
    let activePreset = 'CUSTOM';
    // Removed importDate state variable
    let currentTheme = 'light';

    // --- DOM ELEMENTS ---
    const pages = {
        build: document.getElementById('build-page'),
        category: document.getElementById('category-page'),
        inventory: document.getElementById('inventory-page'),
    };

    const navButtons = {
        build: document.getElementById('build-btn'),
        category: document.getElementById('category-btn'),
        inventory: document.getElementById('inventory-btn'),
    };

    const currentDateTimeEl = document.getElementById('current-datetime'); // New reference for clock
    const buildTableBody = document.getElementById('build-table-body');
    const categoryGrid = document.getElementById('category-grid');
    const summaryTextbox = document.getElementById('summary-textbox');
    const themeToggle = document.getElementById('theme-toggle');
    const exportCatBtn = document.getElementById('export-cat-btn');
    const importCatBtn = document.getElementById('import-cat-btn');
    const categoryFileInput = document.getElementById('category-file-input');
    const importedCatFilenameEl = document.getElementById('imported-cat-filename'); // New DOM reference
    const itemCodeFilter = document.getElementById('item-code-filter');
    const descriptionFilter = document.getElementById('description-filter');
    const presetDropdown = document.getElementById('preset-dropdown'); // Reference to the new <select> element
    const presetEditorContainer = document.getElementById('preset-editor-container');

    // Branch Stock Elements
    const branchImportBtn = document.getElementById('branch-import-btn');
    const branchFileInput = document.getElementById('branch-file-input');
        const branchItemCodeFilter = document.getElementById('branch-item-code-filter');
        const branchDescriptionFilter = document.getElementById('branch-description-filter');
        const branchDescriptionFilter2 = document.getElementById('branch-description-filter2'); // New reference
        const branchStockTableBody = document.getElementById('branch-stock-table-body');
        const branchFileTextEl = document.getElementById('branch-file-text');
        const branchFileDateEl = document.getElementById('branch-file-date');
    
        // WHS Stock Elements
        const whsImportBtn = document.getElementById('whs-import-btn');
        const whsFileInput = document.getElementById('whs-file-input');
        const whsItemCodeFilter = document.getElementById('whs-item-code-filter');
        const whsDescriptionFilter = document.getElementById('whs-description-filter');
        const whsDescriptionFilter2 = document.getElementById('whs-description-filter2'); // New reference
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
            // Setup navigation
            Object.keys(navButtons).forEach(key => {
                navButtons[key].addEventListener('click', () => showPage(key));
            });
    
            // Setup theme toggle
            themeToggle.addEventListener('change', toggleTheme);
    
            // Setup category actions
            exportCatBtn.addEventListener('click', exportCategories);
            importCatBtn.addEventListener('click', () => categoryFileInput.click());
            categoryFileInput.addEventListener('change', handleCategoryImport);
    
            // Setup preset dropdown event listener
            presetDropdown.addEventListener('change', (e) => {
                handlePresetClick(e.target.value);
            });
    
            // Setup Branch Stock actions
            branchImportBtn.addEventListener('click', () => branchFileInput.click());
                    branchFileInput.addEventListener('change', (e) => handleStockFileUpload(e, 'branch'));
                    branchItemCodeFilter.addEventListener('input', () => renderBranchStockTable());
                    branchDescriptionFilter.addEventListener('input', () => renderBranchStockTable());
                    branchDescriptionFilter2.addEventListener('input', () => renderBranchStockTable()); // New listener
            
                    // Setup WHS Stock actions
                    whsImportBtn.addEventListener('click', () => whsFileInput.click());
                    whsFileInput.addEventListener('change', (e) => handleStockFileUpload(e, 'whs'));
                    whsItemCodeFilter.addEventListener('input', () => renderWhsStockTable());
                    whsDescriptionFilter.addEventListener('input', () => renderWhsStockTable());
                    whsDescriptionFilter2.addEventListener('input', () => renderWhsStockTable()); // New listener    
            // Setup Save Build button and modal listeners
            saveBuildBtn.addEventListener('click', showSaveBuildModal);
            modalCancelBtn.addEventListener('click', hideSaveBuildModal);
            modalSaveBtn.addEventListener('click', handleSaveBuild);
            saveBuildModal.addEventListener('click', (e) => { // Close modal if clicking outside content
                if (e.target === saveBuildModal) {
                    hideSaveBuildModal();
                }
            });
    
            // Start real-time clock
            setInterval(updateClock, 1000);
            updateClock(); // Initial call to display time immediately
    
            // Load data from localStorage
            loadFromLocalStorage();
    
            // Apply theme
            applyTheme();
    
            // Render initial state
            renderBuildTable();
            renderCategoryPools(); // Renamed from renderCategoryEditors
            renderPresetSelect(); // Call to the new select renderer
            updateUI();
        }

    // --- THEME ---
    function applyTheme() {
        document.body.setAttribute('data-theme', currentTheme);
        themeToggle.checked = currentTheme === 'dark';
    }

    function toggleTheme() {
        currentTheme = themeToggle.checked ? 'dark' : 'light';
        applyTheme();
        saveToLocalStorage();
    }

    // --- REAL-TIME CLOCK ---
    function updateClock() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        currentDateTimeEl.textContent = now.toLocaleDateString(undefined, options);
    }

    // --- PAGE NAVIGATION ---
    function showPage(pageKey) {
        console.log(`[showPage] Attempting to show: ${pageKey}`);
        // Hide all pages and deactivate all buttons
        Object.values(pages).forEach(page => {
            if (page.classList.contains('active')) {
                page.classList.remove('active');
                console.log(`[showPage] Removed active from: ${page.id}`);
            }
        });
        Object.values(navButtons).forEach(btn => btn.classList.remove('active'));

        // Show the selected page and activate its button
        const targetPage = pages[pageKey];
        if (targetPage) {
            targetPage.classList.add('active');
            console.log(`[showPage] Added active to: ${targetPage.id}`);
        } else {
            console.warn(`[showPage] Target page not found for key: ${pageKey}`);
        }
        
        const targetButton = navButtons[pageKey];
        if (targetButton) {
            targetButton.classList.add('active');
        } else {
            console.warn(`[showPage] Target button not found for key: ${pageKey}`);
        }
    }

    // --- DATA HANDLING & PERSISTENCE ---
    function handleStockFileUpload(event, source) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true }); // Re-added cellDates: true

            console.log(`[handleStockFileUpload] Workbook for source ${source}:`, workbook);
            if (!workbook) {
                alert(`Error: Could not read the Excel file for ${source.toUpperCase()} stock. It might be corrupted or an unsupported format.`);
                return;
            }

            const firstSheetName = workbook.SheetNames[0];
            console.log(`[handleStockFileUpload] First Sheet Name for source ${source}:`, firstSheetName);
            if (!firstSheetName) {
                alert(`Error: The Excel file for ${source.toUpperCase()} stock has no readable sheets.`);
                return;
            }

            const worksheet = workbook.Sheets[firstSheetName];
            console.log(`[handleStockFileUpload] Worksheet for source ${source}:`, worksheet);
            if (!worksheet || Object.keys(worksheet).length === 0) { // Also check if worksheet is empty
                alert(`Error: The Excel file for ${source.toUpperCase()} stock might be corrupted, empty, or in an unsupported .xls format that cannot be parsed. Please try a different .xls file, or re-save your file as .xlsx.`);
                return; // Stop processing if no valid worksheet is found
            }


            // Extract TEXT from A1 (and B1, if merged, will be in A1)
            const textCell = worksheet['A1'];
            const fileText = textCell ? textCell.v : '';

            // Extract DATE from A4 (and B4, if merged, will be in A4)
            const dateCell = worksheet['A4'];
            // Check for date type to ensure correct formatting
            const fileDate = dateCell ? (dateCell.t === 'd' ? new Date(dateCell.v).toLocaleDateString() : dateCell.v) : '';

            // Removed update to global importDate


            // sheet_to_json with header:1 and range:8 means data starts from Excel row 9 (0-indexed range)
            // Header: 1 indicates the first row of the selected range (i.e., row 9) is considered a header row
            // so actual data will be from row 10.
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 8 });

            console.log(`[handleStockFileUpload] Raw sheetData for source ${source}:`, sheetData);

            const newStockData = {};
            sheetData.forEach(row => {
                // Assuming Excel structure:
                // A9: Item Code
                // B9:D9: Description (will be row[1] in sheetData if B9 is the first cell of merged)
                // E9: QTY
                const itemCode = row[0]; // Column A
                // If B9:D9 is merged, row[1] will correctly contain the description.
                // If B9 is not merged and D9 is empty, row[1] is still B9, and row[2],row[3] might be undefined.
                // The prompt says B9:D9 is description, so row[1] should contain the main text.
                const description = row[1];
                const qty = row[4]; // Column E

                if (itemCode) { // Only add if itemCode is present
                    newStockData[itemCode] = {
                        description: description || '',
                        qty: qty || 0,
                    };
                }
            });
            
            console.log(`[handleStockFileUpload] newStockData for source ${source}:`, newStockData);
            
            if (source === 'branch') {
                branchStockData = newStockData;
                branchFileInfo = { text: fileText, date: fileDate };
            } else if (source === 'whs') {
                whsStockData = newStockData;
                whsFileInfo = { text: fileText, date: fileDate };
            }

            updateAllItems(); // Update the merged allItems list
            saveToLocalStorage();
            updateUI();
        };
        reader.readAsArrayBuffer(file);
    }

    function updateAllItems() {
        allItems = { ...branchStockData, ...whsStockData }; // Merge both, WHS will overwrite if item codes are duplicated
    }

    function exportCategories() {
        const dataStr = JSON.stringify({ categories, presets }, null, 2); // Export both categories and presets
        const dataBlob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        const now = new Date();
        const date = now.getFullYear() + '-' + 
                     String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(now.getDate()).padStart(2, '0');
        const time = String(now.getHours()).padStart(2, '0') + '-' + 
                     String(now.getMinutes()).padStart(2, '0') + '-' + 
                     String(now.getSeconds()).padStart(2, '0');
        link.download = `config_${date}_${time}.json`; // Dynamic filename
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function handleCategoryImport(event) {
        const file = event.target.files[0];
        if (!file) {
            importedCatFilenameEl.textContent = ''; // Clear on no file selected
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Basic validation: check if it's an object and contains expected keys
                if (importedData && typeof importedData === 'object' &&
                    importedData.categories && typeof importedData.categories === 'object' &&
                    importedData.presets && typeof importedData.presets === 'object') {

                    categories = importedData.categories;
                    presets = importedData.presets;
                    
                    // Re-initialize categories and presets to ensure all component keys exist
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

                    saveToLocalStorage();
                    updateUI();
                    importedCatFilenameEl.textContent = `Imported: ${file.name}`; // Display filename
                    alert('Configuration imported successfully!');
                } else {
                    alert('Invalid configuration file format. Expected an object with "categories" and "presets" properties.');
                    importedCatFilenameEl.textContent = 'Import failed: Invalid format';
                }
            } catch (error) {
                alert('Error reading or parsing configuration file.');
                console.error(error);
                importedCatFilenameEl.textContent = 'Import failed: Error';
            }
        };
        reader.readAsText(file);
    }

    function saveToLocalStorage() {
        localStorage.setItem('pcBuilderData', JSON.stringify({ allItems, branchStockData, whsStockData, branchFileInfo, whsFileInfo, categories, presets, buildSelections, currentTheme, activePreset }));
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
            // Removed importDate from here
            currentTheme = data.currentTheme || 'light';
            activePreset = data.activePreset || 'CUSTOM';
        }
        // Ensure categories object has all component keys
        COMPONENTS.forEach(c => {
            if (!categories[c]) {
                categories[c] = [];
            }
        });
        // Ensure presets object is fully initialized
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
        updateAllItems(); // Re-merge stock data after loading
    }

    // --- PRESET UI & LOGIC ---
    function handlePresetClick(presetName) {
        activePreset = presetName;

        if (presetName === 'CUSTOM') {
            buildSelections = {};
        } else {
            // Deep copy the preset to buildSelections to avoid accidental mutation
            buildSelections = JSON.parse(JSON.stringify(presets[presetName] || {}));
        }

        saveToLocalStorage();
        updateUI();
    }

    function renderPresetSelect() {
        presetDropdown.innerHTML = ''; // Clear existing options

        const staticPresetNames = Object.keys(PRESET_CONFIG).filter(name => name !== 'CUSTOM');
        const userDefinedPresetNames = Object.keys(presets).filter(name => !PRESET_CONFIG.hasOwnProperty(name));

        // Sort static presets alphabetically (excluding CUSTOM)
        staticPresetNames.sort((a, b) => a.localeCompare(b));
        // Sort user-defined presets alphabetically
        userDefinedPresetNames.sort((a, b) => a.localeCompare(b));

        // Combine them: CUSTOM, then sorted static, then sorted user-defined
        const allPresetNames = ['CUSTOM', ...staticPresetNames, ...userDefinedPresetNames];

        allPresetNames.forEach(presetName => {
            const option = document.createElement('option');
            option.value = presetName;
            option.textContent = presetName;

            // Determine tooltip content
            if (PRESET_CONFIG.hasOwnProperty(presetName)) {
                option.title = PRESET_CONFIG[presetName]; // Static preset tooltip
            } else {
                option.title = `User-defined preset: ${presetName}`; // Generic tooltip for user-defined
            }
            
            if (presetName === activePreset) {
                option.selected = true;
            }
            presetDropdown.appendChild(option);
        });
    }




    function renderCategoryPresetEditors() {
        presetEditorContainer.innerHTML = '<h2>Manage Presets</h2>';
        // Get all preset names, filtering out user-defined ones that might have been deleted but still in PRESET_CONFIG
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

            // Title rendering and editability
            if (isStaticPreset) {
                innerHTML += `<h3>${presetName}</h3>`;
            } else {
                innerHTML += `<input type="text" class="preset-title-input" value="${presetName}" data-preset-name="${presetName}" />`;
            }

            // Delete icon for user-defined, non-custom presets
            if (!isStaticPreset && !isCustomPreset) {
                innerHTML += `<span class="delete-preset-icon" data-preset-name="${presetName}" title="Delete Preset">🗑️</span>`;
            }
            innerHTML += '</div>'; // Close preset-card-header

            // Component inputs
            COMPONENTS.forEach(component => {
                // Ensure the preset object and component key exist
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

            // Event listener for editable title
            if (!isStaticPreset && !isCustomPreset) {
                const titleInput = card.querySelector('.preset-title-input');
                titleInput.addEventListener('change', (e) => {
                    const oldName = e.target.dataset.presetName;
                    const newName = e.target.value.trim();

                    if (!newName) {
                        alert('Preset name cannot be empty.');
                        e.target.value = oldName; // Revert
                        return;
                    }
                    if (newName === oldName) return; // No change

                    if (presets.hasOwnProperty(newName) || PRESET_CONFIG.hasOwnProperty(newName)) {
                        alert(`Preset with name "${newName}" already exists or is reserved.`);
                        e.target.value = oldName; // Revert
                        return;
                    }
                    
                    // Rename preset
                    presets[newName] = presets[oldName];
                    delete presets[oldName];
                    if (activePreset === oldName) {
                        activePreset = newName;
                    }
                    saveToLocalStorage();
                    updateUI();
                });

                // Event listener for delete icon
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

            // Event listener for component inputs
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

        // Add the "ADD PRESET" card
        const addPresetCard = document.createElement('div');
        addPresetCard.className = 'category-card add-preset-card';
        addPresetCard.innerHTML = '<h3>ADD PRESET</h3>';
        addPresetCard.addEventListener('click', addPreset);
        presetEditorContainer.appendChild(addPresetCard);
    }

    // --- UI RENDERING ---
    function updateUI() {
        // Removed importDateEl.textContent = importDate;
        // The global importDate is no longer stored or displayed in the navbar.
        // File dates are now displayed per-section.

        // Update file info for Branch Stock
        branchFileTextEl.textContent = branchFileInfo.text;
        branchFileDateEl.textContent = branchFileInfo.date;

        // Update file info for WHS Stock
        whsFileTextEl.textContent = whsFileInfo.text;
        whsFileDateEl.textContent = whsFileInfo.date;
        
        renderBranchStockTable(); // Call for Branch Stock
        renderWhsStockTable();    // Call for WHS Stock
        renderBuildTable();
        renderCategoryPools(); // Renamed from renderCategoryEditors
        renderCategoryPresetEditors(); // Call to render preset editors in Category tab
        renderPresetSelect(); // Call the new select renderer
        updateBuildSummary();
    }
    
    function renderWhsStockTable() {
        const codeFilter = whsItemCodeFilter.value.toUpperCase();
        const descFilter1 = whsDescriptionFilter.value.toUpperCase();
        const descFilter2 = whsDescriptionFilter2.value.toUpperCase(); // New filter

        whsStockTableBody.innerHTML = '';
        Object.entries(whsStockData)
            .filter(([code, item]) => {
                const itemCode = code.toUpperCase();
                const description = (item.description || '').toUpperCase();
                
                const matchesCode = itemCode.includes(codeFilter);
                const matchesDesc1 = description.includes(descFilter1);
                const matchesDesc2 = description.includes(descFilter2); // New filter match

                return matchesCode && matchesDesc1 && matchesDesc2; // Must match all three
            })
            .forEach(([code, item]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="item-code-cell">${code}</td>
                    <td class="description-cell"><div>${item.description}</div></td>
                    <td class="qty-cell"><div>${item.qty}</div></td>
                `;
                whsStockTableBody.appendChild(row);

                // Add click-to-copy functionality
                const itemCodeCell = row.querySelector('.item-code-cell');
                if (itemCodeCell) {
                    itemCodeCell.style.cursor = 'pointer';
                    const originalText = itemCodeCell.textContent;
                    itemCodeCell.addEventListener('click', () => {
                        navigator.clipboard.writeText(code).then(() => {
                            itemCodeCell.textContent = 'Copied!';
                            setTimeout(() => {
                                itemCodeCell.textContent = originalText;
                            }, 1500);
                        }).catch(err => {
                            console.error('Failed to copy text: ', err);
                            itemCodeCell.textContent = 'Error!';
                            setTimeout(() => {
                                itemCodeCell.textContent = originalText;
                            }, 1500);
                        });
                    });
                }
            });
    }
    
    function renderBuildTable() {
        buildTableBody.innerHTML = '';
        COMPONENTS.forEach(component => {
            const row = document.createElement('tr');
            
            const selectedItemCode = buildSelections[component] || '';
    
            row.innerHTML = `
                <td>${component}</td>
                <td>
                    <select data-component="${component}">
                        <option value="">-- Select --</option>
                        ${getOptionsForComponent(component)}
                    </select>
                </td>
                <td class="item-code-cell">${selectedItemCode}</td>
            `;
            
            const select = row.querySelector('select');
            select.value = selectedItemCode;
            
            select.addEventListener('change', (e) => {
                const newSelectedItemCode = e.target.value;
                buildSelections[component] = newSelectedItemCode;
                // Re-render the whole table to update the item code and copy icon
                renderBuildTable();
                updateBuildSummary();
                saveToLocalStorage();
            });
            
            const itemCodeCell = row.querySelector('.item-code-cell');
            if (itemCodeCell && selectedItemCode) { // Only add listener if there's an actual item code
                // Determine if this item is exclusively WHS stock for styling
                const inBranch = branchStockData.hasOwnProperty(selectedItemCode);
                const inWHS = whsStockData.hasOwnProperty(selectedItemCode);
                if (!inBranch && inWHS) {
                    itemCodeCell.classList.add('whs-item-code');
                }

                itemCodeCell.style.cursor = 'pointer'; // Indicate it's clickable
                let originalText = itemCodeCell.textContent; // Store original text for feedback

                const copyToClipboard = () => {
                    navigator.clipboard.writeText(selectedItemCode).then(() => {
                        itemCodeCell.textContent = 'Copied!';
                        setTimeout(() => {
                           itemCodeCell.textContent = originalText;
                        }, 1500);
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                        itemCodeCell.textContent = 'Error!';
                        setTimeout(() => {
                            itemCodeCell.textContent = originalText;
                        }, 1500);
                    });
                };
                itemCodeCell.addEventListener('click', copyToClipboard);
            }
    
            buildTableBody.appendChild(row);
        });
    }

    function getOptionsForComponent(component) {
        const itemCodes = categories[component] || [];
        return itemCodes
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
                    if (!item) return '';
                    prefix = '[N/A] ';
                }

                if (item) {
                    return `<option value="${code}">${prefix}${item.description}</option>`;
                }
                return ''; // Should be caught by the !item check above, but for safety.
            })
            .join('');
    }

    function updateBuildSummary() {
        const summary = COMPONENTS.map(component => {
            const itemCode = buildSelections[component];
            if (itemCode) {
                const item = allItems[itemCode];
                return `${component}: ${item ? item.description : ''}`;
            }
            return null;
        }).filter(Boolean).join('\n');
    
        summaryTextbox.value = summary;
    }

    function renderCategoryPools() {
        categoryGrid.innerHTML = '';
        COMPONENTS.forEach(component => {
            const card = document.createElement('div');
            card.className = 'category-card';
    
            card.innerHTML = `
                <h3>${component}</h3>
                <div class="category-item-add-section">
                    <input type="text" class="new-item-code-input" placeholder="Add new item code">
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
            
            // Render existing items
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

                newItemCodeInput.value = ''; // Clear input
                if (duplicatesFound) {
                    duplicateWarning.style.display = 'inline';
                    setTimeout(() => {
                        duplicateWarning.style.display = 'none';
                    }, 2000);
                }
                
                if (itemsAdded > 0 || duplicatesFound) { // Only update UI if something changed or duplicates were attempted
                    saveToLocalStorage();
                    updateUI(); // Re-render to show changes
                }
            });
    
            // Event delegation for delete buttons
            tableBody.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-item-btn')) {
                    const itemCodeToDelete = e.target.dataset.itemCode;
                    categories[component] = categories[component].filter(code => code !== itemCodeToDelete);
                    saveToLocalStorage();
                    updateUI(); // Re-render to show changes
                }
            });
    
            categoryGrid.appendChild(card);
        });
    }

    function renderCategoryItems(component, tableBody) {
        tableBody.innerHTML = ''; // Clear existing
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



        function renderBranchStockTable() {
            const codeFilter = branchItemCodeFilter.value.toUpperCase();
            const descFilter1 = branchDescriptionFilter.value.toUpperCase();
            const descFilter2 = branchDescriptionFilter2.value.toUpperCase(); // New filter
    
            branchStockTableBody.innerHTML = '';
            Object.entries(branchStockData)
                .filter(([code, item]) => {
                    const itemCode = code.toUpperCase();
                    const description = (item.description || '').toUpperCase();
                    
                    const matchesCode = itemCode.includes(codeFilter);
                    const matchesDesc1 = description.includes(descFilter1);
                    const matchesDesc2 = description.includes(descFilter2); // New filter match
    
                    console.log(`[Branch Filter] Item: ${item.description}, F1: "${descFilter1}" (${matchesDesc1}), F2: "${descFilter2}" (${matchesDesc2}), Final: ${matchesCode && matchesDesc1 && matchesDesc2}`);
    
                    return matchesCode && matchesDesc1 && matchesDesc2; // Must match all three
                })
                            .forEach(([code, item]) => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td class="item-code-cell">${code}</td>
                                    <td class="description-cell"><div>${item.description}</div></td>
                                    <td class="qty-cell"><div>${item.qty}</div></td>
                                `;
                                branchStockTableBody.appendChild(row);
                
                                // Add click-to-copy functionality
                                const itemCodeCell = row.querySelector('.item-code-cell');
                                if (itemCodeCell) {
                                    itemCodeCell.style.cursor = 'pointer';
                                    const originalText = itemCodeCell.textContent;
                                    itemCodeCell.addEventListener('click', () => {
                                        navigator.clipboard.writeText(code).then(() => {
                                            itemCodeCell.textContent = 'Copied!';
                                            setTimeout(() => {
                                                itemCodeCell.textContent = originalText;
                                            }, 1500);
                                        }).catch(err => {
                                            console.error('Failed to copy text: ', err);
                                            itemCodeCell.textContent = 'Error!';
                                            setTimeout(() => {
                                                itemCodeCell.textContent = originalText;
                                            }, 1500);
                                        });
                                    });
                                }
                            });        }
    
        function renderWhsStockTable() {
            const codeFilter = whsItemCodeFilter.value.toUpperCase();
            const descFilter1 = whsDescriptionFilter.value.toUpperCase();
            const descFilter2 = whsDescriptionFilter2.value.toUpperCase(); // New filter

            console.log("[renderWhsStockTable] Called.");
            console.log("[renderWhsStockTable] whsStockTableBody:", whsStockTableBody);
            console.log("[renderWhsStockTable] whsStockData:", whsStockData);

            whsStockTableBody.innerHTML = '';
            Object.entries(whsStockData)
                .filter(([code, item]) => {
                    const itemCode = code.toUpperCase();
                    const description = (item.description || '').toUpperCase();
                    
                    const matchesCode = itemCode.includes(codeFilter);
                    const matchesDesc1 = description.includes(descFilter1);
                    const matchesDesc2 = description.includes(descFilter2); // New filter match
    
                    console.log(`[WHS Filter] Item: ${item.description}, F1: "${descFilter1}" (${matchesDesc1}), F2: "${descFilter2}" (${matchesDesc2}), Final: ${matchesCode && matchesDesc1 && matchesDesc2}`);
    
                    return matchesCode && matchesDesc1 && matchesDesc2; // Must match all three
                })
                .forEach(([code, item]) => {
                    console.log(`[renderWhsStockTable] Rendering item code: ${code}`);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="item-code-cell">${code}</td>
                        <td class="description-cell"><div>${item.description}</div></td>
                        <td class="qty-cell"><div>${item.qty}</div></td>
                    `;
                    whsStockTableBody.appendChild(row);

                    // Add click-to-copy functionality
                    const itemCodeCell = row.querySelector('.item-code-cell');
                    console.log(`[renderWhsStockTable] itemCodeCell for ${code}:`, itemCodeCell);
                    if (itemCodeCell) {
                        itemCodeCell.style.cursor = 'pointer';
                        const originalText = itemCodeCell.textContent;
                        itemCodeCell.addEventListener('click', () => {
                            navigator.clipboard.writeText(code).then(() => {
                                itemCodeCell.textContent = 'Copied!';
                                setTimeout(() => {
                                    itemCodeCell.textContent = originalText;
                                }, 1500);
                            }).catch(err => {
                                console.error('Failed to copy text: ', err);
                                itemCodeCell.textContent = 'Error!';
                                setTimeout(() => {
                                    itemCodeCell.textContent = originalText;
                                }, 1500);
                            });
                        });
                    }
                });
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
            presets[newPresetName][c] = ''; // Initialize with empty values
        });
        saveToLocalStorage();
        updateUI(); // Re-render to show the new preset card
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
            activePreset = 'CUSTOM'; // Switch to custom if deleted preset was active
        }

        delete presets[presetName];
        saveToLocalStorage();
        updateUI();
        alert(`Preset "${presetName}" deleted.`);
    }

    // --- SAVE BUILD MODAL FUNCTIONS ---
    function showSaveBuildModal() {
        presetNameInput.value = ''; // Clear previous input
        saveBuildModal.style.display = 'flex'; // Show modal
    }

    function hideSaveBuildModal() {
        saveBuildModal.style.display = 'none'; // Hide modal
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
        // Create a deep copy of current buildSelections
        presets[title] = JSON.parse(JSON.stringify(buildSelections));
        activePreset = title; // Make the newly saved preset active

        saveToLocalStorage();
        updateUI(); // Re-render to show the new preset in dropdown and category tab
        alert(`Build "${title}" saved as a new preset!`);
    }

    // --- START THE APP ---
    initialize();
});
