
    // Optimizer Core Logic v1.5.0
    document.addEventListener('DOMContentLoaded', () => {
        // Remove Splash Screen
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
            setTimeout(() => {
                splashScreen.style.opacity = '0';
                setTimeout(() => splashScreen.remove(), 300);
            }, 50); // Slight delay ensures paint
        }

        // --- SCRIPT INITIALIZATION ---
        const APP_VERSION = 'v1.5.1';
        document.getElementById('version-text').textContent = APP_VERSION;
        document.title = 'Optimizer';
        
        // Dynamic Tabindexes for Keyboard Navigation
        document.querySelectorAll('.trigger-link').forEach(el => el.setAttribute('tabindex', '0'));
        document.querySelectorAll('.rt-btn').forEach(el => el.setAttribute('tabindex', '-1'));

        // --- SCANNER POPOVER LOGIC ---
        const scannerBtn = document.getElementById('scanner-btn');
        const scannerPopover = document.getElementById('scanner-popover');
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (scannerBtn) {
            if (isMobileDevice) {
                scannerBtn.href = 'https://spamfan.github.io/iris';
                scannerBtn.target = '_blank';
            } else {
                scannerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scannerPopover.classList.toggle('show');
                });
                
                // Prevent clicks inside popover from bubbling up to the document listener
                scannerPopover.addEventListener('click', (e) => e.stopPropagation());
                
                // Close when clicking anywhere outside
                document.addEventListener('click', () => {
                    if (scannerPopover.classList.contains('show')) {
                        scannerPopover.classList.remove('show');
                    }
                });
            }
        }

        // --- GLOBAL STATE ---
        let appState = { 
            att: { consolidatedList: [], emphasis: new Map(), fileDate: '', storeNumber: '', autoHidden: [] }, 
            vzw: { consolidatedList: [], emphasis: new Map(), fileDate: '', storeNumber: '', autoHidden: [] }, 
            tmo: { consolidatedList: [], emphasis: new Map(), fileDate: '', storeNumber: '', autoHidden: [] } 
        };
        let devModalCloseable = { button: true, backdrop: true };
        let hasWatches = false; 
        let isEdlpIndexMode = false; // EDLP Index Mode Flag

        // --- TRANSLATION DICTIONARY (Stubbed for English Fallback) ---
        let currentLang = 'en';
        const TRANSLATIONS = { en: { ui: {}, pdf: {} } };

        // Populate English Defaults Before Any Swap
        TRANSLATIONS.en.ui = {
            loginWarningTitle: "PROPRIETARY CONTENT", loginWarningBody: "Unauthorized access and/or sharing is forbidden. To gain access, agree to these terms by inputting the passcode or pin given to you by the device administrator.", enterPinPlaceholder: "Enter PIN", enterBtn: "Enter", incorrectPin: "Incorrect PIN",
            devBoxHeader: "Developer options",
            uploadFiles: "Click here to upload files", processing: "Processing...", outdated: "Some file(s) could be outdated.", customizeBtn: "Customize Entries", printBtn: "   Print   ", printoutSettings: "Printout settings ▼", printoutSettingsUp: "Printout settings ▲", isolateApple: "Isolate Apple Devices", showEdlps: "Show likely EDLPs", showWearables: "Show wearables", showWearablesNA: "Show wearables (not applicable)", showDevOptions: "Show developer options", howToUse: "How To Use / FAQ", troubleshooting: "Troubleshooting / help", highlightTitle: "Highlight Inventory", highlightSub: "(Highlight partial/full)", doneBtn: "Done", devModeTitle: "Dev Mode", devModeP1: "<strong>developer mode activated lol</strong>", devModeP2: "(this doesn't do anything)", showPdfInputs: "Show PDF Inputs", showEdlpFetches: "Show EDLP Fetches", copyLog: "Copy Log", forceRefetch: "Force Refetch Data", clearCache: "Clear Optimizer Cache", cloudFiles: "Cloud files", edlpIndexBtn: "EDLPs Index",
            tutorialHtml: document.getElementById('main-steps').innerHTML,
            troubleHtml: document.getElementById('trouble-steps') ? document.getElementById('trouble-steps').innerHTML : ''
        };
        TRANSLATIONS.en.pdf = { inventoryReport: "Inventory Report", madeWith: " - Made with Optimizer.", sources: "Sources: ", na: "N/A", edlpsVerifiedOn: "EDLPs ver'd on: ", appleDevices: "Apple Devices", likelyEdlps: "Likely EDLPs", likely: "Likely", item: "ITEM", qty: "QTY", attVzwTmo: "ATT, VZW, TMO (dp + /mo)", edlpsDpMo: "EDLPs (dp + /mo)", edlps: "EDLPs", noInventory: "No inventory found.", unlockedPhones: "Unlocked phones: ", manualHidden: "Manually hidden devices: ", noneHidden: "No phones were hidden for this report.", and: " and ", commaAnd: ", and ", edlpIndexReport: "likely EDLP price index" };

        // Standard SVG
        const HIDE_ICON_SVG = `<svg class="hide-icon inline-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/><line x1="2" y1="2" x2="22" y2="22" stroke="#606770" stroke-width="2"/></svg>`;
        const SHOW_ICON_SVG = `<svg class="hide-icon inline-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
        const MORE_OPTIONS_SVG = `<svg class="inline-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#606770"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
        
        // --- GLOBAL LOGGING HELPER (V38) ---
        const debugLog = (msg, type = 'sys') => {
            const consoleOut = document.getElementById('dev-console-output');
            if (!consoleOut) return;
            const div = document.createElement('div');
            div.className = `log-entry log-${type}`;
            const ts = new Date().toLocaleTimeString();
            div.textContent = `[${ts}] ${msg}`;
            consoleOut.appendChild(div);
        };

        let STORE_NICKNAMES = {};

        // --- EDLP DATA & ABBREVIATIONS ---
        let DEVICE_ABBREVIATIONS = {};

        let COLOR_ABBREVIATIONS = {};

        let HIDDEN_CLEANUP = {};

      // Offline Backup Data (v1.4.5 Dynamic)
        let EDLP_DATA = { att: {}, vzw: {}, tmo: {} };

        // --- LIVE FETCH LOGIC & PARSER ---
        const processEdlpData = (data, source, log, statusIcon) => {
            if (data && data.devices) {
                const deviceCount = Object.keys(data.devices).length;
                log(`📦 DATA RECEIVED (${source}): ${deviceCount} devices found.`, 'edlp');

                // Update dynamic dictionaries from cloud
                STORE_NICKNAMES = data.store_nicknames || {};
                COLOR_ABBREVIATIONS = data.color_abbreviations || {};
                HIDDEN_CLEANUP = data.hidden_cleanup || {};
                DEVICE_ABBREVIATIONS = {}; // Reset before repopulating

                const newEdlp = { att: {}, vzw: {}, tmo: {} };
                Object.keys(data.devices).forEach(key => {
                    const device = data.devices[key];
                    const name = device.name;
                    
                    if (name && device.abbr) {
                        DEVICE_ABBREVIATIONS[name] = device.abbr;
                    }

                    if (!device.is_ghost) {
                        if (device.att) newEdlp.att[name] = device.att;
                        if (device.vzw) newEdlp.vzw[name] = device.vzw;
                        if (device.tmo) {
                            newEdlp.tmo[name] = device.tmo;
                            if (device.tmo.monthly !== undefined) {
                                newEdlp.tmo[name].mo = device.tmo.monthly;
                            }
                        }
                    }
                });

                EDLP_DATA = newEdlp;
                if (source === 'live') {
                    statusIcon.textContent = "☁️";
                    statusIcon.title = "Live Data Active (Cloud)";
                } else if (source === 'backup') {
                    statusIcon.textContent = "💾";
                    statusIcon.title = "Local Backup Active";
                }
                log(`✅ ${source.toUpperCase()} DATA APPLIED.`, 'edlp');
            }
        };

        const fetchLivePricing = () => {
            const statusIcon = document.getElementById('status-icon');
            const consoleOut = document.getElementById('dev-console-output');
            
            const log = (msg, type = 'sys') => {
                const div = document.createElement('div');
                div.className = `log-entry log-${type}`;
                const ts = new Date().toLocaleTimeString();
                div.textContent = `[${ts}] ${msg}`;
                consoleOut.appendChild(div);
            };

            const url = 'https://cdn.jsdelivr.net/gh/spamfan/optimizer@main/edlp_data.json?t=' + Date.now();
            log(`🔄 FETCH START: ${url}`, 'edlp');

            fetch(url)
                .then(res => {
                    log(`📡 RESPONSE: Status ${res.status}`, 'edlp');
                    if (!res.ok) throw new Error("Fetch failed");
                    return res.json();
                })
                .then(data => {
                    processEdlpData(data, 'live', log, statusIcon);
                })
                .catch(err => {
                    log(`❌ ERROR: ${err.message}`, 'edlp');
                    const localBackup = localStorage.getItem('edlpLocalBackup');
                    if (localBackup) {
                        try {
                            const parsedData = JSON.parse(localBackup);
                            log(`🔄 Attempting to load local backup...`, 'edlp');
                            processEdlpData(parsedData, 'backup', log, statusIcon);
                        } catch (e) {
                            log(`❌ BACKUP ERROR: Invalid JSON in local storage.`, 'edlp');
                            statusIcon.textContent = "❌";
                            statusIcon.title = "Offline / No Data";
                        }
                    } else {
                        statusIcon.textContent = "❌";
                        statusIcon.title = "Offline / No Data";
                    }
                });
        };

        // --- BUTTON LISTENERS ---
        // v42: Added confirmation logic
        document.getElementById('btn-force-fetch').addEventListener('click', () => {
            if(confirm("Press OK to force refetch data.")) {
                fetchLivePricing();
            }
        });

        // Segmented Control Mode Switcher
        const btnModeIndex = document.getElementById('btn-mode-index');
        const btnModeInstore = document.getElementById('btn-mode-instore');

        const activateIndexMode = () => {
            isEdlpIndexMode = true;
            btnModeIndex.classList.add('active');
            btnModeInstore.classList.remove('active');
            
            hasWatches = false;
            ['att', 'vzw', 'tmo'].forEach(carrier => {
                appState[carrier].fileDate = '';
                appState[carrier].storeNumber = '';
                appState[carrier].autoHidden = [];
                
                const dummyList = [];
                if (EDLP_DATA[carrier]) {
                    Object.keys(EDLP_DATA[carrier]).forEach(device => {
                        const priceObj = EDLP_DATA[carrier][device];
                        if ((priceObj.total && priceObj.total > 0) || (priceObj.monthly && priceObj.monthly > 0) || (priceObj.dp !== undefined && priceObj.dp > 0)) {
                            dummyList.push([device, "", 1]);
                        }
                    });
                }
                appState[carrier].consolidatedList = consolidateInventory(dummyList);
                
                const statusSection = document.getElementById(`${carrier}-status`);
                statusSection.querySelector('.status-filename').textContent = "EDLP Index Mode Active";
                statusSection.querySelector('.status-filename').style.color = "";

                const fileHasWatches = dummyList.some(item => item[0].startsWith('AW ') || item[0].toLowerCase().includes('apple watch'));
                if (fileHasWatches) hasWatches = true;
            });

            const emptyCloudMsg = document.getElementById('empty-cloud-message');
            if (emptyCloudMsg) emptyCloudMsg.style.visibility = 'hidden';

            const wearablesToggle = document.getElementById('show-wearables-toggle');
            const wearablesLabel = document.getElementById('wearables-label');
            if (hasWatches) {
                wearablesToggle.disabled = false;
                wearablesLabel.textContent = TRANSLATIONS[currentLang].ui.showWearables || 'Show wearables';
                wearablesToggle.parentElement.classList.remove('disabled');
                const savedSettings = JSON.parse(localStorage.getItem('betterInvSettings') || '{}');
                wearablesToggle.checked = (savedSettings.showWearables !== undefined) ? savedSettings.showWearables : true;
            } else {
                wearablesToggle.checked = true;
                wearablesToggle.disabled = true;
                wearablesLabel.textContent = TRANSLATIONS[currentLang].ui.showWearablesNA || 'Show wearables (not applicable)';
                wearablesToggle.parentElement.classList.add('disabled');
            }

            const warningEl = document.getElementById('global-outdated-warning');
            if (warningEl) warningEl.style.display = 'none';
            debugLog("Activated EDLP Index Mode", "sys");
        };

        const activateInstoreMode = () => {
            isEdlpIndexMode = false;
            btnModeInstore.classList.add('active');
            btnModeIndex.classList.remove('active');
            
            const lastStore = localStorage.getItem('lastStore');
            loadCloudStore(lastStore);
            if (!lastStore || !window.cloudInventoryData) {
                debugLog("No store or cloud data available for In-store mode.", "sys");
            }
        };

        document.getElementById('mode-segmented-control').addEventListener('click', (e) => {
            if (isEdlpIndexMode) activateInstoreMode();
            else activateIndexMode();
        });
        
        document.getElementById('mode-segmented-control').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (isEdlpIndexMode) activateInstoreMode();
                else activateIndexMode();
            }
        });

        // v33: Console Filters Logic (Fixed)
        const consoleOut = document.getElementById('dev-console-output');
        document.getElementById('cb-log-pdf').addEventListener('change', (e) => {
             e.target.checked ? consoleOut.classList.remove('hide-pdf') : consoleOut.classList.add('hide-pdf');
        });
        document.getElementById('cb-log-edlp').addEventListener('change', (e) => {
             e.target.checked ? consoleOut.classList.remove('hide-edlp') : consoleOut.classList.add('hide-edlp');
        });

        // v36.1: Reset Cache Button
        document.getElementById('btn-reset-settings').addEventListener('click', () => {
            if (confirm("Click OK to reset local preferences. This will wipe saved highlights/hidden items.")) {
                localStorage.removeItem('betterInvSettings');
                window.location.reload();
            }
        });

        // v47: Toggle Listeners
        const isolateIphonesCheckbox = document.getElementById('isolate-iphones');
        const showEdlpsToggle = document.getElementById('show-edlps-toggle');
        const showWearablesToggle = document.getElementById('show-wearables-toggle');
        const commentsSection = document.getElementById('comments-section');

        [isolateIphonesCheckbox, showEdlpsToggle, showWearablesToggle].forEach(el => {
            el.addEventListener('change', () => {
                saveSettings();
            });
        });

        // v1.2.3: Dev Console Toggle Logic (Inline Box)
        const devConsoleToggle = document.getElementById('dev-console-toggle');
        const devConsoleContainer = document.getElementById('dev-console-container');
        devConsoleToggle.addEventListener('change', () => { 
            const isChecked = devConsoleToggle.checked;
            devConsoleContainer.style.display = isChecked ? 'block' : 'none';
        });

        // --- LOCALSTORAGE FUNCTIONS ---
        const saveSettings = () => {
            try {
                // V38 Logging
                debugLog("--- SAVE TRIGGERED ---", "sys");
                
                const cleanEmphasis = (emphasisMap) => {
                    const cleanEntries = Array.from(emphasisMap.entries()).map(([key, value]) => {
                        // v52: Safety check for null value
                        if (!value) return [key, { partial: false, full: false, hidden: false }];
                        const { partial, full, hidden } = value; 
                        return [key, { partial: !!partial, full: !!full, hidden: !!hidden }]; // v36: Persistence Fix
                    });
                    return new Map(cleanEntries);
                };

                const settings = {
                    isolate: isolateIphonesCheckbox.checked,
                    showEdlps: showEdlpsToggle.checked, // v35 Sticky Toggle
                    // v48: Save wearables preference even if disabled (unless locked by logic, but we trust user pref here)
                    showWearables: showWearablesToggle.disabled ? (localStorage.getItem('betterInvSettings') ? JSON.parse(localStorage.getItem('betterInvSettings')).showWearables : true) : showWearablesToggle.checked,
                    emphasis: {
                        att: Array.from(cleanEmphasis(appState.att.emphasis).entries()),
                        vzw: Array.from(cleanEmphasis(appState.vzw.emphasis).entries()),
                        tmo: Array.from(cleanEmphasis(appState.tmo.emphasis).entries())
                    }
                };
                localStorage.setItem('betterInvSettings', JSON.stringify(settings));
                
                // v48: Persistence Debug Log
                let totalHidden = 0;
                ['att', 'vzw', 'tmo'].forEach(c => {
                    let count = 0;
                    appState[c].emphasis.forEach(v => { 
                        // v52: Safety check
                        if(v && v.hidden) count++; 
                    });
                    totalHidden += count;
                });
                debugLog(`SAVE COMPLETE. Total Hidden Items: ${totalHidden}`, "sys");

            } catch (error) { console.error("Could not save settings:", error); }
        };

        const loadSettings = () => {
            try {
                debugLog("--- LOAD SETTINGS START ---", "sys");
                const savedSettings = localStorage.getItem('betterInvSettings');
                
                // V38 Logging
                if (savedSettings) {
                    // v52: Removed substring limit for better debugging
                    debugLog(`RAW STORAGE FOUND: ${savedSettings}`, "sys");
                } else {
                    debugLog("RAW STORAGE: null/empty", "sys");
                }

                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    isolateIphonesCheckbox.checked = settings.isolate !== undefined ? settings.isolate : true;
                    
                    // v35 Sticky Toggle
                    if (settings.showEdlps !== undefined) {
                        showEdlpsToggle.checked = settings.showEdlps;
                    } else {
                        showEdlpsToggle.checked = true;
                    }

                    // v48: Wearables state is loaded but UI is locked until file drop
                    // We store the preference in a temp variable if needed, or just let the toggle sit.
                    // The toggle is forced disabled/checked on load by HTML default.

                    appState.att.emphasis = new Map(settings.emphasis.att || []);
                    appState.vzw.emphasis = new Map(settings.emphasis.vzw || []);
                    appState.tmo.emphasis = new Map(settings.emphasis.tmo || []);
                    
                    // V38: Log Hidden Counts
                    ['att', 'vzw', 'tmo'].forEach(c => {
                        let hiddenCount = 0;
                        appState[c].emphasis.forEach((val, key) => {
                            // v51: Log exact keys to check for mismatch
                            // debugLog(`LOAD KEY [${c}]: '${key}' -> Hidden: ${val.hidden}`, "sys");
                            // v52: Safety check for null value
                            if (val && val.hidden) {
                                debugLog(`LOAD HIDDEN [${c}]: '${key}'`, "sys");
                                hiddenCount++;
                            }
                        });
                        debugLog(`[${c}] Loaded: ${appState[c].emphasis.size} settings, ${hiddenCount} hidden.`, "sys");
                    });
                }
            } catch (error) { console.error("Could not load settings, using defaults:", error); }
        };

        // --- STATIC UI ELEMENT SELECTORS ---
        const versionText = document.getElementById('version-text');
        const highlightBtn = document.getElementById('highlight-btn');
        const processBtn = document.getElementById('process-btn');
        const commentsInput = document.getElementById('comments');
        const konamiMessage = document.getElementById('konami-message');
        const copyLogBtn = document.getElementById('copy-log-btn');

        // --- DYNAMIC HTML INJECTION ---
        document.getElementById('emphasis-modal').innerHTML = `<div class="modal-content"><div class="modal-header"><h2 id="emphasis-modal-title" data-i18n="highlightTitle">Highlight Inventory</h2><span class="close-btn" id="emphasis-close-btn">&times;</span></div><div class="modal-body"><div class="emphasis-header"><div class="emphasis-header-unhide" id="unhide-all-btn" title="Unhide All" tabindex="0">${SHOW_ICON_SVG}</div><div class="emphasis-header-hide"></div><div class="emphasis-header-partial"><input type="checkbox" id="master-partial-checkbox" title="Select/Deselect All Partial"></div><div class="emphasis-header-full"><input type="checkbox" id="master-full-checkbox" title="Select/Deselect All Full"></div><div class="emphasis-header-text" data-i18n="highlightSub">(Highlight partial/full)</div></div><div id="emphasis-list-container"></div></div><div class="modal-footer"><button id="emphasis-done-btn" data-i18n="doneBtn">Done</button></div></div>`;
        document.getElementById('dev-mode-modal').innerHTML = `<div class="modal-content"><div class="modal-header"><h2 data-i18n="devModeTitle">Dev Mode</h2><span class="close-btn" id="dev-mode-close-btn">&times;</span></div><div class="modal-body"><div id="dev-mode-text"><p data-i18n-html="devModeP1"><strong>developer mode activated lol</strong></p><p data-i18n="devModeP2">(this doesn't do anything)</p></div></div></div>`;
        
        // --- DYNAMIC UI ELEMENT SELECTORS ---
        const emphasisModal = document.getElementById('emphasis-modal');
        const devModeModal = document.getElementById('dev-mode-modal');
        const backupModal = document.getElementById('backup-modal');
        const emphasisCloseBtn = document.getElementById('emphasis-close-btn');
        const emphasisDoneBtn = document.getElementById('emphasis-done-btn');
        const devModeCloseBtn = document.getElementById('dev-mode-close-btn');
        const backupCloseBtn = document.getElementById('backup-close-btn');
        const unhideAllBtn = document.getElementById('unhide-all-btn');
        const btnOpenBackupModal = document.getElementById('btn-open-backup-modal');
        const btnSaveBackup = document.getElementById('btn-save-backup');
        const edlpBackupInput = document.getElementById('edlp-backup-input');
        const backupStatusMsg = document.getElementById('backup-status-msg');

        // --- CORE LOGIC & HELPER FUNCTIONS ---
        const parseInventoryText = (text) => { 
            if (!text) return { preFilterList: [], postFilterList: [] }; 
            const dataStartIndex = text.indexOf('Quantity'); 
            if (dataStartIndex === -1) return { preFilterList: [], postFilterList: [] }; 
            const dataText = text.substring(dataStartIndex + 'Quantity'.length); 
            
            // v45: Updated Regex to allow N/A capacity and slash in color
            // v46: Updated Regex to allow 'mm' for watches
            const inventoryRegex = /(.+?)\s+(\d+\s?GB|N\/?A|\d+\s?mm)\s+([a-zA-Z\s\/]+?)\s+(\d+\s+available)/g; 
            const matches = [...dataText.matchAll(inventoryRegex)]; 
            const preFilterList = []; 
            const postFilterList = []; 
            const autoHidden = []; 

           // v25: Updated regex to catch "unloc ked"
            const excludeRegex = /demo|un\s?-?\s?loc\s?k\s?e\s?d/i; 
            // v60: Vaporize legacy iPhones
            const vaporizeRegex = /iPhone\s*(11|12|13)(?!\d)/i; 
            
            for (const match of matches) { 
                if (vaporizeRegex.test(match[0])) continue; // Erase from existence
            // v51: Aggressive Whitespace Normalization
            const model = match[1].replace(/\s+/g, ' ').trim(); 
            let capacityRaw = match[2].replace(/\s+/g, ' ').trim();
            let capacity = "";

            // v45: Handle N/A capacity
            if (!/^N\/?A$/i.test(capacityRaw)) {
                // v46: Handle mm as well as GB
                capacity = capacityRaw.replace(/\s+GB/i, 'GB').replace(/\s+mm/i, 'mm');
            }
            
            // v45: Handle N/A color
            let color = match[3].replace(/\s+/g, ' ').trim();
                if (/^N\/?A$/i.test(color)) {
                    color = "";
                }

                // v45: Trim result to avoid trailing space if capacity is empty
                const modelAndCapacity = (capacity ? `${model} ${capacity}` : model).trim(); 
                
                // v47: Fix for "Blu" bug. If regex fails to parse quantity, default to 1.
                const quantityMatch = match[4].match(/\d+/);
                const quantity = quantityMatch ? parseInt(quantityMatch[0], 10) : 1;

                const item = [modelAndCapacity, color, quantity]; 
                
                if (excludeRegex.test(match[0])) { 
                    autoHidden.push({ name: modelAndCapacity, count: quantity, type: /demo/i.test(match[0]) ? 'demo' : 'unlocked' });
                } else {
                    postFilterList.push(item); 
                }
            } 
            
            // v44: Logging removed from here to prevent crash
            return { preFilterList, postFilterList, autoHidden }; 
        };
        
        const abbreviateColor = (color, modelName = '') => {
            // v47: Context-aware abbreviations
            const isWatch = modelName.includes('AW ') || modelName.includes('Apple Watch');
            const cLower = color.toLowerCase();
            
            // Global overrides
            if (cLower.includes('silver')) return 'SLVR';

            // Watch specific overrides
            if (isWatch) {
                if (cLower.includes('starlight')) return 'BEIGE';
                if (cLower.includes('midnight')) return 'MDNGHT';
            } else {
                // Non-watch specific
                if (cLower.includes('midnight')) return 'NAVY';
            }

            // v41: Prioritize longest key match first to handle "Awesome Black" vs "Black"
            const sortedKeys = Object.keys(COLOR_ABBREVIATIONS).sort((a, b) => b.length - a.length);
            for (const key of sortedKeys) {
                if (color.toLowerCase().includes(key.toLowerCase())) {
                    return COLOR_ABBREVIATIONS[key]; // Return ONLY the abbreviation
                }
            }
            return color;
        };

        const abbreviateModel = (model) => {
            const sortedModels = Object.keys(DEVICE_ABBREVIATIONS).sort((a, b) => b.length - a.length);
            for (const fullModel of sortedModels) {
                if (model.startsWith(fullModel)) return model.replace(fullModel, DEVICE_ABBREVIATIONS[fullModel]);
            }
            return model;
        };

        const abbreviateDetails = (details, modelName) => {
            return abbreviateColor(details, modelName); 
        };

        // v57: Smart Footer Formatter (Added Whitespace Normalizer)
        const formatHiddenName = (name) => {
            let processedName = name;
            
            if (HIDDEN_CLEANUP[processedName]) {
                processedName = HIDDEN_CLEANUP[processedName];
            }

            processedName = processedName.replace(/un\s?-?\s?loc\s?k\s?e\s?d/gi, "UNLKD");
            processedName = processedName.replace(/Unlocked/gi, "UNLKD");

            let isDemo = false;
            let isUnlocked = false;
            let isWatch = (processedName.startsWith('AW ') || processedName.toLowerCase().includes('apple watch'));

            if (/demo/i.test(processedName)) {
                isDemo = true;
                processedName = processedName.replace(/demo\s?-\s?|demo\s/gi, '');
            }
            if (/UNLKD/i.test(processedName)) {
                isUnlocked = true;
                processedName = processedName.replace(/\(?UNLKD\)?/gi, '');
            }

            processedName = processedName.replace(/\s?N\/?A/gi, '');
            
            if (isDemo) {
                processedName = processedName.replace(/\s?\d+\s?(GB|TB|mm)/gi, '');
            }

            processedName = processedName.replace(/^\s?-\s?/, '').trim();
            processedName = abbreviateModel(processedName);

            let category = 'manual'; 
            if (isUnlocked) category = 'unlocked';
            else if (isWatch) category = 'wearables';
            else if (isDemo) category = 'demo';

            let finalName = processedName.trim();
            // v57: Whitespace collapse
            finalName = finalName.replace(/\s+/g, ' ');
            
            return { name: finalName, category: category };
        };

        const consolidateInventory = (inventoryList) => { const consolidationMap = new Map(); for (const [modelAndCapacity, color, quantity] of inventoryList) { const key = modelAndCapacity; if (!consolidationMap.has(key)) { consolidationMap.set(key, { modelAndCapacity, details: [] }); } const abbreviated = abbreviateColor(color, modelAndCapacity); consolidationMap.get(key).details.push({ color: abbreviated, quantity }); } const consolidatedList = []; for (const value of consolidationMap.values()) { const detailsString = value.details.map(d => `${d.quantity} ${d.color}`).join(', '); consolidatedList.push([value.modelAndCapacity, detailsString]); } return consolidatedList; };
        
        const categorizePdf = (text) => { const lowerCaseText = text.toLowerCase(); if (lowerCaseText.includes('at&t')) return 'att'; if (lowerCaseText.includes('verizon') || lowerCaseText.includes('vzw')) return 'vzw'; if (lowerCaseText.includes('t-mobile') || lowerCaseText.includes('tmo')) return 'tmo'; return 'unknown'; };
        
        const prepareDataForDisplay = () => { 
            const preparedState = { att: {}, vzw: {}, tmo: {} }; 
            // v47: Isolate Apple Devices (Includes Watches)
            if (isolateIphonesCheckbox.checked) { 
                const priorityOrder = ['att', 'vzw', 'tmo']; 
                let iphoneSource = null; 
                for (const carrier of priorityOrder) { 
                    // Check for iPhones OR Watches
                    if (appState[carrier].consolidatedList.some(item => 
                        item[0].toLowerCase().includes('iphone') || 
                        item[0].startsWith('AW ') || 
                        item[0].toLowerCase().includes('apple watch')
                    )) { iphoneSource = carrier; break; } 
                } 
                preparedState.apple = { consolidatedList: [] }; 
                for (const carrier of ['att', 'vzw', 'tmo']) { 
                    // Filter out BOTH iPhones and Watches from carrier lists
                    preparedState[carrier].consolidatedList = appState[carrier].consolidatedList.filter(item => 
                        !item[0].toLowerCase().includes('iphone') &&
                        !item[0].startsWith('AW ') &&
                        !item[0].toLowerCase().includes('apple watch')
                    ); 
                    if (carrier === iphoneSource) { 
                        const appleItems = appState[carrier].consolidatedList.filter(item => 
                            item[0].toLowerCase().includes('iphone') || 
                            item[0].startsWith('AW ') || 
                            item[0].toLowerCase().includes('apple watch')
                        ).map(item => ({ modelAndCapacity: item[0], details: item[1], sourceCarrier: carrier })); 
                        
                        // v47: Sort Watches to TOP
                        appleItems.sort((a, b) => {
                            const isWatchA = a.modelAndCapacity.startsWith('AW ') || a.modelAndCapacity.toLowerCase().includes('watch');
                            const isWatchB = b.modelAndCapacity.startsWith('AW ') || b.modelAndCapacity.toLowerCase().includes('watch');
                            if (isWatchA && !isWatchB) return -1;
                            if (!isWatchA && isWatchB) return 1;
                            return a.modelAndCapacity.localeCompare(b.modelAndCapacity);
                        });

                        preparedState.apple.consolidatedList = appleItems; 
                    } 
                } 
            } else { 
                preparedState.att.consolidatedList = appState.att.consolidatedList; 
                preparedState.vzw.consolidatedList = appState.vzw.consolidatedList; 
                preparedState.tmo.consolidatedList = appState.tmo.consolidatedList; 
            } 
            
            // v47: Wearables Filter (Remove from display if toggled off)
            if (!showWearablesToggle.checked) {
                // Helper to check if item is a watch
                const isWatch = (name) => name.startsWith('AW ') || name.toLowerCase().includes('apple watch');
                
                // Filter Apple list
                if (preparedState.apple) {
                    preparedState.apple.consolidatedList = preparedState.apple.consolidatedList.filter(item => !isWatch(item.modelAndCapacity));
                }
                // Filter Carrier lists
                ['att', 'vzw', 'tmo'].forEach(c => {
                    preparedState[c].consolidatedList = preparedState[c].consolidatedList.filter(item => !isWatch(item[0]));
                });
            }

            return preparedState; 
        };
        
        // --- RICH TEXT HELPER FOR FOOTER ---
        const drawRichText = (doc, x, y, segments, maxWidth, lineHeight) => {
            let cursorX = x;
            let cursorY = y;
            
            segments.forEach(seg => {
                doc.setFont("helvetica", seg.bold ? "bold" : "normal"); 
                const words = seg.text.split(' ');
                
                words.forEach((word, index) => {
                    const wordWithSpace = word + (index < words.length - 1 ? ' ' : '');
                    const w = doc.getTextWidth(wordWithSpace);
                    
                    if (cursorX + w > x + maxWidth) {
                        cursorX = x;
                        cursorY += lineHeight;
                    }
                    
                    doc.text(wordWithSpace, cursorX, cursorY);
                    cursorX += w;
                });
            });
            return cursorY;
        };

        const generateFinalPdf = (state, comments) => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const topMargin = 12.7, sideMargin = 6.35, bottomMargin = 6.35;
            const pageHeight = 297, lineHeight = 4.5, sectionSpacing = 3; 
            const headerHeight = 6;
            let yPosition = topMargin;
            const showEdlps = showEdlpsToggle.checked;
            
            // --- PASS 1: COLLECT CITATIONS ---
            const citationMap = new Map();
            const getPriceObj = (cData, mName) => {
                if (!cData) return null;
                const keys = Object.keys(cData).sort((a, b) => b.length - a.length);
                for (const key of keys) {
                    if (mName.startsWith(key)) return cData[key];
                }
                return null;
            };

            const now = new Date();
            const currentMonth = now.getMonth(); // 0-11
            const currentYear = now.getFullYear();
            
            // Collection Set
            const collectedCitations = new Map();

            const collectDates = (carrier, list) => {
                list.forEach(item => {
                    const isApple = carrier === 'apple';
                    const rawModel = isApple ? item.modelAndCapacity : item[0];
                    const sourceCarrier = isApple ? item.sourceCarrier : carrier;
                    const emphasisState = (appState[sourceCarrier].emphasis.get(rawModel) || {});
                    if (emphasisState.hidden) return;

                    const addCitation = (ts) => {
                        if (!ts) return;
                        const d = new Date(ts);
                        let label = "";
                        let sortValue = 0;

                        if (d.getFullYear() < currentYear || (d.getFullYear() === currentYear && d.getMonth() < currentMonth)) {
                            label = d.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' });
                            sortValue = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
                        } else {
                            label = `${d.getMonth() + 1}/${d.getDate()}`;
                            sortValue = d.getTime();
                        }

                        if (!collectedCitations.has(label)) {
                            collectedCitations.set(label, sortValue);
                        }
                    };

                    if (isApple) {
                        const pAtt = getPriceObj(EDLP_DATA.att, rawModel);
                        const pVzw = getPriceObj(EDLP_DATA.vzw, rawModel);
                        const pTmo = getPriceObj(EDLP_DATA.tmo, rawModel);
                        if (pAtt && pAtt.total > 0 && pAtt.last_updated) addCitation(pAtt.last_updated);
                        if (pVzw && pVzw.total > 0 && pVzw.last_updated) addCitation(pVzw.last_updated);
                        if (pTmo && pTmo.total > 0 && pTmo.last_updated) addCitation(pTmo.last_updated);
                    } else {
                        const p = getPriceObj(EDLP_DATA[sourceCarrier], rawModel);
                        if (p && p.total > 0 && p.last_updated) addCitation(p.last_updated);
                    }
                });
            };

            const carriersForLayout = Object.keys(state).filter(c => state[c].consolidatedList && state[c].consolidatedList.length > 0);
            carriersForLayout.forEach(c => collectDates(c, state[c].consolidatedList));

            const sortedLabels = Array.from(collectedCitations.entries())
                .sort((a, b) => a[1] - b[1])
                .map(entry => entry[0]);

            sortedLabels.forEach((label, index) => {
                citationMap.set(label, index + 1);
            });

            const getCitation = (ts) => {
                if (!ts) return null;
                const d = new Date(ts);
                let label = "";
                if (d.getFullYear() < currentYear || (d.getFullYear() === currentYear && d.getMonth() < currentMonth)) {
                    label = d.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' });
                } else {
                    label = `${d.getMonth() + 1}/${d.getDate()}`;
                }
                return citationMap.get(label);
            };

            // --- HEADER RENDER ---
            const dateStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(' ', '');
            
            if (isEdlpIndexMode) {
                const headerText1 = `${dateStr} ${timeStr} ${TRANSLATIONS[currentLang].pdf.edlpIndexReport}`;
                doc.setFontSize(8); 
                doc.setFont("helvetica", "bold");
                doc.text(headerText1, sideMargin, yPosition);
                yPosition += lineHeight;

                let line2X = sideMargin;
                if (showEdlps && citationMap.size > 0) {
                    doc.setFont("helvetica", "bold");
                    doc.text(TRANSLATIONS[currentLang].pdf.edlpsVerifiedOn, line2X, yPosition);
                    line2X += doc.getTextWidth(TRANSLATIONS[currentLang].pdf.edlpsVerifiedOn);
                    
                    doc.setFont("helvetica", "normal");
                    const sortedCitations = Array.from(citationMap.entries()).sort((a, b) => a[1] - b[1]);
                    sortedCitations.forEach(([date, index], i) => {
                        doc.text(date, line2X, yPosition);
                        line2X += doc.getTextWidth(date);
                        doc.setFontSize(5);
                        doc.text(`[${index}]`, line2X + 0.5, yPosition - 1);
                        line2X += doc.getTextWidth(`[${index}]`) + 1;
                        doc.setFontSize(8);
                        let sep = "";
                        if (i === sortedCitations.length - 1) {
                            sep = ".";
                        } else if (i === sortedCitations.length - 2) {
                            sep = (sortedCitations.length === 2) ? TRANSLATIONS[currentLang].pdf.and : TRANSLATIONS[currentLang].pdf.commaAnd;
                        } else {
                            sep = ", ";
                        }
                        doc.text(sep, line2X, yPosition);
                        line2X += doc.getTextWidth(sep);
                    });
                }
                yPosition += lineHeight;

            } else {
                const storeSet = new Set();
                ['att', 'vzw', 'tmo'].forEach(c => {
                    if (appState[c].storeNumber) {
                        const nick = STORE_NICKNAMES[appState[c].storeNumber];
                        storeSet.add(nick ? `${nick} #${appState[c].storeNumber}` : `#${appState[c].storeNumber}`);
                    }
                });
                const storeString = Array.from(storeSet).join(' '); 

                // Line 1
                const headerText1 = `${dateStr} ${timeStr} ${storeString} ${TRANSLATIONS[currentLang].pdf.inventoryReport}`;
                const headerText2 = TRANSLATIONS[currentLang].pdf.madeWith;
                
                doc.setFontSize(8); 
                doc.setFont("helvetica", "bold");
                doc.text(headerText1, sideMargin, yPosition);
                const w1 = doc.getTextWidth(headerText1);
                
                doc.setFont("helvetica", "normal");
                doc.text(headerText2, sideMargin + w1, yPosition);
                yPosition += lineHeight;

                // Line 2
                const sourceDates = [];
                ['att', 'vzw', 'tmo'].forEach(c => {
                    if (appState[c] && appState[c].consolidatedList && appState[c].consolidatedList.length > 0) {
                        const rawDate = appState[c].fileDate;
                        if (rawDate) {
                            try {
                                const datePart = rawDate.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(:\d{2})?\s+[AP]M)/i);
                                if (datePart) {
                                    const dObj = new Date(datePart[0]);
                                    sourceDates.push({ carrier: c.toUpperCase(), date: dObj });
                                }
                            } catch (e) {}
                        }
                    }
                });

                sourceDates.sort((a, b) => a.date - b.date);

                const daysMap = new Map();
                sourceDates.forEach(item => {
                    if (!item.date) return;
                    const dayKey = `${item.date.getMonth() + 1}/${item.date.getDate()}`;
                    if (!daysMap.has(dayKey)) daysMap.set(dayKey,[]);
                    daysMap.get(dayKey).push(item);
                });

                let sourcesContent = "";
                const dayKeys = Array.from(daysMap.keys());
                const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(' ', '');
                
                dayKeys.forEach((dayKey, dayIndex) => {
                    const dayItems = daysMap.get(dayKey);
                    let timeGroups = [];
                    let currentGroup = { start: dayItems[0].date, end: dayItems[0].date, carriers: [dayItems[0].carrier] };
                    
                    for (let i = 1; i < dayItems.length; i++) {
                        const item = dayItems[i];
                        if (item.date - currentGroup.start <= 30 * 60 * 1000) {
                            currentGroup.carriers.push(item.carrier);
                            currentGroup.end = item.date;
                        } else {
                            timeGroups.push(currentGroup);
                            currentGroup = { start: item.date, end: item.date, carriers:[item.carrier] };
                        }
                    }
                    timeGroups.push(currentGroup);
                    
                    let dayString = `${dayKey} `;
                    timeGroups.forEach((g, tIndex) => {
                        const startStr = formatTime(g.start);
                        const endStr = formatTime(g.end);
                        let timeLabel = startStr;
                        
                        if (startStr !== endStr) {
                            const sH = g.start.getHours();
                            const eH = g.end.getHours();
                            const sAmPm = sH >= 12 ? 'pm' : 'am';
                            const eAmPm = eH >= 12 ? 'pm' : 'am';
                            
                            if (sH === eH && sAmPm === eAmPm) {
                                const sH12 = sH % 12 || 12;
                                const sMStr = g.start.getMinutes().toString().padStart(2, '0');
                                const eMStr = g.end.getMinutes().toString().padStart(2, '0');
                                timeLabel = `${sH12}:${sMStr}-${eMStr}${sAmPm}`;
                            } else {
                                timeLabel = `${startStr}-${endStr}`;
                            }
                        }
                        
                        dayString += `${timeLabel} (${g.carriers.join(", ")})`;
                        if (tIndex < timeGroups.length - 1) dayString += ", ";
                    });
                    
                    sourcesContent += dayString;
                    if (dayIndex < dayKeys.length - 1) sourcesContent += ", ";
                });
                
                if (sourcesContent === "") sourcesContent = TRANSLATIONS[currentLang].pdf.na;

                let line2X = sideMargin;
                doc.setFont("helvetica", "bold");
                doc.text(TRANSLATIONS[currentLang].pdf.sources, line2X, yPosition);
                line2X += doc.getTextWidth(TRANSLATIONS[currentLang].pdf.sources);
                
                doc.setFont("helvetica", "normal");
                doc.text(sourcesContent, line2X, yPosition);
                line2X += doc.getTextWidth(sourcesContent);
                
                line2X += doc.getTextWidth("    ");

                if (showEdlps && citationMap.size > 0) {
                    doc.setFont("helvetica", "bold");
                    doc.text(TRANSLATIONS[currentLang].pdf.edlpsVerifiedOn, line2X, yPosition);
                    line2X += doc.getTextWidth(TRANSLATIONS[currentLang].pdf.edlpsVerifiedOn);
                    
                    doc.setFont("helvetica", "normal");
                    const sortedCitations = Array.from(citationMap.entries()).sort((a, b) => a[1] - b[1]);
                    sortedCitations.forEach(([date, index], i) => {
                        doc.text(date, line2X, yPosition);
                        line2X += doc.getTextWidth(date);
                        doc.setFontSize(5);
                        doc.text(`[${index}]`, line2X + 0.5, yPosition - 1);
                        line2X += doc.getTextWidth(`[${index}]`) + 1;
                        doc.setFontSize(8);
                        let sep = "";
                        if (i === sortedCitations.length - 1) {
                            sep = ".";
                        } else if (i === sortedCitations.length - 2) {
                            sep = (sortedCitations.length === 2) ? TRANSLATIONS[currentLang].pdf.and : TRANSLATIONS[currentLang].pdf.commaAnd;
                        } else {
                            sep = ", ";
                        }
                        doc.text(sep, line2X, yPosition);
                        line2X += doc.getTextWidth(sep);
                    });
                }
                yPosition += lineHeight;
            }
            
            // --- INJECT DYNAMIC WARNING BANNER ---
            yPosition += lineHeight;
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            if (isEdlpIndexMode) {
                doc.text("[!] NOT A STOCK REPORT, FOR PRICING REFERENCE ONLY.", sideMargin, yPosition);
            } else {
                doc.text("[!] EXPERIMENTAL SOFTWARE. Stock counts may be inaccurate, pricing is not affected.", sideMargin, yPosition);
            }
            yPosition += lineHeight;
            
            // Check if comments are functionally empty before drawing
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = comments || "";
            const hasRealText = tempDiv.textContent.trim().length > 0;
            
            if (comments && hasRealText) { 
                const parseRichTextNode = (node) => {
                    let segments = [];
                    if (node.nodeType === 3) {
                        if (node.textContent.trim() || node.textContent.includes('\u00A0')) {
                            segments.push({ text: node.textContent, bold: false, italic: false, underline: false });
                        }
                    } else if (node.nodeType === 1) {
                        if (node.tagName === 'DIV' || node.tagName === 'P' || node.tagName === 'BR') {
                            segments.push({ text: '\n', bold: false, italic: false, underline: false });
                        }
                        const isBold = node.tagName === 'B' || node.tagName === 'STRONG';
                        const isItalic = node.tagName === 'I' || node.tagName === 'EM';
                        const isUnderline = node.tagName === 'U';
                        
                        node.childNodes.forEach(child => {
                            const childSegments = parseRichTextNode(child);
                            childSegments.forEach(seg => {
                                if (seg.text !== '\n') {
                                    if (isBold) seg.bold = true;
                                    if (isItalic) seg.italic = true;
                                    if (isUnderline) seg.underline = true;
                                }
                                segments.push(seg);
                            });
                        });
                    }
                    return segments;
                };

                const rtSegments = parseRichTextNode(tempDiv);
                
                let cursorX = sideMargin;
                let maxLineWidth = 190;
                
                rtSegments.forEach(seg => {
                    if (seg.text === '\n') {
                        cursorX = sideMargin;
                        yPosition += lineHeight;
                        return;
                    }
                    
                    let fontStyle = "normal";
                    if (seg.bold && seg.italic) fontStyle = "bolditalic";
                    else if (seg.bold) fontStyle = "bold";
                    else if (seg.italic) fontStyle = "italic";
                    
                    doc.setFont("helvetica", fontStyle);
                    
                    const words = seg.text.split(/(\s+)/);
                    words.forEach(word => {
                        if (!word) return;
                        const w = doc.getTextWidth(word);
                        if (cursorX + w > sideMargin + maxLineWidth && word.trim() !== '') {
                            cursorX = sideMargin;
                            yPosition += lineHeight;
                        }
                        doc.text(word, cursorX, yPosition);
                        if (seg.underline && word.trim() !== '') {
                            doc.setLineWidth(0.1);
                            doc.line(cursorX, yPosition + 0.5, cursorX + w, yPosition + 0.5);
                        }
                        cursorX += w;
                    });
                });
                yPosition += lineHeight;
            }
            const contentStartY = yPosition;

            // --- v59: SMART FLOW ENGINE ---
            let startRightX = 100;
            if (showEdlps) {
                if (isolateIphonesCheckbox.checked) {
                    startRightX = 75;
                } else {
                    startRightX = 95;
                }
            }

            // Define Layout State
            let cursors = {
                left: { page: 1, y: contentStartY },
                right: { page: 1, y: contentStartY }
            };
            let maxPage = 1;

            // Queue: ATT -> TMO -> VZW -> Apple
            const processQueue = [];
            if (state.att) processQueue.push({ id: 'att', pref: 'left', alt: 'right' });
            if (state.tmo) processQueue.push({ id: 'tmo', pref: 'right', alt: 'left' });
            if (state.vzw) processQueue.push({ id: 'vzw', pref: 'left', alt: 'right' });
            if (state.apple) processQueue.push({ id: 'apple', pref: 'right', alt: 'left' });

            // Helper: Draw Carrier Block
            const drawCarrierBlock = (carrier, xPos, startY, pageNum) => {
                doc.setPage(pageNum);
                let cursorY = startY;
                const data = state[carrier];

                // Header
                doc.setFont("helvetica", "bold").setFontSize(10);
                const headerText = (carrier === 'apple') ? TRANSLATIONS[currentLang].pdf.appleDevices : carrier.toUpperCase();
                const headerWidth = doc.getTextWidth(headerText);
                doc.text(headerText, xPos, cursorY);
                doc.setLineWidth(0.2).line(xPos, cursorY + 0.5, xPos + headerWidth, cursorY + 0.5);
                cursorY += 6; // headerHeight

                // Legend
                if (showEdlps) {
                        doc.setFontSize(6).setFont("helvetica", "bold");
                        if (carrier === 'apple') {
                            const curEdlpX = xPos + 30;
                            const curDetailsX = xPos + 85;
                            doc.text(TRANSLATIONS[currentLang].pdf.likelyEdlps, curEdlpX, cursorY);
                            cursorY += lineHeight;
                            doc.text(TRANSLATIONS[currentLang].pdf.item, xPos, cursorY);
                            doc.text(TRANSLATIONS[currentLang].pdf.attVzwTmo, curEdlpX, cursorY);
                            if (!isEdlpIndexMode) doc.text(TRANSLATIONS[currentLang].pdf.qty, curDetailsX, cursorY);
                            cursorY += lineHeight;
                        } else if (carrier === 'tmo') {
                            const curEdlpX = xPos + 30; 
                            const curDetailsX = xPos + (isolateIphonesCheckbox.checked ? 85 : 65);
                            doc.text(TRANSLATIONS[currentLang].pdf.likely, curEdlpX, cursorY);
                            cursorY += lineHeight;
                            doc.text(TRANSLATIONS[currentLang].pdf.item, xPos, cursorY);
                            doc.text(TRANSLATIONS[currentLang].pdf.edlpsDpMo, curEdlpX, cursorY);
                            if (!isEdlpIndexMode) doc.text(TRANSLATIONS[currentLang].pdf.qty, curDetailsX, cursorY);
                            cursorY += lineHeight;
                        } else {
                            const curEdlpX = xPos + 28;
                            const curDetailsX = xPos + 38; 
                            doc.text(TRANSLATIONS[currentLang].pdf.likely, curEdlpX, cursorY);
                            cursorY += lineHeight;
                            doc.text(TRANSLATIONS[currentLang].pdf.item, xPos, cursorY);
                            doc.text(TRANSLATIONS[currentLang].pdf.edlps, curEdlpX, cursorY);
                            if (!isEdlpIndexMode) doc.text(TRANSLATIONS[currentLang].pdf.qty, curDetailsX, cursorY); 
                            cursorY += lineHeight;
                        }
                    } else {
                    doc.setFontSize(6).setFont("helvetica", "bold");
                    doc.text(TRANSLATIONS[currentLang].pdf.item, xPos, cursorY);
                    if (!isEdlpIndexMode) doc.text(TRANSLATIONS[currentLang].pdf.qty, xPos + 50, cursorY); 
                    cursorY += lineHeight;
                }

                doc.setFontSize(8);

                // Items
                data.consolidatedList.forEach(item => {
                    const rawModel = (carrier === 'apple') ? item.modelAndCapacity : item[0];
                    const rawDetails = (carrier === 'apple') ? item.details : item[1];
                    const sourceCarrier = (carrier === 'apple') ? item.sourceCarrier : carrier;
                    const emphasisState = (appState[sourceCarrier].emphasis.get(rawModel) || {});
                    
                    if (emphasisState.hidden) return;

                    // Page Break Check inside block
                    if (cursorY + lineHeight > pageHeight - bottomMargin) {
                        pageNum++;
                        if (pageNum > doc.internal.getNumberOfPages()) doc.addPage();
                        doc.setPage(pageNum);
                        cursorY = topMargin;
                        if (pageNum > maxPage) maxPage = pageNum;
                    }

                    // Render Item (Same Logic as v58)
                    let displayModel = rawModel;
                    let displayDetails = rawDetails;
                    let edlpSegments = []; 

                    if (showEdlps) {
                        displayModel = abbreviateModel(rawModel);
                        displayDetails = abbreviateDetails(rawDetails, rawModel); 
                        const findPrice = (cData, mName) => getPriceObj(cData, mName);
                        const formatCurrency = (val) => {
                            if (val === 0 || val === "0" || val === null || val === undefined || val === "???" || val === "??") return "___";
                            return `$${val}`;
                        };

                        if (carrier === 'apple') {
                           const pAtt = findPrice(EDLP_DATA.att, rawModel);
                           const pVzw = findPrice(EDLP_DATA.vzw, rawModel);
                           const pTmo = findPrice(EDLP_DATA.tmo, rawModel);
                           
                           const tAtt = (pAtt && pAtt.total > 0) ? formatCurrency(pAtt.total) : "___";
                           const citAtt = (pAtt && pAtt.total > 0) ? getCitation(pAtt.last_updated) : null;
                           edlpSegments.push({ text: tAtt, citation: citAtt });
                           edlpSegments.push({ text: ", ", citation: null });

                           const tVzw = (pVzw && pVzw.total > 0) ? formatCurrency(pVzw.total) : "___";
                           const citVzw = (pVzw && pVzw.total > 0) ? getCitation(pVzw.last_updated) : null;
                           edlpSegments.push({ text: tVzw, citation: citVzw });
                           edlpSegments.push({ text: ", ", citation: null });
                           
                           let tTmoText = "___";
                           let citTmo = null;
                           if (pTmo && pTmo.total > 0) {
                               citTmo = getCitation(pTmo.last_updated);
                               if (pTmo.dp !== undefined) {
                                   tTmoText = `${formatCurrency(pTmo.total)} (${formatCurrency(pTmo.dp)} + ${formatCurrency(pTmo.mo)}/mo)`;
                               } else {
                                   tTmoText = formatCurrency(pTmo.total);
                               }
                           }
                           edlpSegments.push({ text: tTmoText, citation: citTmo });

                        } else {
                           const priceData = findPrice(EDLP_DATA[sourceCarrier], rawModel);
                           if (priceData && priceData.total > 0) {
                               const cit = getCitation(priceData.last_updated);
                               let txt = "";
                               if (sourceCarrier === 'tmo') {
                                   if (priceData.dp !== undefined) {
                                       txt = `${formatCurrency(priceData.total)} (${formatCurrency(priceData.dp)} + ${formatCurrency(priceData.mo)}/mo)`;
                                   } else {
                                       txt = formatCurrency(priceData.total);
                                   }
                               } else {
                                   txt = priceData.total !== undefined ? formatCurrency(priceData.total) : "";
                               }
                               if (txt) edlpSegments.push({ text: txt, citation: cit });
                           }
                        }
                    }

                    doc.setFont('helvetica', 'normal'); 
                    let curModelX = xPos;
                    let curEdlpX = 0;
                    let curDetailsX = 0;

                    if (showEdlps) {
                        if (carrier === 'apple') {
                            curEdlpX = xPos + 30; curDetailsX = xPos + 85; 
                        } else if (carrier === 'tmo') {
                            curEdlpX = xPos + 30; curDetailsX = xPos + (isolateIphonesCheckbox.checked ? 85 : 65);
                        } else {
                            curEdlpX = xPos + 28; curDetailsX = xPos + 38;
                        }
                    } else {
                        curDetailsX = xPos + 50; 
                    }

                    if (emphasisState.full || emphasisState.partial) { 
                        doc.setFillColor(150, 150, 150); 
                        const textDimensions = doc.getTextDimensions(displayDetails || "A", { fontSize: 8 }); 
                        const rectY = cursorY - textDimensions.h + 0.2; 
                        const rectHeight = textDimensions.h + 0.5; 
                        
                        let rectWidth = 0; 
                        if (emphasisState.full) {
                             rectWidth = isEdlpIndexMode ? 85 : ((curDetailsX + textDimensions.w) - curModelX + 2); 
                        } else {
                             const modelDimensions = doc.getTextDimensions(displayModel, { fontSize: 8 }); 
                             rectWidth = modelDimensions.w + 2; 
                        }
                        doc.rect(curModelX - 1, rectY, rectWidth, rectHeight, 'F'); 
                    } 
                    
                    doc.setFont('helvetica', 'normal');
                    doc.text(displayModel, curModelX, cursorY); 
                    
                    if (showEdlps) {
                        doc.setFontSize(7); 
                        let segX = curEdlpX;
                        edlpSegments.forEach(seg => {
                            doc.text(seg.text, segX, cursorY);
                            const w = doc.getTextWidth(seg.text);
                            if (seg.citation) {
                                doc.setFontSize(5);
                                doc.text(`[${seg.citation}]`, segX + w + 0.5, cursorY - 1); 
                                doc.setFontSize(7); 
                                segX += w + 2.5; 
                            } else {
                                segX += w;
                            }
                        });
                        doc.setFontSize(8);
                    }
                    if (!isEdlpIndexMode) doc.text(displayDetails, curDetailsX, cursorY); 
                    cursorY += lineHeight; 
                });
                
                cursorY += sectionSpacing;
                return { y: cursorY, page: pageNum };
            };

            // Process Queue
            processQueue.forEach(item => {
                const data = state[item.id];
                if (!data.consolidatedList || data.consolidatedList.length === 0) return;

                // Calculate Height
                let visibleCount = 0;
                data.consolidatedList.forEach(i => {
                    const m = (item.id === 'apple') ? i.modelAndCapacity : i[0];
                    const s = (item.id === 'apple') ? i.sourceCarrier : item.id;
                    if (!(appState[s].emphasis.get(m) || {}).hidden) visibleCount++;
                });
                
                let legendH = lineHeight;
                if (showEdlps && item.id === 'apple' && isolateIphonesCheckbox.checked) legendH = lineHeight * 2;
                const height = 6 + legendH + (visibleCount * lineHeight) + sectionSpacing;

                // Decision Logic
                let targetCol = item.pref;
                let targetX = (targetCol === 'left') ? sideMargin : startRightX;
                let cursor = cursors[targetCol];
                let remainingSpace = pageHeight - bottomMargin - cursor.y;

                if (height < remainingSpace) {
                    // Fits in Preferred
                } else {
                    // Try Alternate
                    let altCol = item.alt;
                    let altCursor = cursors[altCol];
                    let altRemaining = pageHeight - bottomMargin - altCursor.y;
                    
                    // Only switch to alt if it fits on the CURRENT page
                    // And only if the alternate column isn't way behind (on a previous page)
                    if (height < altRemaining && altCursor.page === cursor.page) {
                        targetCol = altCol;
                        targetX = (targetCol === 'left') ? sideMargin : startRightX;
                        cursor = altCursor;
                    } else {
                        // Force New Page on Preferred
                        cursor.page++;
                        cursor.y = topMargin;
                        if (cursor.page > maxPage) maxPage = cursor.page;
                        if (cursor.page > doc.internal.getNumberOfPages()) doc.addPage();
                    }
                }

                // Draw
                const result = drawCarrierBlock(item.id, targetX, cursor.y, cursor.page);
                cursors[targetCol] = result;
                if (result.page > maxPage) maxPage = result.page;
            });

            if (processQueue.length === 0) { doc.setFont("helvetica", "normal").setFontSize(12).text(TRANSLATIONS[currentLang].pdf.noInventory, sideMargin, contentStartY); } 
            
            // --- FOOTER (Hidden Items v57 Dynamic Position) ---
            doc.setPage(maxPage);
            
            // Find lowest Y on the final page
            let finalY = topMargin;
            if (cursors.left.page === maxPage) finalY = Math.max(finalY, cursors.left.y);
            if (cursors.right.page === maxPage) finalY = Math.max(finalY, cursors.right.y);
            
            const footerY = finalY + lineHeight;

            doc.setFontSize(7);
            
            // v60: Smart Footer Buckets
            const buckets = {
                unlocked: { att: new Map(), vzw: new Map(), tmo: new Map() },
                manual: { att: [], vzw: [], tmo: [] }
            };

            const isWatchCheck = (name) => name.startsWith('AW ') || name.toLowerCase().includes('apple watch');

            // 1. Process Auto-Hidden (Unlocked only, skip Demos & Watches)
            ['att', 'vzw', 'tmo'].forEach(c => {
                appState[c].autoHidden.forEach(item => {
                    if (isWatchCheck(item.name)) return; // Skip watches

                    const formatted = formatHiddenName(item.name);
                    if (formatted.category === 'unlocked') {
                        buckets.unlocked[c].set(formatted.name, (buckets.unlocked[c].get(formatted.name) || 0) + item.count);
                    }
                    // Demos are intentionally ignored in v60
                });
            });

            // 2. Process Manual Hidden
            ['att', 'vzw', 'tmo'].forEach(c => {
                appState[c].consolidatedList.forEach(item => {
                    const name = item[0];
                    const emphasis = appState[c].emphasis.get(name);
                    
                    if (isWatchCheck(name)) return; // Skip watches for footer
                    
                    const formatted = formatHiddenName(name);
                    if (formatted.category === 'demo') return; // v60: Never show demos in manual list

                    if (emphasis && emphasis.hidden) {
                        buckets.manual[c].push(formatted.name); // Ignore quantity
                    }
                });
            });

            const richSegments = [];
            const addSegment = (boldText, normalText) => {
                richSegments.push({ text: boldText, bold: true });
                richSegments.push({ text: normalText + " ", bold: false });
            };

            // 3. Consolidate Unlocked (Priority Merge: ATT > VZW > TMO)
            const allUnlockedNames = new Set([
                ...buckets.unlocked.att.keys(),
                ...buckets.unlocked.vzw.keys(),
                ...buckets.unlocked.tmo.keys()
            ]);
            
            const unlockedList = [];
            allUnlockedNames.forEach(name => {
                const count = buckets.unlocked.att.get(name) || buckets.unlocked.vzw.get(name) || buckets.unlocked.tmo.get(name) || 0;
                if (count > 0) {
                    unlockedList.push({ name: name, count: count });
                }
            });

            // Sort by count descending
            unlockedList.sort((a, b) => b.count - a.count);
            
            if (unlockedList.length > 0) {
                const formattedUnlocked = unlockedList.map(i => `${i.count}x ${i.name}`);
                addSegment(TRANSLATIONS[currentLang].pdf.unlockedPhones, formattedUnlocked.join(", "));
            }

            // 4. Format Manual (Smart Grouping)
            const manualStrings = [];
            ['att', 'vzw', 'tmo'].forEach(c => {
                const uniqueItems = [...new Set(buckets.manual[c])];
                if (uniqueItems.length === 1) {
                    manualStrings.push(`${uniqueItems[0]} (${c.toUpperCase()})`);
                } else if (uniqueItems.length > 1) {
                    manualStrings.push(`${c.toUpperCase()}: ${uniqueItems.join(", ")}`);
                }
            });

            if (manualStrings.length > 0) {
                addSegment(TRANSLATIONS[currentLang].pdf.manualHidden, manualStrings.join(", "));
            }

            if (richSegments.length === 0) {
                richSegments.push({ text: TRANSLATIONS[currentLang].pdf.noneHidden, bold: true });
            }

            drawRichText(doc, sideMargin, footerY, richSegments, 190, 3.5);

            // Hybrid Output: DataURI for visual iframe (Mobile/Right WMPC), Blob for secure Print/Download
            const dataUri = doc.output('datauristring');
            const blobUri = URL.createObjectURL(doc.output('blob'));
            
            return { dataUri, blobUri };

        };

        // --- EVENT HANDLER FUNCTIONS ---
        
        const openEmphasisModal = () => {
            // V38 Logging
            debugLog("--- OPENING MODAL (Key Lookup Check) ---", "sys");
            
            const listContainer = document.getElementById('emphasis-list-container'); listContainer.innerHTML = ''; const processedData = prepareDataForDisplay(); const carriersToDisplay = Object.keys(processedData).filter(c => processedData[c].consolidatedList.length > 0); carriersToDisplay.forEach(carrier => { const header = document.createElement('div'); header.className = 'emphasis-list-carrier-header'; header.textContent = (carrier === 'apple') ? 'Apple Devices' : carrier.toUpperCase(); listContainer.appendChild(header); processedData[carrier].consolidatedList.forEach(item => { const isApple = carrier === 'apple'; const modelAndCapacity = isApple ? item.modelAndCapacity : item[0]; const details = isApple ? item.details : item[1]; const sourceCarrier = isApple ? item.sourceCarrier : carrier; 
            
            // V38 Logging
            const existingState = appState[sourceCarrier].emphasis.get(modelAndCapacity);
            debugLog(`LOOKUP: Carrier [${sourceCarrier}] Key '[${modelAndCapacity}]' -> Found: ${existingState ? JSON.stringify(existingState) : 'undefined'}`, "sys");

            // v40: Ensure full fallback object includes hidden:false
            const currentEmphasis = existingState || { partial: false, full: false, hidden: false }; 
            
            const itemDiv = document.createElement('div'); itemDiv.className = 'emphasis-item'; if (currentEmphasis.hidden) itemDiv.classList.add('item-hidden'); const hideDiv = document.createElement('div'); hideDiv.className = 'emphasis-item-hide'; hideDiv.innerHTML = currentEmphasis.hidden ? SHOW_ICON_SVG : HIDE_ICON_SVG; hideDiv.tabIndex = 0; hideDiv.dataset.key = modelAndCapacity; hideDiv.dataset.carrier = sourceCarrier; const partialCheckbox = document.createElement('input'); partialCheckbox.type = 'checkbox'; partialCheckbox.checked = currentEmphasis.partial; partialCheckbox.disabled = currentEmphasis.hidden; partialCheckbox.dataset.key = modelAndCapacity; partialCheckbox.dataset.carrier = sourceCarrier; partialCheckbox.dataset.type = 'partial'; const fullCheckbox = document.createElement('input'); fullCheckbox.type = 'checkbox'; fullCheckbox.checked = currentEmphasis.full; fullCheckbox.disabled = currentEmphasis.hidden; fullCheckbox.dataset.key = modelAndCapacity; fullCheckbox.dataset.carrier = sourceCarrier; fullCheckbox.dataset.type = 'full'; const textDiv = document.createElement('div'); textDiv.className = 'emphasis-item-text'; textDiv.textContent = `${modelAndCapacity} - ${details}`; itemDiv.appendChild(hideDiv); itemDiv.appendChild(partialCheckbox); itemDiv.appendChild(fullCheckbox); itemDiv.appendChild(textDiv); listContainer.appendChild(itemDiv); }); }); updateMasterHideIcon(); emphasisModal.style.display = 'flex'; };

        const updateMasterHideIcon = () => {
            const unhideBtn = document.getElementById('unhide-all-btn');
            if (!unhideBtn) return;
            let anyHidden = false;
            ['att', 'vzw', 'tmo'].forEach(c => {
                appState[c].consolidatedList.forEach(item => {
                    const key = item[0];
                    const val = appState[c].emphasis.get(key);
                    if (val && val.hidden) anyHidden = true;
                });
            });
            unhideBtn.innerHTML = anyHidden ? SHOW_ICON_SVG : HIDE_ICON_SVG;
            unhideBtn.dataset.state = anyHidden ? 'show' : 'hide';
        };

        unhideAllBtn.addEventListener('click', () => {
            const isShow = unhideAllBtn.dataset.state === 'show';
            ['att', 'vzw', 'tmo'].forEach(c => {
                if (isShow) {
                    appState[c].emphasis.forEach((val, key) => {
                        if (val) {
                            val.hidden = false;
                            appState[c].emphasis.set(key, val);
                        }
                    });
                } else {
                    appState[c].consolidatedList.forEach(item => {
                        const key = item[0];
                        const val = appState[c].emphasis.get(key) || { partial: false, full: false, hidden: false };
                        val.hidden = true;
                        appState[c].emphasis.set(key, val);
                    });
                }
            });
            saveSettings();
            openEmphasisModal();
        });

        // --- ATTACH EVENT LISTENERS ---
        highlightBtn.addEventListener('click', openEmphasisModal);
        
        processBtn.addEventListener('click', () => { 
            try {
                const processedData = prepareDataForDisplay(); 
                const comments = commentsInput.innerHTML; 
                const pdfOutput = generateFinalPdf(processedData, comments); 
                const blobUri = pdfOutput.blobUri;
                
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                if (isMobile) {
                    window.open(blobUri, '_blank');
                } else {
                    const printFrame = document.createElement('iframe');
                    printFrame.style.display = 'none';
                    printFrame.src = blobUri;
                    document.body.appendChild(printFrame);
                    
                    printFrame.onload = function() {
                        try { 
                            printFrame.contentWindow.print(); 
                        } catch (e) { 
                            window.open(blobUri, '_blank'); 
                        }
                        // Cleanup invisible frame after 5 seconds
                        setTimeout(() => document.body.removeChild(printFrame), 5000);
                    };
                }
            } catch (err) {
                debugLog(` CRASH: ${err.message}`, "sys");
                alert("Failed to generate PDF. Check Dev Console.");
            }
        });
        
        isolateIphonesCheckbox.addEventListener('change', saveSettings);
        
        // Listener for EDLP toggle to show/hide warning
        showEdlpsToggle.addEventListener('change', () => {
             saveSettings(); // v35 Save on Toggle
        });
        
        // v52: Fixed Copy Log Button (Specific Selector)
        copyLogBtn.addEventListener('click', () => { 
            const logText = document.getElementById('dev-console-output').textContent; 
            if (navigator.clipboard && navigator.clipboard.writeText) { 
                navigator.clipboard.writeText(logText).then(() => { alert('Log copied to clipboard!'); }).catch(err => { console.warn('Modern clipboard API failed, trying fallback.', err); legacyCopy(logText); }); 
            } else { 
                legacyCopy(logText); 
            } 
        });
        const legacyCopy = (text) => { const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; textArea.style.top = 0; textArea.style.left = 0; textArea.style.opacity = 0; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { const successful = document.execCommand('copy'); if (!successful) { alert('Failed to copy log.'); } } catch (err) { alert('Failed to copy log.'); } document.body.removeChild(textArea); };
        
        emphasisCloseBtn.addEventListener('click', () => emphasisModal.style.display = 'none');
        emphasisDoneBtn.addEventListener('click', () => emphasisModal.style.display = 'none');
        devModeCloseBtn.addEventListener('click', () => { if (devModalCloseable.button) devModeModal.style.display = 'none'; });
        
        if (btnOpenBackupModal) {
            btnOpenBackupModal.addEventListener('click', () => {
                const existingBackup = localStorage.getItem('edlpLocalBackup');
                if (existingBackup) {
                    edlpBackupInput.value = existingBackup;
                } else {
                    edlpBackupInput.value = '';
                }
                backupModal.style.display = 'flex';
            });
        }
        if (backupCloseBtn) backupCloseBtn.addEventListener('click', () => backupModal.style.display = 'none');
        
        if (btnSaveBackup) {
            btnSaveBackup.addEventListener('click', () => {
                try {
                    const rawText = edlpBackupInput.value.trim();
                    const parsedData = JSON.parse(rawText);
                    if (parsedData && parsedData.devices) {
                        localStorage.setItem('edlpLocalBackup', rawText);
                        
                        // Test live CDN first; it will automatically fall back to this local backup if the CDN fails.
                        fetchLivePricing();
                        
                        backupStatusMsg.style.color = '#1877f2';
                        backupStatusMsg.textContent = ' Backup Saved!';
                        setTimeout(() => backupStatusMsg.textContent = '', 3000);
                    } else {
                        throw new Error("Missing 'devices' property.");
                    }
                } catch (err) {
                    backupStatusMsg.style.color = '#d93025';
                    backupStatusMsg.textContent = ' Invalid JSON format';
                    setTimeout(() => backupStatusMsg.textContent = '', 3000);
                }
            });
        }

        window.addEventListener('click', (event) => { 
            if (event.target == emphasisModal) emphasisModal.style.display = 'none'; 
            if (event.target == devModeModal && devModalCloseable.backdrop) devModeModal.style.display = 'none'; 
            if (event.target == backupModal) backupModal.style.display = 'none';
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                emphasisModal.style.display = 'none';
                if (devModalCloseable.backdrop) devModeModal.style.display = 'none';
                backupModal.style.display = 'none';
            }
        });

        // v48 Persistence Debug: Added logging to the click listener
        emphasisModal.addEventListener('click', (e) => { const target = e.target.closest('.emphasis-item-hide'); if (!target) return; const { key, carrier } = target.dataset; const state = appState[carrier].emphasis.get(key) || { partial: false, full: false, hidden: false }; 
        
        // V48 Log
        debugLog(`HIDE CLICK: Key '${key}' | Pre-State: ${JSON.stringify(state)}`, "sys");

        state.hidden = !state.hidden; appState[carrier].emphasis.set(key, state); const parentItem = target.closest('.emphasis-item'); parentItem.classList.toggle('item-hidden'); parentItem.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.disabled = state.hidden); target.innerHTML = state.hidden ? SHOW_ICON_SVG : HIDE_ICON_SVG; updateMasterHideIcon(); saveSettings(); });
        
        emphasisModal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (document.activeElement && (document.activeElement.classList.contains('emphasis-item-hide') || document.activeElement.id === 'unhide-all-btn')) {
                    e.preventDefault();
                    document.activeElement.click();
                }
            }
        });
        // v40: Updated fallback object in change listener
        emphasisModal.addEventListener('change', (e) => { const target = e.target; if (target.type !== 'checkbox') return; const isMaster = target.id.startsWith('master-'); if (isMaster) { const masterType = target.id.includes('partial') ? 'partial' : 'full'; const isChecking = target.checked; const allItems = emphasisModal.querySelectorAll('.emphasis-item:not(.item-hidden)'); allItems.forEach(item => { const partialBox = item.querySelector('[data-type="partial"]'); const fullBox = item.querySelector('[data-type="full"]'); const key = partialBox.dataset.key; const carrier = partialBox.dataset.carrier; const state = appState[carrier].emphasis.get(key) || { partial: false, full: false, hidden: false }; if (masterType === 'partial') { partialBox.checked = isChecking; state.partial = isChecking; if (!isChecking) { fullBox.checked = false; state.full = false; } } else { fullBox.checked = isChecking; state.full = isChecking; if (isChecking) { partialBox.checked = true; state.partial = true; } } appState[carrier].emphasis.set(key, state); }); const masterPartial = document.getElementById('master-partial-checkbox'); const masterFull = document.getElementById('master-full-checkbox'); if (masterType === 'full' && isChecking) masterPartial.checked = true; if (masterType === 'partial' && !isChecking) masterFull.checked = false; } else if (target.dataset.key) { const { key, carrier, type } = target.dataset; const state = appState[carrier].emphasis.get(key) || { partial: false, full: false, hidden: false }; state[type] = target.checked; const parentItem = target.closest('.emphasis-item'); if (parentItem) { const partialBox = parentItem.querySelector('[data-type="partial"]'); const fullBox = parentItem.querySelector('[data-type="full"]'); if (type === 'full' && target.checked) { state.partial = true; if (partialBox) partialBox.checked = true; } if (type === 'partial' && !target.checked) { state.full = false; if (fullBox) fullBox.checked = false; } } appState[carrier].emphasis.set(key, state); } saveSettings(); });
        
        let clickCount = 0, lastClick = 0;
        versionText.addEventListener('click', () => { const now = Date.now(); if (now - lastClick > 500) { clickCount = 0; } lastClick = now; clickCount++; if (clickCount === 7) { devModalCloseable.button = false; devModalCloseable.backdrop = false; devModeModal.style.display = 'flex'; setTimeout(() => { devModalCloseable.button = true; }, 500); setTimeout(() => { devModalCloseable.backdrop = true; }, 1000); clickCount = 0; } });
        
        commentsInput.addEventListener('beforeinput', (e) => {
            if (e.data && /[^\x00-\x7F]/.test(e.data)) {
                e.preventDefault();
            }
        });

        commentsInput.addEventListener('input', (e) => { 
            const konami = "upupdowndownleftrightleftrightba"; 
            const input = e.target.textContent.toLowerCase().replace(/[^a-z0-9]/g, ''); 
            konamiMessage.style.display = input.includes(konami) ? 'block' : 'none'; 
            
            // Ghost Text Fix
            if (commentsInput.innerHTML === '<br>' || commentsInput.innerHTML.trim() === '') {
                commentsInput.innerHTML = '';
            }
        });

        commentsInput.addEventListener('paste', (e) => {
            e.preventDefault();
            let text = (e.originalEvent || e).clipboardData.getData('text/plain');
            text = text.replace(/[^\x00-\x7F]/g, ''); // Bouncer
            document.execCommand('insertText', false, text);
        });

        commentsInput.addEventListener('blur', () => {
            // Ghost Text Fix on blur & Auto-Shrink
            if (commentsInput.innerHTML === '<br>' || commentsInput.innerHTML.trim() === '') {
                commentsInput.innerHTML = '';
            }
            commentsInput.scrollTop = 0;
        });

        // --- RICH TEXT V2 (BUBBLE & STICKY) ---
        const rtBubble = document.getElementById('rt-bubble');
        const rtSticky = document.getElementById('rt-sticky');
        const isMobileRT = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const updateActiveButtons = () => {
            const commands = ['bold', 'italic', 'underline'];
            const containers = [rtBubble, rtSticky];
            containers.forEach(container => {
                if (!container) return;
                commands.forEach(cmd => {
                    const btn = container.querySelector(`[data-command="${cmd}"]`);
                    if (btn) {
                        if (document.queryCommandState(cmd)) btn.classList.add('active');
                        else btn.classList.remove('active');
                    }
                });
            });
        };

        document.addEventListener('selectionchange', () => {
            if (document.activeElement !== commentsInput) {
                rtBubble.classList.remove('visible');
                return;
            }
            updateActiveButtons();
            if (!isMobileRT) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0 && !selection.isCollapsed) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    rtBubble.style.top = `${rect.top - 40}px`;
                    rtBubble.style.left = `${rect.left + (rect.width / 2)}px`;
                    rtBubble.classList.add('visible');
                } else {
                    rtBubble.classList.remove('visible');
                }
            }
        });

        if (isMobileRT && window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                const vv = window.visualViewport;
                if (document.activeElement === commentsInput && vv.height < window.innerHeight - 100) {
                    rtSticky.style.top = `${vv.offsetTop + vv.height - 35}px`;
                    rtSticky.classList.add('visible');
                } else {
                    rtSticky.classList.remove('visible');
                }
            });
            commentsInput.addEventListener('focus', () => {
                setTimeout(() => {
                    const vv = window.visualViewport;
                    if (vv.height < window.innerHeight - 100) {
                        rtSticky.style.top = `${vv.offsetTop + vv.height - 35}px`;
                        rtSticky.classList.add('visible');
                    }
                }, 300);
            });
            commentsInput.addEventListener('blur', () => {
                setTimeout(() => rtSticky.classList.remove('visible'), 100);
            });
        }

        document.querySelectorAll('.rt-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent losing focus
                document.execCommand(btn.dataset.command, false, null);
                updateActiveButtons();
            });
        });

        commentsInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                if (e.key === 'b') { e.preventDefault(); document.execCommand('bold', false, null); }
                if (e.key === 'i') { e.preventDefault(); document.execCommand('italic', false, null); }
                if (e.key === 'u') { e.preventDefault(); document.execCommand('underline', false, null); }
            }
        });

        // Global Keyboard Accessibility for TabIndex elements
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.getAttribute('tabindex') === '0') {
                e.preventDefault();
                document.activeElement.click();
            }
        });

        // --- INTERACTIVE TUTORIAL LOGIC ---
        window.setHeight = function(element, height) { element.style.maxHeight = height + 'px'; };
        window.closeAccordion = function(element) {
            if (!element.classList.contains('open')) return;
            window.setHeight(element, element.scrollHeight);
            element.classList.remove('open');
            requestAnimationFrame(function() { window.setHeight(element, 0); });
        };
        window.openAccordion = function(element) {
            if (element.classList.contains('open')) return;
            element.classList.add('open');
            window.setHeight(element, element.scrollHeight);
            element.addEventListener('transitionend', function onTransitionEnd() {
                if (element.classList.contains('open')) element.style.maxHeight = 'none';
                element.removeEventListener('transitionend', onTransitionEnd);
            });
        };
        window.toggleAccordion = function(contentId, headerElement) {
            const targetContentElement = document.getElementById(contentId);
            if (!targetContentElement) return;
            const isOpening = !targetContentElement.classList.contains('open');
            if (isOpening) {
                if (!targetContentElement.classList.contains('step-list')) {
                    const parentContainer = targetContentElement.closest('.tutorial-container') || document;
                    parentContainer.querySelectorAll('.expandable.open').forEach(function (openContent) {
                        if (!openContent.contains(targetContentElement) && !openContent.classList.contains('step-list')) {
                            window.closeAccordion(openContent);
                        }
                    });
                }
                window.openAccordion(targetContentElement);
            } else {
                const childrenToClose =[targetContentElement, ...targetContentElement.querySelectorAll('.expandable.open')];
                childrenToClose.forEach(window.closeAccordion);
            }
            if (headerElement && (headerElement.classList.contains('main-header') || headerElement.classList.contains('trigger-link'))) {
                headerElement.classList.toggle('open', isOpening);
            }
        };
        
        const mainSteps = document.getElementById('main-steps');
        if (mainSteps && mainSteps.classList.contains('open')) {
            mainSteps.style.maxHeight = mainSteps.scrollHeight + 'px';
        }

        // (v107 Advanced Settings Toggle removed - now handled by native toggleAccordion logic)

        // Terms of Use Modal Logic
        const termsLink = document.getElementById('terms-link');
        const termsModal = document.getElementById('terms-modal');
        const termsOkBtn = document.getElementById('terms-ok-btn');

        if (termsLink && termsModal && termsOkBtn) {
            termsLink.addEventListener('click', (e) => {
                e.preventDefault();
                termsModal.style.display = 'flex';
            });
            
            termsOkBtn.addEventListener('click', () => {
                termsModal.style.display = 'none';
            });

            // Close on outside click
            window.addEventListener('click', (e) => {
                if (e.target === termsModal) {
                    termsModal.style.display = 'none';
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && termsModal.style.display === 'flex') {
                    termsModal.style.display = 'none';
                }
            });
        }

        // Initial load of settings from localStorage
        loadSettings();
        fetchLivePricing(); // v33: Fetch from Stable Repo

        // --- CLOUD INVENTORY FETCHER & INJECTOR ---
        window.fetchCloudInventory = async () => {
            try {
                const url = `https://cdn.jsdelivr.net/gh/spamfan/optimizer@main/inventory_data.json?t=${Date.now()}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Fetch failed");
                const data = await res.json();
                if (data && data.inventory) {
                    window.cloudInventoryData = data.inventory;
                }
            } catch (err) {
                console.warn("Cloud Inventory fetch failed:", err);
            }
        };

        const loadCloudStore = async (storeNum) => {
            isEdlpIndexMode = false;
            const storeData = window.cloudInventoryData ? window.cloudInventoryData[storeNum] : null;
            const emptyCloudMsg = document.getElementById('empty-cloud-message');
            
            if (!storeData) {
                if (emptyCloudMsg) emptyCloudMsg.style.visibility = 'visible';
                ['att', 'vzw', 'tmo'].forEach(c => {
                    appState[c].consolidatedList = [];
                    appState[c].autoHidden = [];
                    appState[c].fileDate = '';
                    appState[c].storeNumber = '';
                    const sec = document.getElementById(`${c}-status`);
                    if (sec) {
                        sec.querySelector('.status-filename').textContent = "None found";
                        sec.querySelector('.status-filename').style.color = "#8d949e";
                    }
                });
                return;
            }

            try {
                if (emptyCloudMsg) emptyCloudMsg.style.visibility = 'hidden';
                ['att', 'vzw', 'tmo'].forEach(c => {
                    const sec = document.getElementById(`${c}-status`);
                    if (sec) {
                        sec.querySelector('.status-filename').textContent = "Loading...";
                        sec.querySelector('.status-filename').style.color = "#8d949e";
                    }
                });
            } catch (e) {}

            await new Promise(resolve => setTimeout(resolve, 50));

            hasWatches = false;
            let validFilesCount = 0;

            for (const c of ['ATT', 'VZW', 'TMO']) {
                const carrier = c.toLowerCase();
                const statusSection = document.getElementById(`${carrier}-status`);
                if (storeData[c] && storeData[c].text) {
                    try {
                        const text = storeData[c].text;
                        const parsedCarrier = categorizePdf(text);
                        const targetCarrier = parsedCarrier !== 'unknown' ? parsedCarrier : carrier;
                        const targetSection = document.getElementById(`${targetCarrier}-status`);

                        appState[targetCarrier].fileDate = '';
                        appState[targetCarrier].storeNumber = '';
                        appState[targetCarrier].consolidatedList = [];
                        appState[targetCarrier].autoHidden = [];

                        const dateMatch = text.match(/Date:\s*(.*?)(?=\s+Store)/);
                        if (dateMatch && dateMatch[1]) appState[targetCarrier].fileDate = dateMatch[1].trim();
                        
                        const storeMatch = text.match(/Store:\s*(\d+)/);
                        if (storeMatch && storeMatch[1]) appState[targetCarrier].storeNumber = storeMatch[1].trim();

                        let isExpired = false;
                        if (appState[targetCarrier].fileDate) {
                            const datePart = appState[targetCarrier].fileDate.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(:\d{2})?\s+[AP]M)/i);
                            if (datePart) {
                                const fileTime = new Date(datePart[0]).getTime();
                                const hoursOld = (Date.now() - fileTime) / (1000 * 60 * 60);
                                if (Math.abs(hoursOld) >= 8) {
                                    isExpired = true;
                                }
                            }
                        }

                        if (isExpired) {
                            appState[targetCarrier].consolidatedList = [];
                            appState[targetCarrier].autoHidden = [];
                            targetSection.querySelector('.status-filename').textContent = "None found";
                            targetSection.querySelector('.status-filename').style.color = "#8d949e";
                        } else {
                            const { preFilterList, postFilterList, autoHidden } = parseInventoryText(text);
                            appState[targetCarrier].consolidatedList = consolidateInventory(postFilterList);
                            appState[targetCarrier].autoHidden = autoHidden;
                            targetSection.querySelector('.status-filename').textContent = `Cloud File - ${c}`;
                            targetSection.querySelector('.status-filename').style.color = ""; 
                            validFilesCount++;
                        }

                        const fileHasWatches = postFilterList && postFilterList.some(item => item[0].startsWith('AW ') || item[0].toLowerCase().includes('apple watch'));
                        if (fileHasWatches) hasWatches = true;

                    } catch (err) {
                        debugLog(`❌ Cloud Parse CRASH: ${err.message}`, 'sys');
                    }
                } else {
                    if (statusSection) {
                        statusSection.querySelector('.status-filename').textContent = "None found";
                        statusSection.querySelector('.status-filename').style.color = "#8d949e";
                    }
                }
            }

            if (validFilesCount === 0 && emptyCloudMsg) {
                emptyCloudMsg.style.visibility = 'visible';
            } else if (emptyCloudMsg) {
                emptyCloudMsg.style.visibility = 'hidden';
            }

            const wearablesToggle = document.getElementById('show-wearables-toggle');
            const wearablesLabel = document.getElementById('wearables-label');
            if (hasWatches) {
                wearablesToggle.disabled = false;           
                wearablesLabel.textContent = TRANSLATIONS[currentLang].ui.showWearables || 'Show wearables';
                wearablesToggle.parentElement.classList.remove('disabled');
                const savedSettings = JSON.parse(localStorage.getItem('betterInvSettings') || '{}');
                wearablesToggle.checked = (savedSettings.showWearables !== undefined) ? savedSettings.showWearables : true;
            } else {
                wearablesToggle.checked = true;
                wearablesToggle.disabled = true;
                wearablesLabel.textContent = TRANSLATIONS[currentLang].ui.showWearablesNA || 'Show wearables (not applicable)';
                wearablesToggle.parentElement.classList.add('disabled');
            }

            let hasOutdatedFile = false;
            ['att', 'vzw', 'tmo'].forEach(c => {
                if (appState[c].consolidatedList.length > 0 && appState[c].fileDate) {
                    try {
                        const datePart = appState[c].fileDate.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(:\d{2})?\s+[AP]M)/i);
                        if (datePart) {
                            const fileTime = new Date(datePart[0]).getTime();
                            const hoursOld = (Date.now() - fileTime) / (1000 * 60 * 60);
                            if (Math.abs(hoursOld) >= 4) hasOutdatedFile = true;
                        }
                    } catch(e) {}
                }
            });
            const warningEl = document.getElementById('global-outdated-warning');
            if (warningEl) warningEl.style.display = hasOutdatedFile ? 'flex' : 'none';

            try { document.querySelectorAll('.skeleton-box').forEach(el => el.remove()); } catch(e) {}
        };

        // --- GATEKEEPER (DYNAMIC SECRET LOGIC) ---
        const SECRET_SUFFIX = atob('MTAyMA==');
        const storeInput = document.getElementById('store-input');
        const pinInput = document.getElementById('pin-input');
        const btnEnter = document.getElementById('btn-enter');
        const pinError = document.getElementById('pin-error');
        const loginView = document.getElementById('login-view');
        const appContainer = document.getElementById('app-container');

        const checkPin = async () => {
            const storeVal = storeInput.value.trim();
            const pinVal = pinInput.value.trim();
            
            if (storeVal && pinVal === storeVal + SECRET_SUFFIX) {
                localStorage.setItem('lastStore', storeVal);
                pinInput.value = '';
                loginView.style.display = 'none';
                appContainer.style.display = 'block';
                pinError.style.display = 'none';
                
                if (window.fetchCloudInventory) {
                    await window.fetchCloudInventory();
                    if (window.cloudInventoryData) {
                        loadCloudStore(storeVal);
                    }
                }
            } else {
                pinError.style.display = 'block';
                pinInput.value = '';
                pinInput.focus();
            }
        };

        // Auto-fill and focus
        const lastStore = localStorage.getItem('lastStore');
        if (lastStore) {
            storeInput.value = lastStore;
            // Force a slight delay to ensure DOM is ready, then forcibly focus. 
            // Note: Mobile OS may still suppress keyboard without physical tap, but cursor will be staged.
            setTimeout(() => {
                pinInput.focus();
                try { pinInput.select(); } catch(e){}
            }, 150);
        }

        storeInput.addEventListener('input', (e) => {
            if (e.target.value.trim().length === 4) {
                pinInput.focus();
            }
        });

        btnEnter.addEventListener('click', checkPin);
        
        pinInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') checkPin();
        });
        
        pinInput.addEventListener('input', (e) => {
            const storeVal = storeInput.value.trim();
            const pinVal = e.target.value.trim();
            if (storeVal && pinVal === storeVal + SECRET_SUFFIX) {
                e.target.blur();
                checkPin();
            }
        });
    });
    