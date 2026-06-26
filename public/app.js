/* ============================================================
   GELISAH — VCS Talent Agency
   app.js
   ============================================================ */

/* ══════════════════════════════
   STATE & CONSTANTS
══════════════════════════════ */
const DB_KEY = 'gelisah_data_v4';

let state = {
  bg: { type: 'color', value: '#0a0a0f', imageData: null },
  music: {
    enabled: true,
    url: 'https://youtu.be/S8m5FQfANs4?si=wgY8OOJu21TlGtiF'
  },
  talents: [
    {
      id: 1,
      name: 'Arlina',
      photo: '',
      desc: 'Talent VCS cantik dan ramah, siap menemanimu kapan saja dengan suara merdu dan kepribadian yang menyenangkan.'
    },
    {
      id: 2,
      name: 'Bella',
      photo: '',
      desc: 'Percakapan seru dan menarik, Bella hadir untuk membuatmu nyaman dan terhibur setiap saat.'
    },
    {
      id: 3,
      name: 'Citra',
      photo: '',
      desc: 'Energik dan ceria, Citra adalah pilihan terbaik untuk sesi VCS yang penuh keceriaan dan keseruan.'
    }
  ]
};

let nextId      = 100;
let chatOpen    = false;
let replyIdx    = 0;
let ytPlayer    = null;
let ytApiReady  = false;
let musicStarted = false;

const autoReplies = [
  'Terima kasih sudah menghubungi kami! 😊',
  'Silakan pilih talent dari halaman utama untuk order langsung ya.',
  'Ada yang bisa kami bantu lagi?',
  'Tim kami siap melayani 24/7. Untuk order cepat, klik tombol di profil talent! 💫',
  'Terima kasih atas kepercayaan kamu kepada GELISAH! 🌟',
  'Untuk info lebih lanjut bisa gabung di group Telegram kami ya! 😊'
];

/* ══════════════════════════════
   DATA — LOAD & SAVE
══════════════════════════════ */
function loadData() {
  try {
    const s = localStorage.getItem(DB_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      state = Object.assign({}, state, parsed);
      if (!state.music) {
        state.music = {
          enabled: true,
          url: 'https://youtu.be/S8m5FQfANs4?si=wgY8OOJu21TlGtiF'
        };
      }
      nextId = Math.max(nextId, ...state.talents.map(t => t.id || 0)) + 1;
    }
  } catch (e) {}
}

function saveData() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  } catch (e) {}
}

/* ══════════════════════════════
   YOUTUBE BACKGROUND MUSIC
══════════════════════════════ */

/** Called automatically by YouTube IFrame API when it's ready */
function onYouTubeIframeAPIReady() {
  ytApiReady = true;
}

/** Extract YouTube video ID from any youtube URL format */
function extractYtId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Create hidden YT player and start playback at 50% volume */
function startMusic() {
  if (musicStarted || !state.music || !state.music.enabled) return;
  const vid = extractYtId(state.music.url);
  if (!vid) return;

  // Wait for YT API to be ready
  if (!ytApiReady) {
    setTimeout(startMusic, 500);
    return;
  }

  musicStarted = true;

  const container = document.getElementById('yt-frame');
  const el = document.createElement('div');
  el.id = 'yt-inner';
  container.appendChild(el);

  ytPlayer = new YT.Player('yt-inner', {
    videoId: vid,
    playerVars: {
      autoplay:       1,
      loop:           1,
      playlist:       vid,   // required for loop to work
      controls:       0,
      disablekb:      1,
      fs:             0,
      modestbranding: 1,
      rel:            0
    },
    events: {
      onReady: function (e) {
        e.target.setVolume(50);
        e.target.playVideo();
      },
      onStateChange: function (e) {
        // Fallback loop in case playlist loop fails
        if (e.data === YT.PlayerState.ENDED) {
          ytPlayer.seekTo(0);
          ytPlayer.playVideo();
        }
      }
    }
  });
}

/** Stop and destroy current YT player */
function stopMusic() {
  if (ytPlayer) {
    try { ytPlayer.stopVideo(); ytPlayer.destroy(); } catch (e) {}
    ytPlayer = null;
  }
  musicStarted = false;
  const el = document.getElementById('yt-inner');
  if (el) el.remove();
}

/**
 * Triggered once on first user interaction.
 * Browser policy requires a user gesture before audio can play.
 */
function onFirstInteraction() {
  if (state.music && state.music.enabled && !musicStarted) {
    startMusic();
  }
  // Remove all listeners after first trigger
  document.removeEventListener('click',      onFirstInteraction);
  document.removeEventListener('touchstart', onFirstInteraction);
  document.removeEventListener('keydown',    onFirstInteraction);
  document.removeEventListener('scroll',     onFirstInteraction);
}

/* ══════════════════════════════
   BACKGROUND
══════════════════════════════ */

/** Apply saved background to the page overlay */
function applyBg() {
  const o = document.getElementById('bg-overlay');
  if (state.bg && state.bg.imageData) {
    o.style.backgroundImage  = 'url(' + state.bg.imageData + ')';
    o.style.backgroundColor  = '';
  } else {
    o.style.backgroundImage  = '';
    o.style.backgroundColor  = (state.bg && state.bg.value) || '#0a0a0f';
  }
}

/** Handle background image file upload from gallery */
function handleBgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.bg.imageData = ev.target.result;
    state.bg.type      = 'image';
    document.getElementById('bg-upload-label').textContent = '✓ ' + file.name;
    previewBg();
  };
  reader.readAsDataURL(file);
}

/** Remove background image, revert to color */
function clearBgImage() {
  state.bg.imageData = null;
  state.bg.type      = 'color';
  document.getElementById('bg-upload-label').textContent = '📁 Klik untuk upload foto';
  previewBg();
}

/** Update the preview box inside admin panel */
function previewBg() {
  const prev = document.getElementById('bg-preview');
  if (state.bg.imageData) {
    prev.style.backgroundImage = 'url(' + state.bg.imageData + ')';
    prev.style.backgroundColor = '';
  } else {
    prev.style.backgroundColor = document.getElementById('bg-color').value;
    prev.style.backgroundImage = '';
  }
}

/** Sync color picker → hex text field */
function onColorPick() {
  const c = document.getElementById('bg-color').value;
  document.getElementById('bg-color-hex').value = c;
  state.bg.value     = c;
  state.bg.imageData = null;
  previewBg();
}

/** Sync hex text field → color picker */
function syncColorHex() {
  const v = document.getElementById('bg-color-hex').value;
  if (/^#[0-9a-f]{6}$/i.test(v)) {
    document.getElementById('bg-color').value = v;
    state.bg.value     = v;
    state.bg.imageData = null;
    previewBg();
  }
}

/* ══════════════════════════════
   TALENT GRID (Landing Page)
══════════════════════════════ */

/** Render all talent cards on the home page */
function renderTalentGrid() {
  const grid = document.getElementById('talent-grid');
  grid.innerHTML = '';

  if (!state.talents || !state.talents.length) {
    grid.innerHTML =
      '<div style="text-align:center;color:rgba(255,255,255,0.3);padding:60px;grid-column:1/-1;">' +
      'Belum ada talent. Tambahkan di panel admin.</div>';
    return;
  }

  state.talents.forEach(t => {
    const card = document.createElement('div');
    card.className = 'talent-card';
    card.onclick   = () => showDetail(t);

    const imgHtml = t.photo
      ? '<img src="' + t.photo + '" alt="' + t.name + '" ' +
        'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
        '<div class="talent-card-no-img" style="display:none;">👤</div>'
      : '<div class="talent-card-no-img">👤</div>';

    card.innerHTML =
      imgHtml +
      '<div class="talent-info">' +
        '<div class="talent-name">'  + t.name + '</div>' +
        '<div class="talent-desc">'  + t.desc + '</div>' +
        '<div class="talent-cta">Lihat profil →</div>' +
      '</div>';

    grid.appendChild(card);
  });
}

/** Open talent detail page */
function showDetail(t) {
  const tgMsg = encodeURIComponent(
    'Halo admin GELISAH, saya ingin order VCS dengan talent: ' + t.name
  );

  const imgHtml = t.photo
    ? '<img src="' + t.photo + '" alt="' + t.name + '" class="detail-photo" ' +
      'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
      '<div class="detail-photo-placeholder" style="display:none;">👤</div>'
    : '<div class="detail-photo-placeholder">👤</div>';

  document.getElementById('detail-content').innerHTML =
    imgHtml +
    '<div class="detail-name">'  + t.name + '</div>' +
    '<div class="detail-badge">VCS TALENT GELISAH</div>' +
    '<div class="detail-desc">'  + t.desc + '</div>' +
    '<a href="https://t.me/livechatgs_bot?text=' + tgMsg + '" target="_blank" class="order-btn">' +
      '💬 Order VCS dengan ' + t.name +
    '</a>';

  showPage('detail');
}

/* ══════════════════════════════
   ADMIN PANEL
══════════════════════════════ */

/** Render talent list inside admin panel */
function renderAdminList() {
  const list = document.getElementById('talent-list');
  list.innerHTML = '';

  (state.talents || []).forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'talent-admin-item';

    const upBtn = i > 0
      ? '<button class="btn-sm" onclick="moveTalent(' + t.id + ',-1)">↑</button>'
      : '';
    const dnBtn = i < state.talents.length - 1
      ? '<button class="btn-sm" onclick="moveTalent(' + t.id + ',1)">↓</button>'
      : '';

    const imgSection = t.photo
      ? '<div class="photo-upload-area" style="flex-direction:column;">' +
          '<input type="file" accept="image/*" onchange="handleTalentPhoto(event,' + t.id + ')">' +
          '<img src="' + t.photo + '" class="photo-preview-img">' +
        '</div>' +
        '<button onclick="clearTalentPhoto(' + t.id + ')" ' +
          'style="background:transparent;border:none;color:rgba(255,255,255,0.4);font-size:11px;cursor:pointer;margin-top:4px;">' +
          '✕ Hapus foto</button>'
      : '<div class="photo-upload-area">' +
          '<input type="file" accept="image/*" onchange="handleTalentPhoto(event,' + t.id + ')">' +
          '<div><div class="upload-icon">📷</div>' +
          '<div class="photo-placeholder">Klik upload foto dari galeri</div></div>' +
        '</div>';

    div.innerHTML =
      '<div class="talent-admin-header">' +
        '<span class="talent-num">TALENT #' + (i + 1) + '</span>' +
        '<div class="talent-admin-actions">' +
          upBtn + dnBtn +
          '<button class="btn-sm del" onclick="delTalent(' + t.id + ')">Hapus</button>' +
        '</div>' +
      '</div>' +
      '<div class="talent-admin-grid">' +
        '<div>' +
          '<label>Nama Talent</label>' +
          '<input type="text" value="' + t.name + '" ' +
            'oninput="updateTalent(' + t.id + ',\'name\',this.value)" placeholder="Nama talent...">' +
        '</div>' +
        '<div><label>Foto Talent</label>' + imgSection + '</div>' +
      '</div>' +
      '<div class="talent-admin-grid full" style="margin-top:10px;">' +
        '<div>' +
          '<label>Deskripsi</label>' +
          '<textarea oninput="updateTalent(' + t.id + ',\'desc\',this.value)">' + t.desc + '</textarea>' +
        '</div>' +
      '</div>';

    list.appendChild(div);
  });
}

/** Handle talent photo upload from device gallery */
function handleTalentPhoto(e, id) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    updateTalent(id, 'photo', ev.target.result);
    renderAdminList();
  };
  reader.readAsDataURL(file);
}

/** Remove talent photo */
function clearTalentPhoto(id) {
  updateTalent(id, 'photo', '');
  renderAdminList();
}

/** Add a new blank talent */
function addTalent() {
  state.talents.push({
    id:    nextId++,
    name:  'Talent Baru',
    photo: '',
    desc:  'Deskripsi talent...'
  });
  renderAdminList();
}

/** Delete a talent by id */
function delTalent(id) {
  if (!confirm('Hapus talent ini?')) return;
  state.talents = state.talents.filter(t => t.id !== id);
  renderAdminList();
}

/** Move talent up or down in the list */
function moveTalent(id, dir) {
  const i  = state.talents.findIndex(t => t.id === id);
  const ni = i + dir;
  if (ni < 0 || ni >= state.talents.length) return;
  [state.talents[i], state.talents[ni]] = [state.talents[ni], state.talents[i]];
  renderAdminList();
}

/** Update a single field on a talent object */
function updateTalent(id, key, val) {
  const t = state.talents.find(t => t.id === id);
  if (t) t[key] = val;
}

/** Save all admin changes to localStorage */
function saveAll() {
  state.bg.value = document.getElementById('bg-color').value;

  const newUrl     = document.getElementById('music-url-input').value.trim();
  const newEnabled = document.getElementById('music-enabled').checked;

  // Restart player if URL changed
  if (newUrl && newUrl !== state.music.url) {
    stopMusic();
    state.music.url  = newUrl;
    musicStarted     = false;
    if (newEnabled) startMusic();
  } else if (!newEnabled && state.music.enabled) {
    stopMusic();
  } else if (newEnabled && !state.music.enabled) {
    musicStarted = false;
    startMusic();
  }

  state.music.url     = newUrl || state.music.url;
  state.music.enabled = newEnabled;

  saveData();
  applyBg();
  renderTalentGrid();
  showToast('Semua perubahan berhasil disimpan! ✓', 'success');
}

/* ══════════════════════════════
   PAGE NAVIGATION
══════════════════════════════ */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');

  if (id === 'admin') {
    renderAdminList();
    previewBg();
    const col = state.bg.value || '#0a0a0f';
    document.getElementById('bg-color').value     = col;
    document.getElementById('bg-color-hex').value = col;
    document.getElementById('music-url-input').value = state.music.url || '';
    document.getElementById('music-enabled').checked = !!state.music.enabled;
  }

  window.scrollTo(0, 0);
}

/* ══════════════════════════════
   TOAST NOTIFICATION
══════════════════════════════ */
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast ' + type + ' show';
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

/* ══════════════════════════════
   LIVE CHAT
══════════════════════════════ */
function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chat-win').classList.toggle('open', chatOpen);
  if (chatOpen) {
    document.getElementById('chat-notif').style.display = 'none';
    document.getElementById('chat-input').focus();
  }
}

function sendChat() {
  const inp = document.getElementById('chat-input');
  const msg = inp.value.trim();
  if (!msg) return;

  const msgs = document.getElementById('chat-msgs');

  // User bubble
  const u = document.createElement('div');
  u.className   = 'msg-bubble user';
  u.textContent = msg;
  msgs.appendChild(u);
  inp.value = '';
  msgs.scrollTop = msgs.scrollHeight;

  // Auto-reply after delay
  setTimeout(() => {
    const a = document.createElement('div');
    a.className   = 'msg-bubble admin';
    a.textContent = autoReplies[replyIdx++ % autoReplies.length];
    msgs.appendChild(a);
    msgs.scrollTop = msgs.scrollHeight;
  }, 900);
}

/* ══════════════════════════════
   INIT
══════════════════════════════ */
loadData();
applyBg();
renderTalentGrid();

// Show chat notification after 3 seconds
setTimeout(() => {
  if (!chatOpen) document.getElementById('chat-notif').style.display = 'flex';
}, 3000);

// Start music on first user interaction (required by browser autoplay policy)
document.addEventListener('click',      onFirstInteraction);
document.addEventListener('touchstart', onFirstInteraction);
document.addEventListener('keydown',    onFirstInteraction);
document.addEventListener('scroll',     onFirstInteraction);
