(function(){
  const grid = document.querySelector("[data-instrus-grid]");
  if(!grid) return; // only on instrus page

  const miniPlayer = document.querySelector("[data-mini-player]");
  const miniTitle = document.querySelector("[data-mini-title]");
  const miniArtist = document.querySelector("[data-mini-artist]");
  const miniToggle = document.querySelector("[data-mini-toggle]");

  let player = null;
  let playerReady = false;
  let activeEntry = null;
  let progressTimer = null;
  let apiPromise = null;
  const entries = [];

  function formatTime(value){
    if(!value || Number.isNaN(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2,"0");
    return `${minutes}:${seconds}`;
  }

  function stopProgressLoop(){
    if(progressTimer){
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function startProgressLoop(){
    stopProgressLoop();
    progressTimer = setInterval(() => {
      if(!player || !activeEntry || typeof player.getCurrentTime !== "function") return;
      const current = player.getCurrentTime() || 0;
      const duration = player.getDuration() || 0;
      updateProgressUI(current, duration);
    }, 250);
  }

  function updateProgressUI(current, duration){
    const entry = activeEntry;
    if(!entry) return;
    const percent = duration ? Math.min(100, (current / duration) * 100) : 0;
    entry.progressBar.style.width = `${percent}%`;
    entry.timeCurrent.textContent = formatTime(current);
    entry.timeTotal.textContent = duration ? formatTime(duration) : "–:–";
  }

  function markActive(entry, isPlaying){
    entries.forEach(item => {
      const active = entry && item.card === entry.card;
      item.card.classList.toggle("is-active", active);
      item.playBtn.classList.toggle("is-playing", active && isPlaying);
    });

    if(miniPlayer && entry){
      miniPlayer.classList.add("is-visible");
      if(miniTitle) miniTitle.textContent = entry.track.title;
      if(miniArtist) miniArtist.textContent = entry.track.artist;
      if(miniToggle) miniToggle.classList.toggle("is-playing", isPlaying);
    } else if(miniPlayer){
      miniPlayer.classList.remove("is-visible");
    }
  }

  function handleStateChange(event){
    if(!activeEntry) return;
    switch(event.data){
      case YT.PlayerState.PLAYING:
        markActive(activeEntry, true);
        startProgressLoop();
        break;
      case YT.PlayerState.PAUSED:
        markActive(activeEntry, false);
        stopProgressLoop();
        break;
      case YT.PlayerState.ENDED:
        stopProgressLoop();
        updateProgressUI(0, player.getDuration());
        markActive(activeEntry, false);
        break;
      default:
        break;
    }
  }

  function ensurePlayer(){
    if(playerReady) return Promise.resolve(player);

    if(apiPromise) return apiPromise;

    apiPromise = new Promise((resolve) => {
      const createPlayer = () => {
        player = new YT.Player("yt-player", {
          height: "0",
          width: "0",
          videoId: "",
          playerVars: { playsinline: 1, modestbranding: 1, rel: 0 },
          events: {
            onReady: () => { playerReady = true; resolve(player); },
            onStateChange: handleStateChange
          }
        });
      };

      if(window.YT && typeof YT.Player === "function"){
        createPlayer();
        return;
      }

      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if(!existing){
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => createPlayer();
    });

    return apiPromise;
  }

  function toggleTrack(entry){
    ensurePlayer().then(() => {
      const isSameTrack = activeEntry && activeEntry.track.youtubeId === entry.track.youtubeId;
      activeEntry = entry;
      markActive(entry, false);
      updateProgressUI(0, 0);

      const state = player.getPlayerState ? player.getPlayerState() : -1;
      const isCurrentlyPlaying = isSameTrack && state === YT.PlayerState.PLAYING;

      if(isSameTrack){
        if(isCurrentlyPlaying) player.pauseVideo();
        else player.playVideo();
        return;
      }

      player.loadVideoById(entry.track.youtubeId);
      player.playVideo();
    });
  }

  function createCard(track){
    const card = document.createElement("article");
    card.className = "instru-card";
    card.dataset.videoId = track.youtubeId;

    const thumb = document.createElement("img");
    thumb.className = "instru-thumb";
    thumb.src = `https://img.youtube.com/vi/${track.youtubeId}/hqdefault.jpg`;
    thumb.alt = `${track.title} — ${track.artist}`;
    card.appendChild(thumb);

    const body = document.createElement("div");
    body.className = "instru-body";

    const top = document.createElement("div");
    top.className = "instru-top";

    const titles = document.createElement("div");
    titles.className = "instru-titles";

    const meta = document.createElement("p");
    meta.className = "instru-meta";
    meta.textContent = `${track.type || "Single"} · ${track.year || "2024"}`;

    const title = document.createElement("h3");
    title.className = "instru-title";
    title.textContent = track.title;

    const artist = document.createElement("p");
    artist.className = "instru-artist";
    artist.textContent = track.artist;

    titles.append(meta, title, artist);

    const playBtn = document.createElement("button");
    playBtn.className = "play-btn";
    playBtn.type = "button";
    playBtn.innerHTML = '<span class="icon-play">▶</span><span class="icon-pause">❚❚</span>';
    playBtn.addEventListener("click", () => toggleTrack(entry));

    top.append(titles, playBtn);

    const progress = document.createElement("div");
    progress.className = "progress";
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    progress.appendChild(bar);

    const bottom = document.createElement("div");
    bottom.className = "instru-bottom";

    const time = document.createElement("span");
    time.className = "timecode";
    time.textContent = "0:00";

    const total = document.createElement("span");
    total.className = "timecode";
    total.textContent = "–:–";

    const cta = document.createElement("a");
    cta.className = "btn btn-quiet";
    cta.href = "https://wa.me/33600000000?text=Je%20veux%20valider%20cette%20instru%20SZD%20Studio";
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    cta.textContent = "Brief rapide";

    bottom.append(time, total, cta);

    body.append(top, progress, bottom);
    card.appendChild(body);

    const entry = { track, card, playBtn, progressBar: bar, timeCurrent: time, timeTotal: total };
    return entry;
  }

  function renderInstrus(items){
    grid.innerHTML = "";
    if(!items.length){
      grid.innerHTML = '<p class="muted">Catalogue en cours d’actualisation.</p>';
      return;
    }

    items.forEach(track => {
      const entry = createCard(track);
      entries.push(entry);
      grid.appendChild(entry.card);
    });
  }

  function initMiniToggle(){
    if(!miniToggle) return;
    miniToggle.addEventListener("click", () => {
      if(activeEntry) toggleTrack(activeEntry);
    });
  }

  function loadInstrus(){
    fetch("data/instrus.json")
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? data : [])
      .then(items => renderInstrus(items))
      .catch(() => { grid.innerHTML = '<p class="muted">Impossible de charger les instrus pour le moment.</p>'; });
  }

  initMiniToggle();
  loadInstrus();
})();
