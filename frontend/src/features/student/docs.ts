declare const marked: { parse: (md: string) => string };

export function initDocs(): void {
  const navBtns = document.querySelectorAll<HTMLButtonElement>(".docs-nav-btn");
  const markdownBody = document.getElementById("docsMarkdownBody");

  if (navBtns.length === 0 || !markdownBody) return;

  async function loadDoc(filename: string): Promise<void> {
    markdownBody!.innerHTML = `<p class="text-muted">Loading...</p>`;

    try {
      const res = await fetch("/docs/" + filename);
      if (!res.ok) {
        markdownBody!.innerHTML = `<p class="text-danger">Could not load documentation file: ${filename}</p>`;
        return;
      }
      const md = await res.text();
      markdownBody!.innerHTML = marked.parse(md);
    } catch (err) {
      markdownBody!.innerHTML = `<p class="text-danger">Error loading documentation.</p>`;
      console.error("Docs load error:", err);
    }


    const docsContent = document.getElementById("docsContent");
    if (docsContent) {
      docsContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setActiveBtn(activeBtn: HTMLButtonElement): void {
    navBtns.forEach((btn) => {
      btn.style.color = "#555";
      btn.style.fontWeight = "normal";
      btn.style.background = "none";
    });
    activeBtn.style.color = "#0399b0";
    activeBtn.style.fontWeight = "600";
    activeBtn.style.background = "#e8f7fa";
  }

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const file = btn.getAttribute("data-file");
      if (!file) return;
      setActiveBtn(btn);
      loadDoc(file);
    });
  });

  const firstBtn = navBtns[0] as HTMLButtonElement;
  setActiveBtn(firstBtn);
  loadDoc(firstBtn.getAttribute("data-file") || "01-getting-started.md");
}