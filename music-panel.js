/* KyZer music panel - add to any page:  <script src="/music-panel.js" defer></script> */
function kzMusicInit() {
    // ---- add more songs here ----
    var TRACKS = [
        { name: 'Manasha (Over-Slowed)', src: '/music/MANASHA (OVER-SLOWED) - ASHREVEAL  ASHISH SWARGIARY_1762602800795.mp3' }
        // , { name: 'Song 2', src: '/music/song2.mp3' }
    ];

    if (window.__kzMusicLoaded || document.getElementById('kzMusicPanel')) return;
    window.__kzMusicLoaded = true;

    var CSS = ".kz-music-panel {\n    position: fixed; top: 54px; right: 12px; z-index: 3001;\n    width: 270px; max-width: calc(100vw - 24px); box-sizing: border-box;\n    padding: 14px 14px 16px; border-radius: 18px;\n    border: 1.5px solid rgba(255,30,30,.65);\n    background: radial-gradient(ellipse at 50% 0%, rgba(120,0,0,.35), transparent 60%), linear-gradient(160deg, rgba(14,3,3,.97), rgba(30,2,2,.95));\n    box-shadow: 0 0 28px rgba(255,0,0,.3), 0 10px 30px rgba(0,0,0,.6);\n    backdrop-filter: blur(14px);\n    opacity: 0; visibility: hidden; transform: translateY(-8px) scale(.97); transform-origin: top right;\n    transition: opacity .2s ease, transform .2s ease, visibility .2s;\n}\n.kz-music-panel.open { opacity: 1; visibility: visible; transform: none; }\n.kzm-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; color: #fff; font-size: 14px; }\n.kzm-x { width: 26px; height: 26px; border-radius: 50%; border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.06); color: #ddd; cursor: pointer; font-size: 12px; }\n.kzm-x:hover { border-color: #ff2222; color: #ff4444; }\n.kzm-label { display: flex; justify-content: space-between; margin: 10px 0 4px; color: #ffcc00; font-size: 11.5px; font-weight: 800; letter-spacing: .3px; }\n.kz-music-panel select {\n    width: 100%; padding: 9px 10px; border-radius: 10px; border: 1px solid rgba(255,204,0,.4);\n    background: #000; color: #fff; font-size: 12.5px; margin: 0;\n}\n.kz-music-panel input[type=range] { width: 100%; padding: 0; margin: 6px 0 0; border: none; background: transparent; accent-color: #00ff22; cursor: pointer; }\n.kzm-row { display: flex; gap: 8px; margin-top: 12px; }\n.kzm-btn {\n    flex: 1; padding: 10px; border-radius: 10px; border: 1px solid #ff2222;\n    background: linear-gradient(120deg, #ff1a1a, #8a0000); color: #fff; font-weight: 800; font-size: 12.5px; cursor: pointer;\n}\n.kzm-btn:hover { box-shadow: 0 0 14px rgba(255,0,0,.5); }\n.kzm-ghost { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.25); }\n\n.music-toggle { position: fixed; top: 12px; right: 12px; z-index: 3000; width: 34px; height: 34px; padding: 0;\n    border: 1px solid rgba(255,255,255,.35); border-radius: 50%; background: rgba(0,0,0,.75); color: #fff;\n    cursor: pointer; font-size: 16px; line-height: 1; }\n.music-toggle:hover { background: #fbff00; color: #000; }\n";
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    var wrap = document.createElement('div');
    wrap.innerHTML =
        '<audio id="bg-music" preload="auto"></audio>' +
        '<button id="music-toggle" class="music-toggle" type="button" aria-label="Music settings" aria-expanded="false" onclick="kzToggleMusicPanel(event)">\uD83D\uDD0A</button>' +
        '<div id="kzMusicPanel" class="kz-music-panel" role="dialog" aria-label="Music settings">' +
          '<div class="kzm-head"><b>\uD83C\uDFB5 Music</b><button type="button" class="kzm-x" aria-label="Close" onclick="kzToggleMusicPanel(event)">\u2715</button></div>' +
          '<label class="kzm-label" for="kzmTrack">Song</label><select id="kzmTrack"></select>' +
          '<div class="kzm-row"><button type="button" id="kzmPlay" class="kzm-btn">\u23F8 Stop</button><button type="button" id="kzmNext" class="kzm-btn kzm-ghost">\u23ED Next</button></div>' +
          '<label class="kzm-label" for="kzmVol"><span>Volume</span><span id="kzmVolText">60%</span></label>' +
          '<input type="range" id="kzmVol" min="0" max="100" value="60">' +
        '</div>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    var audio   = document.getElementById('bg-music');
    var iconBtn = document.getElementById('music-toggle');
    var panel   = document.getElementById('kzMusicPanel');
    var sel     = document.getElementById('kzmTrack');
    var playBtn = document.getElementById('kzmPlay');
    var nextBtn = document.getElementById('kzmNext');
    var vol     = document.getElementById('kzmVol');
    var volText = document.getElementById('kzmVolText');

    function load(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
    function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    var stopped = false; // Stop is not remembered: every page load tries to autoplay
    var track   = parseInt(load('kz-music-track', '0'), 10);
    if (!(track >= 0 && track < TRACKS.length)) track = 0;
    var volume  = parseInt(load('kz-music-volume', '60'), 10);
    if (!(volume >= 0 && volume <= 100)) volume = 60;
    var resumeAfterHidden = false;

    TRACKS.forEach(function (t, i) {
        var o = document.createElement('option');
        o.value = i; o.textContent = t.name;
        sel.appendChild(o);
    });

    function play() { audio.play().catch(function () {}); }

    function ui() {
        iconBtn.textContent = (stopped || volume === 0) ? '🔇' : '🔊';
        playBtn.textContent = stopped ? '▶ Play' : '⏸ Stop';
        sel.value = track;
        vol.value = volume;
        volText.textContent = volume + '%';
        audio.volume = volume / 100;
        audio.loop = TRACKS.length === 1;
        nextBtn.style.display = TRACKS.length > 1 ? '' : 'none';
    }

    function setTrack(i) {
        track = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
        save('kz-music-track', track);
        audio.src = TRACKS[track].src;
        audio.load();
        if (!stopped) play();
        ui();
    }

    // initial state
    audio.src = TRACKS[track].src;
    ui();

    // controls
    playBtn.addEventListener('click', function () {
        stopped = !stopped;
        if (stopped) audio.pause(); else play();
        ui();
    });
    nextBtn.addEventListener('click', function () { setTrack(track + 1); });
    sel.addEventListener('change', function () { setTrack(parseInt(sel.value, 10)); });
    vol.addEventListener('input', function () {
        volume = parseInt(vol.value, 10);
        save('kz-music-volume', volume);
        ui();
    });
    audio.addEventListener('ended', function () { if (TRACKS.length > 1) setTrack(track + 1); });

    // panel open / close
    window.kzToggleMusicPanel = function (e) {
        if (e) e.stopPropagation();
        var open = panel.classList.toggle('open');
        iconBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    function closePanel() { panel.classList.remove('open'); iconBtn.setAttribute('aria-expanded', 'false'); }
    document.addEventListener('click', function (e) {
        if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== iconBtn) closePanel();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });

    // autoplay: try right away on page load; if the browser blocks it,
    // start on the first click / tap / key press anywhere on the page (unless the user stopped the music)
    (function autoplay() {
        if (stopped) return;
        var evs = ['pointerdown', 'keydown', 'touchstart'];
        function remove() { evs.forEach(function (e) { document.removeEventListener(e, unlock, true); }); }
        function unlock() {
            if (stopped) return;
            var p = audio.play();
            if (p && p.then) p.then(remove).catch(function () {}); else remove();
        }
        var first = audio.play();
        if (first && first.catch) {
            first.catch(function () { evs.forEach(function (e) { document.addEventListener(e, unlock, true); }); });
        }
    })();

    // pause when the tab is hidden, resume when it is back
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            if (!audio.paused) { resumeAfterHidden = true; audio.pause(); }
        } else if (resumeAfterHidden && !stopped) {
            play();
            resumeAfterHidden = false;
        }
    });
}
if (document.body) kzMusicInit(); else document.addEventListener('DOMContentLoaded', kzMusicInit);