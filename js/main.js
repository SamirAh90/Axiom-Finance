// Application logic: Language switcher & Hero phrase animation
(function () {
  const STORAGE_KEY = "axiom-lang";
  let currentLang = "en";
  let phraseIndex = 0;
  let phraseTimer = null;

  function getInitialLanguage() {
    const urlParam = new URLSearchParams(window.location.search).get("lang");
    if (urlParam === "sv" || urlParam === "en") return urlParam;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "sv" || stored === "en") return stored;

    if (navigator.language && navigator.language.toLowerCase().startsWith("sv")) {
      return "sv";
    }
    return "en";
  }

  function getNested(obj, path) {
    return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  function formatKr(num) {
    return Number(num).toLocaleString("sv-SE").replace(/\u00a0/g, " ");
  }

  function updateTimelineLine() {
    const track = document.getElementById("timeline-steps");
    const line = document.getElementById("timeline-line");
    if (!track || !line) return;

    const firstNode = track.querySelector(".timeline-step:first-child .timeline-node");
    const lastNode = track.querySelector(".timeline-step:last-child .timeline-node");
    if (!firstNode || !lastNode) return;

    const parent = line.offsetParent || track;
    const parentRect = parent.getBoundingClientRect();
    const firstRect = firstNode.getBoundingClientRect();
    const lastRect = lastNode.getBoundingClientRect();

    const top = firstRect.top + firstRect.height / 2 - parentRect.top;
    const bottom = lastRect.top + lastRect.height / 2 - parentRect.top;
    const height = Math.max(0, bottom - top);

    line.style.top = top + "px";
    line.style.height = height + "px";
  }

  function updateDOM(lang) {
    const t = window.CONTENT[lang];
    if (!t) return;

    document.documentElement.lang = lang;

    // Update active state of language toggle buttons
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      const btnLang = btn.getAttribute("data-lang");
      if (btnLang === lang) {
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
      }
    });

    // Update simple text elements
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = getNested(t, key);
      if (val !== undefined && typeof val === "string") {
        el.textContent = val;
      }
    });

    // Page-specific updates
    const page = document.body.getAttribute("data-page");

    if (page === "home") {
      document.title = t.home.metaTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", t.home.metaDescription);

      // Hero phrase
      const phraseEl = document.getElementById("hero-phrase");
      if (phraseEl) {
        phraseEl.textContent = t.home.phrases[phraseIndex % t.home.phrases.length];
      }

      // Situation problems
      const problemsContainer = document.getElementById("situation-problems");
      if (problemsContainer) {
        problemsContainer.innerHTML = t.home.problems
          .map(
            (p) => `
          <div>
            <h3 class="problem-title">${p.title}</h3>
            <p class="problem-body">${p.body}</p>
          </div>
        `
          )
          .join("");
      }

      // Pricing cards
      const pricingContainer = document.getElementById("pricing-cards");
      if (pricingContainer) {
        pricingContainer.innerHTML = t.plans
          .map((plan, idx) => {
            const isHighlighted = idx === 1;
            const amount = Number(plan.price.replace(/\D/g, ""));
            return `
            <article class="pricing-card ${isHighlighted ? "highlighted" : ""}" tabindex="0" role="region" aria-label="${plan.name}">
              ${isHighlighted ? '<div class="card-corner-cutout"></div>' : ""}
              <span class="pricing-register">${plan.register}</span>
              <h3 class="pricing-name">${plan.name}</h3>
              <p class="pricing-tagline">${plan.tagline}</p>

              <div class="pricing-amount-box">
                <p class="pricing-amount">
                  ${formatKr(amount)} <span class="pricing-unit">kr</span>
                </p>
                <p class="pricing-note">${plan.priceNote}</p>
              </div>

              <ul class="pricing-includes">
                ${plan.includes
                  .map(
                    (item) => `
                  <li>
                    <span class="check-icon">
                      <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <span>${item}</span>
                  </li>
                `
                  )
                  .join("")}
              </ul>

              ${
                plan.addons.length > 0
                  ? `
                <div class="pricing-addons">
                  <p class="addons-label">${t.pricing.addonsLabel}</p>
                  <ul class="addons-list">
                    ${plan.addons
                      .map(
                        (a) => `
                      <li>
                        <span>${a.label}</span>
                        <span class="addon-price">${a.price}</span>
                      </li>
                    `
                      )
                      .join("")}
                  </ul>
                </div>
              `
                  : ""
              }

              <a href="contact.html" class="pricing-cta-btn ${isHighlighted ? "btn-light" : "btn-primary"}">
                ${t.common.contact}
              </a>
            </article>
          `;
          })
          .join("");

        pricingContainer.querySelectorAll(".pricing-card").forEach((card) => {
          card.addEventListener("click", (e) => {
            if (e.target.closest(".pricing-cta-btn")) return;
            const wasSelected = card.classList.contains("selected");
            pricingContainer.querySelectorAll(".pricing-card").forEach((c) => c.classList.remove("selected"));
            if (!wasSelected) {
              card.classList.add("selected");
            }
          });

          card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (e.target.closest(".pricing-cta-btn")) return;
              e.preventDefault();
              card.click();
            }
          });
        });
      }

      // Stats
      const statsContainer = document.getElementById("trust-stats");
      if (statsContainer) {
        statsContainer.innerHTML = t.home.stats
          .map(
            ([k, v]) => `
          <div>
            <dt class="stat-key">${k}</dt>
            <dd class="stat-val">${v}</dd>
          </div>
        `
          )
          .join("");
      }

      // Timeline
      const timelineContainer = document.getElementById("timeline-steps");
      if (timelineContainer) {
        timelineContainer.innerHTML = t.home.steps
          .map((step, idx) => {
            const isRight = idx % 2 === 1;
            return `
            <li class="timeline-step ${isRight ? "step-right" : "step-left"}">
              <span class="timeline-node"></span>
              <div class="timeline-card-col">
                <div class="timeline-card">
                  <h3 class="timeline-step-title">${step.title}</h3>
                  ${step.body ? `<p class="timeline-step-body">${step.body}</p>` : ""}
                </div>
              </div>
            </li>
          `;
          })
          .join("");

        requestAnimationFrame(updateTimelineLine);
        setTimeout(updateTimelineLine, 50);
      }
    } else if (page === "about") {
      document.title = t.about.metaTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", t.about.metaDescription);

      const paragraphsContainer = document.getElementById("about-paragraphs");
      if (paragraphsContainer) {
        const p1 = t.about.paragraphs.map((p) => `<p>${p}</p>`).join("");
        const tog = t.about.together;
        const pTogether = `<p>${tog.pre}<span class="text-foreground">${tog.axiom}</span>${tog.mid}<span class="text-foreground">${tog.lambda}</span>${tog.post}</p>`;
        paragraphsContainer.innerHTML = p1 + pTogether;
      }

      const valuesContainer = document.getElementById("about-values");
      if (valuesContainer) {
        valuesContainer.innerHTML = t.about.values
          .map(
            ([title, body]) => `
          <div>
            <h2 class="value-title">${title}</h2>
            <p class="value-body">${body}</p>
          </div>
        `
          )
          .join("");
      }
    } else if (page === "contact") {
      document.title = t.contact.metaTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", t.contact.metaDescription);
    } else if (page === "gdpr") {
      document.title = lang === "sv" ? "Integritetspolicy & GDPR — Axiom Finance AB" : "Privacy Policy & GDPR — Axiom Finance AB";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          "content",
          lang === "sv"
            ? "Integritetspolicy och behandling av personuppgifter hos Axiom Finance AB i enlighet med dataskyddsförordningen (GDPR)."
            : "Privacy policy and processing of personal data at Axiom Finance AB in accordance with the GDPR."
        );
      }
    }
  }

  function setLanguage(lang) {
    currentLang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
    updateDOM(lang);
  }

  function startHeroPhraseAnimation() {
    const phraseEl = document.getElementById("hero-phrase");
    if (!phraseEl) return;

    if (phraseTimer) clearInterval(phraseTimer);

    phraseTimer = setInterval(() => {
      phraseEl.style.opacity = "0";
      setTimeout(() => {
        const phrases = window.CONTENT[currentLang].home.phrases;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        phraseEl.textContent = phrases[phraseIndex];
        phraseEl.style.opacity = "1";
      }, 500);
    }, 3400);
  }

  document.addEventListener("DOMContentLoaded", () => {
    currentLang = getInitialLanguage();

    // Attach click listeners to language toggle buttons
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        if (lang) setLanguage(lang);
      });
    });

    updateDOM(currentLang);
    startHeroPhraseAnimation();

    window.addEventListener("resize", updateTimelineLine);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateTimelineLine);
    }
  });
})();
