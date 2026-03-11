(() => {
  const ACCESS_KEY = "brightpath_access_v1";

  function getAccess() {
    try {
      const raw = localStorage.getItem(ACCESS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || ![1, 2, 3].includes(parsed.grade)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function setAccess(access) {
    localStorage.setItem(ACCESS_KEY, JSON.stringify(access));
  }

  function clearAccess() {
    localStorage.removeItem(ACCESS_KEY);
  }

  function accessLabel(access) {
    if (!access) return "Locked";
    return `Grade ${access.grade}`;
  }

  window.BRIGHTPATH_AUTH = {
    getAccess,
    setAccess,
    clearAccess,
    accessLabel,
    ACCESS_KEY,
  };
})();
