"use strict";

// Auth gating
(() => {
  const token = localStorage.getItem('sv_token');
  if (!token) {
    // redirect back to landing if unauthenticated
    window.location.href = '../landing/index.html';
    return;
  }
  const emailSpan = document.getElementById('userEmail');
  fetch('http://localhost:5000/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(async r => {
    if (!r.ok) { localStorage.removeItem('sv_token'); window.location.href='../landing/index.html'; return; }
    const data = await r.json();
    if (emailSpan) {
      const email = data.email || 'User';
      emailSpan.textContent = `Welcome ${email}`;
    }
  }).catch(() => { localStorage.removeItem('sv_token'); window.location.href='../landing/index.html'; });
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('sv_token');
    window.location.href = '../landing/index.html';
  });
  // Toggle analytics on user email click
  emailSpan?.addEventListener('click', () => {
    const panel = document.getElementById('userAnalyticsPanel');
    if (!panel) return;
    const hidden = panel.getAttribute('aria-hidden') === 'true';
    panel.setAttribute('aria-hidden', hidden ? 'false' : 'true');
    if (!hidden) return; // if going to visible, refresh analytics
    loadUserAnalytics();
  });
})();

// Global state
let isSorting = false;
let comparisons = 0;
let swaps = 0;
let startTime = 0;
let completedAlgorithmName = '';

// UI Elements
const algoSelect = document.querySelector(".algo-menu");
const sizeSelect = document.querySelector(".size-menu");
const speedSelect = document.querySelector(".speed-menu");
const startBtn = document.querySelector(".start");
const randomBtn = document.querySelector("#random");
const statusEl = document.querySelector("#status");
const algoEl = document.querySelector("#current-algo");
const comparisonsEl = document.querySelector("#comparisons");
const swapsEl = document.querySelector("#swaps");
const timeEl = document.querySelector("#time");

// Algorithm names
const algoNames = {
  0: "Select Algorithm",
  1: "Bubble Sort",
  2: "Selection Sort",
  3: "Insertion Sort",
  4: "Merge Sort",
  5: "Quick Sort"
};

// Reset stats
const resetStats = () => {
  comparisons = 0;
  swaps = 0;
  startTime = Date.now();
  updateStats();
};

// Update stats display
const updateStats = () => {
  comparisonsEl.textContent = comparisons;
  swapsEl.textContent = swaps;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  timeEl.textContent = `${elapsed}s`;
};

// Update status
const setStatus = (text, type = 'ready') => {
  statusEl.textContent = text;
  statusEl.style.background = type === 'sorting' ? '#f59e0b' : 
                              type === 'done' ? '#10b981' : 
                              '#6366f1';
};

// Disable controls during sorting
const toggleControls = (disabled) => {
  algoSelect.disabled = disabled;
  sizeSelect.disabled = disabled;
  speedSelect.disabled = disabled;
  randomBtn.disabled = disabled;
  startBtn.disabled = disabled;
  
  if (disabled) {
    startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sorting...';
  } else {
    startBtn.innerHTML = '<i class="fas fa-play"></i> Start Sort';
  }
};

// Start sorting
const start = async () => {
  if (isSorting) return;
  
  let algoValue = Number(algoSelect.value);
  let speedValue = Number(speedSelect.value);

  if (speedValue === 0) speedValue = 1;
  
  if (algoValue === 0) {
    setStatus("Please select an algorithm", "ready");
    algoSelect.focus();
    algoSelect.style.borderColor = '#ef4444';
    setTimeout(() => {
      algoSelect.style.borderColor = '';
    }, 1000);
    return;
  }

  isSorting = true;
  toggleControls(true);
  resetStats();
  setStatus(`Sorting with ${algoNames[algoValue]}`, 'sorting');
  completedAlgorithmName = algoNames[algoValue];

  let algorithm = new sortAlgorithms(speedValue);
  
  try {
    if (algoValue === 1) await algorithm.BubbleSort();
    if (algoValue === 2) await algorithm.SelectionSort();
    if (algoValue === 3) await algorithm.InsertionSort();
    if (algoValue === 4) await algorithm.MergeSort();
    if (algoValue === 5) await algorithm.QuickSort();
    
    setStatus("Sorting Complete!", 'done');
    updateStats();
    // Push analytics to backend
    const token = localStorage.getItem('sv_token');
    if (token) {
      const elapsedMs = Date.now() - startTime;
      fetch('http://localhost:5000/api/analytics/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          comparisons,
            swaps,
            timeMs: elapsedMs,
            algorithm: completedAlgorithmName
        })
      }).then(() => {
        loadUserAnalytics();
      }).catch(() => {});
    }
  } catch (error) {
    console.error("Sorting error:", error);
    setStatus("Error during sorting", 'ready');
  } finally {
    isSorting = false;
    toggleControls(false);
  }
};

// Render screen
const RenderScreen = async () => {
  if (isSorting) return;
  await RenderList();
};

// Render list
const RenderList = async () => {
  let sizeValue = Number(sizeSelect.value);
  if (!sizeValue || sizeValue <= 0) sizeValue = 30;
  
  await clearScreen();

  let list = await randomList(sizeValue);
  const arrayNode = document.querySelector(".array");
  
  for (const element of list) {
    const node = document.createElement("div");
    node.className = "cell";
    node.setAttribute("value", String(element));
    node.style.height = `${3.8 * element}px`;
    
    // Add number label below the bar
    const label = document.createElement("span");
    label.className = "cell-label";
    label.textContent = element;
    node.appendChild(label);
    
    arrayNode.appendChild(node);
  }
  
  resetStats();
  setStatus("Ready to sort", 'ready');
};

// Generate random list
const randomList = async (Length) => {
  let list = [];
  let lowerBound = 1;
  let upperBound = 100;

  for (let counter = 0; counter < Length; ++counter) {
    let randomNumber = Math.floor(
      Math.random() * (upperBound - lowerBound + 1) + lowerBound
    );
    list.push(parseInt(randomNumber));
  }
  return list;
};

// Clear screen
const clearScreen = async () => {
  document.querySelector(".array").innerHTML = "";
};

// Event listeners
startBtn.addEventListener("click", (e) => {
  e.preventDefault();
  start();
});

randomBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (!isSorting) {
    RenderScreen();
  }
});

sizeSelect.addEventListener("change", (e) => {
  e.preventDefault();
  if (!isSorting) {
    RenderScreen();
  }
});

algoSelect.addEventListener("change", (e) => {
  e.preventDefault();
  const algoValue = Number(algoSelect.value);
  algoEl.textContent = algoNames[algoValue];
  if (algoValue !== 0 && !isSorting) {
    setStatus(`Ready to sort with ${algoNames[algoValue]}`, 'ready');
  }
});

speedSelect.addEventListener("change", (e) => {
  e.preventDefault();
});

// Initialize on load
window.onload = () => {
  // Set default values
  if (!sizeSelect.value || Number(sizeSelect.value) === 0) {
    sizeSelect.value = "30";
  }
  if (!speedSelect.value || Number(speedSelect.value) === 0) {
    speedSelect.value = "1";
  }
  
  // Update algorithm display
  algoEl.textContent = algoNames[Number(algoSelect.value)];
  
  // Initial render
  RenderScreen();
  
  // Update time every 100ms during sorting
  setInterval(() => {
    if (isSorting) {
      updateStats();
    }
  }, 100);
};

// Export for use in helper
window.incrementComparisons = () => comparisons++;
window.incrementSwaps = () => swaps++;

// Load user analytics from backend
const loadUserAnalytics = () => {
  const token = localStorage.getItem('sv_token');
  if (!token) return;
  fetch('http://localhost:5000/api/analytics', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(async r => {
    if (!r.ok) return;
    const data = await r.json();
    document.getElementById('ua-total-sorts').textContent = data.sortsCount ?? 0;
    document.getElementById('ua-total-comparisons').textContent = data.totalComparisons ?? 0;
    document.getElementById('ua-total-swaps').textContent = data.totalSwaps ?? 0;
    const totalSeconds = ((data.totalTimeMs || 0) / 1000).toFixed(1);
    document.getElementById('ua-total-time').textContent = `${totalSeconds}s`;
    const usage = data.algoUsage || {};
    document.getElementById('ua-algo-bubble').textContent = usage.Bubble ?? 0;
    document.getElementById('ua-algo-selection').textContent = usage.Selection ?? 0;
    document.getElementById('ua-algo-insertion').textContent = usage.Insertion ?? 0;
    document.getElementById('ua-algo-merge').textContent = usage.Merge ?? 0;
    document.getElementById('ua-algo-quick').textContent = usage.Quick ?? 0;
  }).catch(() => {});
};

// Initial load after screen render
setTimeout(loadUserAnalytics, 300);
