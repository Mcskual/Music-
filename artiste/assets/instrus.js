(function(){
  const listEl = document.querySelector("[data-instru-list]");
  const chipsEl = document.querySelector("[data-genre-chips]");
  const searchInput = document.querySelector("[data-search-input]");
  const audio = document.querySelector("[data-audio-player]");

  if(!listEl || !chipsEl || !audio) return;

  const nowCover = document.querySelector("[data-now-cover]");
  const nowGenre = document.querySelector("[data-now-genre]");
  const nowTitle = document.querySelector("[data-now-title]");
  const nowSubtitle = document.querySelector("[data-now-subtitle]");
  const nowTime = document.querySelector("[data-now-time]");
  const nowDuration = document.querySelector("[data-now-duration]");
  const nowBpm = document.querySelector("[data-now-bpm]");
  const nowYoutube = document.querySelector("[data-now-youtube]");
  const nowContact = document.querySelector("[data-now-contact]");
  const progressBar = document.querySelector("[data-progress-bar]");
  const progressInput = document.querySelector("[data-progress-input]");
  const volumeInput = document.querySelector("[data-volume]");
  const muteBtn = document.querySelector("[data-mute]");
  const toggleBtn = document.querySelector("[data-toggle]");
  const prevBtn = document.querySelector("[data-prev]");
  const nextBtn = document.querySelector("[data-next]");

  const miniPlayer = document.querySelector("[data-mini-player]");
  const miniTitle = document.querySelector("[data-mini-title]");
  const miniArtist = document.querySelector("[data-mini-artist]");
  const miniProgress = document.querySelector("[data-mini-progress]");
  const miniToggle = document.querySelector("[data-mini-toggle]");
  const miniPrev = document.querySelector("[data-mini-prev]");
  const miniNext = document.querySelector("[data-mini-next]");

  let allTracks = [];
  let filteredTracks = [];
  let currentId = null;
  let isUserSeeking = false;
  let cardsById = new Map();

  function formatTime(value){
    if(!value || Number.isNaN(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2,"0");
    return `${minutes}:${seconds}`;
  }

  function extractYoutubeId(value){
    if(!value) return "";
    if(/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
    const match = value.match(/[?&]v=([^&#]+)/) || value.match(/youtu\.be\/(.*?)(?:\?|#|$)/);
    return match ? match[1] : "";
  }

  function updateNowPlayingUI(track){
    if(!track){
      if(nowTitle) nowTitle.textContent = "Aucune instru en lecture";
      if(nowSubtitle) nowSubtitle.textContent = "Choisis une carte pour lancer la lecture.";
      if(nowCover) nowCover.style.backgroundImage = "none";
      if(nowGenre) nowGenre.textContent = "Genre";
      if(nowBpm) nowBpm.textContent = "BPM";
      if(nowYoutube) nowYoutube.href = "instrus.html";
      if(nowContact) nowContact.onclick = null;
      return;
    }

    if(nowTitle) nowTitle.textContent = track.title;
    if(nowSubtitle) nowSubtitle.textContent = track.artist || "";
    if(nowGenre) nowGenre.textContent = track.genre || "Genre";
    if(nowBpm) nowBpm.textContent = `${track.bpm || "–"} BPM`;
    if(nowCover) nowCover.style.backgroundImage = `url(${track.cover})`;
    if(nowYoutube) nowYoutube.href = track.youtube || `https://www.youtube.com/watch?v=${track.youtubeId || ""}`;
    if(nowContact) nowContact.onclick = () => window.open(`https://wa.me/33600000000?text=Je%20veux%20valider%20l'instru%20${encodeURIComponent(track.title)}`, "_blank", "noopener,noreferrer");
    if(miniTitle) miniTitle.textContent = track.title;
    if(miniArtist) miniArtist.textContent = track.genre ? `${track.genre} • ${track.bpm || ""} BPM` : (track.artist || "");
  }

  function setMiniProgress(percent){
    if(miniProgress) miniProgress.style.setProperty("--mini-progress", `${percent}%`);
  }

  function markActiveCards(trackId, isPlaying){
    cardsById.forEach((entry, id) => {
      const active = id === trackId;
      entry.card.classList.toggle("is-active", active);
      entry.playBtn.classList.toggle("is-playing", active && isPlaying);
      if(!active) entry.progressBar.style.width = "0%";
    });
    if(toggleBtn) toggleBtn.classList.toggle("is-playing", !!isPlaying);
    if(miniToggle) miniToggle.classList.toggle("is-playing", !!isPlaying);
    if(miniPlayer) miniPlayer.classList.toggle("is-visible", !!trackId);
  }

  function updateProgress(){
    if(isUserSeeking) return;
    const duration = audio.duration || 0;
    const current = audio.currentTime || 0;
    const percent = duration ? Math.min(100, (current / duration) * 100) : 0;

    if(progressBar) progressBar.style.width = `${percent}%`;
    if(progressInput) progressInput.value = percent;
    if(nowTime) nowTime.textContent = formatTime(current);
    if(nowDuration) nowDuration.textContent = duration ? formatTime(duration) : "0:00";
    setMiniProgress(percent);

    if(currentId && cardsById.has(currentId)){
      const entry = cardsById.get(currentId);
      entry.progressBar.style.width = `${percent}%`;
    }
  }

  function syncDuration(){
    const duration = audio.duration || 0;
    if(nowDuration) nowDuration.textContent = duration ? formatTime(duration) : "0:00";
  }

  function handleEnded(){
    nextTrack();
  }

  function handleError(){
    const track = allTracks.find(t => t.id === currentId);
    if(track && track.youtube){
      window.open(track.youtube, "_blank", "noopener,noreferrer");
    }
    markActiveCards(null, false);
    updateNowPlayingUI(null);
  }

  function setVolume(value){
    audio.volume = value;
    if(volumeInput) volumeInput.value = value;
  }

  function toggleMute(){
    audio.muted = !audio.muted;
    if(muteBtn) muteBtn.textContent = audio.muted ? "🔇" : "🔈";
  }

  function setTrack(track){
    if(!track) return;
    currentId = track.id;
    updateNowPlayingUI(track);
    markActiveCards(track.id, false);
    const contactText = encodeURIComponent(`Salut, je veux sécuriser l'instru ${track.title}`);
    if(nowContact) nowContact.onclick = () => window.open(`https://wa.me/33600000000?text=${contactText}`, "_blank", "noopener,noreferrer");

    const playFromAudio = () => {
      audio.play().catch(() => {});
    };

    if(track.audio){
      audio.src = track.audio;
      audio.load();
      playFromAudio();
    } else if(track.youtube){
      window.open(track.youtube, "_blank", "noopener,noreferrer");
    }
  }

  function playTrackByIndex(index){
    if(index < 0 || index >= filteredTracks.length) return;
    const track = filteredTracks[index];
    setTrack(track);
  }

  function togglePlay(){
    if(!currentId){
      if(filteredTracks.length) playTrackByIndex(0);
      return;
    }
    if(audio.paused) audio.play();
    else audio.pause();
  }

  function prevTrack(){
    if(!filteredTracks.length) return;
    let idx = filteredTracks.findIndex(t => t.id === currentId);
    if(idx === -1) idx = 0;
    const target = (idx - 1 + filteredTracks.length) % filteredTracks.length;
    playTrackByIndex(target);
  }

  function nextTrack(){
    if(!filteredTracks.length) return;
    let idx = filteredTracks.findIndex(t => t.id === currentId);
    if(idx === -1) idx = 0;
    const target = (idx + 1) % filteredTracks.length;
    playTrackByIndex(target);
  }

  function renderEmpty(){
    listEl.innerHTML = '<p class="muted">Catalogue en cours d’actualisation.</p>';
    cardsById.clear();
  }

  function createTrackCard(track){
    const card = document.createElement("article");
    card.className = "track-card";
    card.dataset.trackId = track.id;

    const thumb = document.createElement("img");
    thumb.className = "track-thumb";
    thumb.src = track.cover;
    thumb.alt = `${track.title} — ${track.genre || "Instru"}`;

    const body = document.createElement("div");
    body.className = "track-body";

    const title = document.createElement("h3");
    title.className = "track-title";
    title.textContent = track.title;

    const meta = document.createElement("p");
    meta.className = "track-meta";
    meta.textContent = `${track.genre || "Genre"} • ${track.bpm || "–"} BPM`;

    const badges = document.createElement("div");
    badges.className = "track-badges";
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = track.mood || "Exclusive";
    badges.appendChild(pill);

    const progress = document.createElement("div");
    progress.className = "progress";
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    progress.appendChild(bar);

    body.append(title, meta, badges, progress);

    const actions = document.createElement("div");
    actions.className = "track-actions";

    const playBtn = document.createElement("button");
    playBtn.className = "play-btn";
    playBtn.type = "button";
    playBtn.innerHTML = '<span class="icon-play">▶</span><span class="icon-pause">❚❚</span>';
    playBtn.addEventListener("click", (e) => { e.stopPropagation(); startTrack(track.id); });

    const ytBtn = document.createElement("a");
    ytBtn.className = "btn btn-quiet";
    ytBtn.textContent = "YouTube";
    ytBtn.href = track.youtube || `https://www.youtube.com/watch?v=${track.youtubeId || ""}`;
    ytBtn.target = "_blank";
    ytBtn.rel = "noopener noreferrer";

    actions.append(playBtn, ytBtn);

    card.append(thumb, body, actions);

    card.addEventListener("click", () => startTrack(track.id));

    cardsById.set(track.id, { card, playBtn, progressBar: bar });
    return card;
  }

  function renderList(items){
    listEl.innerHTML = "";
    cardsById.clear();
    if(!items.length){
      renderEmpty();
      return;
    }

    items.forEach(track => {
      const card = createTrackCard(track);
      listEl.appendChild(card);
    });
    markActiveCards(currentId, !audio.paused);
  }

  function applyFilters(){
    const query = (searchInput?.value || "").toLowerCase();
    const activeChip = chipsEl.querySelector(".chip.is-active");
    const activeGenre = activeChip ? activeChip.dataset.genre : "Tous";

    filteredTracks = allTracks.filter(track => {
      const matchesGenre = activeGenre === "Tous" || track.genre === activeGenre;
      const matchesQuery = track.title.toLowerCase().includes(query) || (track.mood || "").toLowerCase().includes(query);
      return matchesGenre && matchesQuery;
    });

    renderList(filteredTracks);
  }

  function buildChips(genres){
    chipsEl.innerHTML = "";
    const all = document.createElement("button");
    all.className = "chip is-active";
    all.type = "button";
    all.dataset.genre = "Tous";
    all.textContent = "Tous";
    chipsEl.appendChild(all);

    genres.forEach((genre) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.type = "button";
      btn.dataset.genre = genre;
      btn.textContent = genre;
      chipsEl.appendChild(btn);
    });

    chipsEl.addEventListener("click", (event) => {
      const target = event.target.closest(".chip");
      if(!target) return;
      chipsEl.querySelectorAll(".chip").forEach(chip => chip.classList.remove("is-active"));
      target.classList.add("is-active");
      applyFilters();
    });
  }

  function startTrack(id){
    const index = filteredTracks.findIndex(t => t.id === id);
    if(index === -1) return;
    const track = filteredTracks[index];
    const isSame = currentId === track.id;
    if(isSame){
      togglePlay();
      return;
    }
    playTrackByIndex(index);
  }

  function attachEvents(){
    if(searchInput){
      searchInput.addEventListener("input", () => applyFilters());
    }

    if(progressInput){
      progressInput.addEventListener("input", (event) => {
        isUserSeeking = true;
        const percent = Number(event.target.value) || 0;
        const duration = audio.duration || 0;
        audio.currentTime = (percent / 100) * duration;
        updateProgress();
      });
      progressInput.addEventListener("change", () => { isUserSeeking = false; });
    }

    if(volumeInput){
      volumeInput.addEventListener("input", (event) => setVolume(Number(event.target.value)));
    }

    if(muteBtn){
      muteBtn.addEventListener("click", toggleMute);
    }

    if(toggleBtn){
      toggleBtn.addEventListener("click", togglePlay);
    }
    if(prevBtn) prevBtn.addEventListener("click", prevTrack);
    if(nextBtn) nextBtn.addEventListener("click", nextTrack);
    if(miniToggle) miniToggle.addEventListener("click", togglePlay);
    if(miniPrev) miniPrev.addEventListener("click", prevTrack);
    if(miniNext) miniNext.addEventListener("click", nextTrack);

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    audio.addEventListener("play", () => markActiveCards(currentId, true));
    audio.addEventListener("pause", () => markActiveCards(currentId, false));
  }

  function generateId(){
    if(window.crypto && typeof window.crypto.randomUUID === "function") return crypto.randomUUID();
    return `instru-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeTrack(raw){
    const youtubeId = extractYoutubeId(raw.youtube || raw.youtubeId || "");
    const cover = raw.cover || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : "assets/releases/mono-lines.svg");
    return {
      id: raw.id || generateId(),
      title: raw.title || "Instru",
      artist: raw.artist || "",
      genre: raw.genre || "",
      bpm: raw.bpm || "",
      mood: raw.mood || "Exclusive",
      cover,
      audio: raw.audio || "",
      youtube: raw.youtube || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : ""),
      youtubeId
    };
  }

  function loadTracks(){
    fetch("data/instrus.json")
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? data.map(normalizeTrack) : [])
      .then((tracks) => {
        allTracks = tracks;
        const genres = Array.from(new Set(tracks.map(t => t.genre).filter(Boolean)));
        buildChips(genres);
        filteredTracks = [...tracks];
        renderList(filteredTracks);
      })
      .catch(() => renderEmpty());
  }

  setVolume(0.8);
  attachEvents();
  loadTracks();
})();
