declare const marked: { parse: (md: string) => string };

export function initDocs(): void {
  const navBtns = document.querySelectorAll<HTMLButtonElement>(".docs-nav-btn");
  const markdownBody = document.getElementById("docsMarkdownBody");

  if (navBtns.length === 0 || !markdownBody) return;

  async function loadDoc(filename: string): Promise<void> {
    // DELETE THIS LINE: markdownBody!.innerHTML = `<p class="text-muted">Loading...</p>`;

    try {
      const res = await fetch("/docs/" + filename);
      if (!res.ok) {
        markdownBody!.innerHTML = `<p class="text-danger">Could not load documentation file: ${filename}</p>`;
        return;
      }
      const md = await res.text();

      // Only update the HTML once the content is actually fetched
      markdownBody!.innerHTML = marked.parse(md);
    } catch (err) {
      markdownBody!.innerHTML = `<p class="text-danger">Error loading documentation.</p>`;
      console.error("Docs load error:", err);
    }

    const docsContent = document.getElementById("docsContent");
    if (docsContent) {
      // Keep the smooth scroll so the user knows the content changed
      docsContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // async function loadDoc(filename: string): Promise<void> {
  //   markdownBody!.innerHTML = `<p class="text-muted">Loading...</p>`;

  //   try {
  //     const res = await fetch("/docs/" + filename);
  //     if (!res.ok) {
  //       markdownBody!.innerHTML = `<p class="text-danger">Could not load documentation file: ${filename}</p>`;
  //       return;
  //     }
  //     const md = await res.text();
  //     markdownBody!.innerHTML = marked.parse(md);
  //   } catch (err) {
  //     markdownBody!.innerHTML = `<p class="text-danger">Error loading documentation.</p>`;
  //     console.error("Docs load error:", err);
  //   }

  //   const docsContent = document.getElementById("docsContent");
  //   if (docsContent) {
  //     docsContent.scrollIntoView({ behavior: "smooth", block: "start" });
  //   }
  // }

  function setActiveBtn(activeBtn: HTMLButtonElement): void {
    navBtns.forEach((btn) => {
      btn.classList.remove("active");

      btn.style.color = ""; // Clear inline color
      btn.style.background = ""; // Clear inline background
      btn.style.fontWeight = ""; // Clear inline weight
    });

    activeBtn.classList.add("active");
  }

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const file = btn.getAttribute("data-file");
      if (!file) return;
      setActiveBtn(btn);
      localStorage.setItem("activeDocSection", file);
      loadDoc(file);
    });
  });
  const savedDoc =
    localStorage.getItem("activeDocSection") || "01-getting-started.md";
  const savedBtn = Array.from(navBtns).find(
    (b) => b.getAttribute("data-file") === savedDoc,
  ) as HTMLButtonElement;
  if (savedBtn) {
    setActiveBtn(savedBtn);
    loadDoc(savedDoc);
  } else {
    const firstBtn = navBtns[0] as HTMLButtonElement;
    setActiveBtn(firstBtn);
    loadDoc(firstBtn.getAttribute("data-file") || "01-getting-started.md");
  }
}
