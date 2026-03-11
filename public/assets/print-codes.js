(() => {
  const status = document.getElementById("printStatus");
  const container = document.getElementById("codesContainer");
  if (!status || !container) return;

  const gen = window.BRIGHTPATH_CODES?.generateCode;
  if (!gen) {
    status.textContent = "Code generator is missing.";
    return;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function buildGrade(grade) {
    const rows = [];
    for (let i = 1; i <= 300; i++) {
      const code = await gen(grade, i);
      rows.push(`<tr><td>${String(i).padStart(3, "0")}</td><td><span class="code">${esc(code)}</span></td></tr>`);
    }
    return `
      <section class="grade-sheet">
        <h2 class="grade-title">Grade ${grade} (300 codes)</h2>
        <table class="codes-table">
          <thead><tr><th>#</th><th>Code</th></tr></thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </section>
    `;
  }

  (async () => {
    status.textContent = "Generating codes… (this may take a few seconds)";
    try {
      const parts = [];
      for (const g of [1, 2, 3]) parts.push(await buildGrade(g));
      container.innerHTML = parts.join("");
      status.textContent = "Done. Use the Print button (or Ctrl+P).";
    } catch {
      status.textContent = "Failed to generate codes. Please refresh.";
    }
  })();
})();

