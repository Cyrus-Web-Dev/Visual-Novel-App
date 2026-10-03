// ==============================
// STATE GAME (GLOBAL)
// ==============================
let storyData = [];
let currentIndex = 0;
let mcName = "Ahmad";
let currentActiveChapter = 1;
let currentVoice = null;
let currentBgm = null;
let currentBgmFile = "";
let maxUnlockedChapter = 1;

// Volume BGM & Voice (0.0–1.0), disimpan di localStorage
let bgmVolume = 0.10;
let voiceVolume = 1.0;
let bgmDucked = false;
const BGM_DUCK_FACTOR = 0.35; // BGM diperkecil saat voice main

try {
    const sb = localStorage.getItem("hlh_bgm_volume");
    const sv = localStorage.getItem("hlh_voice_volume");
    if (sb !== null) bgmVolume = Math.min(1, Math.max(0, parseFloat(sb)));
    if (sv !== null) voiceVolume = Math.min(1, Math.max(0, parseFloat(sv)));
} catch (_) {}

// Nama file musik latar menu utama
const MENU_BGM = "peaceful_school.mp3";

let affectionFxTimeout = null;
let affectionFxCallback = null;

// Setelah pilih opsi branching, skip ke merge point (hindari memutar semua path)
let branchSkipToIndex = null;

// Menyimpan status affection masing-masing cewek
let progressAffection = {
    1: 0, // Suzuki Ichika
    2: 0, // Tachibana Nino
    3: 0, // Yoshikawa Miku
    4: 0, // Takahashi Yotsuba
    5: 0  // Watanabe Itsuki
};

// Menyimpan status ending yang sudah dicapai per chapter (status TERAKHIR)
let chapterEndingStatus = {
    1: null, // null, 'happy', 'good', 'bad'
    2: null,
    3: null,
    4: null,
    5: null
};

// Album: foto yang pernah terbuka (permanent, tidak di-reset)
// bad = ditinggalkan (<80), good = pacaran (>=80), happy = pernikahan (>=100)
let albumUnlocks = {
    1: { bad: false, good: false, happy: false },
    2: { bad: false, good: false, happy: false },
    3: { bad: false, good: false, happy: false },
    4: { bad: false, good: false, happy: false },
    5: { bad: false, good: false, happy: false },
    6: { harem: false }
};

// Extra chapter (after marriage) — terbuka jika ending happy chapter 1-5
let extraUnlocks = { 1: false, 2: false, 3: false, 4: false, 5: false };
let currentIsExtra = false;

const NAMA_CEWEK = ["", "Ichika", "Nino", "Miku", "Yotsuba", "Itsuki"];
const ALBUM_META = {
    1: { name: "Suzuki Ichika", emoji: "🌸", color: "#ff8fa8", id: "ichika" },
    2: { name: "Tachibana Nino", emoji: "🍓", color: "#ff6f6f", id: "nino" },
    3: { name: "Yoshikawa Miku", emoji: "💧", color: "#6fc8d6", id: "miku" },
    4: { name: "Takahashi Yotsuba", emoji: "🍀", color: "#8fc655", id: "yotsuba" },
    5: { name: "Watanabe Itsuki", emoji: "🌟", color: "#f2c94c", id: "itsuki" }
};

// ==============================
// DATA KARAKTER LENGKAP
// ==============================
const CHARACTERS = [
    {
        id: "ichika",
        chapter: 1,
        emoji: "🌸",
        color: "#ff8fa8",
        name: "Suzuki Ichika",
        location: "Tempat Les Bahasa Inggris",
        role: "Model Populer yang Lelah",
        personality: "Ichika tampil sebagai cewek modis dan dewasa, namun sebenarnya sangat lelah dengan tekanan kariernya. Dia mencari seseorang yang bisa menerimanya sebagai dirinya sendiri. Di luar, Ichika selalu tersenyum dan menjadi tempat bersandar orang lain. Namun di dalam, dia sangat lelah karena tekanan karier modelnya dan merasa kesepian karena tidak ada tempat untuk mengeluh.",
        habit: "Suka ketiduran di bahu MC saat les karena kelelahan, dan suka menjahili MC dengan berpura-pura tidak tahu bahasa Inggris yang mudah agar bisa berdekatan.",
        why: "MC adalah satu-satunya orang yang memperlakukannya sebagai 'Ichika biasa', bukan sebagai model terkenal. MC menyadari kelelahannya tanpa dia harus bercerita, dan menawarkan pundak serta ketulusan untuk membantunya."
    },
    {
        id: "nino",
        chapter: 2,
        emoji: "🍓",
        color: "#ff6f6f",
        name: "Tachibana Nino",
        location: "Perpustakaan",
        role: "Tsundere Modern yang Protektif",
        personality: "Nino punya gaya bicara yang ketus, defensif, dan selalu menilai orang dari luarnya saja (apalagi MC yang terlihat miskin). Namun, sifat aslinya sangat feminin, peduli pada kebersihan, dan sangat menyayangi teman-temannya. Dia memasak bukan cuma hobi, tapi cara mengekspresikan kasih sayang yang tidak bisa dia ucapkan lewat kata-kata. Di balik sikap galaknya, Nino sebenarnya sangat perhatian dan selalu khawatir dengan orang-orang di sekitarnya.",
        habit: "Selalu memalingkan wajah sambil merona merah saat memberi MC bekal kotak (bento), lalu berkata, 'Ini cuma sisa memasakku tadi pagi, jangan geer ya!' Dia juga suka memasak dengan resep-resep rumit dan selalu berusaha menyempurnakan masakannya.",
        why: "Karena saat semua orang menjauhinya akibat sifat ketusnya, MC tetap bertahan dengan sabar. MC dengan tulus menghabiskan masakan Nino yang gagal dan memujinya dengan detail. Ini membuat dinding pertahanan Nino runtuh total karena dia merasa diterima apa adanya."
    },
    {
        id: "miku",
        chapter: 3,
        emoji: "💧",
        color: "#6fc8d6",
        name: "Yoshikawa Miku",
        location: "Kedai Ramen",
        role: "Si Pendiam yang Penuh Hasrat Tersembunyi",
        personality: "Miku adalah cewek introvert ekstrem yang merasa dirinya membosankan. Dia memakai headphone besar ke mana-mana agar orang tidak mengajaknya bicara. Padahal, jika sudah membahas sejarah Jepang kuno (Samurai dan Shogun), matanya akan berbinar-binar dan dia bisa bicara berjam-jam tanpa henti. Di balik sifat pendiamnya, Miku memiliki hasrat dan pengetahuan yang sangat dalam tentang sejarah, yang membuatnya unik dan menarik.",
        habit: "Suka memainkan kabel headphone-nya saat gugup berhadapan dengan MC, dan selalu menyembunyikan wajahnya di balik kerah jaketnya jika sedang malu. Dia juga sering membawa buku sejarah ke mana-mana dan membaca di tempat-tempat tidak biasa seperti kedai ramen.",
        why: "Orang lain menganggap hobi sejarah Miku itu aneh untuk seorang cewek. Namun, MC justru mendengarkan ceritanya dengan antusias, bahkan bisa mengimbangi pengetahuannya. Miku merasa akhirnya ada orang yang benar-benar 'melihat' dan menerima dirinya apa adanya, tanpa menghakimi."
    },
    {
        id: "yotsuba",
        chapter: 4,
        emoji: "🍀",
        color: "#8fc655",
        name: "Takahashi Yotsuba",
        location: "Lapangan Basket",
        role: "Sinar Matahari yang Memendam Kesedihan",
        personality: "Yotsuba adalah cewek tomboi yang enerjik, selalu positif, dan menjadi andalan klub olahraga. Masalahnya, dia tidak bisa berkata 'tidak'. Dia sering dimanfaatkan untuk mengerjakan tugas klub lain sampai fisiknya drop, karena selalu mengutamakan kebahagiaan orang lain di atas dirinya sendiri. Meskipun terlihat ceria, Yotsuba sebenarnya memiliki rasa rendah diri yang dalam karena merasa tidak sepintar atau secantik teman-temannya.",
        habit: "Suka menepuk punggung MC dengan keras sampai MC tersedak, dan ekspresi wajahnya sangat ekspresif — mudah tertawa terbahak-bahak tapi juga mudah menangis terharu. Dia juga selalu membawa handuk dan botol minum ke mana-mana karena sering diminta tolong oleh klub lain.",
        why: "MC adalah orang pertama yang memarahi Yotsuba karena terlalu memaksakan diri. MC menarik tangan Yotsuba keluar dari lapangan, menyuruhnya istirahat, dan berkata, 'Kamu juga berhak untuk lelah, Yotsuba.' Kata-kata itu menyelamatkan kesehatan mental Yotsuba dan membuatnya merasa dihargai sebagai pribadi, bukan hanya sebagai 'orang yang bisa membantu'."
    },
    {
        id: "itsuki",
        chapter: 5,
        emoji: "🌟",
        color: "#f2c94c",
        name: "Watanabe Itsuki",
        location: "Kelas Privat",
        role: "Cewek Formal yang Gengsian & Pecinta Kuliner",
        personality: "Itsuki berasal dari keluarga terpandang. Dia sangat sopan, kaku, dan ambisius dalam belajar, tetapi sering gagal karena salah metode. Dia punya gengsi setinggi langit dan awalnya memandang rendah MC yang menjadi guru privatnya. Namun, di balik topeng serius itu, dia adalah seorang foodie yang kekanak-kanakan. Itsuki sebenarnya sangat kesepian karena orang tuanya sibuk dan tidak pernah memperhatikannya.",
        habit: "Perutnya sering berbunyi di tengah-tengah sesi belajar privat yang serius, membuat wajahnya memerah menahan malu. Dia juga suka menyembunyikan makanan ringan di balik buku dan memakannya diam-diam saat belajar. Itsuki sangat menyukai makanan jalanan yang murah tapi enak, meskipun gengsinya melarangnya untuk mengakuinya.",
        why: "MC tidak membalas keangkuhan Itsuki dengan kemarahan. Sebaliknya, MC membuatkan metode belajar khusus sesuai cara berpikir Itsuki, dan sering membawa camilan murah namun enak sebagai hadiah jika Itsuki berhasil menjawab soal. Hal ini meruntuhkan gengsi Itsuki sekaligus merebut hatinya lewat makanan. MC juga menunjukkan perhatian yang tidak pernah Itsuki dapatkan dari keluarganya."
    }
];

function getCharId(chapterNum) {
    const map = {1: 'ichika', 2: 'nino', 3: 'miku', 4: 'yotsuba', 5: 'itsuki'};
    return map[chapterNum] || 'ichika';
}

/** Persist chapterEndingStatus + maxUnlockedChapter ke localStorage */
function saveProgressToLocal() {
    try {
        localStorage.setItem('hlh_chapter_endings', JSON.stringify(chapterEndingStatus));
        localStorage.setItem('hlh_max_unlocked', String(maxUnlockedChapter || 1));
        localStorage.setItem('hlh_extra_unlocks', JSON.stringify(extraUnlocks));
        localStorage.setItem('hlh_affection', JSON.stringify(progressAffection));
    } catch (e) {
        console.warn('saveProgressToLocal failed', e);
    }
}

/** Load progress dari localStorage (supaya Chapter 6 tetap muncul setelah refresh) */
function loadProgressFromLocal() {
    try {
        const rawEnd = localStorage.getItem('hlh_chapter_endings');
        if (rawEnd) {
            const parsed = JSON.parse(rawEnd);
            for (let i = 1; i <= 5; i++) {
                if (parsed[i]) chapterEndingStatus[i] = parsed[i];
            }
        }
        const rawMax = localStorage.getItem('hlh_max_unlocked');
        if (rawMax !== null) {
            const n = parseInt(rawMax, 10);
            if (!isNaN(n) && n > 0) maxUnlockedChapter = n;
        }
        const rawAff = localStorage.getItem('hlh_affection');
        if (rawAff) {
            const parsed = JSON.parse(rawAff);
            for (let i = 1; i <= 5; i++) {
                if (typeof parsed[i] === 'number') progressAffection[i] = parsed[i];
            }
        }
        // Sinkron extra → happy
        for (let i = 1; i <= 5; i++) {
            if (extraUnlocks[i]) chapterEndingStatus[i] = 'happy';
            if (chapterEndingStatus[i] === 'happy') extraUnlocks[i] = true;
        }
        // Jika semua extra terbuka / semua happy, pastikan maxUnlocked cukup untuk Chapter 6
        let allHappy = true;
        for (let i = 1; i <= 5; i++) {
            if (chapterEndingStatus[i] !== 'happy') { allHappy = false; break; }
        }
        if (allHappy) {
            maxUnlockedChapter = Math.max(maxUnlockedChapter, 6);
        } else {
            // Naikkan max berdasarkan chapter yang sudah selesai (ada ending)
            for (let i = 1; i <= 5; i++) {
                if (chapterEndingStatus[i]) {
                    maxUnlockedChapter = Math.max(maxUnlockedChapter, i + 1);
                }
            }
        }
    } catch (e) {
        console.warn('loadProgressFromLocal failed', e);
    }
}

// ==============================
// UTILITY FUNCTIONS
// ==============================
function showScreen(id) {
    console.log('Showing screen:', id);
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('is-visible'));
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('is-visible');
    } else {
        console.error('Screen not found:', id);
    }
}

function hideOverlayScreen(id) {
    document.getElementById(id).classList.remove('is-visible');
    showScreen('main-menu');
}

// ==============================
// AMBIENT: KELOPAK SAKURA
// ==============================
function generatePetals() {
    const layer = document.getElementById('petals-layer');
    if (!layer) return;
    const total = 16;
    for (let i = 0; i < total; i++) {
        let petal = document.createElement('div');
        petal.className = 'petal';
        let left = Math.random() * 100;
        let duration = 9 + Math.random() * 8;
        let delay = Math.random() * 12;
        let size = 6 + Math.random() * 6;
        petal.style.left = left + '%';
        petal.style.width = size + 'px';
        petal.style.height = size + 'px';
        petal.style.animationDuration = duration + 's';
        petal.style.animationDelay = '-' + delay + 's';
        layer.appendChild(petal);
    }
}
generatePetals();

// ==============================
// BGM MANAGEMENT
// ==============================
function playBgm(filename, volume = null, startMuted = false) {
    // Filename kosong → jangan sentuh BGM yang sedang jalan
    if (!filename || !String(filename).trim()) {
        ensureBgmPlaying();
        return;
    }

    const clean = String(filename).trim();
    const vol = (volume === null || volume === undefined) ? bgmVolume : volume;

    // File sama → pastikan tetap playing + update volume
    if (currentBgm && currentBgmFile === clean) {
        if (!startMuted) currentBgm.muted = false;
        if (!bgmDucked) currentBgm.volume = vol;
        else currentBgm.volume = vol * BGM_DUCK_FACTOR;
        if (currentBgm.paused) {
            currentBgm.play().catch(() => {});
        }
        return;
    }

    // JANGAN pause track lama sebelum track baru berhasil play.
    // Kalau file baru 404 / gagal, musik lama tetap lanjut.
    const prevBgm = currentBgm;
    const prevFile = currentBgmFile;

    try {
        const next = new Audio(`assets/audio/bgm/${clean}`);
        next.loop = true;
        next.volume = vol;
        next.muted = startMuted;

        const onFail = (reason) => {
            console.warn('BGM gagal, tetap pakai track lama:', clean, reason || '');
            if (currentBgm === next) {
                currentBgm = prevBgm;
                currentBgmFile = prevFile;
            }
            ensureBgmPlaying();
        };

        next.addEventListener('error', () => onFail('file tidak ditemukan / path salah'));

        const playPromise = next.play();
        if (playPromise && typeof playPromise.then === 'function') {
            playPromise
                .then(() => {
                    if (prevBgm && prevBgm !== next) {
                        try { prevBgm.pause(); } catch (_) {}
                    }
                    currentBgm = next;
                    currentBgmFile = clean;
                })
                .catch((err) => onFail(err && err.message));
        } else {
            if (prevBgm && prevBgm !== next) {
                try { prevBgm.pause(); } catch (_) {}
            }
            currentBgm = next;
            currentBgmFile = clean;
        }
    } catch (e) {
        console.warn('BGM error:', e);
        ensureBgmPlaying();
    }
}

function ensureBgmPlaying() {
    if (currentBgm && currentBgmFile && currentBgm.paused) {
        currentBgm.play().catch(() => {});
    }
}

function stopBgm() {
    if (currentBgm) {
        try { currentBgm.pause(); } catch (_) {}
        currentBgm = null;
        currentBgmFile = "";
    }
    bgmDucked = false;
}

function duckBgm() {
    if (currentBgm && !bgmDucked) {
        try {
            currentBgm.volume = bgmVolume * BGM_DUCK_FACTOR;
            bgmDucked = true;
        } catch (_) {}
    }
}

function unduckBgm() {
    if (currentBgm && bgmDucked) {
        try {
            currentBgm.volume = bgmVolume;
            bgmDucked = false;
        } catch (_) {}
    }
}

/** Stop voice yang sedang jalan (wajib dipanggil saat skip dialog) */
function stopVoice() {
    if (currentVoice) {
        try {
            currentVoice.pause();
            currentVoice.currentTime = 0;
            currentVoice.onended = null;
            currentVoice.onerror = null;
        } catch (_) {}
        currentVoice = null;
    }
    unduckBgm();
}

/** Putar voice baris dialog baru; otomatis stop voice lama */
function playVoiceLine(filename) {
    stopVoice();
    if (!filename || !String(filename).trim()) return;

    let clean = String(filename).trim().replace(/\.mp3$/i, ".wav");
    try {
        const audio = new Audio(`assets/audio/voices/${clean}`);
        audio.volume = voiceVolume;
        currentVoice = audio;
        duckBgm();
        audio.onended = () => {
            if (currentVoice === audio) {
                currentVoice = null;
                unduckBgm();
            }
        };
        audio.onerror = () => {
            console.warn("Voice tidak ditemukan:", clean);
            if (currentVoice === audio) {
                currentVoice = null;
                unduckBgm();
            }
        };
        audio.play().catch(() => unduckBgm());
    } catch (e) {
        console.warn("Voice error:", e);
        unduckBgm();
    }
}

function setBgmVolume(val) {
    bgmVolume = Math.min(1, Math.max(0, parseFloat(val) || 0));
    try { localStorage.setItem("hlh_bgm_volume", String(bgmVolume)); } catch (_) {}
    if (currentBgm) {
        currentBgm.volume = bgmDucked ? bgmVolume * BGM_DUCK_FACTOR : bgmVolume;
    }
    const label = document.getElementById("bgm-vol-label");
    if (label) label.textContent = Math.round(bgmVolume * 100) + "%";
}

function setVoiceVolume(val) {
    voiceVolume = Math.min(1, Math.max(0, parseFloat(val) || 0));
    try { localStorage.setItem("hlh_voice_volume", String(voiceVolume)); } catch (_) {}
    if (currentVoice) {
        try { currentVoice.volume = voiceVolume; } catch (_) {}
    }
    const label = document.getElementById("voice-vol-label");
    if (label) label.textContent = Math.round(voiceVolume * 100) + "%";
}

function syncVolumeSliders() {
    const bgmSlider = document.getElementById("bgm-volume-slider");
    const voiceSlider = document.getElementById("voice-volume-slider");
    const bgmLabel = document.getElementById("bgm-vol-label");
    const voiceLabel = document.getElementById("voice-vol-label");
    if (bgmSlider) bgmSlider.value = Math.round(bgmVolume * 100);
    if (voiceSlider) voiceSlider.value = Math.round(voiceVolume * 100);
    if (bgmLabel) bgmLabel.textContent = Math.round(bgmVolume * 100) + "%";
    if (voiceLabel) voiceLabel.textContent = Math.round(voiceVolume * 100) + "%";
}

// Watchdog: cegah BGM mati diam-diam saat pertanyaan / transisi UI
let bgmWatchdog = null;
function startBgmWatchdog() {
    if (bgmWatchdog) return;
    bgmWatchdog = setInterval(() => {
        const game = document.getElementById('game-container');
        if (game && game.classList.contains('is-visible')) {
            ensureBgmPlaying();
        }
    }, 2500);
}

function playMenuBgm(startMuted = false) {
    playBgm(MENU_BGM, bgmVolume, startMuted);
}

// Background scene: file di folder assets/bg/
// Contoh path penuh: visual_novel/assets/bg/classroom_sunset.jpg
let _lastBgFile = "";
function setSceneBackground(filename) {
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) return;

    if (!filename || !String(filename).trim()) {
        return;
    }
    const clean = String(filename).trim();
    if (clean === _lastBgFile) return; // same bg → no flicker
    _lastBgFile = clean;
    const bgUrl = `assets/bg/${clean}`;

    // Soft crossfade: fade out briefly, swap, fade in
    gameContainer.style.transition = "opacity 0.35s ease";
    gameContainer.style.opacity = "0.55";
    const img = new Image();
    img.onload = () => {
        gameContainer.style.backgroundImage = `url('${bgUrl}')`;
        gameContainer.style.backgroundSize = 'cover';
        gameContainer.style.backgroundPosition = 'center';
        gameContainer.style.backgroundRepeat = 'no-repeat';
        requestAnimationFrame(() => {
            gameContainer.style.opacity = "1";
        });
    };
    img.onerror = () => {
        console.warn('⚠️ Background tidak ditemukan:', bgUrl);
        gameContainer.style.backgroundImage = `url('${bgUrl}')`;
        gameContainer.style.opacity = "1";
    };
    img.src = bgUrl;
}

// Unlock BGM on first interaction
let menuBgmUnlockAttempted = false;
function unlockMenuBgmOnce() {
    if (menuBgmUnlockAttempted) return;
    menuBgmUnlockAttempted = true;

    if (currentBgm) {
        currentBgm.muted = false;
        if (currentBgm.paused) currentBgm.play().catch(() => {});
    } else {
        playMenuBgm(false);
    }
}
['click', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, unlockMenuBgmOnce, { once: true });
});

// ==============================
// MAIN MENU FUNCTIONS
// ==============================
function startNewGame() {
    showScreen('name-input-screen');
}

/** Cek apakah ada save (slot lokal atau server progress) */
function hasAnySaveData() {
    try {
        const slots = getSaveSlots();
        if (slots.some(s => s && s.current_chapter)) return true;
    } catch (_) {}
    // Progress minimal: chapter pernah dibuka lebih dari 1 atau ada ending
    if (maxUnlockedChapter > 1) return true;
    for (let i = 1; i <= 5; i++) {
        if (chapterEndingStatus[i]) return true;
        if ((progressAffection[i] || 0) > 0) return true;
    }
    if (albumUnlocks[6] && albumUnlocks[6].harem) return true;
    return false;
}

function updateContinueButton() {
    const btn = document.getElementById('btn-continue');
    if (!btn) return;
    if (hasAnySaveData()) {
        btn.style.display = '';
        btn.disabled = false;
        btn.classList.remove('locked');
    } else {
        btn.style.display = 'none';
        btn.disabled = true;
    }
}

/** Continue: selalu buka menu chapter (hindari bentrok BGM/BG saat resume mid-chapter) */
function continueGame() {
    if (!hasAnySaveData()) {
        showRomanticNotification('Belum ada data save. Mulai New Game dulu ya~', 'info');
        return;
    }
    try {
        stopVoice();
        stopBgm();
    } catch (_) {}
    // Ambil slot terbaru (jika ada) supaya unlock/ending ikut termuat
    try {
        const slots = getSaveSlots();
        let best = null;
        let bestTime = 0;
        slots.forEach(s => {
            if (!s || !s.savedAt) return;
            const t = Date.parse(s.savedAt) || 0;
            if (t >= bestTime) { bestTime = t; best = s; }
        });
        if (best) applyProgressSnapshot(best);
    } catch (_) {}
    // Progress lokal (endings/maxUnlocked) sudah di-load di DOMContentLoaded
    bukaMenuChapter();
    showRomanticNotification('📂 Pilih chapter untuk melanjutkan...', 'info');
}

function confirmMcName() {
    let inputName = document.getElementById("mc-name-field").value.trim();
    let regexAlpabet = /^[A-Za-z\s]+$/;
    if (inputName === "" || !regexAlpabet.test(inputName)) {
        showRomanticNotification("Nama harus berupa huruf dan tidak boleh kosong, sayang~ 💕", "error");
        return;
    }
    mcName = inputName;
    bukaMenuChapter();
}

function showSynopsis() {
    showScreen('synopsis-screen');
}

function showSettings() {
    showRomanticNotification("Pengaturan akan segera hadir! Stay tuned~ 🌸", "info");
}

function exitGame() {
    if (confirm("Apakah kamu yakin ingin keluar? Kamu akan logout dari akunmu.")) {
        const go = () => { window.location.href = "login.html"; };
        if (window.hlhAPI && window.hlhAPI.logout) {
            window.hlhAPI.logout().finally(go);
        } else {
            go();
        }
    }
}

// ==============================
// ROMANTIC NOTIFICATION
// ==============================
function showRomanticNotification(message, type = "info") {
    let old = document.querySelector('.romantic-notification');
    if (old) old.remove();

    let container = document.createElement('div');
    container.className = 'romantic-notification';
    container.innerHTML = `
        <div class="notification-content ${type}">
            <span class="notif-icon">${type === "success" ? "💖" : type === "error" ? "😢" : "🌸"}</span>
            <p class="notif-text">${message}</p>
            <button class="notif-close" onclick="this.closest('.romantic-notification').remove()">✕</button>
        </div>
    `;
    document.body.appendChild(container);

    setTimeout(() => {
        if (container.parentNode) container.remove();
    }, 4000);
}

// ==============================
// CHARACTER INFO
// ==============================
function showCharacterInfo() {
    let tabList = document.getElementById('char-tab-list');
    if (!tabList) return;
    tabList.innerHTML = "";

    CHARACTERS.forEach((c, idx) => {
        let tab = document.createElement('div');
        tab.className = 'char-tab' + (idx === 0 ? ' is-active' : '');
        tab.id = 'char-tab-' + c.id;
        tab.style.setProperty('--tab-color', c.color);
        tab.innerHTML = `<span class="tab-emoji">${c.emoji}</span><span>${c.name.split(' ')[1] || c.name}<small>Chapter ${c.chapter}</small></span>`;
        tab.onclick = () => renderCharacterDetail(c.id);
        tabList.appendChild(tab);
    });

    renderCharacterDetail(CHARACTERS[0].id);
    showScreen('character-info-screen');
}

function renderCharacterDetail(id) {
    document.querySelectorAll('.char-tab').forEach(el => el.classList.remove('is-active'));
    let activeTab = document.getElementById('char-tab-' + id);
    if (activeTab) activeTab.classList.add('is-active');

    let c = CHARACTERS.find(ch => ch.id === id);
    if (!c) return;

    let panel = document.getElementById('char-detail-panel');
    if (!panel) return;
    panel.style.setProperty('--portrait-color', c.color);
    panel.innerHTML = `
        <div class="char-detail-head">
            <div class="char-portrait" style="--portrait-color:${c.color};" onclick="openCharLightbox('${c.id}')">
                <img src="assets/characters/${c.id}.png" alt="${c.name}" onerror="this.style.display='none'; this.parentElement.innerText='${c.emoji}';">
            </div>
            <div>
                <h3>${c.name}</h3>
                <div class="char-role">${c.role}</div>
                <span class="char-chapter-tag" style="background:${c.color};">Chapter ${c.chapter} · ${c.location}</span>
            </div>
        </div>
        <div class="char-section">
            <h4 style="color:${c.color};">💝 Kepribadian</h4>
            <p>${c.personality}</p>
        </div>
        <div class="char-section">
            <h4 style="color:${c.color};">✨ Kebiasaan Unik</h4>
            <p>${c.habit}</p>
        </div>
        <div class="char-section">
            <h4 style="color:${c.color};">💕 Kenapa Dia Suka MC?</h4>
            <p>${c.why}</p>
        </div>
    `;
}

// ==============================
// LIGHTBOX
// ==============================
function openCharLightbox(id) {
    let c = CHARACTERS.find(ch => ch.id === id);
    if (!c) return;

    let overlay = document.getElementById('char-lightbox');
    let frame = document.getElementById('lightbox-frame');
    let img = document.getElementById('lightbox-img');
    let fallback = document.getElementById('lightbox-fallback');
    let caption = document.getElementById('lightbox-caption');

    if (!overlay || !frame || !img || !fallback || !caption) return;

    frame.style.setProperty('--lb-color', c.color);
    caption.innerText = c.name;

    img.style.display = 'block';
    fallback.style.display = 'none';
    img.src = `assets/characters/${c.id}.png`;
    img.onerror = () => {
        img.style.display = 'none';
        fallback.style.display = 'flex';
        fallback.innerText = c.emoji;
    };

    overlay.classList.add('is-visible');
}

function closeCharLightbox() {
    document.getElementById('char-lightbox').classList.remove('is-visible');
}

// ==============================
// CHAPTER MENU
// ==============================
// ==============================
// CHAPTER MENU
// ==============================
function bukaMenuChapter() {
    stopVoice();
    stopBgm();
    showScreen('chapter-menu');
    playMenuBgm();

    const lockLabels = {
        1: { h3: 'Chapter 1', locked: 'Chapter 1' },
        2: { h3: 'Chapter 2', locked: 'Chapter 2 🔒' },
        3: { h3: 'Chapter 3', locked: 'Chapter 3 🔒' },
        4: { h3: 'Chapter 4', locked: 'Chapter 4 🔒' },
        5: { h3: 'Chapter 5', locked: 'Chapter 5 🔒' }
    };

    for (let i = 1; i <= 5; i++) {
        let currentBtn = document.getElementById(`btn-ch${i}`);
        if (!currentBtn) continue;
        const h3 = currentBtn.querySelector('h3');
        if (i <= maxUnlockedChapter) {
            currentBtn.className = "ch-btn active";
            currentBtn.disabled = false;
            if (h3 && lockLabels[i]) h3.textContent = lockLabels[i].h3;
        } else {
            currentBtn.className = "ch-btn locked";
            currentBtn.disabled = true;
            if (h3 && lockLabels[i]) h3.textContent = lockLabels[i].locked;
        }
        // Extra chapter unlock dari happy ending
        if (chapterEndingStatus[i] === 'happy') extraUnlocks[i] = true;
        const exBtn = document.getElementById(`btn-extra${i}`);
        if (exBtn) {
            if (extraUnlocks[i]) {
                exBtn.style.display = 'block';
                exBtn.disabled = false;
                exBtn.classList.remove('locked');
            } else {
                exBtn.style.display = 'none';
                exBtn.disabled = true;
            }
        }
    }

    cekKunciChapter6();
    updateContinueButton();
    try { localStorage.setItem('hlh_extra_unlocks', JSON.stringify(extraUnlocks)); } catch (_) {}
}


function pilihExtraChapter(nomor) {
    if (!extraUnlocks[nomor] && chapterEndingStatus[nomor] !== 'happy') {
        showRomanticNotification('Selesaikan ending pernikahan Chapter ' + nomor + ' dulu ya~', 'info');
        return;
    }
    extraUnlocks[nomor] = true;
    currentIsExtra = true;
    currentActiveChapter = nomor;
    currentIndex = 0;
    branchSkipToIndex = null;
    storyData = [];

    const dialogueBox = document.getElementById('dialogue-box');
    const optionsContainer = document.getElementById('options-container');
    if (dialogueBox) dialogueBox.style.display = 'block';
    if (optionsContainer) { optionsContainer.style.display = 'none'; optionsContainer.innerHTML = ''; }

    const charNameLabel = document.getElementById('char-name-label');
    const affVal = document.getElementById('aff-val');
    if (charNameLabel) charNameLabel.innerText = NAMA_CEWEK[nomor] || '';
    if (affVal) affVal.innerText = progressAffection[nomor] || 0;

    showScreen('game-container');
    startBgmWatchdog();
    syncVolumeSliders();

    const path = `chapter/extra${nomor}.json`;
    fetch(path)
        .then(r => { if (!r.ok) throw new Error('Extra not found'); return r.json(); })
        .then(data => {
            storyData = data;
            currentIndex = 0;
            displayScene();
        })
        .catch(err => {
            console.error(err);
            showRomanticNotification('Gagal memuat Extra Chapter ' + nomor, 'error');
            setTimeout(() => bukaMenuChapter(), 1500);
        });
}


function clearEndingOverlay() {
    try {
        const es = document.getElementById("ending-screen");
        if (es) es.remove();
    } catch (_) {}
}

function pilihChapter(nomorChapter) {
    console.log('Pilih chapter:', nomorChapter);
    currentIsExtra = false;
    currentActiveChapter = nomorChapter;
    currentIndex = 0;
    branchSkipToIndex = null;
    storyData = [];
    clearEndingOverlay();
    try { _lastBgFile = ""; } catch (_) {}

    // Reset sprite display
    const spriteLeft = document.getElementById("sprite-left");
    const spriteRight = document.getElementById("sprite-right");
    const characterSprite = document.getElementById("character-sprite");
    const dialogueBox = document.getElementById("dialogue-box");
    const optionsContainer = document.getElementById("options-container");
    const charNameLabel = document.getElementById("char-name-label");
    const affVal = document.getElementById("aff-val");

    if (spriteLeft) spriteLeft.style.display = "none";
    if (spriteRight) spriteRight.style.display = "none";
    if (characterSprite) characterSprite.style.display = "none";
    if (dialogueBox) {
        dialogueBox.style.display = "block";
        dialogueBox.style.visibility = "visible";
        dialogueBox.style.opacity = "1";
        dialogueBox.style.zIndex = "10";
    }
    if (optionsContainer) {
        optionsContainer.style.display = "none";
        optionsContainer.innerHTML = "";
    }
    if (charNameLabel) {
        charNameLabel.innerText = (typeof NAMA_CEWEK !== 'undefined' && NAMA_CEWEK[nomorChapter])
            ? NAMA_CEWEK[nomorChapter]
            : ('Chapter ' + nomorChapter);
    }
    if (affVal) {
        if (nomorChapter >= 1 && nomorChapter <= 5) {
            const v = progressAffection[nomorChapter];
            affVal.innerText = (typeof v === 'number' && !Number.isNaN(v)) ? v : 0;
        } else {
            affVal.innerText = '—';
        }
    }

    try { stopVoice(); } catch (_) {}
    try { stopBgm(); } catch (_) {}
    showScreen('game-container');
    startBgmWatchdog();

    // Set background default
    setSceneBackground('default.jpg');

    // Coba beberapa path (struktur folder bisa beda di XAMPP)
    const pathsToTry = [
        `chapter/chapter${nomorChapter}.json`,
        `./chapter/chapter${nomorChapter}.json`,
        `/visual_novel/chapter/chapter${nomorChapter}.json`,
        `../chapter/chapter${nomorChapter}.json`
    ];

    const dialogueTextEl = document.getElementById("dialogue-text");
    const speakerNameEl = document.getElementById("speaker-name");
    if (speakerNameEl) speakerNameEl.innerText = "Sistem";
    if (dialogueTextEl) dialogueTextEl.innerText = `⏳ Memuat chapter ${nomorChapter}...`;

    function tryLoad(pathIndex) {
        if (pathIndex >= pathsToTry.length) {
            const msg = `File chapter${nomorChapter}.json TIDAK DITEMUKAN.\nPath yang dicoba:\n- ${pathsToTry.join("\n- ")}\n\nPastikan folder "chapter" ada di folder yang SAMA dengan game_screen.php, dan isinya chapter${nomorChapter}.json`;
            console.error(msg);
            showRomanticNotification(`💔 Chapter ${nomorChapter} tidak ditemukan. Buka Console (F12)!`, "error");
            if (dialogueTextEl) dialogueTextEl.innerText = "⚠️ " + msg;
            setTimeout(() => kembaliKeChapterMenu(), 10000);
            return;
        }

        const chapterPath = pathsToTry[pathIndex];
        console.log(`[${pathIndex + 1}/${pathsToTry.length}] Trying fetch:`, chapterPath);

        fetch(chapterPath)
            .then(response => {
                console.log("  → status", response.status, response.url);
                if (!response.ok) {
                    tryLoad(pathIndex + 1);
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (data === null || data === undefined) return;
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error("Chapter JSON kosong atau bukan array");
                }
                console.log("✅ SUCCESS from", chapterPath, "| scenes:", data.length);
                storyData = data;
                currentIndex = 0;
                branchSkipToIndex = null;
                displayScene();
            })
            .catch(err => {
                console.warn("  → error on", chapterPath, err.message);
                if (err instanceof SyntaxError) {
                    showRomanticNotification("💔 File chapter ketemu tapi JSON rusak.", "error");
                    if (dialogueTextEl) dialogueTextEl.innerText = "⚠️ JSON invalid di " + chapterPath + "\n" + err.message;
                    setTimeout(() => kembaliKeChapterMenu(), 8000);
                    return;
                }
                tryLoad(pathIndex + 1);
            });
    }

    tryLoad(0);
}


function kembaliKeChapterMenu() {
    stopVoice();
    stopBgm();
    showScreen('chapter-menu');
    playMenuBgm();
}

function kembaliKeMenuUtama() {
    stopVoice();
    stopBgm();
    showScreen('main-menu');
    playMenuBgm();
}

function cekKunciChapter6() {
    // Sinkronkan: extra terbuka = pasti pernah happy ending
    for (let i = 1; i <= 5; i++) {
        if (extraUnlocks[i] && chapterEndingStatus[i] !== 'happy') {
            chapterEndingStatus[i] = 'happy';
        }
    }

    let allHappy = true;
    for (let i = 1; i <= 5; i++) {
        if (chapterEndingStatus[i] !== 'happy' && !extraUnlocks[i]) {
            allHappy = false;
            break;
        }
    }

    let ch6Btn = document.getElementById("btn-ch6");
    if (ch6Btn) {
        if (allHappy && maxUnlockedChapter >= 5) {
            ch6Btn.style.display = "block";
            ch6Btn.className = "harem-btn";
            ch6Btn.disabled = false;
            if (maxUnlockedChapter < 6) maxUnlockedChapter = 6;
        } else {
            ch6Btn.style.display = "none";
            ch6Btn.disabled = true;
        }
    }
    saveProgressToLocal();
    cekKunciChapter7();
}

// Chapter 7 (After Story) terbuka setelah True Harem Ending selesai
function cekKunciChapter7() {
    let ch7Btn = document.getElementById("btn-ch7");
    if (!ch7Btn) return;
    const haremDone = albumUnlocks[6] && albumUnlocks[6].harem;
    if (haremDone || maxUnlockedChapter >= 7) {
        ch7Btn.style.display = "block";
        ch7Btn.className = "harem-btn after-story-btn";
        ch7Btn.disabled = false;
        if (maxUnlockedChapter < 7) maxUnlockedChapter = 7;
    } else {
        ch7Btn.style.display = "none";
        ch7Btn.disabled = true;
    }
}

// ==============================
// DISPLAY SCENE
// ==============================
function displayScene() {
    console.log('Display scene, currentIndex:', currentIndex, 'storyData length:', storyData.length);
    if (!storyData || storyData.length === 0) {
        console.warn('storyData empty');
        return;
    }
    if (currentIndex >= storyData.length) {
        console.warn('No more scenes');
        return;
    }
    let scene = storyData[currentIndex];
    console.log('Scene id:', scene.id, 'type:', scene.type || 'dialogue');

    // Sembunyikan opsi dulu (kecuali nanti type question)
    const optionsContainer = document.getElementById("options-container");
    if (optionsContainer && scene.type !== "question") {
        optionsContainer.style.display = "none";
        optionsContainer.innerHTML = "";
    }

    // BGM: hanya ganti jika scene punya bgm valid; kalau tidak, biarkan musik lama terus
    if (scene.bgm && String(scene.bgm).trim()) {
        playBgm(scene.bgm);
    } else {
        ensureBgmPlaying();
    }

    // Check for chapter end
    if (scene.type === "chapter_end") {
        stopVoice();
        if (scene.ending_type === "extra" || currentIsExtra) {
            // Extra chapter selesai → kembali ke menu, jangan hitung affection lagi
            showRomanticNotification("Extra Chapter selesai. Kisah kalian terus berlanjut~ 💕", "success");
            setTimeout(() => { currentIsExtra = false; bukaMenuChapter(); }, 1200);
            return;
        }
        evaluasiAkhirChapter();
        return;
    }

    // Check for game clear (harem ending / after story)
    if (scene.type === "game_clear") {
        if (scene.ending_type === "after_story") {
            tampilkanAfterStoryEnding(scene);
        } else {
            tampilkanHaremEnding(scene);
        }
        return;
    }

    // Check for question
    if (scene.type === "question") {
        stopVoice();
        ensureBgmPlaying(); // pastikan musik tidak mati saat pilihan muncul
        const speakerName = document.getElementById("speaker-name");
        const dialogueText = document.getElementById("dialogue-text");
        const dialogueBox = document.getElementById("dialogue-box");
        if (dialogueBox) {
            dialogueBox.style.display = "block";
            dialogueBox.style.visibility = "visible";
        }
        if (speakerName) speakerName.innerText = scene.speaker || "Pilihan";
        if (dialogueText) {
            dialogueText.innerText = scene.text
                ? scene.text.replace(/\[Nama_MC\]/g, mcName)
                : "Pilih responsmu:";
        }
        if (scene.bg_image) setSceneBackground(scene.bg_image);
        renderCharacters(scene);
        showOptions(scene);
        return;
    }

    // Normal dialogue
    const speakerName = document.getElementById("speaker-name");
    const dialogueText = document.getElementById("dialogue-text");
    const dialogueBox = document.getElementById("dialogue-box");
    const gameContainer = document.getElementById("game-container");

    // Paksa kotak dialog selalu terlihat
    if (dialogueBox) {
        dialogueBox.style.display = "block";
        dialogueBox.style.visibility = "visible";
        dialogueBox.style.opacity = "1";
        dialogueBox.style.zIndex = "15";
    }

    if (speakerName) speakerName.innerText = scene.speaker || "Narasi";
    if (dialogueText) {
        let textOutput = scene.text ? scene.text.replace(/\[Nama_MC\]/g, mcName) : "...";
        dialogueText.innerText = textOutput;
        console.log('Dialogue set:', (scene.speaker || 'Narasi'), '→', textOutput.slice(0, 60) + '...');
    } else {
        console.error('Element #dialogue-text TIDAK DITEMUKAN di DOM!');
    }

    // Background (kalau file tidak ada, tetap warna solid CSS — dialog tetap jalan)
    if (scene.bg_image) setSceneBackground(scene.bg_image);

    renderCharacters(scene);

    // Voice: stop lama dulu, lalu putar baru (supaya skip dialog tidak overlap)
    if (scene.voice && String(scene.voice).trim()) {
        playVoiceLine(scene.voice);
    } else {
        stopVoice();
    }

    // Effects
    if (scene.effect === "sprite_jump") {
        const target = document.getElementById("character-sprite");
        if (target && target.style.display !== "none") {
            target.style.transform = "translateX(-50%) translateY(-20px)";
            setTimeout(() => { target.style.transform = "translateX(-50%) translateY(0)"; }, 150);
        }
    }
}

// ==============================
// RENDER CHARACTERS
// ==============================
function renderCharacters(scene) {
    let centerImg = document.getElementById("character-sprite");
    let leftImg = document.getElementById("sprite-left");
    let rightImg = document.getElementById("sprite-right");

    if (!centerImg || !leftImg || !rightImg) return;

    centerImg.style.display = "none";
    leftImg.style.display = "none";
    rightImg.style.display = "none";
    centerImg.className = "";
    leftImg.className = "";
    rightImg.className = "";

    if (Array.isArray(scene.characters) && scene.characters.length > 0) {
        scene.characters.forEach(ch => {
            let target = ch.position === "left" ? leftImg : ch.position === "right" ? rightImg : centerImg;
            if (ch.sprite && String(ch.sprite).trim() !== "") {
                target.src = `assets/sprites/${ch.sprite}`;
                target.style.display = "block";
            }

            if (scene.speaker && ch.name && scene.speaker.toLowerCase().includes(ch.name.toLowerCase())) {
                target.className = "sprite-active";
            } else {
                target.className = "sprite-inactive";
            }
        });
    } else if (scene.sprite && String(scene.sprite).trim() !== "") {
        centerImg.src = `assets/sprites/${scene.sprite}`;
        centerImg.style.display = "block";
        centerImg.className = "sprite-active";
    }
}

// ==============================
// NEXT DIALOGUE
// ==============================
function nextDialogue() {
    const optionsContainer = document.getElementById("options-container");
    if (optionsContainer && optionsContainer.style.display === "flex") return;

    // Jangan lanjut jika ending screen sedang tampil
    if (document.getElementById("ending-screen")) return;

    // Jika baru saja dari branch opsi, loncat ke merge point
    if (branchSkipToIndex !== null) {
        let target = branchSkipToIndex;
        branchSkipToIndex = null;
        if (typeof target !== 'number' || target < 0) target = currentIndex + 1;
        if (target >= storyData.length) {
            // Sudah di ujung
            return;
        }
        if (target <= currentIndex) {
            target = currentIndex + 1;
        }
        if (target < storyData.length) {
            currentIndex = target;
            displayScene();
        }
        return;
    }

    if (currentIndex < storyData.length - 1) {
        currentIndex++;
        displayScene();
    }
}

// ==============================
// SHOW OPTIONS
// ==============================
function showOptions(scene) {
    ensureBgmPlaying();
    let container = document.getElementById("options-container");
    if (!container) return;
    container.innerHTML = "";
    container.style.display = "flex";

    if (!scene.options || scene.options.length === 0) {
        console.warn('No options found in question scene');
        return;
    }

    scene.options.forEach(opt => {
        let btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt.text || "Pilihan";
        btn.onclick = () => selectOption(opt);
        container.appendChild(btn);
    });
}

function findSceneIndexById(id) {
    if (id == null) return -1;
    // Pakai == supaya number/string id sama-sama ketemu
    return storyData.findIndex(item => item && item.id == id);
}

function selectOption(option) {
    const optionsContainer = document.getElementById("options-container");
    if (optionsContainer) {
        optionsContainer.style.display = "none";
        optionsContainer.innerHTML = "";
    }

    // Update affection HANYA untuk chapter 1-5 (hindari NaN di ch 6/7/extra)
    const affEffect = Number(option.affection_effect);
    const safeEffect = Number.isFinite(affEffect) ? affEffect : 0;
    if (currentActiveChapter >= 1 && currentActiveChapter <= 5) {
        if (typeof progressAffection[currentActiveChapter] !== 'number' || Number.isNaN(progressAffection[currentActiveChapter])) {
            progressAffection[currentActiveChapter] = 0;
        }
        progressAffection[currentActiveChapter] += safeEffect;
        if (progressAffection[currentActiveChapter] < 0) progressAffection[currentActiveChapter] = 0;
        if (progressAffection[currentActiveChapter] > 100) progressAffection[currentActiveChapter] = 100;
        const affVal = document.getElementById("aff-val");
        if (affVal) affVal.innerText = progressAffection[currentActiveChapter];
        try { saveProgressToLocal(); } catch (_) {}
    }

    // Merge point: pakai INDEX array
    const currentScene = storyData[currentIndex];
    branchSkipToIndex = null;
    if (currentScene && currentScene.type === "question" && Array.isArray(currentScene.options)) {
        const nextIds = currentScene.options
            .map(opt => opt.next_id)
            .filter(id => id != null);
        const uniqueIds = [];
        nextIds.forEach(id => { if (!uniqueIds.includes(id)) uniqueIds.push(id); });

        if (uniqueIds.length > 1) {
            let maxResponseIdx = -1;
            uniqueIds.forEach(nid => {
                const idx = findSceneIndexById(nid);
                if (idx > maxResponseIdx) maxResponseIdx = idx;
            });
            if (maxResponseIdx >= 0 && maxResponseIdx + 1 < storyData.length) {
                branchSkipToIndex = maxResponseIdx + 1;
            }
        }
    }

    const goNext = () => {
        if (option.next_id != null) {
            const newIndex = findSceneIndexById(option.next_id);
            if (newIndex !== -1) {
                currentIndex = newIndex;
                const target = storyData[newIndex];
                if (target && (target.type === "chapter_end" || target.type === "game_clear")) {
                    branchSkipToIndex = null;
                }
                displayScene();
                return;
            }
            console.warn('next_id tidak ketemu di storyData:', option.next_id);
        }
        branchSkipToIndex = null;
        if (currentIndex < storyData.length - 1) {
            currentIndex++;
            displayScene();
        }
    };

    // Chapter 6/7/extra atau effect 0 → lewati FX affection (cegah alur macet)
    const showFx = (currentActiveChapter >= 1 && currentActiveChapter <= 5 && safeEffect !== 0);
    if (showFx) {
        showAffectionFx(option, goNext);
    } else {
        if (option.feedback_text) {
            try { showRomanticNotification(option.feedback_text, "info"); } catch (_) {}
        }
        goNext();
    }
}

// ==============================
// AFFECTION FX
// ==============================
function showAffectionFx(option, onDone) {
    let overlay = document.getElementById("affection-fx-overlay");
    let icon = document.getElementById("affection-fx-icon");
    let label = document.getElementById("affection-fx-label");
    let textEl = document.getElementById("affection-fx-text");
    let sparkleLayer = document.getElementById("affection-fx-sparkles");

    if (!overlay || !icon || !label || !textEl || !sparkleLayer) {
        if (onDone) onDone();
        return;
    }

    let benar = option.affection_effect > 0;

    icon.className = "affection-fx-icon " + (benar ? "fx-correct" : "fx-wrong");
    icon.innerText = benar ? "❤️" : "💔";

    let tanda = option.affection_effect > 0 ? "+" : "";
    label.innerText = `${tanda}${option.affection_effect}% Affection`;
    label.className = "affection-fx-label " + (benar ? "fx-label-correct" : "fx-label-wrong");

    textEl.innerText = option.feedback_text || "";

    sparkleLayer.innerHTML = "";
    if (benar) {
        let ikonSparkle = ["✨", "💗", "⭐", "🌺", "💕"];
        for (let i = 0; i < 10; i++) {
            let sp = document.createElement("span");
            sp.className = "affection-sparkle";
            sp.innerText = ikonSparkle[Math.floor(Math.random() * ikonSparkle.length)];
            let sudut = Math.random() * Math.PI * 2;
            let jarak = 60 + Math.random() * 70;
            sp.style.setProperty("--sx", Math.cos(sudut) * jarak + "px");
            sp.style.setProperty("--sy", (Math.sin(sudut) * jarak - 30) + "px");
            sp.style.animationDelay = (Math.random() * 0.25) + "s";
            sparkleLayer.appendChild(sp);
        }
    }

    overlay.classList.add("is-visible");

    affectionFxCallback = onDone;
    clearTimeout(affectionFxTimeout);
    affectionFxTimeout = setTimeout(() => closeAffectionFx(), 2500);
}

function closeAffectionFx() {
    let overlay = document.getElementById("affection-fx-overlay");
    if (overlay) overlay.classList.remove("is-visible");
    clearTimeout(affectionFxTimeout);
    ensureBgmPlaying();

    let cb = affectionFxCallback;
    affectionFxCallback = null;
    if (cb) cb();
}

// ==============================
// EVALUASI AKHIR CHAPTER
// ==============================
function evaluasiAkhirChapter() {
    let skor = progressAffection[currentActiveChapter] || 0;
    let namaCewek = NAMA_CEWEK[currentActiveChapter] || "Gadis";
    let charId = getCharId(currentActiveChapter);
    let endingType = "";
    let endingTitle = "";
    let endingDesc = "";
    let endingImage = "";

    if (skor >= 100) {
        endingType = "happy";
        endingTitle = `💍 PERNIKAHAN - ${namaCewek}`;
        endingDesc = `❤️ Cinta kalian sempurna! ${namaCewek} menerima lamaranmu dan kalian menikah bahagia. Selamat! 🎉`;
        endingImage = `wedding_${charId}.jpg`;
        chapterEndingStatus[currentActiveChapter] = 'happy';
        extraUnlocks[currentActiveChapter] = true;
        try { localStorage.setItem('hlh_extra_unlocks', JSON.stringify(extraUnlocks)); } catch (_) {}
        unlockAlbumPhoto(currentActiveChapter, 'happy');
        maxUnlockedChapter = Math.max(maxUnlockedChapter, currentActiveChapter + 1);
    } else if (skor >= 80) {
        endingType = "good";
        endingTitle = `💕 PACARAN - ${namaCewek}`;
        endingDesc = `💑 Kalian resmi berpacaran! Hubungan yang manis dan penuh kebahagiaan. Semoga langgeng! 🌸`;
        endingImage = `dating_${charId}.jpg`;
        chapterEndingStatus[currentActiveChapter] = 'good';
        unlockAlbumPhoto(currentActiveChapter, 'good');
        maxUnlockedChapter = Math.max(maxUnlockedChapter, currentActiveChapter + 1);
    } else {
        endingType = "bad";
        endingTitle = `💔 DITINGGALKAN - ${namaCewek}`;
        endingDesc = `😢 ${namaCewek} memilih pergi... Mungkin lain kali kamu bisa lebih peka terhadap perasaannya. Semangat! 💪`;
        endingImage = `rejected_${charId}.jpg`;
        chapterEndingStatus[currentActiveChapter] = 'bad';
        unlockAlbumPhoto(currentActiveChapter, 'bad');
    }

    saveAlbumToLocal();
    saveProgressToLocal();
    tampilkanEndingScreen(endingTitle, endingDesc, endingImage, endingType, skor);
}

// ==============================
// TAMPILKAN ENDING SCREEN
// ==============================
function tampilkanEndingScreen(title, desc, image, type, score) {
    const dialogueBox = document.getElementById("dialogue-box");
    const characterSprite = document.getElementById("character-sprite");
    const spriteLeft = document.getElementById("sprite-left");
    const spriteRight = document.getElementById("sprite-right");

    if (dialogueBox) dialogueBox.style.display = "none";
    if (characterSprite) characterSprite.style.display = "none";
    if (spriteLeft) spriteLeft.style.display = "none";
    if (spriteRight) spriteRight.style.display = "none";

    let container = document.getElementById("game-container");
    if (!container) return;

    // Hapus ending screen lama jika ada
    let oldEnding = document.getElementById("ending-screen");
    if (oldEnding) oldEnding.remove();

    let endingScreen = document.createElement("div");
    endingScreen.id = "ending-screen";
    endingScreen.className = "ending-screen";

    let emoji = type === "happy" ? "💍" : type === "good" ? "💕" : "💔";

    endingScreen.innerHTML = `
        <div class="ending-content">
            <div class="ending-image-container">
                <img src="assets/images/endings/${image}" alt="${title}" 
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'ending-fallback\\'>${emoji}</div>';"
                     class="ending-image">
            </div>
            <div class="ending-text">
                <h2 class="ending-title">${title}</h2>
                <div class="ending-score">💝 Skor Akhir: ${score}%</div>
                <p class="ending-description">${desc}</p>
                <div class="ending-actions">
                    <button class="btn btn-primary" onclick="handleEndingAction('${type}')">
                        ${type === "happy" ? "💍 Lanjutkan Petualangan" : type === "good" ? "💕 Kembali ke Menu" : "💪 Coba Lagi"}
                    </button>
                </div>
            </div>
        </div>
    `;

    container.appendChild(endingScreen);
}

function handleEndingAction(type) {
    let ending = document.getElementById("ending-screen");
    if (ending) ending.remove();

    const dialogueBox = document.getElementById("dialogue-box");
    if (dialogueBox) dialogueBox.style.display = "block";

    if (type === "bad") {
        progressAffection[currentActiveChapter] = 0;
        const affVal = document.getElementById("aff-val");
        if (affVal) affVal.innerText = 0;
        currentIndex = 0;
        displayScene();
    } else {
        bukaMenuChapter();
    }
}

// ==============================
// HAREM ENDING
// ==============================
function tampilkanHaremEnding(scene) {
    // Buka foto harem di album (permanent) + unlock after story
    if (!albumUnlocks[6]) albumUnlocks[6] = { harem: false };
    albumUnlocks[6].harem = true;
    maxUnlockedChapter = Math.max(maxUnlockedChapter || 1, 6);
    try { saveAlbumToLocal(); } catch (_) {}
    try { saveProgressToLocal(); } catch (_) {}

    const dialogueBox = document.getElementById("dialogue-box");
    const characterSprite = document.getElementById("character-sprite");
    const spriteLeft = document.getElementById("sprite-left");
    const spriteRight = document.getElementById("sprite-right");

    if (dialogueBox) dialogueBox.style.display = "none";
    if (characterSprite) characterSprite.style.display = "none";
    if (spriteLeft) spriteLeft.style.display = "none";
    if (spriteRight) spriteRight.style.display = "none";

    let container = document.getElementById("game-container");
    if (!container) return;

    let oldEnding = document.getElementById("ending-screen");
    if (oldEnding) oldEnding.remove();

    let endingScreen = document.createElement("div");
    endingScreen.id = "ending-screen";
    endingScreen.className = "ending-screen harem-ending";

    endingScreen.innerHTML = `
        <div class="ending-content">
            <div class="harem-image">
                <img src="assets/images/endings/harem_wedding.jpg" alt="Harem Wedding" 
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:80px;background:linear-gradient(135deg,#f7dfa0,#ff8fa8);\\'>👑</div>';"
                     class="ending-image">
                <div class="harem-sparkles">✨💖✨</div>
            </div>

            <h2 class="harem-title">👑 TRUE HAREM ENDING</h2>

            <div class="harem-desc">
                Selamat, <span class="highlight-name">${mcName}</span>! 
                Kamu berhasil menikahi kelima gadis cantik!
                <br><br>
                <span class="girls-list">
                    <span>🌸 Suzuki Ichika</span> · 
                    <span>🍓 Tachibana Nino</span> · 
                    <span>💧 Yoshikawa Miku</span> · 
                    <span>🍀 Takahashi Yotsuba</span> · 
                    <span>🌟 Watanabe Itsuki</span>
                </span>
                Mereka semua setia menemanimu dalam suka dan duka.
                <br><br>
                🌺 Ini adalah awal dari petualangan baru yang lebih indah!
            </div>

            <div class="ending-actions">
                <button class="btn harem-btn-final" onclick="unlockAfterStoryAndMenu()">
                    🌸 Lanjut ke After Story (Chapter 7)
                </button>
                <button class="btn btn-secondary" onclick="kembaliKeMenuUtama()">
                    🏠 Kembali ke Menu Utama
                </button>
            </div>
        </div>
    `;

    container.appendChild(endingScreen);
}


function tampilkanAfterStoryEnding(scene) {
    const dialogueBox = document.getElementById("dialogue-box");
    const characterSprite = document.getElementById("character-sprite");
    const spriteLeft = document.getElementById("sprite-left");
    const spriteRight = document.getElementById("sprite-right");
    if (dialogueBox) dialogueBox.style.display = "none";
    if (characterSprite) characterSprite.style.display = "none";
    if (spriteLeft) spriteLeft.style.display = "none";
    if (spriteRight) spriteRight.style.display = "none";

    let container = document.getElementById("game-container");
    if (!container) return;
    let oldEnding = document.getElementById("ending-screen");
    if (oldEnding) oldEnding.remove();

    let endingScreen = document.createElement("div");
    endingScreen.id = "ending-screen";
    endingScreen.className = "ending-screen harem-ending";
    endingScreen.innerHTML = `
        <div class="ending-content harem-content">
            <div class="ending-text harem-text">
                <h2 class="ending-title harem-title">🌸 AFTER STORY SELESAI</h2>
                <p class="ending-description harem-desc">
                    Kehidupan kalian berenam terus berlanjut — di dapur yang ramai, di sofa yang penuh tawa, dan di rumah yang selalu ada yang menunggu pulang.
                    <br><br>
                    Terima kasih sudah menemani harmoni lima hati sampai di sini, ${typeof mcName !== "undefined" ? mcName : ""}.
                </p>
                <div class="ending-actions">
                    <button class="btn btn-primary harem-btn-final" onclick="kembaliKeMenuUtama()">
                        🏠 Kembali ke Menu Utama
                    </button>
                </div>
            </div>
        </div>
    `;
    container.appendChild(endingScreen);
}

function unlockAfterStoryAndMenu() {
    if (!albumUnlocks[6]) albumUnlocks[6] = { harem: false };
    albumUnlocks[6].harem = true;
    maxUnlockedChapter = Math.max(maxUnlockedChapter, 7);
    saveAlbumToLocal();
    let ending = document.getElementById("ending-screen");
    if (ending) ending.remove();
    const dialogueBox = document.getElementById("dialogue-box");
    if (dialogueBox) dialogueBox.style.display = "block";
    // Langsung masuk chapter 7
    pilihChapter(7);
}

// ==============================
// IN-GAME MENU
// ==============================
function openInGameMenu() {
    const modal = document.getElementById("in-game-menu-modal");
    if (modal) modal.classList.add("is-visible");
}

function closeInGameMenu() {
    const modal = document.getElementById("in-game-menu-modal");
    if (modal) modal.classList.remove("is-visible");
}

function handleLoadFromInGameMenu() {
    closeInGameMenu();
    openLoadSlots();
}

function confirmReturnToMainMenu() {
    if (confirm("Yakin ingin kembali ke Menu Utama? Progres yang belum di-save akan hilang.")) {
        closeInGameMenu();
        stopVoice();
        stopBgm();
        let ending = document.getElementById("ending-screen");
        if (ending) ending.remove();
        const dialogueBox = document.getElementById("dialogue-box");
        if (dialogueBox) dialogueBox.style.display = "block";
        const optionsContainer = document.getElementById("options-container");
        if (optionsContainer) optionsContainer.style.display = "none";
        showScreen('main-menu');
        playMenuBgm();
    }
}


// ==============================
// MULTI-SLOT SAVE / LOAD (localStorage)
// ==============================
const SAVE_SLOT_COUNT = 5;
const SAVE_SLOTS_KEY = 'hlh_save_slots';

function getSaveSlots() {
    try {
        const raw = localStorage.getItem(SAVE_SLOTS_KEY);
        if (!raw) return Array(SAVE_SLOT_COUNT).fill(null);
        const arr = JSON.parse(raw);
        while (arr.length < SAVE_SLOT_COUNT) arr.push(null);
        return arr.slice(0, SAVE_SLOT_COUNT);
    } catch (_) {
        return Array(SAVE_SLOT_COUNT).fill(null);
    }
}

function writeSaveSlots(arr) {
    try {
        localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(arr));
        return true;
    } catch (e) {
        console.warn('save slots failed', e);
        showRomanticNotification('Gagal menulis ke localStorage (quota penuh?).', 'error');
        return false;
    }
}

function buildProgressSnapshot() {
    // Simpan progress global + posisi chapter saat ini
    const ch = currentActiveChapter || 1;
    const line = (typeof currentIndex === 'number' && currentIndex >= 0) ? currentIndex : 0;
    return {
        savedAt: new Date().toISOString(),
        label: new Date().toLocaleString('id-ID'),
        current_chapter: ch,
        current_line: line,
        is_extra: !!currentIsExtra,
        mcName: (typeof mcName === 'string' && mcName) ? mcName : '',
        progressAffection: {
            1: progressAffection[1] || 0,
            2: progressAffection[2] || 0,
            3: progressAffection[3] || 0,
            4: progressAffection[4] || 0,
            5: progressAffection[5] || 0
        },
        chapterEndingStatus: {
            1: chapterEndingStatus[1] || null,
            2: chapterEndingStatus[2] || null,
            3: chapterEndingStatus[3] || null,
            4: chapterEndingStatus[4] || null,
            5: chapterEndingStatus[5] || null
        },
        max_unlocked: maxUnlockedChapter || 1,
        album_unlocks: JSON.parse(JSON.stringify(albumUnlocks || {})),
        extra_unlocks: {
            1: !!extraUnlocks[1],
            2: !!extraUnlocks[2],
            3: !!extraUnlocks[3],
            4: !!extraUnlocks[4],
            5: !!extraUnlocks[5]
        }
    };
}

function applyProgressSnapshot(data) {
    if (!data || typeof data !== 'object') return;
    currentActiveChapter = parseInt(data.current_chapter, 10) || 1;
    currentIndex = parseInt(data.current_line, 10) || 0;
    currentIsExtra = !!data.is_extra;
    if (data.mcName) mcName = String(data.mcName);
    if (data.progressAffection) {
        for (let i = 1; i <= 5; i++) {
            progressAffection[i] = parseInt(data.progressAffection[i], 10) || 0;
        }
    }
    if (data.chapterEndingStatus) {
        for (let i = 1; i <= 5; i++) {
            chapterEndingStatus[i] = data.chapterEndingStatus[i] || null;
        }
    }
    maxUnlockedChapter = parseInt(data.max_unlocked, 10) || maxUnlockedChapter || 1;
    if (data.album_unlocks) {
        try { mergeAlbumUnlocks(data.album_unlocks); } catch (_) {}
    }
    if (data.extra_unlocks) {
        for (let i = 1; i <= 5; i++) {
            if (data.extra_unlocks[i]) extraUnlocks[i] = true;
        }
    }
    try { saveAlbumToLocal(); } catch (_) {}
    try { saveProgressToLocal(); } catch (_) {}
    try { updateContinueButton(); } catch (_) {}
}

function openSaveSlots() {
    try { closeInGameMenu(); } catch (_) {}
    renderSlotModal('save');
}

function openLoadSlots() {
    try { closeInGameMenu(); } catch (_) {}
    renderSlotModal('load');
}

function openDeleteSlots() {
    try { closeInGameMenu(); } catch (_) {}
    renderSlotModal('delete');
}

function renderSlotModal(mode) {
    let old = document.getElementById('slot-modal');
    if (old) old.remove();
    const slots = getSaveSlots();
    const modal = document.createElement('div');
    modal.id = 'slot-modal';
    modal.className = 'slot-modal is-visible';

    const titles = {
        save: '💾 Pilih Slot Save',
        load: '📂 Pilih Slot Load',
        delete: '🗑️ Hapus Save'
    };
    let cards = '';
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
        const s = slots[i];
        if (s && s.current_chapter) {
            const chLabel = s.is_extra
                ? ('Extra Ch.' + s.current_chapter)
                : ('Chapter ' + s.current_chapter);
            const lineLabel = (typeof s.current_line === 'number')
                ? (' · baris ' + (s.current_line + 1))
                : '';
            if (mode === 'delete') {
                cards += `<div class="slot-card filled slot-row">
                    <div class="slot-info" onclick="handleSlotClick('load', ${i})">
                        <span class="slot-num">Slot ${i + 1}</span>
                        <span class="slot-meta">${chLabel}${lineLabel}</span>
                        <span class="slot-date">${s.label || ''}</span>
                    </div>
                    <button type="button" class="slot-delete-btn" onclick="event.stopPropagation(); deleteSaveSlot(${i})" title="Hapus slot">🗑️</button>
                </div>`;
            } else {
                cards += `<div class="slot-card filled slot-row">
                    <button type="button" class="slot-main-btn" onclick="handleSlotClick('${mode}', ${i})">
                        <span class="slot-num">Slot ${i + 1}</span>
                        <span class="slot-meta">${chLabel}${lineLabel}</span>
                        <span class="slot-date">${s.label || ''}</span>
                    </button>
                    <button type="button" class="slot-delete-btn" onclick="event.stopPropagation(); deleteSaveSlot(${i})" title="Hapus slot">🗑️</button>
                </div>`;
            }
        } else {
            if (mode === 'save') {
                cards += `<button type="button" class="slot-card empty" onclick="handleSlotClick('save', ${i})">
                    <span class="slot-num">Slot ${i + 1}</span>
                    <span class="slot-meta">Kosong — klik untuk simpan</span>
                </button>`;
            } else {
                cards += `<div class="slot-card empty">
                    <span class="slot-num">Slot ${i + 1}</span>
                    <span class="slot-meta">Kosong</span>
                </div>`;
            }
        }
    }

    const extraActions = (mode !== 'delete')
        ? `<button type="button" class="modal-close slot-secondary" onclick="renderSlotModal('delete')">🗑️ Mode Hapus</button>`
        : `<button type="button" class="modal-close slot-secondary" onclick="renderSlotModal('load')">📂 Kembali ke Load</button>`;

    modal.innerHTML = `
        <div class="slot-box">
            <h3>${titles[mode] || 'Slot'}</h3>
            <div class="slot-grid">${cards}</div>
            <div class="slot-actions">
                ${extraActions}
                <button type="button" class="modal-close" onclick="document.getElementById('slot-modal')?.remove()">Tutup</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

function deleteSaveSlot(index) {
    const slots = getSaveSlots();
    if (!slots[index]) {
        showRomanticNotification('Slot ini sudah kosong.', 'info');
        return;
    }
    if (!confirm('Hapus save di Slot ' + (index + 1) + '? Tindakan ini tidak bisa dibatalkan.')) {
        return;
    }
    slots[index] = null;
    if (!writeSaveSlots(slots)) return;
    showRomanticNotification('🗑️ Slot ' + (index + 1) + ' dihapus.', 'success');
    try { updateContinueButton(); } catch (_) {}
    // Refresh modal if still open
    const m = document.getElementById('slot-modal');
    if (m) {
        // keep current mode if possible
        const h = m.querySelector('h3');
        const mode = (h && h.textContent.includes('Hapus')) ? 'delete'
            : (h && h.textContent.includes('Save')) ? 'save' : 'load';
        renderSlotModal(mode);
    }
}

function handleSlotClick(mode, index) {
    const slots = getSaveSlots();

    if (mode === 'save') {
        // Boleh save dari mana saja — simpan progress global + posisi saat ini
        const snap = buildProgressSnapshot();
        slots[index] = snap;
        if (!writeSaveSlots(slots)) return;
        // Server opsional — jangan gagalkan save lokal
        try {
            saveGameToServerSilent();
        } catch (_) {}
        showRomanticNotification('💾 Tersimpan di Slot ' + (index + 1) + '!', 'success');
        try { updateContinueButton(); } catch (_) {}
        const m = document.getElementById('slot-modal');
        if (m) m.remove();
        return;
    }

    if (mode === 'delete') {
        deleteSaveSlot(index);
        return;
    }

    // ===== LOAD =====
    if (!slots[index] || !slots[index].current_chapter) {
        showRomanticNotification('Slot ini masih kosong.', 'info');
        return;
    }

    const snap = slots[index];
    try { stopVoice(); } catch (_) {}
    try { stopBgm(); } catch (_) {}
    branchSkipToIndex = null;

    applyProgressSnapshot(snap);

    const m = document.getElementById('slot-modal');
    if (m) m.remove();

    // Resume di chapter + baris yang disimpan
    const ch = parseInt(snap.current_chapter, 10) || 1;
    const line = parseInt(snap.current_line, 10) || 0;
    const isExtra = !!snap.is_extra;
    currentActiveChapter = ch;
    currentIsExtra = isExtra;
    currentIndex = line;

    clearEndingOverlay();
    try { _lastBgFile = ""; } catch (_) {}

    // Reset visual state sebelum masuk game
    try {
        const left = document.getElementById('sprite-left');
        const right = document.getElementById('sprite-right');
        const center = document.getElementById('character-sprite');
        if (left) { left.style.display = 'none'; left.src = ''; }
        if (right) { right.style.display = 'none'; right.src = ''; }
        if (center) { center.style.display = 'none'; center.src = ''; }
        const opts = document.getElementById('options-container');
        if (opts) { opts.style.display = 'none'; opts.innerHTML = ''; }
        const dlg = document.getElementById('dialogue-box');
        if (dlg) { dlg.style.display = 'block'; dlg.style.visibility = 'visible'; }
    } catch (_) {}

    showScreen('game-container');
    startBgmWatchdog();
    try { syncVolumeSliders(); } catch (_) {}

    const charNameLabel = document.getElementById('char-name-label');
    const affVal = document.getElementById('aff-val');
    if (charNameLabel) {
        charNameLabel.innerText = (typeof NAMA_CEWEK !== 'undefined' && NAMA_CEWEK[ch])
            ? NAMA_CEWEK[ch]
            : (isExtra ? ('Extra ' + ch) : ('Chapter ' + ch));
    }
    if (affVal) {
        if (ch >= 1 && ch <= 5) {
            const v = progressAffection[ch] || 0;
            affVal.innerText = Number.isFinite(v) ? v : 0;
        } else {
            affVal.innerText = '—';
        }
    }

    const baseName = isExtra ? ('extra' + ch) : ('chapter' + ch);
    const pathsToTry = [
        `chapter/${baseName}.json`,
        `./chapter/${baseName}.json`,
        `/visual_novel/chapter/${baseName}.json`
    ];

    function tryLoadPath(i) {
        if (i >= pathsToTry.length) {
            console.error('Load: semua path gagal', pathsToTry);
            showRomanticNotification('Gagal memuat file chapter. Membuka menu chapter.', 'error');
            bukaMenuChapter();
            return;
        }
        const filePath = pathsToTry[i];
        console.log('Load trying', filePath);
        fetch(filePath)
            .then(r => {
                if (!r.ok) throw new Error('missing ' + filePath);
                return r.json();
            })
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) throw new Error('empty chapter');
                storyData = data;
                if (currentIndex < 0 || currentIndex >= storyData.length) currentIndex = 0;
                branchSkipToIndex = null;
                displayScene();
                const chLabel = isExtra ? ('Extra ' + ch) : ('Chapter ' + ch);
                showRomanticNotification('💖 Dimuat Slot ' + (index + 1) + ' — ' + chLabel + ' baris ' + (currentIndex + 1), 'success');
            })
            .catch(err => {
                console.warn('Load path fail', filePath, err.message);
                tryLoadPath(i + 1);
            });
    }
    tryLoadPath(0);
}

// Override tombol save/load di in-game menu & main menu agar pakai slot
// ==============================
// SAVE / LOAD GAME
// ==============================
function handleLoadGameClick() {
    openLoadSlots();
}

function buildServerSavePayload() {
    return {
        current_chapter: currentActiveChapter || 1,
        current_line: (typeof currentIndex === 'number' ? currentIndex : 0),
        ichika_aff: progressAffection[1] || 0,
        nino_aff: progressAffection[2] || 0,
        miku_aff: progressAffection[3] || 0,
        yotsuba_aff: progressAffection[4] || 0,
        itsuki_aff: progressAffection[5] || 0,
        ichika_ending: chapterEndingStatus[1] || null,
        nino_ending: chapterEndingStatus[2] || null,
        miku_ending: chapterEndingStatus[3] || null,
        yotsuba_ending: chapterEndingStatus[4] || null,
        itsuki_ending: chapterEndingStatus[5] || null,
        max_unlocked: maxUnlockedChapter || 1,
        album_unlocks: albumUnlocks
    };
}

/** Save ke server tanpa notifikasi (dipakai slot save lokal) */
function saveGameToServerSilent() {
    try { saveAlbumToLocal(); } catch (_) {}
    if (window.hlhAPI && window.hlhAPI.saveProgress) {
        window.hlhAPI.saveProgress(buildServerSavePayload()).catch(() => {});
    }
}

function saveGameToServer() {
    try { saveAlbumToLocal(); } catch (_) {}
    // Simpan dulu ke slot 1 otomatis supaya offline tetap aman
    try {
        const slots = getSaveSlots();
        slots[0] = buildProgressSnapshot();
        writeSaveSlots(slots);
        updateContinueButton();
    } catch (_) {}

    if (!window.hlhAPI || !window.hlhAPI.saveProgress) {
        showRomanticNotification("💾 Tersimpan di perangkat (slot lokal).", "info");
        return;
    }

    window.hlhAPI.saveProgress(buildServerSavePayload())
        .then(data => {
            if (data && data.ok) {
                showRomanticNotification("💾 Game berhasil disimpan (lokal + akun SQLite)!", "success");
            } else {
                showRomanticNotification("💾 Tersimpan di perangkat. Akun: " + ((data && data.message) || "login diperlukan"), "info");
            }
        })
        .catch(error => {
            showRomanticNotification("💾 Tersimpan di perangkat. SQLite error.", "info");
            console.error('Save error:', error);
        });
}

function loadGameFromServer() {
    if (!window.hlhAPI || !window.hlhAPI.loadProgress) {
        showRomanticNotification("ℹ️ Load akun hanya tersedia di aplikasi Electron.", "info");
        return;
    }

    window.hlhAPI.loadProgress()
        .then(res => {
            if (res && res.ok && res.data) {
                currentActiveChapter = res.data.current_chapter || 1;
                currentIndex = res.data.current_line || 0;

                progressAffection[1] = res.data.ichika_aff || 0;
                progressAffection[2] = res.data.nino_aff || 0;
                progressAffection[3] = res.data.miku_aff || 0;
                progressAffection[4] = res.data.yotsuba_aff || 0;
                progressAffection[5] = res.data.itsuki_aff || 0;

                chapterEndingStatus[1] = res.data.ichika_ending || null;
                chapterEndingStatus[2] = res.data.nino_ending || null;
                chapterEndingStatus[3] = res.data.miku_ending || null;
                chapterEndingStatus[4] = res.data.yotsuba_ending || null;
                chapterEndingStatus[5] = res.data.itsuki_ending || null;

                maxUnlockedChapter = res.data.max_unlocked || 1;

                if (res.data.album_unlocks) {
                    mergeAlbumUnlocks(res.data.album_unlocks);
                }
                loadAlbumFromLocal();
                saveAlbumToLocal();
                saveProgressToLocal();

                try { stopVoice(); stopBgm(); } catch (_) {}
                branchSkipToIndex = null;
                storyData = [];
                bukaMenuChapter();
                showRomanticNotification("💖 Progress akun dimuat. Pilih chapter untuk main.", "success");
            } else {
                showRomanticNotification("ℹ️ " + ((res && res.message) || "Tidak ada data save yang ditemukan."), "info");
            }
        })
        .catch(error => {
            showRomanticNotification("😢 Gagal memuat progress akun.", "error");
            console.error('Load error:', error);
        });
}

// ==============================
// ALBUM FOTO
// ==============================
function unlockAlbumPhoto(chapterNum, endingKey) {
    if (!albumUnlocks[chapterNum]) {
        albumUnlocks[chapterNum] = { bad: false, good: false, happy: false };
    }
    if (endingKey === 'harem') {
        if (!albumUnlocks[6]) albumUnlocks[6] = { harem: false };
        albumUnlocks[6].harem = true;
    } else if (albumUnlocks[chapterNum][endingKey] !== undefined) {
        albumUnlocks[chapterNum][endingKey] = true;
    }
    saveAlbumToLocal();
}

function mergeAlbumUnlocks(incoming) {
    if (!incoming || typeof incoming !== 'object') return;
    for (let ch = 1; ch <= 5; ch++) {
        if (!albumUnlocks[ch]) albumUnlocks[ch] = { bad: false, good: false, happy: false };
        if (incoming[ch]) {
            ['bad', 'good', 'happy'].forEach(k => {
                if (incoming[ch][k]) albumUnlocks[ch][k] = true;
            });
        }
    }
    if (incoming[6] && incoming[6].harem) {
        if (!albumUnlocks[6]) albumUnlocks[6] = { harem: false };
        albumUnlocks[6].harem = true;
    }
}

function saveAlbumToLocal() {
    try {
        localStorage.setItem('hlh_album_unlocks', JSON.stringify(albumUnlocks));
    } catch (e) {
        console.warn('localStorage save album failed', e);
    }
}

function loadAlbumFromLocal() {
    try {
        const raw = localStorage.getItem('hlh_album_unlocks');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        mergeAlbumUnlocks(parsed);
    } catch (e) {
        console.warn('localStorage load album failed', e);
    }
}

function showAlbum() {
    loadAlbumFromLocal();
    const grid = document.getElementById('album-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Chapter 1–5: header + 3 foto per cewek
    for (let ch = 1; ch <= 5; ch++) {
        const meta = ALBUM_META[ch];
        const unlocks = albumUnlocks[ch] || { bad: false, good: false, happy: false };
        const slots = [
            { key: 'bad', label: 'Ditinggalkan', emoji: '💔', file: `rejected_${meta.id}.jpg`, hint: 'Skor akhir < 80%' },
            { key: 'good', label: 'Pacaran', emoji: '💕', file: `dating_${meta.id}.jpg`, hint: 'Skor akhir ≥ 80%' },
            { key: 'happy', label: 'Pernikahan', emoji: '💍', file: `wedding_${meta.id}.jpg`, hint: 'Skor akhir 100%' }
        ];

        // Section header
        const header = document.createElement('div');
        header.className = 'album-section-header';
        header.style.setProperty('--album-color', meta.color);
        header.innerHTML = `<span class="album-section-emoji">${meta.emoji}</span>
            <span class="album-section-name">${meta.name}</span>
            <span class="album-section-line"></span>`;
        grid.appendChild(header);

        slots.forEach(slot => {
            const unlocked = !!unlocks[slot.key];
            const card = document.createElement('div');
            card.className = 'album-card' + (unlocked ? ' is-unlocked' : ' is-locked');
            card.style.setProperty('--album-color', meta.color);

            if (unlocked) {
                card.innerHTML = `
                    <div class="album-thumb">
                        <img src="assets/images/endings/${slot.file}" alt="${slot.label}"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="album-fallback" style="display:none;">${slot.emoji}</div>
                    </div>
                    <div class="album-info">
                        <span class="album-label">${slot.emoji} ${slot.label}</span>
                    </div>
                `;
                card.onclick = () => openAlbumLightbox(meta, slot);
            } else {
                card.innerHTML = `
                    <div class="album-thumb album-locked-thumb">
                        <span class="album-lock">🔒</span>
                    </div>
                    <div class="album-info">
                        <span class="album-label">${slot.emoji} ${slot.label}</span>
                        <span class="album-hint">${slot.hint}</span>
                    </div>
                `;
            }
            grid.appendChild(card);
        });
    }

    // Harem ending
    const haremUnlocked = albumUnlocks[6] && albumUnlocks[6].harem;
    const haremCard = document.createElement('div');
    haremCard.className = 'album-card album-harem' + (haremUnlocked ? ' is-unlocked' : ' is-locked');
    haremCard.style.setProperty('--album-color', '#e3b567');
    if (haremUnlocked) {
        haremCard.innerHTML = `
            <div class="album-thumb">
                <img src="assets/images/endings/harem_wedding.jpg" alt="Harem Wedding"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="album-fallback" style="display:none;">👑</div>
            </div>
            <div class="album-info">
                <span class="album-emoji">👑</span>
                <strong>True Harem</strong>
                <span class="album-label">Pernikahan Berlima</span>
            </div>
        `;
        haremCard.onclick = () => openAlbumLightbox(
            { name: 'True Harem Ending', emoji: '👑', color: '#e3b567', id: 'harem' },
            { key: 'harem', label: 'Pernikahan Berlima', emoji: '👑', file: 'harem_wedding.jpg' }
        );
    } else {
        haremCard.innerHTML = `
            <div class="album-thumb album-locked-thumb"><span class="album-lock">🔒</span></div>
            <div class="album-info">
                <span class="album-emoji">👑</span>
                <strong>True Harem</strong>
                <span class="album-label">Pernikahan Berlima</span>
                <span class="album-hint">Raih ending pernikahan di kelima chapter</span>
            </div>
        `;
    }
    grid.appendChild(haremCard);

    showScreen('album-screen');
}

function openAlbumLightbox(meta, slot) {
    const overlay = document.getElementById('album-lightbox');
    const img = document.getElementById('album-lightbox-img');
    const fallback = document.getElementById('album-lightbox-fallback');
    const caption = document.getElementById('album-lightbox-caption');
    const frame = document.getElementById('album-lightbox-frame');
    if (!overlay || !img || !fallback || !caption || !frame) return;

    // Pindahkan ke body agar position:fixed tidak terpengaruh scroll #album-screen
    if (overlay.parentElement !== document.body) {
        document.body.appendChild(overlay);
    }

    frame.style.setProperty('--lb-color', meta.color || '#e3b567');
    caption.innerText = `${meta.emoji} ${meta.name} — ${slot.label}`;
    img.style.display = 'block';
    fallback.style.display = 'none';
    img.src = `assets/images/endings/${slot.file}`;
    img.onerror = () => {
        img.style.display = 'none';
        fallback.style.display = 'flex';
        fallback.innerText = slot.emoji;
    };
    overlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
}

function closeAlbumLightbox() {
    const overlay = document.getElementById('album-lightbox');
    if (overlay) overlay.classList.remove('is-visible');
    document.body.style.overflow = '';
}

// ==============================
// DOM READY
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Ready - Harmoni Lima Hati');
    loadAlbumFromLocal();
    try {
        const raw = localStorage.getItem('hlh_extra_unlocks');
        if (raw) {
            const parsed = JSON.parse(raw);
            for (let i = 1; i <= 5; i++) if (parsed[i]) extraUnlocks[i] = true;
        }
    } catch (_) {}
    loadProgressFromLocal();
    // Sinkron dari ending status
    for (let i = 1; i <= 5; i++) {
        if (chapterEndingStatus[i] === 'happy') extraUnlocks[i] = true;
    }
    syncVolumeSliders();
    updateContinueButton();
    playMenuBgm(true);
});

