(() => {
  const manifests = window.BRIGHTPATH_MANIFESTS || {};

  const grid = document.getElementById("videosGrid");
  const resultsMeta = document.getElementById("resultsMeta");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearFiltersBtn");
  const lockedGate = document.getElementById("lockedGate");

  if (!grid || !resultsMeta || !emptyState || !searchInput || !clearBtn || !lockedGate) return;

  /** @type {"all" | "1" | "2" | "3"} */
  let activeGrade = "all";
  let query = "";
  let allowedGrade = null; // null => locked

  function getGradeFiles(grade) {
    const list = manifests && manifests[grade] ? manifests[grade] : [];
    return Array.isArray(list) ? list : [];
  }

  function titleFromFilename(name) {
    const base = String(name || "").replace(/\.[^/.]+$/, "");
    return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Lesson";
  }

  function posterFor(grade, filename) {
    const base = String(filename || "").replace(/\.[^/.]+$/, "");
    // Try common image extensions (you can create these optional thumbnails)
    return [
      `./assets/videos/grade-${grade}/${base}.jpg`,
      `./assets/videos/grade-${grade}/${base}.jpeg`,
      `./assets/videos/grade-${grade}/${base}.png`,
      `./assets/videos/grade-${grade}/${base}.webp`,
    ];
  }

  function buildVideosForGrade(gradeStr) {
    const grade = Number(gradeStr);
    const files = getGradeFiles(grade);
    return files.map((file) => {
      const safeFile = String(file || "");
      return {
        id: `g${grade}-${safeFile}`,
        grade,
        title: titleFromFilename(safeFile),
        topic: `Grade ${grade}`,
        description: "Video lesson.",
        videoSrc: `./assets/videos/grade-${grade}/${safeFile}`,
        posterCandidates: posterFor(grade, safeFile),
      };
    });
  }

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function getAllowedGrade() {
    const access = window.BRIGHTPATH_AUTH?.getAccess?.() || null;
    if (!access || ![1, 2, 3].includes(access.grade)) return null;
    return String(access.grade);
  }

  function parseHashGrade() {
    const raw = (location.hash || "").replace(/^#/, "");
    const m = raw.match(/(?:^|&)grade=(1|2|3)(?:&|$)/);
    return m ? m[1] : null;
  }

  function setActiveGrade(next) {
    activeGrade = next;
    const buttons = document.querySelectorAll(".seg-btn[data-grade]");
    buttons.forEach((btn) => {
      const grade = btn.getAttribute("data-grade");
      btn.setAttribute("aria-selected", grade === activeGrade ? "true" : "false");
    });
  }

  function setUiLocked(isLocked) {
    lockedGate.hidden = !isLocked;
    resultsMeta.hidden = isLocked;
    grid.hidden = isLocked;
    emptyState.hidden = true;

    const buttons = document.querySelectorAll(".seg-btn[data-grade]");
    buttons.forEach((btn) => {
      const g = btn.getAttribute("data-grade");
      if (isLocked) {
        btn.disabled = true;
        btn.setAttribute("aria-selected", "false");
      } else {
        // enable, then re-disable non-allowed grades below if needed
        btn.disabled = false;
      }

      if (!isLocked && allowedGrade && g && g !== allowedGrade && g !== "all") {
        btn.disabled = true;
      }
      if (!isLocked && allowedGrade && g === "all") {
        btn.disabled = true; // force focus to single grade
      }
    });

    searchInput.disabled = isLocked;
    clearBtn.disabled = isLocked;
  }

  function getFiltered() {
    const q = normalize(query);
    const list = allowedGrade ? buildVideosForGrade(allowedGrade) : [];
    return list.filter((v) => {
      if (!q) return true;
      const haystack = normalize([v.title, v.topic, v.description, `grade ${v.grade}`].join(" "));
      return haystack.includes(q);
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function render() {
    // Gate by login
    allowedGrade = getAllowedGrade();
    if (!allowedGrade) {
      setUiLocked(true);
      return;
    }

    setUiLocked(false);
    // Force active grade to allowed grade
    if (activeGrade !== allowedGrade) setActiveGrade(allowedGrade);
    if (location.hash !== `#grade=${allowedGrade}`) {
      history.replaceState(null, "", `./videos.html#grade=${allowedGrade}`);
    }

    const items = getFiltered();
    const gradeLabel = `Grade ${allowedGrade}`;
    resultsMeta.textContent = `${items.length} lesson${items.length === 1 ? "" : "s"} • ${gradeLabel}`;

    grid.innerHTML = items
      .map((v) => {
        const title = escapeHtml(v.title);
        const desc = escapeHtml(v.description);
        const topic = escapeHtml(v.topic || "Lesson");
        const grade = Number(v.grade) || 0;
        const tag = `Grade ${grade} • ${topic}`;
        const videoSrc = v.videoSrc ? String(v.videoSrc) : "";
        const posters = Array.isArray(v.posterCandidates) ? v.posterCandidates : [];

        const safeSrc = videoSrc && !/^\s*javascript:/i.test(videoSrc) ? videoSrc : "";
        const safePoster = posters.find((p) => p && !/^\s*javascript:/i.test(String(p))) || "";

        const player = safeSrc
          ? `<div class="video-frame">
              <video controls preload="metadata" ${safePoster ? `poster="${safePoster}"` : ""}>
                <source src="${safeSrc}" type="video/mp4" />
                Your browser does not support HTML5 video.
              </video>
            </div>`
          : `<div class="video-frame"><div class="muted">Add a video file in assets/videos/</div></div>`;

        return `
          <article class="card video-card">
            <div class="video-card-inner">
              <div class="video-top">
                <span class="grade-tag">${escapeHtml(tag)}</span>
              </div>
              <h2 class="video-title">${title}</h2>
              <p class="video-desc">${desc}</p>
              ${player}
            </div>
          </article>
        `;
      })
      .join("");

    const showEmpty = items.length === 0;
    emptyState.hidden = !showEmpty;
  }

  function clearFilters() {
    query = "";
    searchInput.value = "";
    setActiveGrade(allowedGrade || "all");
    if (allowedGrade) history.replaceState(null, "", `./videos.html#grade=${allowedGrade}`);
    render();
  }

  // Grade buttons
  document.addEventListener("click", (e) => {
    const btn = e.target instanceof Element ? e.target.closest(".seg-btn[data-grade]") : null;
    if (!btn) return;
    const grade = btn.getAttribute("data-grade");
    if (!grade) return;
    setActiveGrade(grade);
    if (grade === "all") {
      history.replaceState(null, "", "./videos.html");
    } else {
      history.replaceState(null, "", `./videos.html#grade=${grade}`);
    }
    render();
  });

  // Search
  searchInput.addEventListener("input", () => {
    query = searchInput.value || "";
    render();
  });

  clearBtn.addEventListener("click", clearFilters);

  // Initial state from hash
  const initial = parseHashGrade();
  if (initial === "1" || initial === "2" || initial === "3") setActiveGrade(initial);
  render();

  window.addEventListener("hashchange", () => {
    const next = parseHashGrade();
    if (allowedGrade) {
      setActiveGrade(allowedGrade);
      history.replaceState(null, "", `./videos.html#grade=${allowedGrade}`);
      render();
      return;
    }
    if (next === "1" || next === "2" || next === "3") setActiveGrade(next);
    render();
  });
})();
