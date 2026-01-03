(function(){
  const listEl = document.querySelector("[data-instru-list]");
  const chipsEl = document.querySelector("[data-genre-chips]");
  const moodChipsEl = document.querySelector("[data-mood-chips]");
  const searchInput = document.querySelector("[data-search-input]");
  const audio = document.querySelector("[data-audio-player]");
  const trackNodes = document.querySelectorAll("[data-track-item]");

  if(!listEl || !chipsEl || !audio || !trackNodes.length) return;

  const nowCover = document.querySelector("[data-now-cover]");
  const nowGenre = document.querySelector("[data-now-genre]");
  const nowTitle = document.querySelector("[data-now-title]");
  const nowSubtitle = document.querySelector("[data-now-subtitle]");
  const nowMood = document.querySelector("[data-now-mood]");
  const nowTime = document.querySelector("[data-now-time]");
  const nowDuration = document.querySelector("[data-now-duration]");
  const nowBpm = document.querySelector("[data-now-bpm]");
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
  const contactTarget = "contact.html#infos-contact";

  function formatTime(value){
    if(!value || Number.isNaN(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2,"0");
    return `${minutes}:${seconds}`;
  }

  function updateNowPlayingUI(track){
    if(!track){
      if(nowTitle) nowTitle.textContent = "Aucune instru en lecture";
      if(nowSubtitle) nowSubtitle.textContent = "Choisis une carte pour lancer la lecture.";
      if(nowCover) nowCover.style.backgroundImage = "none";
      if(nowGenre) nowGenre.textContent = "Genre";
      if(nowBpm) nowBpm.textContent = "BPM";
      if(nowContact) nowContact.onclick = null;
      return;
    }

    if(nowTitle) nowTitle.textContent = track.title;
    if(nowSubtitle) nowSubtitle.textContent = track.artist || track.mood || "";
    if(nowMood) nowMood.textContent = track.mood || "Mood";
    if(nowGenre) nowGenre.textContent = track.genre || "Genre";
    if(nowBpm) nowBpm.textContent = `${track.bpm || "–"} BPM`;
    if(nowCover) nowCover.style.backgroundImage = `url(${track.cover})`;
    if(nowContact) nowContact.onclick = () => { window.location.href = `${contactTarget}?titre=${encodeURIComponent(track.title)}`; };
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
    if(currentId){
      const failing = allTracks.find(t => t.id === currentId);
      if(failing) failing.available = false;
      if(cardsById.has(currentId)){
        const entry = cardsById.get(currentId);
        entry.card.classList.add("is-muted", "is-disabled");
        entry.playBtn.disabled = true;
        const badges = entry.card.querySelector(".track-badges");
        if(badges && !badges.querySelector(".pill.warning")){
          const warn = document.createElement("span");
          warn.className = "pill warning";
          warn.textContent = "Aperçu indisponible";
          badges.appendChild(warn);
        }
      }
    }
    currentId = null;
    audio.removeAttribute("src");
    audio.load();
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
    if(!track || !track.available) return;
    currentId = track.id;
    updateNowPlayingUI(track);
    markActiveCards(track.id, false);
    const contactText = encodeURIComponent(`Salut, je veux sécuriser l'instru ${track.title}`);
    if(nowContact) nowContact.onclick = () => { window.location.href = `${contactTarget}?message=${contactText}`; };

    const playFromAudio = () => {
      audio.play().catch(() => {});
    };

    if(track.audio){
      audio.src = track.audio;
      audio.load();
      playFromAudio();
    }
  }

  function findPlayableIndex(startIndex, direction = 1){
    if(!filteredTracks.length) return null;
    const max = filteredTracks.length;
    for(let i = 0; i < max; i++){
      const target = (startIndex + (i * direction) + max) % max;
      const candidate = filteredTracks[target];
      if(candidate && candidate.available) return target;
    }
    return null;
  }

  function playTrackByIndex(index){
    if(!filteredTracks.length) return;
    const playableIndex = findPlayableIndex(index);
    if(playableIndex === null) return;
    const track = filteredTracks[playableIndex];
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
    if(idx === -1) idx = filteredTracks.length - 1;
    const target = findPlayableIndex(idx - 1, -1);
    if(target !== null) playTrackByIndex(target);
  }

  function nextTrack(){
    if(!filteredTracks.length) return;
    let idx = filteredTracks.findIndex(t => t.id === currentId);
    if(idx === -1) idx = 0;
    const target = findPlayableIndex(idx + 1, 1);
    if(target !== null) playTrackByIndex(target);
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
    if(!track.audio || !track.available){
      const warn = document.createElement("span");
      warn.className = "pill warning";
      warn.textContent = "Aperçu indisponible";
      badges.appendChild(warn);
    }

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
    if(track.available){
      playBtn.addEventListener("click", (e) => { e.stopPropagation(); startTrack(track.id); });
    } else {
      playBtn.disabled = true;
    }

    const contactBtn = document.createElement("button");
    contactBtn.className = "btn btn-quiet";
    contactBtn.type = "button";
    contactBtn.textContent = "Parler de cette instru";
    contactBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `${contactTarget}?titre=${encodeURIComponent(track.title)}`;
    });

    actions.append(playBtn, contactBtn);

    card.append(thumb, body, actions);

    if(track.available){
      card.addEventListener("click", () => startTrack(track.id));
    } else {
      card.classList.add("is-disabled");
      card.setAttribute("aria-disabled", "true");
    }

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
    const activeMoodChip = moodChipsEl?.querySelector(".chip.is-active");
    const activeMood = activeMoodChip ? activeMoodChip.dataset.mood : "Tous";

    filteredTracks = allTracks.filter(track => {
      const matchesGenre = activeGenre === "Tous" || track.genre === activeGenre;
      const matchesMood = activeMood === "Tous" || track.mood === activeMood;
      const matchesQuery = track.title.toLowerCase().includes(query)
        || (track.mood || "").toLowerCase().includes(query)
        || (track.bpm || "").toString().includes(query);
      return matchesGenre && matchesMood && matchesQuery;
    });

    renderList(filteredTracks);
  }

  function buildChips(values, container, dataKey){
    if(!container) return;
    container.innerHTML = "";
    const all = document.createElement("button");
    all.className = "chip is-active";
    all.type = "button";
    all.dataset[dataKey] = "Tous";
    all.textContent = "Tous";
    container.appendChild(all);

    values.forEach((value) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.type = "button";
      btn.dataset[dataKey] = value;
      btn.textContent = value;
      container.appendChild(btn);
    });

    container.addEventListener("click", (event) => {
      const target = event.target.closest(".chip");
      if(!target) return;
      container.querySelectorAll(".chip").forEach(chip => chip.classList.remove("is-active"));
      target.classList.add("is-active");
      applyFilters();
    });
  }

  function startTrack(id){
    const index = filteredTracks.findIndex(t => t.id === id);
    if(index === -1) return;
    const track = filteredTracks[index];
    if(!track.available){
      const entry = cardsById.get(track.id);
      if(entry) entry.card.classList.add("is-muted");
      return;
    }
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
    const cover = raw.cover || "assets/releases/mono-lines.svg";
    const hasAudio = !!raw.audio;
    const available = raw.available !== false && hasAudio;
    return {
      id: raw.id || generateId(),
      title: raw.title || "Instru",
      artist: raw.artist || "",
      genre: raw.genre || "",
      bpm: raw.bpm || "",
      mood: raw.mood || "Exclusive",
      cover,
      audio: hasAudio ? raw.audio : "",
      available
    };
  }

  function parseTracks(){
    return Array.from(trackNodes).map(node => normalizeTrack({
      id: node.dataset.id,
      title: node.dataset.title,
      genre: node.dataset.genre,
      bpm: node.dataset.bpm,
      mood: node.dataset.mood,
      cover: node.dataset.cover,
      audio: node.dataset.audio,
      available: node.dataset.available !== "false",
    }));
  }

  function loadTracks(){
    const tracks = parseTracks();
    allTracks = tracks;
    if(!tracks.length){
      renderEmpty();
      return;
    }
    const genres = Array.from(new Set(tracks.map(t => t.genre).filter(Boolean)));
    const moods = Array.from(new Set(tracks.map(t => t.mood).filter(Boolean)));
    buildChips(genres, chipsEl, "genre");
    buildChips(moods, moodChipsEl, "mood");
    filteredTracks = [...tracks];
    renderList(filteredTracks);
  }

  setVolume(0.8);
  attachEvents();
  loadTracks();
})();
