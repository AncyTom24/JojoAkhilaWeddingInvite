(function () {
  const config = window.INVITATION_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function getValue(path) {
    return path.split(".").reduce((value, key) => value && value[key], config);
  }

  function applyConfig() {
    $$("[data-config]").forEach((node) => {
      const value = getValue(node.dataset.config);
      if (value !== undefined && value !== null) node.textContent = value;
    });

    if (config.assets && config.assets.cover) {
      $("#coverImage").src = config.assets.cover;
      document.querySelector('link[rel="preload"]').href = config.assets.cover;
    }

    const mapButton = $("#mapButton");
    if (mapButton && config.mapUrl) mapButton.href = config.mapUrl;

    document.title = (config.share && config.share.title) || `${config.couple} Wedding Invitation`;
    setMeta("description", config.share && config.share.description);
    setMeta("property", "og:title", config.share && config.share.title);
    setMeta("property", "og:description", config.share && config.share.description);
    setMeta("property", "og:url", config.share && config.share.url);
    setMeta("property", "og:image", config.share && config.share.image);
    setMeta("property", "og:image:secure_url", config.share && config.share.image);
    setMeta("name", "twitter:title", config.share && config.share.title);
    setMeta("name", "twitter:description", config.share && config.share.description);
    setMeta("name", "twitter:image", config.share && config.share.image);
  }

  function setMeta(attr, keyOrValue, maybeValue) {
    const selector = maybeValue === undefined ? `meta[name="${attr}"]` : `meta[${attr}="${keyOrValue}"]`;
    const value = maybeValue === undefined ? keyOrValue : maybeValue;
    const node = document.querySelector(selector);
    if (node && value) node.setAttribute("content", value);
  }

  function initOpening() {
    const cover = $("#cover");
    const button = $("#openInvite");
    const audio = $("#bgMusic");
    const musicToggle = $("#musicToggle");
    document.body.classList.add("locked");

    if (config.assets && config.assets.music) {
      audio.src = config.assets.music;
      audio.preload = "auto";
      audio.volume = 0.82;
      audio.load();
      musicToggle.hidden = false;
    }

    const startMusic = () => playMusic(audio, musicToggle);

    button.addEventListener("pointerdown", startMusic, { once: true });
    button.addEventListener("touchstart", startMusic, { once: true, passive: true });

    button.addEventListener("click", async () => {
      cover.classList.add("is-opening");
      button.disabled = true;
      window.setTimeout(() => {
        cover.classList.add("is-flap-open");
      }, 120);
      window.setTimeout(() => {
        cover.classList.add("is-envelope-open");
      }, 760);
      window.setTimeout(() => {
        cover.classList.add("is-card-rise");
      }, 1550);
      window.setTimeout(() => {
        cover.classList.add("is-open");
        document.body.classList.remove("locked");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 4300);
      window.setTimeout(() => {
        cover.setAttribute("aria-hidden", "true");
      }, 5100);
      await startMusic();
    });

    musicToggle.addEventListener("click", async () => {
      if (audio.paused) {
        await playMusic(audio, musicToggle);
      } else {
        stopMusic(audio, musicToggle);
      }
    });

    window.addEventListener("pagehide", () => stopMusic(audio, musicToggle));
    window.addEventListener("beforeunload", () => stopMusic(audio, musicToggle));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") stopMusic(audio, musicToggle);
    });
  }

  async function playMusic(audio, toggle) {
    if (!audio.src) return;
    try {
      audio.muted = false;
      await audio.play();
      toggle.classList.add("is-playing");
      toggle.classList.remove("needs-tap");
    } catch (error) {
      toggle.classList.remove("is-playing");
      toggle.classList.add("needs-tap");
    }
  }

  function stopMusic(audio, toggle) {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    if (toggle) {
      toggle.classList.remove("is-playing");
      toggle.classList.remove("needs-tap");
    }
  }

  function initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: 0.18 });

    $$(".reveal").forEach((node) => observer.observe(node));
  }

  function initCountdown() {
    const target = new Date(config.weddingDate || "2026-09-14T11:00:00+05:30").getTime();
    const nodes = {
      days: $("#days"),
      hours: $("#hours"),
      minutes: $("#minutes"),
      seconds: $("#seconds")
    };

    function tick() {
      const remaining = Math.max(0, target - Date.now());
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      nodes.days.textContent = String(days).padStart(2, "0");
      nodes.hours.textContent = String(hours).padStart(2, "0");
      nodes.minutes.textContent = String(minutes).padStart(2, "0");
      nodes.seconds.textContent = String(seconds).padStart(2, "0");
    }

    tick();
    setInterval(tick, 1000);
  }

  function initGallery() {
    const stack = $("#photoStack");
    const photos = (config.assets && config.assets.photos && config.assets.photos.length)
      ? config.assets.photos
      : [config.assets && config.assets.cover].filter(Boolean);

    stack.innerHTML = "";
    photos.forEach((src, index) => {
      const card = document.createElement("article");
      card.className = "photo-card";
      const img = document.createElement("img");
      img.src = src;
      img.alt = index === 0 ? `${config.couple || "Couple"} photo` : `${config.couple || "Couple"} memory ${index + 1}`;
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";
      card.appendChild(img);
      stack.appendChild(card);
    });
  }

  function initScratchCards() {
    const cards = $$(".scratch-card");
    let revealedCount = 0;
    cards.forEach((card) => {
      const canvas = $("canvas", card);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      let scratching = false;

      function resize() {
        const rect = card.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(rect.width * ratio);
        canvas.height = Math.floor(rect.height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        drawFoil(ctx, rect.width, rect.height);
      }

      function pointFromEvent(event) {
        return event.touches ? event.touches[0] : event;
      }

      function scratch(event) {
        if (!scratching || card.classList.contains("is-revealed")) return;
        event.preventDefault();
        const point = pointFromEvent(event);
        const rect = canvas.getBoundingClientRect();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(point.clientX - rect.left, point.clientY - rect.top, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        if (getScratchedRatio(ctx, canvas) > 0.42) revealCard(card);
      }

      function revealCard(cardNode) {
        if (cardNode.classList.contains("is-revealed")) return;
        cardNode.classList.add("is-revealed");
        revealedCount += 1;
        popPetals(cardNode);
        if (revealedCount === cards.length) popPetals($("#scratchSection"), 34);
      }

      resize();
      window.addEventListener("resize", resize, { passive: true });
      canvas.addEventListener("pointerdown", (event) => {
        scratching = true;
        if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
        scratch(event);
      });
      canvas.addEventListener("pointermove", scratch);
      canvas.addEventListener("pointerup", () => { scratching = false; });
      canvas.addEventListener("pointercancel", () => { scratching = false; });
      canvas.addEventListener("mousedown", (event) => {
        scratching = true;
        scratch(event);
      });
      canvas.addEventListener("mousemove", scratch);
      window.addEventListener("mouseup", () => { scratching = false; });
      canvas.addEventListener("touchstart", (event) => {
        scratching = true;
        scratch(event);
      }, { passive: false });
      canvas.addEventListener("touchmove", scratch, { passive: false });
      canvas.addEventListener("touchend", () => { scratching = false; });
      canvas.addEventListener("click", () => revealCard(card));
    });
  }

  function drawFoil(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#f9e7aa");
    gradient.addColorStop(0.3, "#b78028");
    gradient.addColorStop(0.52, "#fff2bd");
    gradient.addColorStop(0.75, "#c5963a");
    gradient.addColorStop(1, "#80581e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
    for (let x = -width; x < width * 2; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 16, 0);
      ctx.lineTo(x + height + 16, height);
      ctx.lineTo(x + height, height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "rgba(44, 29, 13, 0.34)";
    ctx.font = "700 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText("SCRATCH", width / 2, height / 2 + 4);
  }

  function getScratchedRatio(ctx, canvas) {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0;
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] < 35) clear += 1;
    }
    return clear / (pixels.length / 16);
  }

  function popPetals(source, count = 18) {
    const rect = source.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    for (let i = 0; i < count; i += 1) {
      const petal = document.createElement("span");
      petal.className = "petal";
      petal.style.left = `${originX}px`;
      petal.style.top = `${originY}px`;
      petal.style.setProperty("--petal-x", `${(Math.random() - 0.5) * 240}px`);
      petal.style.setProperty("--petal-y", `${-70 - Math.random() * 210}px`);
      petal.style.setProperty("--petal-r", `${(Math.random() - 0.5) * 360}deg`);
      document.body.appendChild(petal);
      setTimeout(() => petal.remove(), 1700);
    }
  }

  applyConfig();
  initOpening();
  initRevealAnimations();
  initCountdown();
  initGallery();
  initScratchCards();
})();
