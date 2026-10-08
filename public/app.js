/**
 * EduCase Pro - School Management & Geospatial Proximity Engine
 * Frontend Controller & Integration
 */

// ==========================================================================
// Default Seed Data (Delhi NCR Education Hub & Surrounding)
// ==========================================================================
const DEFAULT_SEED_SCHOOLS = [
  {
    id: 1,
    name: "Delhi Public School, R.K. Puram",
    address: "Sector 12, RK Puram, New Delhi - 110022",
    latitude: 28.5683,
    longitude: 77.1717
  },
  {
    id: 2,
    name: "Modern School, Barakhamba Road",
    address: "Barakhamba Road, Connaught Place, New Delhi - 110001",
    latitude: 28.6275,
    longitude: 77.2289
  },
  {
    id: 3,
    name: "Sanskriti School",
    address: "Dr S Radhakrishnan Marg, Chanakyapuri, New Delhi - 110021",
    latitude: 28.5898,
    longitude: 77.1856
  },
  {
    id: 4,
    name: "The Mother's International School",
    address: "Sri Aurobindo Marg, Vijay Mandal Enclave, New Delhi - 110016",
    latitude: 28.5398,
    longitude: 77.2037
  },
  {
    id: 5,
    name: "Step by Step School",
    address: "Plot A-10, Sector 132, Expressway, Noida, UP - 201304",
    latitude: 28.5028,
    longitude: 77.3820
  },
  {
    id: 6,
    name: "Amity International School",
    address: "Sector 44, Noida, Uttar Pradesh - 201303",
    latitude: 28.5542,
    longitude: 77.3385
  },
  {
    id: 7,
    name: "The Shri Ram School, Vasant Vihar",
    address: "D-Block, Vasant Vihar, New Delhi - 110057",
    latitude: 28.5584,
    longitude: 77.1592
  },
  {
    id: 8,
    name: "Springdales School, Dhaula Kuan",
    address: "Benito Juarez Marg, Dhaula Kuan, New Delhi - 110021",
    latitude: 28.5912,
    longitude: 77.1610
  },
  {
    id: 9,
    name: "Shiv Nadar School",
    address: "Sector 168, Express Way, Noida, UP - 201305",
    latitude: 28.4901,
    longitude: 77.4082
  },
  {
    id: 10,
    name: "The Heritage School",
    address: "Sector 62, Gurgaon, Haryana - 122011",
    latitude: 28.4038,
    longitude: 77.0862
  }
];

// ==========================================================================
// Application State
// ==========================================================================
const state = {
  // Current user / origin coordinates (defaults to Noida / Delhi NCR from postman spec)
  originLat: 28.5355,
  originLng: 77.3910,

  // All schools loaded (either from backend or local sandbox)
  allSchools: [],
  filteredSchools: [],
  selectedSchoolId: null,

  // Filter & Search
  searchQuery: '',
  maxRadius: 100, // km, 100 means 'no limit'
  sortBy: 'distance-asc',
  viewMode: 'cards', // 'cards' | 'table'

  // Backend Integration
  backendUrl: localStorage.getItem('educase_backend_url') || (window.location.protocol.startsWith('http') ? window.location.origin : 'http://localhost:3000'),
  isBackendConnected: false,
  isDemoMode: false,

  // Map picking mode
  mapPickingMode: null, // null | 'origin' | 'school'

  // Map theme
  mapTheme: 'dark' // 'dark' | 'light'
};

// Map & Layer References
let map = null;
let tileLayer = null;
let userMarker = null;
let schoolMarkersGroup = null;
let distancePolyline = null;

// ==========================================================================
// Haversine Distance Formula (Exact Match to schoolController.js)
// ==========================================================================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMap();
  bindDomEvents();
  loadSchoolsData();
});

// ==========================================================================
// Theme Management
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('educase_theme') || 'theme-dark';
  document.body.className = savedTheme;
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains('theme-dark');
  const newTheme = isDark ? 'theme-light' : 'theme-dark';
  document.body.className = newTheme;
  localStorage.setItem('educase_theme', newTheme);
  updateThemeIcon(newTheme);

  // Switch map tiles accordingly if map is loaded
  if (map) {
    state.mapTheme = isDark ? 'light' : 'dark';
    updateMapTileLayer();
  }
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  if (theme === 'theme-light') {
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>`;
    btn.title = "Switch to Dark Theme";
  } else {
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>`;
    btn.title = "Switch to Light Theme";
  }
}

// ==========================================================================
// Leaflet Map Setup
// ==========================================================================
function initMap() {
  if (typeof L === 'undefined') {
    console.error('Leaflet library failed to load.');
    return;
  }

  // Create Leaflet map centered at user's origin
  map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView([state.originLat, state.originLng], 12);

  // Add zoom control to top-left
  L.control.zoom({ position: 'topleft' }).addTo(map);

  // Add attribution control to bottom-right
  L.control.attribution({ position: 'bottomright', prefix: false })
    .addAttribution('&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors')
    .addTo(map);

  // Layer groups
  schoolMarkersGroup = L.featureGroup().addTo(map);

  // Add tile layer
  updateMapTileLayer();

  // Render User Location Pin
  renderUserMarker();

  // Click handler on map
  map.on('click', handleMapClick);
}

function updateMapTileLayer() {
  if (tileLayer) {
    map.removeLayer(tileLayer);
  }

  const isDark = state.mapTheme === 'dark';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  tileLayer = L.tileLayer(tileUrl, {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);
}

// Custom Leaflet Icons
function createUserIcon() {
  return L.divIcon({
    className: 'custom-pin-user-wrapper',
    html: `
      <div class="custom-pin-user">
        <div class="user-pulse-beacon"></div>
        <div class="user-center-dot"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

function createSchoolIcon(isSelected = false) {
  return L.divIcon({
    className: `custom-school-marker ${isSelected ? 'active-pin' : ''}`,
    html: `
      <div class="school-pin-badge">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 36],
    popupAnchor: [0, -36]
  });
}

function renderUserMarker() {
  if (userMarker) {
    userMarker.setLatLng([state.originLat, state.originLng]);
  } else {
    userMarker = L.marker([state.originLat, state.originLng], {
      icon: createUserIcon(),
      zIndexOffset: 1000
    }).addTo(map);

    userMarker.bindTooltip("Your Location (Origin)", {
      direction: 'top',
      offset: [0, -14],
      className: 'coords-tooltip'
    });
  }
}

function handleMapClick(e) {
  const { lat, lng } = e.latlng;
  const formattedLat = parseFloat(lat.toFixed(5));
  const formattedLng = parseFloat(lng.toFixed(5));

  // If in school coordinates picker mode (from modal)
  if (state.mapPickingMode === 'school') {
    document.getElementById('newSchoolLat').value = formattedLat;
    document.getElementById('newSchoolLng').value = formattedLng;
    openAddModal();
    state.mapPickingMode = null;
    showToast(`Pinned coordinates: ${formattedLat}, ${formattedLng}`, 'info');
    return;
  }

  // Otherwise: update User Origin coordinates!
  setOriginCoordinates(formattedLat, formattedLng, 'Custom Map Pin');
  showToast(`Updated origin location to ${formattedLat}, ${formattedLng}`, 'info');
}

// ==========================================================================
// School Markers & Map Geometry
// ==========================================================================
function refreshMapMarkers() {
  if (!map || !schoolMarkersGroup) return;

  schoolMarkersGroup.clearLayers();

  state.filteredSchools.forEach(school => {
    const isSelected = school.id === state.selectedSchoolId;
    const marker = L.marker([school.latitude, school.longitude], {
      icon: createSchoolIcon(isSelected),
      riseOnHover: true
    });

    const distStr = typeof school.distance === 'number' ? school.distance.toFixed(2) : '--';

    const popupHtml = `
      <div class="popup-card">
        <h4 class="popup-title">${escapeHtml(school.name)}</h4>
        <p class="popup-address">${escapeHtml(school.address)}</p>
        <div class="popup-distance">
          <span>Proximity:</span>
          <strong>${distStr} km away</strong>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);

    marker.on('click', () => {
      selectSchool(school.id);
    });

    schoolMarkersGroup.addLayer(marker);
  });

  // If a school was selected, draw the geodesic distance line
  updateDistanceLine();
}

function updateDistanceLine() {
  if (distancePolyline) {
    map.removeLayer(distancePolyline);
    distancePolyline = null;
  }

  if (!state.selectedSchoolId) {
    document.getElementById('mapInfoBanner').classList.add('hidden');
    return;
  }

  const school = state.allSchools.find(s => s.id === state.selectedSchoolId);
  if (!school) return;

  const latlngs = [
    [state.originLat, state.originLng],
    [school.latitude, school.longitude]
  ];

  distancePolyline = L.polyline(latlngs, {
    color: '#06b6d4',
    weight: 3,
    dashArray: '6, 8',
    opacity: 0.85
  }).addTo(map);

  const distKm = typeof school.distance === 'number' ? school.distance.toFixed(2) : calculateDistance(state.originLat, state.originLng, school.latitude, school.longitude).toFixed(2);

  // Update floating info banner
  const banner = document.getElementById('mapInfoBanner');
  banner.classList.remove('hidden');
  document.getElementById('bannerBadge').textContent = `${distKm} km`;
  document.getElementById('bannerText').innerHTML = `Direct distance from origin to <strong>${escapeHtml(school.name)}</strong>`;
}

// ==========================================================================
// Backend API Integration & Fallback Engine
// ==========================================================================
async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    // Try pinging the health endpoint or listSchools
    const res = await fetch(`${state.backendUrl}/listSchools?latitude=${state.originLat}&longitude=${state.originLng}`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      state.isBackendConnected = true;
      updateConnectionStatusBadge('online', `Backend Live (${state.backendUrl})`);
      return true;
    } else {
      state.isBackendConnected = false;
      updateConnectionStatusBadge('demo', 'Demo Mode (Backend Error)');
      return false;
    }
  } catch (err) {
    state.isBackendConnected = false;
    updateConnectionStatusBadge('demo', 'Demo Sandbox (Offline)');
    return false;
  }
}

async function loadSchoolsData() {
  updateConnectionStatusBadge('checking', 'Connecting...');

  const isLive = !state.isDemoMode && (await checkBackendHealth());

  if (isLive) {
    try {
      const res = await fetch(`${state.backendUrl}/listSchools?latitude=${state.originLat}&longitude=${state.originLng}`);
      if (res.ok) {
        const body = await res.json();
        // Backend returns: { message: "...", count: N, data: [...] }
        state.allSchools = Array.isArray(body.data) ? body.data : [];
        updateConnectionStatusBadge('online', `Backend Live (${state.backendUrl})`);
        applyFiltersAndRender();
        return;
      }
    } catch (e) {
      console.warn('Failed to load from backend, switching to demo store', e);
    }
  }

  // Fallback / Demo Sandbox Mode
  loadDemoStorageSchools();
  applyFiltersAndRender();
}

function loadDemoStorageSchools() {
  const localData = localStorage.getItem('educase_demo_schools');
  if (localData) {
    try {
      state.allSchools = JSON.parse(localData);
    } catch (e) {
      state.allSchools = [...DEFAULT_SEED_SCHOOLS];
    }
  } else {
    state.allSchools = [...DEFAULT_SEED_SCHOOLS];
    saveDemoStorageSchools();
  }

  // Compute distance for all local schools using Haversine
  recomputeLocalDistances();
}

function saveDemoStorageSchools() {
  localStorage.setItem('educase_demo_schools', JSON.stringify(state.allSchools));
}

function recomputeLocalDistances() {
  state.allSchools = state.allSchools.map(school => {
    const distance = calculateDistance(state.originLat, state.originLng, school.latitude, school.longitude);
    return { ...school, distance };
  });
}

function updateConnectionStatusBadge(status, text) {
  const badge = document.getElementById('connectionBadge');
  const dot = document.getElementById('statusDot');
  const label = document.getElementById('statusText');

  dot.className = 'status-dot';

  if (status === 'online') {
    dot.classList.add('online');
    label.textContent = text || 'Backend Live';
    badge.title = 'Connected to Node/Express MySQL backend';
  } else if (status === 'demo') {
    dot.classList.add('demo');
    label.textContent = text || 'Demo Sandbox';
    badge.title = 'Running in Demo Sandbox with client Haversine calculations';
  } else if (status === 'offline') {
    dot.classList.add('offline');
    label.textContent = text || 'Offline';
    badge.title = 'Backend unavailable';
  } else {
    dot.classList.add('pulsing');
    label.textContent = text || 'Connecting...';
  }
}

// ==========================================================================
// Filtering, Sorting & Rendering
// ==========================================================================
function applyFiltersAndRender() {
  // Always ensure distance is up to date relative to originLat / originLng
  recomputeLocalDistances();

  let list = [...state.allSchools];

  // 1. Text Search Filter (name or address)
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase().trim();
    list = list.filter(school =>
      (school.name && school.name.toLowerCase().includes(q)) ||
      (school.address && school.address.toLowerCase().includes(q))
    );
  }

  // 2. Max Radius Filter
  if (state.maxRadius < 100) {
    list = list.filter(school => school.distance <= state.maxRadius);
  }

  // 3. Sorting
  if (state.sortBy === 'distance-asc') {
    list.sort((a, b) => a.distance - b.distance);
  } else if (state.sortBy === 'distance-desc') {
    list.sort((a, b) => b.distance - a.distance);
  } else if (state.sortBy === 'name-asc') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  state.filteredSchools = list;

  // Update Statistics Ribbon
  updateStatsRibbon();

  // Render Left Panel
  renderSchoolsList();

  // Render Map Markers
  refreshMapMarkers();
}

function updateStatsRibbon() {
  const totalEl = document.getElementById('statTotalSchools');
  const nearestEl = document.getElementById('statNearestSchool');
  const avgDistEl = document.getElementById('statAvgDistance');
  const coordsEl = document.getElementById('statOriginCoords');

  totalEl.textContent = state.allSchools.length;
  coordsEl.textContent = `${state.originLat.toFixed(4)}, ${state.originLng.toFixed(4)}`;

  if (state.allSchools.length > 0) {
    // Sort all schools by distance to find nearest
    const sorted = [...state.allSchools].sort((a, b) => a.distance - b.distance);
    const nearest = sorted[0];
    nearestEl.textContent = `${nearest.name.split(',')[0]} (${nearest.distance.toFixed(1)} km)`;

    const totalDist = state.allSchools.reduce((acc, curr) => acc + curr.distance, 0);
    const avgDist = (totalDist / state.allSchools.length).toFixed(1);
    avgDistEl.textContent = `${avgDist} km`;
  } else {
    nearestEl.textContent = '--';
    avgDistEl.textContent = '-- km';
  }
}

function renderSchoolsList() {
  const container = document.getElementById('schoolsContainer');
  const countTag = document.getElementById('resultsCountTag');
  const mobileCountSpan = document.getElementById('mobileCountSpan');

  countTag.textContent = `${state.filteredSchools.length} found`;
  if (mobileCountSpan) mobileCountSpan.textContent = state.filteredSchools.length;

  if (state.filteredSchools.length === 0) {
    container.innerHTML = `
      <div class="empty-schools-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <h4 class="empty-title">No Schools Found</h4>
        <p class="empty-desc">No schools match your search or radius criteria. Try adjusting the radius filter or add a new school.</p>
        <button class="btn btn-primary btn-xs" onclick="openAddModal()">+ Register School</button>
      </div>
    `;
    return;
  }

  if (state.viewMode === 'table') {
    renderTableView(container);
  } else {
    renderCardsView(container);
  }
}

function renderCardsView(container) {
  container.className = 'schools-container cards-mode';

  container.innerHTML = state.filteredSchools.map(school => {
    const isSelected = school.id === state.selectedSchoolId;
    const dist = school.distance.toFixed(2);
    let distBadgeClass = 'nearby';
    if (school.distance > 20) distBadgeClass = 'far';
    else if (school.distance > 7) distBadgeClass = 'medium';

    return `
      <article class="school-card ${isSelected ? 'selected' : ''}" data-id="${school.id}">
        <div class="school-card-header">
          <h4 class="school-name">${escapeHtml(school.name)}</h4>
          <span class="distance-badge ${distBadgeClass}">
            <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2.5" fill="none">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            ${dist} km
          </span>
        </div>

        <div class="school-address-row">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${escapeHtml(school.address)}</span>
        </div>

        <div class="school-card-footer">
          <span class="coords-pill" title="Click to copy coordinates" onclick="copyCoords(event, ${school.latitude}, ${school.longitude})">
            ${school.latitude.toFixed(4)}, ${school.longitude.toFixed(4)}
          </span>

          <div class="card-actions">
            <button class="btn-card-action" onclick="focusSchoolOnMap(event, ${school.id})">
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              View on Map
            </button>
            <button class="btn-card-action" onclick="openDirections(event, ${school.latitude}, ${school.longitude})">
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
              Directions
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attach card click handlers
  container.querySelectorAll('.school-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id, 10);
      selectSchool(id);
    });
  });
}

function renderTableView(container) {
  container.className = 'schools-container table-mode';

  const rows = state.filteredSchools.map(school => {
    const isSelected = school.id === state.selectedSchoolId;
    return `
      <tr class="${isSelected ? 'selected' : ''}" onclick="selectSchool(${school.id})">
        <td style="font-weight: 700; color: var(--text-primary);">${escapeHtml(school.name)}</td>
        <td>${escapeHtml(school.address)}</td>
        <td class="mono" style="font-weight: 700; color: var(--accent-cyan);">${school.distance.toFixed(2)} km</td>
        <td class="mono">${school.latitude.toFixed(4)}, ${school.longitude.toFixed(4)}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <table class="schools-table">
      <thead>
        <tr>
          <th>School Name</th>
          <th>Address</th>
          <th>Proximity</th>
          <th>Coordinates</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// ==========================================================================
// School Selection & Map Interaction
// ==========================================================================
function selectSchool(id) {
  state.selectedSchoolId = id;

  // Highlight in DOM
  document.querySelectorAll('.school-card').forEach(c => {
    c.classList.toggle('selected', parseInt(c.dataset.id, 10) === id);
  });

  document.querySelectorAll('.schools-table tr').forEach(r => {
    // skip header
  });

  const school = state.allSchools.find(s => s.id === id);
  if (!school || !map) return;

  // Fly to school coordinates on map
  map.flyTo([school.latitude, school.longitude], 14, {
    duration: 1.2
  });

  // Re-render markers with selection state & draw distance polyline
  refreshMapMarkers();

  // On mobile, if in list tab, switch to map view
  const mobileTabMap = document.getElementById('mobileTabMap');
  if (window.innerWidth <= 820 && mobileTabMap) {
    switchMobileTab('map');
  }
}

function focusSchoolOnMap(e, id) {
  e.stopPropagation();
  selectSchool(id);
}

function openDirections(e, destLat, destLng) {
  e.stopPropagation();
  const url = `https://www.google.com/maps/dir/?api=1&origin=${state.originLat},${state.originLng}&destination=${destLat},${destLng}`;
  window.open(url, '_blank');
}

function copyCoords(e, lat, lng) {
  e.stopPropagation();
  const text = `${lat}, ${lng}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied coordinates: ${text}`, 'info');
  }).catch(() => {
    showToast(`Coordinates: ${text}`, 'info');
  });
}

// ==========================================================================
// Geolocation & Origin Coordinates Management
// ==========================================================================
function setOriginCoordinates(lat, lng, label = 'Custom Location') {
  state.originLat = parseFloat(lat);
  state.originLng = parseFloat(lng);

  document.getElementById('originLat').value = state.originLat;
  document.getElementById('originLng').value = state.originLng;

  renderUserMarker();

  if (map) {
    map.panTo([state.originLat, state.originLng]);
  }

  // Update preset buttons active state
  document.querySelectorAll('.preset-chip').forEach(btn => {
    const bLat = parseFloat(btn.dataset.lat);
    const bLng = parseFloat(btn.dataset.lng);
    btn.classList.toggle('active', Math.abs(bLat - state.originLat) < 0.001 && Math.abs(bLng - state.originLng) < 0.001);
  });

  // Reload or re-sort
  if (state.isBackendConnected) {
    loadSchoolsData();
  } else {
    applyFiltersAndRender();
  }
}

function detectCurrentGps() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', 'error');
    return;
  }

  showToast('Detecting your GPS location...', 'info');

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = parseFloat(position.coords.latitude.toFixed(5));
      const lng = parseFloat(position.coords.longitude.toFixed(5));
      setOriginCoordinates(lat, lng, 'My GPS Location');
      showToast(`Location detected: ${lat}, ${lng}`, 'success');
    },
    error => {
      console.warn('Geolocation error:', error);
      showToast('Could not access GPS. Please check location permissions.', 'warning');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// ==========================================================================
// Add School Form & Backend POST Handler
// ==========================================================================
async function handleAddSchoolSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('newSchoolName');
  const addrInput = document.getElementById('newSchoolAddress');
  const latInput = document.getElementById('newSchoolLat');
  const lngInput = document.getElementById('newSchoolLng');

  const name = nameInput.value.trim();
  const address = addrInput.value.trim();
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);

  // Validation according to backend requirements in schoolController.js
  let hasError = false;
  resetFormErrors();

  if (!name) {
    showFieldError('nameError', 'School name is required and cannot be empty.');
    hasError = true;
  }

  if (!address) {
    showFieldError('addressError', 'Address is required and cannot be empty.');
    hasError = true;
  }

  if (isNaN(lat) || lat < -90 || lat > 90) {
    showFieldError('latError', 'Latitude must be a number between -90 and 90.');
    hasError = true;
  }

  if (isNaN(lng) || lng < -180 || lng > 180) {
    showFieldError('lngError', 'Longitude must be a number between -180 and 180.');
    hasError = true;
  }

  if (hasError) return;

  const submitBtn = document.getElementById('submitAddSchoolBtn');
  const spinner = document.getElementById('addBtnSpinner');
  const feedback = document.getElementById('addFormFeedback');

  submitBtn.disabled = true;
  spinner.classList.remove('hidden');
  feedback.className = 'form-feedback hidden';

  // If connected to live backend, call POST /addSchool
  if (state.isBackendConnected) {
    try {
      const res = await fetch(`${state.backendUrl}/addSchool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, latitude: lat, longitude: lng })
      });

      const data = await res.json();

      if (res.status === 201) {
        showToast(`School added successfully! ID: ${data.schoolId}`, 'success');
        closeAddModal();
        resetAddForm();
        await loadSchoolsData();
        selectSchool(data.schoolId);
      } else {
        feedback.className = 'form-feedback error';
        feedback.textContent = data.error || 'Failed to add school to backend.';
        feedback.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Error posting to backend:', err);
      // Fallback: save to local demo storage
      saveSchoolLocally(name, address, lat, lng);
    } finally {
      submitBtn.disabled = false;
      spinner.classList.add('hidden');
    }
  } else {
    // Demo Sandbox Mode: directly append to local list
    saveSchoolLocally(name, address, lat, lng);
    submitBtn.disabled = false;
    spinner.classList.add('hidden');
  }
}

function saveSchoolLocally(name, address, latitude, longitude) {
  const newId = (state.allSchools.reduce((max, s) => Math.max(max, s.id || 0), 0) || 0) + 1;
  const newSchool = {
    id: newId,
    name,
    address,
    latitude,
    longitude,
    distance: calculateDistance(state.originLat, state.originLng, latitude, longitude)
  };

  state.allSchools.push(newSchool);
  saveDemoStorageSchools();

  showToast(`School saved in Sandbox! (ID: ${newId})`, 'success');
  closeAddModal();
  resetAddForm();
  applyFiltersAndRender();
  selectSchool(newId);
}

function resetFormErrors() {
  document.getElementById('nameError').textContent = '';
  document.getElementById('addressError').textContent = '';
  document.getElementById('latError').textContent = '';
  document.getElementById('lngError').textContent = '';
}

function showFieldError(elemId, msg) {
  const el = document.getElementById(elemId);
  if (el) el.textContent = msg;
}

function resetAddForm() {
  document.getElementById('addSchoolForm').reset();
  resetFormErrors();
  document.getElementById('addFormFeedback').className = 'form-feedback hidden';
}

// ==========================================================================
// Modal Operations
// ==========================================================================
function openAddModal() {
  document.getElementById('addSchoolModal').classList.add('open');
}

function closeAddModal() {
  document.getElementById('addSchoolModal').classList.remove('open');
}

function openSettingsModal() {
  document.getElementById('backendUrlInput').value = state.backendUrl;
  document.getElementById('settingsModal').classList.add('open');
}

function closeSettingsModal() {
  document.getElementById('settingsModal').classList.remove('open');
}

// ==========================================================================
// API Connection Tester
// ==========================================================================
async function testBackendConnection() {
  const urlInput = document.getElementById('backendUrlInput');
  const resultBox = document.getElementById('testResultBox');
  const testBtn = document.getElementById('testConnectionBtn');
  const testText = document.getElementById('testBtnText');

  const testUrl = urlInput.value.trim().replace(/\/$/, '');
  testBtn.disabled = true;
  testText.textContent = 'Testing...';
  resultBox.className = 'test-result-box';
  resultBox.textContent = '';

  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${testUrl}/listSchools?latitude=28.5355&longitude=77.3910`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    const latency = Math.round(performance.now() - startTime);

    if (res.ok) {
      const data = await res.json();
      state.backendUrl = testUrl;
      state.isDemoMode = false;
      state.isBackendConnected = true;
      localStorage.setItem('educase_backend_url', testUrl);

      resultBox.className = 'test-result-box show ok';
      resultBox.textContent = `✓ Successfully reached ${testUrl} (${latency}ms)! Found ${data.count || 0} schools.`;

      updateConnectionStatusBadge('online', `Backend Live (${testUrl})`);
      showToast('Connected to Express Backend!', 'success');
      loadSchoolsData();
    } else {
      resultBox.className = 'test-result-box show fail';
      resultBox.textContent = `✗ Endpoint responded with status ${res.status} (${res.statusText}).`;
    }
  } catch (err) {
    resultBox.className = 'test-result-box show fail';
    resultBox.textContent = `✗ Connection failed: ${err.message || 'Cannot reach server'}. Ensure 'npm start' is running in educase-main.`;
    showToast('Backend is offline. Using Demo Sandbox mode.', 'warning');
  } finally {
    testBtn.disabled = false;
    testText.textContent = 'Test & Connect';
  }
}

// ==========================================================================
// Data Export & Tools
// ==========================================================================
function exportToJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.allSchools, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `educase_schools_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Exported schools as JSON', 'info');
}

function exportToCsv() {
  if (state.allSchools.length === 0) {
    showToast('No schools to export', 'warning');
    return;
  }

  const headers = ['id', 'name', 'address', 'latitude', 'longitude', 'distance_km'];
  const rows = state.allSchools.map(s => [
    s.id,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.address || '').replace(/"/g, '""')}"`,
    s.latitude,
    s.longitude,
    (s.distance || 0).toFixed(2)
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `educase_schools_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Exported schools as CSV', 'info');
}

function resetDemoSeeds() {
  if (confirm('Reset to default seed schools? Any newly created local schools will be cleared.')) {
    state.allSchools = [...DEFAULT_SEED_SCHOOLS];
    saveDemoStorageSchools();
    applyFiltersAndRender();
    showToast('Reset to default seed schools', 'info');
  }
}

// ==========================================================================
// Toast Notifications System
// ==========================================================================
function showToast(message, type = 'info') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'ℹ';
  if (type === 'success') icon = '✓';
  else if (type === 'error') icon = '✗';
  else if (type === 'warning') icon = '⚠';

  toast.innerHTML = `
    <span style="font-weight: 800;">${icon}</span>
    <span>${escapeHtml(message)}</span>
  `;

  stack.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// Mobile Tab Switching
// ==========================================================================
function switchMobileTab(tab) {
  const listBtn = document.getElementById('mobileTabList');
  const mapBtn = document.getElementById('mobileTabMap');
  const sidebar = document.getElementById('sidebarPanel');
  const mapPanel = document.getElementById('mapPanel');

  if (tab === 'map') {
    listBtn.classList.remove('active');
    mapBtn.classList.add('active');
    sidebar.classList.add('mobile-hidden');
    mapPanel.classList.remove('mobile-hidden');
    if (map) map.invalidateSize();
  } else {
    mapBtn.classList.remove('active');
    listBtn.classList.add('active');
    sidebar.classList.remove('mobile-hidden');
    mapPanel.classList.add('mobile-hidden');
  }
}

// ==========================================================================
// DOM Event Listeners Binding
// ==========================================================================
function bindDomEvents() {
  // Theme toggle
  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

  // Settings & Connection badge click
  document.getElementById('openSettingsBtn').addEventListener('click', openSettingsModal);
  document.getElementById('connectionBadge').addEventListener('click', openSettingsModal);
  document.getElementById('closeSettingsModalBtn').addEventListener('click', closeSettingsModal);
  document.getElementById('closeSettingsModalFooterBtn').addEventListener('click', closeSettingsModal);
  document.getElementById('testConnectionBtn').addEventListener('click', testBackendConnection);

  // Toggle demo mode button inside settings
  document.getElementById('toggleDemoModeBtn').addEventListener('click', () => {
    state.isDemoMode = !state.isDemoMode;
    showToast(state.isDemoMode ? 'Switched to Demo Sandbox mode' : 'Switched to Live Backend mode', 'info');
    loadSchoolsData();
  });

  // Export & reset buttons
  document.getElementById('exportJsonBtn').addEventListener('click', exportToJson);
  document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);
  document.getElementById('loadDemoSeedsBtn').addEventListener('click', resetDemoSeeds);

  // Add School Modal
  document.getElementById('openAddModalBtn').addEventListener('click', () => {
    resetAddForm();
    openAddModal();
  });
  document.getElementById('closeAddModalBtn').addEventListener('click', closeAddModal);
  document.getElementById('cancelAddBtn').addEventListener('click', closeAddModal);
  document.getElementById('addSchoolForm').addEventListener('submit', handleAddSchoolSubmit);

  // Modal Coordinate Pickers
  document.getElementById('pickOnMapModalBtn').addEventListener('click', () => {
    closeAddModal();
    state.mapPickingMode = 'school';
    showToast('Click anywhere on the map to set the school coordinates', 'info');
  });

  document.getElementById('useOriginCoordsModalBtn').addEventListener('click', () => {
    document.getElementById('newSchoolLat').value = state.originLat;
    document.getElementById('newSchoolLng').value = state.originLng;
  });

  // Sample school pills in Add modal
  document.querySelectorAll('.sample-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.getElementById('newSchoolName').value = pill.dataset.name;
      document.getElementById('newSchoolAddress').value = pill.dataset.addr;
      document.getElementById('newSchoolLat').value = pill.dataset.lat;
      document.getElementById('newSchoolLng').value = pill.dataset.lng;
    });
  });

  // Origin Geolocation Form & Presets
  document.getElementById('applyOriginBtn').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('originLat').value);
    const lng = parseFloat(document.getElementById('originLng').value);
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      showToast('Please enter valid coordinates (-90 to 90 lat, -180 to 180 lng)', 'warning');
      return;
    }
    setOriginCoordinates(lat, lng, 'Manual Input');
    showToast(`Origin coordinates applied: ${lat}, ${lng}`, 'success');
  });

  document.getElementById('autoDetectGpsBtn').addEventListener('click', detectCurrentGps);

  // Preset location chips
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const lat = parseFloat(chip.dataset.lat);
      const lng = parseFloat(chip.dataset.lng);
      setOriginCoordinates(lat, lng, chip.dataset.label);
    });
  });

  // Live Search Input with debounce
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value;
    clearSearchBtn.classList.toggle('hidden', searchInput.value === '');
    applyFiltersAndRender();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    applyFiltersAndRender();
  });

  // Radius Slider
  const radiusRange = document.getElementById('radiusRange');
  const radiusValueText = document.getElementById('radiusValueText');

  radiusRange.addEventListener('input', () => {
    const val = parseInt(radiusRange.value, 10);
    state.maxRadius = val;
    radiusValueText.textContent = val >= 100 ? 'All (No limit)' : `Within ${val} km`;
    applyFiltersAndRender();
  });

  // Sort Selector
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    applyFiltersAndRender();
  });

  // View Mode Buttons (Cards vs Table)
  const viewCardsBtn = document.getElementById('viewCardsBtn');
  const viewTableBtn = document.getElementById('viewTableBtn');

  viewCardsBtn.addEventListener('click', () => {
    state.viewMode = 'cards';
    viewCardsBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
    renderSchoolsList();
  });

  viewTableBtn.addEventListener('click', () => {
    state.viewMode = 'table';
    viewTableBtn.classList.add('active');
    viewCardsBtn.classList.remove('active');
    renderSchoolsList();
  });

  // Floating Map Buttons
  document.getElementById('mapCenterOriginBtn').addEventListener('click', () => {
    if (map) {
      map.flyTo([state.originLat, state.originLng], 13);
      showToast('Centered on your origin location', 'info');
    }
  });

  document.getElementById('mapFitBoundsBtn').addEventListener('click', () => {
    if (map && schoolMarkersGroup && schoolMarkersGroup.getLayers().length > 0) {
      const bounds = schoolMarkersGroup.getBounds();
      bounds.extend([state.originLat, state.originLng]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  });

  document.getElementById('mapTileToggleBtn').addEventListener('click', () => {
    state.mapTheme = state.mapTheme === 'dark' ? 'light' : 'dark';
    updateMapTileLayer();
    showToast(`Map style: ${state.mapTheme === 'dark' ? 'Dark Matter' : 'Voyager Light'}`, 'info');
  });

  document.getElementById('bannerCloseBtn').addEventListener('click', () => {
    document.getElementById('mapInfoBanner').classList.add('hidden');
    if (distancePolyline && map) {
      map.removeLayer(distancePolyline);
      distancePolyline = null;
    }
    state.selectedSchoolId = null;
    document.querySelectorAll('.school-card').forEach(c => c.classList.remove('selected'));
  });

  // Mobile View Switcher
  const mobileTabList = document.getElementById('mobileTabList');
  const mobileTabMap = document.getElementById('mobileTabMap');
  if (mobileTabList && mobileTabMap) {
    mobileTabList.addEventListener('click', () => switchMobileTab('list'));
    mobileTabMap.addEventListener('click', () => switchMobileTab('map'));
  }

  // Backdrop click to close modals
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('open');
      }
    });
  });

  // Escape key closes modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    }
  });
}

// ==========================================================================
// Helper Utilities
// ==========================================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Make functions globally accessible for inline HTML handlers
window.openAddModal = openAddModal;
window.selectSchool = selectSchool;
window.focusSchoolOnMap = focusSchoolOnMap;
window.openDirections = openDirections;
window.copyCoords = copyCoords;
