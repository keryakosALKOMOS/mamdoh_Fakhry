(() => {
  const form = document.getElementById("loginForm");
  const input = document.getElementById("codeInput");
  const msg = document.getElementById("message");
  const currentAccess = document.getElementById("currentAccess");
  const logoutBtn = document.getElementById("logoutBtn");
  const submitBtn = document.querySelector(".auth-submit");

  if (!form || !(input instanceof HTMLInputElement) || !msg || !currentAccess || !logoutBtn) return;

  function setMessage(text, tone) {
    msg.textContent = text;
    msg.classList.remove("is-ok", "is-bad");
    if (tone === "ok") msg.classList.add("is-ok");
    if (tone === "bad") msg.classList.add("is-bad");
  }

  function refreshStatus() {
    const access = window.BRIGHTPATH_AUTH?.getAccess?.() || null;
    currentAccess.textContent = window.BRIGHTPATH_AUTH?.accessLabel?.(access) || "Locked";
  }

  refreshStatus();
  // If JS is running, show a small ready hint (non-intrusive).
  if (!msg.textContent) setMessage("Ready. Enter your code.", "ok");

  logoutBtn.addEventListener("click", () => {
    window.BRIGHTPATH_AUTH?.clearAccess?.();
    refreshStatus();
    setMessage("Logged out. Videos are locked.", "ok");
  });

  // Extra safety: if submit doesn't fire for any reason, force it.
  if (submitBtn instanceof HTMLButtonElement) {
    submitBtn.addEventListener("click", (e) => {
      // If it's already a submit inside the form this is harmless; it just ensures submission.
      if (e.defaultPrevented) return;
      try {
        if (typeof form.requestSubmit === "function") form.requestSubmit();
      } catch {
        // ignore
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("Checking code…", "ok");

    try {
      // quick sanity: if opened via file://, API won't work
      if (!location.protocol.startsWith("http")) {
        setMessage("Please open via http://localhost:3000/login.html (server must be running).", "bad");
        return;
      }

      const res = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input.value }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok) {
        const err = data?.error || "That code is not valid. Please try again.";
        setMessage(err, "bad");
        return;
      }

      window.BRIGHTPATH_AUTH?.setAccess?.({
        grade: data.grade,
        serial: data.serial,
        code: data.code,
        grantedAt: Date.now(),
      });

      refreshStatus();
      setMessage(`Unlocked: Grade ${data.grade}. Redirecting…`, "ok");
      window.location.href = `./videos.html#grade=${data.grade}`;
    } catch (err) {
      setMessage("Cannot reach server. Start it with npm start, then open http://localhost:3000/login.html", "bad");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });
})();

