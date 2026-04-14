// ============================================================
// app.js — Command Centre UI + logic
// ES module. Imports Firebase operations from firebase.js.
// Functions exposed to window so HTML onclick handlers work.
// ============================================================

import {
  fbSignIn, fbSignOut, onAuthChange,
  loadProducts, saveProduct,
  loadSections, saveSection, updateSectionToken, deleteSectionDoc,
  loadCards,    saveCard,    updateCardFields, deleteCardDoc, updateCardToken, getCardDoc, loadBoardCards,
  createShareLink, getShareLink,
} from './firebase.js';

// ============================================================
// CONSTANTS
// ============================================================

// ── Cloudinary ──
const CLOUDINARY_CLOUD  = 'dx0nrujwa';
const CLOUDINARY_PRESET = 'ml_default';

const COLOUR_NAMES = ['blue', 'purple', 'orange', 'green', 'pink', 'teal'];
const COLOUR_HEX   = {
  blue: '#6b9fff', purple: '#a78bfa', orange: '#fb923c',
  green: '#4ade80', pink: '#f472b6', teal: '#2dd4bf',
};
const DEFAULT_SECTIONS = ['Marketing', 'SEO', 'Product', 'Content', 'Dev', 'Design', 'Ads'];

const ICON = {
  edit:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  link:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`,
  trash: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
};

// ============================================================
// INITIAL DATA (used only on first login — seeds Firestore)
// ============================================================

function buildInitialData() {
  const prods = [
    { id: 'prod-1', name: 'eSIM 70',         colourIndex: 0 },
    { id: 'prod-2', name: 'FlightPoints',     colourIndex: 1 },
    { id: 'prod-3', name: 'Airport Delay',    colourIndex: 2 },
    { id: 'prod-4', name: 'Room Points',      colourIndex: 3 },
    { id: 'prod-5', name: 'Seat Info',        colourIndex: 4 },
    { id: 'prod-6', name: 'Transfer Points',  colourIndex: 5 },
  ];
  const sections = {};
  prods.forEach(p => {
    sections[p.id] = DEFAULT_SECTIONS.map((name, i) => ({
      id: `sec-${p.id}-${i}`, productId: p.id, name, order: i, shareToken: null,
    }));
  });
  const daysAgo = d => new Date(Date.now() - d * 86400000).toISOString();
  const cards = [
    { id: 'c1', productId: 'prod-1', section: 'Marketing', title: 'Hero Copy — Q2 Refresh',
      body: 'Update the hero section copy for the eSIM 70 landing page. Focus on speed, coverage, and no contracts. Current copy feels too technical — we need it to resonate with travellers aged 25–45.\n\nKey messages:\n1. Instant activation, no roaming fees\n2. Works in 130+ countries\n3. Cancel anytime, no lock-in',
      priority: 'High', status: 'To Do', attachmentUrl: null, createdAt: daysAgo(2), updatedAt: daysAgo(2), shareToken: null },
    { id: 'c2', productId: 'prod-1', section: 'Marketing', title: 'Meta Ad Brief — Summer Campaign',
      body: 'Run a 3-week Meta ad campaign targeting frequent travellers. Budget: $2,000. Goal: trial sign-ups with promo code SUMMER20 for 20% off first month.\n\nAudience: Ages 28–50, frequent flyers, tech-savvy, household income 60k+.',
      priority: 'High', status: 'In Progress', attachmentUrl: 'https://example.com/ad-brief.pdf', createdAt: daysAgo(5), updatedAt: daysAgo(1), shareToken: null },
    { id: 'c3', productId: 'prod-1', section: 'SEO', title: 'Blog: "Best eSIM for Europe 2026"',
      body: 'Write a 1,500-word comparison article targeting "best eSIM for Europe". Include a comparison table with top 5 competitors.\n\nTarget volume: 8,400/mo. Current position: 18. Goal: top 5.',
      priority: 'Medium', status: 'To Do', attachmentUrl: null, createdAt: daysAgo(3), updatedAt: daysAgo(3), shareToken: null },
    { id: 'c4', productId: 'prod-1', section: 'Product', title: 'Activation Flow Redesign',
      body: 'The current QR code activation flow has a 34% drop-off at step 3. Redesign to reduce steps from 6 to 3. Priority: iOS clarity.',
      priority: 'High', status: 'To Do', attachmentUrl: null, createdAt: daysAgo(1), updatedAt: daysAgo(1), shareToken: null },
    { id: 'c5', productId: 'prod-1', section: 'Design', title: 'Onboarding Screens — v2',
      body: 'Redesign onboarding based on UX audit findings. Max 4 screens. Lead with a visual "how to activate" diagram. Use existing design tokens.',
      priority: 'Medium', status: 'In Progress',
      attachmentUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80',
      createdAt: daysAgo(4), updatedAt: daysAgo(4), shareToken: null },
    { id: 'c6', productId: 'prod-1', section: 'Dev', title: 'Fix iOS Safari checkout bug',
      body: 'On iOS Safari 17+, the payment modal does not dismiss after successful payment. User must hard-refresh. Likely a Promise resolution issue with the Stripe SDK.',
      priority: 'High', status: 'Done', attachmentUrl: null, createdAt: daysAgo(7), updatedAt: daysAgo(2), shareToken: null },
    { id: 'c7', productId: 'prod-2', section: 'Marketing', title: 'Qantas Integration Announcement',
      body: 'Draft announcement copy for the Qantas Frequent Flyer integration. Goes live Monday. Channels: email newsletter, Instagram, LinkedIn. Mention 3x points earn for first 30 days.',
      priority: 'High', status: 'To Do', attachmentUrl: null, createdAt: daysAgo(1), updatedAt: daysAgo(1), shareToken: null },
    { id: 'c8', productId: 'prod-2', section: 'SEO', title: 'Pillar Page: Credit Card Points Guide',
      body: 'Build a comprehensive pillar page targeting "credit card points Australia". Target: 12,000 words. Cover earn rates, transfer partners, and redemption strategies.',
      priority: 'Medium', status: 'In Progress', attachmentUrl: null, createdAt: daysAgo(6), updatedAt: daysAgo(2), shareToken: null },
    { id: 'c9', productId: 'prod-3', section: 'Product', title: 'Real-time Delay API Integration',
      body: 'Integrate FlightAware API for real-time delay data. Replace 15-min polling with webhooks. SLA: data must be < 2 min stale. Budget: $400/mo approved.',
      priority: 'High', status: 'To Do', attachmentUrl: null, createdAt: daysAgo(3), updatedAt: daysAgo(3), shareToken: null },
  ];
  return { prods, sections, cards };
}

// ============================================================
// STATE
// ============================================================

const state = {
  activeProductId:     null,
  activeSectionFilter: 'All',
  editingCardId:       null,
  products:  [],
  sections:  {},
  cards:     [],
};

// ============================================================
// SCREEN MANAGEMENT
// ============================================================

const SCREENS = {
  loading: 'loading',
  login:   'login-screen',
  dash:    'dashboard',
  board:   'board-viewer',
  card:    'card-viewer-page',
  expired: 'link-expired',
};

function showScreen(name) {
  Object.values(SCREENS).forEach(id => document.getElementById(id)?.classList.add('hidden'));
  const id = SCREENS[name];
  if (id) document.getElementById(id).classList.remove('hidden');
}

// ============================================================
// AUTH
// ============================================================

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-password').value;
  const btn   = document.getElementById('login-btn');
  const err   = document.getElementById('login-error');

  err.classList.add('hidden');
  btn.textContent = 'Signing in…';
  btn.disabled    = true;

  try {
    await fbSignIn(email, pw);
    // onAuthChange listener handles the transition to dashboard
  } catch (e) {
    err.classList.remove('hidden');
    btn.textContent = 'Log In';
    btn.disabled    = false;
  }
}

async function handleLogout() {
  document.getElementById('user-menu').classList.add('hidden');
  await fbSignOut();
  // onAuthChange listener handles the transition to login
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadAllData() {
  const [products, sections, cards] = await Promise.all([
    loadProducts(),
    loadSections(),
    loadCards(),
  ]);

  // First run — seed Firestore with initial data
  if (products.length === 0) {
    await seedFirestore();
    return; // seedFirestore sets state directly
  }

  state.products        = products;
  state.sections        = sections;
  state.cards           = cards;
  state.activeProductId = state.activeProductId || products[0]?.id || null;
}

async function seedFirestore() {
  const { prods, sections, cards } = buildInitialData();
  const writes = [];
  prods.forEach(p => writes.push(saveProduct(p)));
  Object.values(sections).flat().forEach(s => writes.push(saveSection(s)));
  cards.forEach(c => writes.push(saveCard(c)));
  await Promise.all(writes);
  state.products        = prods;
  state.sections        = sections;
  state.cards           = cards;
  state.activeProductId = prods[0].id;
}

// ============================================================
// ROUTING
// ============================================================

function parseHash() {
  // Hash format: #<token>/<section-slug>          → board
  //              #<token>/<section-slug>/<card-slug> → card
  // Legacy query param support: ?s=token or ?c=token
  const hash = window.location.hash.slice(1); // strip leading #
  if (hash) {
    const parts = hash.split('/').filter(Boolean);
    if (parts.length >= 2) return { token: parts[0], type: parts.length >= 3 ? 'card' : 'board' };
  }
  // Legacy fallback
  const params = new URLSearchParams(window.location.search);
  if (params.get('s')) return { token: params.get('s'), type: 'board' };
  if (params.get('c')) return { token: params.get('c'), type: 'card' };
  return null;
}

function handleRoute() {
  const route = parseHash();

  // Share link routes — no auth required
  if (route?.type === 'board') { showBoardViewer(route.token); return; }
  if (route?.type === 'card')  { showCardViewer(route.token);  return; }

  // Dashboard route — listen for Firebase auth state
  showScreen('loading');
  onAuthChange(async user => {
    if (user) {
      await loadAllData();
      showScreen('dash');
      renderAll();
      // Reset login button in case it was stuck
      const btn = document.getElementById('login-btn');
      if (btn) { btn.textContent = 'Log In'; btn.disabled = false; }
    } else {
      showScreen('login');
      setTimeout(() => document.getElementById('login-email')?.focus(), 50);
    }
  });
}

// ============================================================
// RENDER — DASHBOARD
// ============================================================

function renderAll() {
  renderAppRow();
  renderSectionRow();
  renderCardGrid();
}

function pendingCount(productId, sectionName) {
  return state.cards.filter(c =>
    c.productId === productId &&
    c.status !== 'Done' &&
    (sectionName == null || c.section === sectionName)
  ).length;
}

function badge(n) {
  if (!n) return '';
  return `<span class="nav-badge">${n > 99 ? '99+' : n}</span>`;
}

function renderAppRow() {
  document.getElementById('product-buttons').innerHTML = state.products.map(p => {
    const colour  = COLOUR_NAMES[p.colourIndex % COLOUR_NAMES.length];
    const hex     = COLOUR_HEX[colour];
    const active  = p.id === state.activeProductId;
    const pending = pendingCount(p.id, null);
    return `<button class="product-btn${active ? ' active' : ''}" onclick="switchProduct('${p.id}')">
      <span class="product-dot" style="background:${hex}"></span>${esc(p.name)}${badge(pending)}
    </button>`;
  }).join('');
}

function renderSectionRow() {
  const sections   = state.sections[state.activeProductId] || [];
  const active     = state.activeSectionFilter;
  const allPending = pendingCount(state.activeProductId, null);
  const allTab     = `<button class="section-tab${active === 'All' ? ' active' : ''}" onclick="switchSection('All')">All${badge(allPending)}</button>`;
  const secTabs    = sections.map(s => {
    const n = pendingCount(state.activeProductId, s.name);
    return `<button class="section-tab${active === s.name ? ' active' : ''}" onclick="switchSection('${esc(s.name)}')">
      ${esc(s.name)}${badge(n)}
      <span class="section-delete-btn" onclick="openDeleteSectionModal(event,'${esc(s.name)}')" title="Delete section">✕</span>
    </button>`;
  }).join('');
  const addBtn = `<button class="btn-add-section" onclick="handleAddSection()">+ Section</button>`;
  document.getElementById('section-tabs').innerHTML = allTab + secTabs + addBtn;
}

function getSortedCards() {
  return state.cards
    .filter(c => {
      if (c.productId !== state.activeProductId) return false;
      if (state.activeSectionFilter !== 'All' && c.section !== state.activeSectionFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const aDone = a.status === 'Done', bDone = b.status === 'Done';
      if (aDone !== bDone) return aDone ? 1 : -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function renderCardGrid() {
  const cards  = getSortedCards();
  const addNew = `<div class="card-add-new" onclick="openNewBriefModal()">
    <div class="add-icon">+</div><div class="add-label">New Brief</div>
  </div>`;
  document.getElementById('card-grid').innerHTML = cards.map(c => renderCard(c)).join('') + addNew;
}

function renderCard(card, viewerMode = false) {
  const stsCls  = statusClass(card.status);
  const tagCls  = tagClass(card.section);
  const priCls  = priorityClass(card.priority);
  const tintCls = tintClass(card.section);
  const date    = fmtDate(card.createdAt);
  const hasBody = card.body?.trim();
  // Normalise to array — support both old single-URL and new multi-URL cards
  const allUrls = card.attachmentUrls?.length
    ? card.attachmentUrls
    : card.attachmentUrl ? [card.attachmentUrl] : [];

  let attachPreview = '';
  if (allUrls.length) {
    const items = allUrls.map(url => {
      const src = esc(url);
      const fn  = esc(attachFilename(url));
      if (isImageUrl(url)) {
        return `<div class="card-img-preview" onclick="event.stopPropagation();openLightbox('${src}','${fn}')"><img src="${src}" alt="" loading="lazy"></div>`;
      }
      const isPdf = isPdfUrl(url);
      return `<div class="card-file-preview ${isPdf ? 'is-pdf' : 'is-file'}" onclick="event.stopPropagation();window.open('${src}','_blank')" style="cursor:pointer"><span class="card-file-icon">${isPdf ? '📄' : '📎'}</span><span class="card-file-name">${fn}</span></div>`;
    }).join('');
    attachPreview = `<div class="card-attachments-grid">${items}</div>`;
  }

  const actions = viewerMode ? '' : `
    <div class="card-actions" onclick="event.stopPropagation()">
      <button class="card-action-btn edit"   onclick="openEditModal('${card.id}')"  title="Edit">${ICON.edit}</button>
      <button class="card-action-btn"        onclick="copyCardLink('${card.id}')"   title="Copy link">${ICON.link}</button>
      <button class="card-action-btn danger" onclick="deleteCard('${card.id}')"     title="Delete">${ICON.trash}</button>
    </div>`;
  const statusClick = viewerMode
    ? `style="cursor:default"`
    : `onclick="cycleStatus(event,'${card.id}')"`;
  const cardClick = `onclick="openViewModal('${card.id}')"`;

  return `<div class="card${card.status === 'Done' ? ' done' : ''}${tintCls ? ' '+tintCls : ''}" data-id="${card.id}" ${cardClick}>
    <div class="card-header">
      <div class="card-title">${esc(card.title)}</div>
      <div class="status-pill ${stsCls}" ${statusClick}>${esc(card.status)}</div>
    </div>
    ${hasBody ? `<div class="card-body">${esc(card.body)}</div>` : ''}
    ${attachPreview}
    <div class="card-footer">
      <div class="team-tag ${tagCls}">${esc(card.section)}</div>
      <div class="priority-badge ${priCls}">${esc(card.priority)}</div>
      <div class="card-date">${date}</div>
      ${actions}
    </div>
  </div>`;
}

// ============================================================
// VIEWER PAGES  (share links — no auth)
// ============================================================

async function showBoardViewer(token) {
  showScreen('loading');
  try {
    const entry = await getShareLink(token);
    if (!entry || entry.type !== 'board') { showScreen('expired'); return; }

    const cards = await loadBoardCards(entry.productId, entry.sectionName);
    state.cards = cards; // allow view modal to work within board viewer

    const sorted = [...cards].sort((a, b) => {
      const aDone = a.status === 'Done', bDone = b.status === 'Done';
      if (aDone !== bDone) return aDone ? 1 : -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    document.getElementById('board-viewer-inner').innerHTML = `
      <h1 class="viewer-header">${esc(entry.sectionName)}</h1>
      <div class="viewer-grid">
        ${sorted.length
          ? sorted.map(c => renderCard(c, true)).join('')
          : `<p style="color:var(--muted);font-size:13px">No briefs in this board yet.</p>`}
      </div>`;
    showScreen('board');
  } catch (e) {
    console.error(e);
    showScreen('expired');
  }
}

async function showCardViewer(token) {
  showScreen('loading');
  try {
    const entry = await getShareLink(token);
    if (!entry || entry.type !== 'card') { showScreen('expired'); return; }

    const card = await getCardDoc(entry.cardId);
    if (!card) { showScreen('expired'); return; }

    document.getElementById('card-viewer-inner').innerHTML = `
      <div class="view-modal" style="width:600px;max-width:calc(100vw - 40px)">
        ${viewModalContent(card, true)}
      </div>`;
    showScreen('card');
  } catch (e) {
    console.error(e);
    showScreen('expired');
  }
}

// ============================================================
// MODALS
// ============================================================

let _activeModal = null;

function openNewBriefModal() {
  state.editingCardId = null;
  document.getElementById('brief-modal-title').textContent = 'New Brief';
  document.getElementById('brief-save-btn').textContent    = 'Save Brief';
  document.getElementById('brief-title').value             = '';
  document.getElementById('brief-body').value              = '';
  document.getElementById('brief-priority').value          = 'Medium';
  document.getElementById('brief-status').value            = 'To Do';
  populateSectionDropdown(null);
  showModal('brief-modal');
  initDropZone();
  setTimeout(() => document.getElementById('brief-title').focus(), 80);
}

function openEditModal(cardId) {
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;
  state.editingCardId = cardId;
  document.getElementById('brief-modal-title').textContent = 'Edit Brief';
  document.getElementById('brief-save-btn').textContent    = 'Save Changes';
  document.getElementById('brief-title').value             = card.title;
  document.getElementById('brief-body').value              = card.body;
  document.getElementById('brief-priority').value          = card.priority;
  document.getElementById('brief-status').value            = card.status;
  populateSectionDropdown(card.section);
  showModal('brief-modal');
  initDropZone();
  // Pre-populate drop zone with existing attachments
  const existingUrls = card.attachmentUrls?.length
    ? card.attachmentUrls
    : card.attachmentUrl ? [card.attachmentUrl] : [];
  existingUrls.forEach(url => _stagedUrls.push({ url, name: attachFilename(url) }));
  if (existingUrls.length) renderDropFilesList();
}

function populateSectionDropdown(selected) {
  const sections = state.sections[state.activeProductId] || [];
  const def      = selected || (state.activeSectionFilter !== 'All' ? state.activeSectionFilter : sections[0]?.name || '');
  document.getElementById('brief-section').innerHTML = sections.map(s =>
    `<option value="${esc(s.name)}"${s.name === def ? ' selected' : ''}>${esc(s.name)}</option>`
  ).join('');
}

function openViewModal(cardId) {
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;
  document.getElementById('view-modal').innerHTML = viewModalContent(card, false);
  showModal('view-modal');
}

function viewModalContent(card, standalone = false) {
  const tagCls = tagClass(card.section);
  const priCls = priorityClass(card.priority);
  const stsCls = statusClass(card.status);
  const closeBtn = standalone ? '' : `<button class="modal-close" onclick="closeModal()">✕</button>`;

  const allUrls = card.attachmentUrls?.length
    ? card.attachmentUrls
    : card.attachmentUrl ? [card.attachmentUrl] : [];

  let attachHtml = '';
  if (allUrls.length) {
    const items = allUrls.map(url => {
      const src = esc(url);
      const fn  = esc(attachFilename(url));
      return isImageUrl(url)
        ? `<img class="view-img-thumb" src="${src}" alt="${fn}" onclick="openLightbox('${src}','${fn}')">`
        : `<div class="view-file-chip" onclick="window.open('${src}','_blank')" style="cursor:pointer">${attachEmoji(url)} ${fn}</div>`;
    }).join('');
    attachHtml = `<div class="view-attachments">
      <div class="view-attach-label">ATTACHMENTS</div>
      <div class="view-file-grid">${items}</div>
    </div>`;
  }

  return `
    <div class="view-top">
      <h2 class="view-title">${esc(card.title)}</h2>
      ${closeBtn}
    </div>
    <div class="view-meta">
      <div class="team-tag ${tagCls}">${esc(card.section)}</div>
      <div class="priority-badge ${priCls}">${esc(card.priority)}</div>
      <div class="status-pill ${stsCls}" style="cursor:default">${esc(card.status)}</div>
    </div>
    <div class="view-body">${esc(card.body)}</div>
    ${attachHtml}`;
}

function openAddProductModal() {
  document.getElementById('product-name-input').value = '';
  showModal('add-product-modal');
  setTimeout(() => document.getElementById('product-name-input').focus(), 80);
}

function showModal(modalId) {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById(modalId).classList.remove('hidden');
  _activeModal = modalId;
}

function closeModal() {
  teardownDropZone();
  document.getElementById('modal-overlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  _activeModal        = null;
  state.editingCardId = null;
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

// ============================================================
// LIGHTBOX
// ============================================================

function openLightbox(src, filename) {
  document.getElementById('lightbox-img').src                = src;
  document.getElementById('lightbox-filename').textContent   = filename || attachFilename(src);
  document.getElementById('lightbox').classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.getElementById('lightbox-img').src = '';
}

function handleLightboxClick(e) {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
}

// ============================================================
// ACTIONS
// ============================================================

async function saveBrief() {
  const title      = document.getElementById('brief-title').value.trim();
  const body       = document.getElementById('brief-body').value.trim();
  const section    = document.getElementById('brief-section').value;
  const priority   = document.getElementById('brief-priority').value;
  const status      = document.getElementById('brief-status').value;
  const attachUrls  = _stagedUrls.map(f => f.url);
  // Keep single legacy field for backwards compat; also store array
  const attachmentUrl  = attachUrls[0] || null;
  const attachmentUrls = attachUrls.length ? attachUrls : null;

  if (!title) { showToast('Add a title first'); return; }

  if (state.editingCardId) {
    const idx = state.cards.findIndex(c => c.id === state.editingCardId);
    if (idx === -1) return;
    const updates = { title, body, section, priority, status, attachmentUrl, attachmentUrls };
    Object.assign(state.cards[idx], updates);
    updateCardFields(state.editingCardId, updates).catch(console.error);
    showToast('Brief updated');
  } else {
    const newCard = {
      id: 'c' + Date.now(), productId: state.activeProductId,
      section, title, body, priority, status, attachmentUrl, attachmentUrls,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), shareToken: null,
    };
    state.cards.unshift(newCard);
    saveCard(newCard).catch(console.error);
    showToast('Brief saved');
  }

  closeModal();
  renderCardGrid();
}

async function deleteCard(cardId) {
  state.cards = state.cards.filter(c => c.id !== cardId);
  renderCardGrid();
  showToast('Brief deleted');
  deleteCardDoc(cardId).catch(console.error);
}

function cycleStatus(e, cardId) {
  e.stopPropagation();
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;
  const order = ['To Do', 'In Progress', 'Done'];
  card.status = order[(order.indexOf(card.status) + 1) % order.length];
  card.updatedAt = new Date().toISOString();

  // Write to Firestore (fire and forget)
  updateCardFields(cardId, { status: card.status }).catch(console.error);

  if (card.status === 'Done') {
    // Immediately style the card as done, then re-sort after delay
    const el = document.querySelector(`.card[data-id="${cardId}"]`);
    if (el) {
      el.classList.add('done');
      const pill = el.querySelector('.status-pill');
      if (pill) { pill.className = `status-pill ${statusClass('Done')}`; pill.textContent = 'Done'; }
      const title = el.querySelector('.card-title');
      if (title) title.style.textDecoration = 'line-through';
    }
    setTimeout(() => renderCardGrid(), 320);
  } else {
    renderCardGrid();
  }
}

function switchProduct(productId) {
  state.activeProductId     = productId;
  state.activeSectionFilter = 'All';
  const p = state.products.find(x => x.id === productId);
  if (p) showToast(`Switched to ${p.name}`);
  renderAll();
}

function switchSection(name) {
  state.activeSectionFilter = name;
  renderSectionRow();
  renderCardGrid();
}

function handleAddSection() {
  const name = prompt('New section name:');
  if (!name?.trim()) return;
  const trimmed  = name.trim();
  const sections = state.sections[state.activeProductId] || [];
  if (sections.find(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
    showToast('Section already exists'); return;
  }
  const newSection = {
    id:        'sec-' + Date.now(),
    productId: state.activeProductId,
    name:      trimmed,
    order:     sections.length,
    shareToken: null,
  };
  sections.push(newSection);
  state.sections[state.activeProductId] = sections;
  saveSection(newSection).catch(console.error);
  renderSectionRow();
  showToast(`${trimmed} section added`);
}

// ── Delete Section ──
let _deletingSectionName = null;

function openDeleteSectionModal(e, sectionName) {
  e.stopPropagation();
  _deletingSectionName = sectionName;
  document.getElementById('delete-section-label').textContent = sectionName;
  document.getElementById('delete-section-confirm').value = '';
  document.getElementById('delete-section-confirm').placeholder = sectionName;
  document.getElementById('delete-section-btn').disabled = true;
  showModal('delete-section-modal');
  setTimeout(() => document.getElementById('delete-section-confirm').focus(), 80);
}

function checkDeleteConfirm() {
  const val = document.getElementById('delete-section-confirm').value;
  document.getElementById('delete-section-btn').disabled = val !== _deletingSectionName;
}

async function confirmDeleteSection() {
  const name = _deletingSectionName;
  if (!name) return;

  const sections  = state.sections[state.activeProductId] || [];
  const section   = sections.find(s => s.name === name);
  const toDelete  = state.cards.filter(c => c.productId === state.activeProductId && c.section === name);

  // Update local state immediately
  state.sections[state.activeProductId] = sections.filter(s => s.name !== name);
  state.cards = state.cards.filter(c => !(c.productId === state.activeProductId && c.section === name));
  if (state.activeSectionFilter === name) state.activeSectionFilter = 'All';

  closeModal();
  renderAll();
  showToast(`${name} section deleted`);

  // Firestore writes (fire and forget)
  if (section) deleteSectionDoc(section.id).catch(console.error);
  toDelete.forEach(c => deleteCardDoc(c.id).catch(console.error));
}

async function addProduct() {
  const name = document.getElementById('product-name-input').value.trim();
  if (!name) return;
  const colourIndex = state.products.length % COLOUR_NAMES.length;
  const newProd     = { id: 'prod-' + Date.now(), name, colourIndex };
  const newSections = DEFAULT_SECTIONS.map((sName, i) => ({
    id: `sec-${newProd.id}-${i}`, productId: newProd.id, name: sName, order: i, shareToken: null,
  }));

  state.products.push(newProd);
  state.sections[newProd.id]    = newSections;
  state.activeProductId         = newProd.id;
  state.activeSectionFilter     = 'All';

  closeModal();
  renderAll();
  showToast(`${name} added`);

  // Write to Firestore
  saveProduct(newProd).catch(console.error);
  newSections.forEach(s => saveSection(s).catch(console.error));
}

async function copyCardLink(cardId) {
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;

  if (!card.shareToken) {
    card.shareToken = genToken();
    // Write token to Firestore
    await createShareLink(card.shareToken, { type: 'card', cardId });
    await updateCardToken(cardId, card.shareToken);
  }

  const sectionSlug = slugify(card.section);
  const cardSlug    = slugify(card.title);
  const url = `${location.origin}${location.pathname}#${card.shareToken}/${sectionSlug}/${cardSlug}`;
  copyToClipboard(url, 'Link copied — share with your team');
}

async function shareBoardLink() {
  if (state.activeSectionFilter === 'All') {
    showToast('Select a section first, then share');
    return;
  }
  const sections = state.sections[state.activeProductId] || [];
  const section  = sections.find(s => s.name === state.activeSectionFilter);
  if (!section) return;

  if (!section.shareToken) {
    section.shareToken = genToken();
    await createShareLink(section.shareToken, {
      type:        'board',
      productId:   state.activeProductId,
      sectionName: state.activeSectionFilter,
    });
    await updateSectionToken(section.id, section.shareToken);
  }

  const sectionSlug = slugify(state.activeSectionFilter);
  const url = `${location.origin}${location.pathname}#${section.shareToken}/${sectionSlug}`;
  copyToClipboard(url, 'Board link copied — share with your team');
}

// ── Clipboard helper ──
function copyToClipboard(text, successMsg) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMsg))
      .catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}
function fallbackCopy(text, msg) {
  const inp = Object.assign(document.createElement('input'), { value: text });
  document.body.appendChild(inp);
  inp.select();
  try { document.execCommand('copy'); showToast(msg); } catch (_) { prompt('Copy this link:', text); }
  document.body.removeChild(inp);
}

// ── User menu ──
function toggleUserMenu() {
  document.getElementById('user-menu').classList.toggle('hidden');
}
document.addEventListener('click', e => {
  const chip = document.getElementById('user-chip');
  if (chip && !chip.contains(e.target)) document.getElementById('user-menu')?.classList.add('hidden');
});

// ============================================================
// TOAST
// ============================================================

let _toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.remove('hidden');
  toast.style.animation = 'none';
  void toast.offsetHeight;
  toast.style.animation = '';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!document.getElementById('lightbox').classList.contains('hidden')) { closeLightbox(); return; }
  if (_activeModal) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const id = document.activeElement?.id;
  if (id === 'login-email') {
    const pw = document.getElementById('login-password');
    pw?.value ? handleLogin() : pw?.focus();
  } else if (id === 'login-password') {
    handleLogin();
  }
});

document.addEventListener('input', e => {
  if (['login-email','login-password'].includes(e.target?.id))
    document.getElementById('login-error')?.classList.add('hidden');
});

// ============================================================
// UTILITIES
// ============================================================

function genToken(len = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let t = '';
  for (let i = 0; i < len; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isImageUrl(url) {
  if (!url) return false;
  // Cloudinary URLs don't always end in extension — check resource_type or common patterns
  if (/\.(jpe?g|png|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url)) return true;
  if (url.includes('cloudinary.com') && !url.includes('/raw/') && !/\.pdf/i.test(url)) return true;
  return false;
}
function isPdfUrl(url) {
  if (!url) return false;
  return /\.pdf(\?.*)?$/i.test(url) || (url.includes('cloudinary.com') && url.includes('/raw/'));
}
function attachEmoji(url) {
  if (isImageUrl(url))                     return '🖼';
  if (isPdfUrl(url))                       return '📄';
  if (/\.(xlsx?|csv|tsv|ods)$/i.test(url)) return '📊';
  return '📎';
}

// ============================================================
// CLOUDINARY UPLOAD
// ============================================================

async function uploadToCloudinary(file) {
  const isPdf     = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const endpoint  = isPdf ? 'raw' : 'image';

  const fd = new FormData();
  fd.append('file',          file);
  fd.append('upload_preset', CLOUDINARY_PRESET);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${endpoint}/upload`, {
    method: 'POST',
    body:   fd,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.secure_url;
}

// ── Drop zone — multiple files ──
let _stagedUrls = []; // array of {url, name}

function initDropZone() {
  _stagedUrls = [];
  const zone = document.getElementById('drop-zone');
  if (!zone) return;

  renderDropFilesList();

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over'); });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = [...(e.dataTransfer?.files || [])];
    if (files.length) handleFilesUpload(files);
  });

  zone._pasteHandler = e => {
    const file = [...(e.clipboardData?.items || [])].find(i => i.kind === 'file')?.getAsFile();
    if (file) { e.preventDefault(); handleFilesUpload([file]); }
  };
  document.addEventListener('paste', zone._pasteHandler);
}

function teardownDropZone() {
  const zone = document.getElementById('drop-zone');
  if (zone?._pasteHandler) document.removeEventListener('paste', zone._pasteHandler);
}

function renderDropFilesList() {
  const list = document.getElementById('drop-files-list');
  if (!list) return;
  const idle = document.getElementById('drop-idle');
  if (_stagedUrls.length === 0) {
    list.innerHTML = '';
    idle?.classList.remove('hidden');
    return;
  }
  idle?.classList.add('hidden');
  list.innerHTML = _stagedUrls.map((f, i) => {
    const isPdf = isPdfUrl(f.url);
    const isImg = isImageUrl(f.url);
    const icon  = isImg ? '🖼' : isPdf ? '📄' : '📎';
    return `<div class="drop-file-item">
      <span class="drop-file-item-icon">${icon}</span>
      <span class="drop-file-item-name">${esc(f.name)}</span>
      <button class="drop-remove-btn" onclick="removeAttachmentAt(${i})">✕</button>
    </div>`;
  }).join('') + `<label class="drop-add-more" for="file-input">+ Add more</label>`;
}

async function handleFilesUpload(files) {
  const uploading = document.getElementById('drop-uploading');
  const label     = document.getElementById('drop-uploading-label');
  uploading?.classList.remove('hidden');
  document.getElementById('drop-idle')?.classList.add('hidden');

  for (let i = 0; i < files.length; i++) {
    if (label) label.textContent = files.length > 1 ? `Uploading ${i+1}/${files.length}…` : 'Uploading…';
    try {
      const url = await uploadToCloudinary(files[i]);
      _stagedUrls.push({ url, name: files[i].name || 'screenshot.png' });
    } catch (err) {
      console.error(err);
      showToast(`Failed to upload ${files[i].name || 'file'}`);
    }
  }

  uploading?.classList.add('hidden');
  document.getElementById('file-input').value = '';
  renderDropFilesList();
}

function handleFileInputMulti(fileList) {
  const files = [...(fileList || [])];
  if (files.length) handleFilesUpload(files);
}

function removeAttachmentAt(index) {
  _stagedUrls.splice(index, 1);
  renderDropFilesList();
}
function attachFilename(url) {
  try { return decodeURIComponent(new URL(url).pathname.split('/').pop()) || url; }
  catch (_) { return url.split('/').pop() || url; }
}
function tagClass(s) {
  return ({Marketing:'tag-marketing',SEO:'tag-seo',Dev:'tag-dev',Content:'tag-content',
           Ads:'tag-ads',Design:'tag-design',Product:'tag-product'})[s] || 'tag-default';
}
function tintClass(s) {
  return ({Marketing:'tint-marketing',SEO:'tint-seo',Dev:'tint-dev',Content:'tint-content',
           Ads:'tint-ads',Design:'tint-design',Product:'tint-product'})[s] || '';
}
function priorityClass(p) {
  return ({High:'priority-high',Medium:'priority-medium',Low:'priority-low'})[p] || 'priority-low';
}
function statusClass(s) {
  return ({'To Do':'status-todo','In Progress':'status-inprogress','Done':'status-done'})[s] || 'status-todo';
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' });
}
function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ============================================================
// EXPOSE TO WINDOW  (required — HTML onclick handlers need globals)
// ============================================================

Object.assign(window, {
  handleLogin, handleLogout, toggleUserMenu,
  openNewBriefModal, openEditModal, openViewModal,
  openAddProductModal, openLightbox, closeLightbox, handleLightboxClick,
  closeModal, handleOverlayClick,
  saveBrief, deleteCard, cycleStatus,
  switchProduct, switchSection, handleAddSection, addProduct,
  copyCardLink, shareBoardLink, showToast,
  openDeleteSectionModal, checkDeleteConfirm, confirmDeleteSection,
  handleFileInputMulti, removeAttachmentAt,
});

// ============================================================
// INIT
// ============================================================

handleRoute();
