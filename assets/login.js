(() => {
  const form = document.getElementById("loginForm");
  const input = document.getElementById("codeInput");
  const msg = document.getElementById("message");
  const currentAccess = document.getElementById("currentAccess");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!form || !(input instanceof HTMLInputElement) || !msg || !currentAccess || !logoutBtn) return;

  const REDEEMED_KEY = "brightpath_redeemed_codes_v1";

  function getRedeemedSet() {
    try {
      const raw = localStorage.getItem(REDEEMED_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.map((x) => String(x)));
    } catch {
      return new Set();
    }
  }

  function saveRedeemedSet(set) {
    localStorage.setItem(REDEEMED_KEY, JSON.stringify(Array.from(set)));
  }

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

  logoutBtn.addEventListener("click", () => {
    window.BRIGHTPATH_AUTH?.clearAccess?.();
    refreshStatus();
    setMessage("Logged out. Videos are locked.", "ok");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("Checking code…", "ok");

    try {
      const validator = window.BRIGHTPATH_CODES?.validateCode;
      if (!validator) throw new Error("Validator missing");

      const result = await validator(input.value);
      if (!result.ok) {
        setMessage("That code is not valid. Please try again.", "bad");
        return;
      }

      // Static limitation: enforce one-time use per browser/device (localStorage).
      const redeemed = getRedeemedSet();
      if (redeemed.has(result.code)) {
        setMessage("This code was already used on this device. Please use a new code.", "bad");
        return;
      }

      redeemed.add(result.code);
      saveRedeemedSet(redeemed);

      window.BRIGHTPATH_AUTH?.setAccess?.({
        grade: result.grade,
        serial: result.serial,
        code: result.code,
        grantedAt: Date.now(),
      });

      refreshStatus();
      setMessage(`Unlocked: Grade ${result.grade}. Redirecting…`, "ok");
      window.location.href = `./videos.html#grade=${result.grade}`;
    } catch {
      setMessage("Something went wrong. Please refresh and try again.", "bad");
    }
  });
})();

