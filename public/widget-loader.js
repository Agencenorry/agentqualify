/**
 * AgentQualify — Overlay de qualification (vanilla JS, zéro dépendance)
 * Usage : <script src="https://votre-domaine/widget-loader.js" data-client-id="UUID"></script>
 * Concept : overlay central, une question à la fois, comme un entretien humain.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var clientId =
    (script && script.getAttribute("data-client-id")) ||
    (window.AgentQualifyConfig && window.AgentQualifyConfig.clientId);
  if (!clientId) return;

  var baseUrl =
    (script && script.src)
      ? script.src.replace(/\/widget-loader\.js.*$/, "")
      : (window.AgentQualifyConfig && window.AgentQualifyConfig.baseUrl) || "";

  var STORAGE_KEY_CLOSED = "aq_closed_" + clientId;
  var STORAGE_KEY_OPENED = "aq_opened_" + clientId;
  var conversationId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "x" + Math.random().toString(36).slice(2) + Date.now().toString(36);

  var config = { agentName: "Alex", greeting: "", widgetColor: "#1a1917", ctaText: "Réserver une démo", ctaUrl: "" };
  var messages = [];
  var isQualified = false;
  var userClosed = false;
  var stepCount = 0;

  function getClosed() {
    try {
      return sessionStorage.getItem(STORAGE_KEY_CLOSED) === "1";
    } catch (e) {
      return false;
    }
  }
  function setClosed() {
    try {
      sessionStorage.setItem(STORAGE_KEY_CLOSED, "1");
    } catch (e) {}
  }
  function getOpened() {
    try {
      return sessionStorage.getItem(STORAGE_KEY_OPENED) === "1";
    } catch (e) {
      return false;
    }
  }
  function setOpened() {
    try {
      sessionStorage.setItem(STORAGE_KEY_OPENED, "1");
    } catch (e) {}
  }

  // ——— Styles (préfixe aq-)
  var css =
    ".aq-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:999998;opacity:0;visibility:hidden;transition:opacity .3s ease, visibility .3s ease;}" +
    ".aq-backdrop.aq-visible{opacity:1;visibility:visible;}" +
    ".aq-card{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);max-width:560px;width:90vw;background:#fff;border-radius:20px;padding:48px;box-shadow:0 32px 80px rgba(0,0,0,.18);z-index:999999;font-family:system-ui,-apple-system,sans-serif;}" +
    ".aq-progress-wrap{height:3px;background:#f0f0f0;border-radius:4px;overflow:hidden;margin-bottom:20px;}" +
    ".aq-progress-fill{height:100%;background:#111;width:0%;transition:width .4s ease;}" +
    ".aq-close-btn{position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:50%;background:#f5f5f5;border:none;cursor:pointer;color:#999;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;transition:background .2s;}" +
    ".aq-close-btn:hover{background:#eee;color:#111;}" +
    ".aq-content{position:relative;min-height:120px;}" +
    ".aq-previous{font-size:.82rem;color:#999;margin-bottom:24px;line-height:1.4;}" +
    ".aq-question{font-size:1.5rem;font-weight:600;color:#111;line-height:1.4;margin-bottom:24px;}" +
    ".aq-thinking{font-size:.9rem;color:#999;margin-bottom:24px;}" +
    ".aq-thinking-dots{display:inline-flex;gap:4px;}.aq-thinking-dots span{width:6px;height:6px;border-radius:50%;background:#999;animation:aq-bounce 1.4s ease-in-out infinite both;}" +
    ".aq-thinking-dots span:nth-child(2){animation-delay:.2s;}.aq-thinking-dots span:nth-child(3){animation-delay:.4s;}" +
    "@keyframes aq-bounce{0%,80%,100%{transform:scale(0);}40%{transform:scale(1);}}" +
    ".aq-input{width:100%;font-size:1rem;border:1.5px solid #e5e5e5;border-radius:10px;padding:14px 18px;outline:none;font-family:inherit;box-sizing:border-box;}" +
    ".aq-input:focus{border-color:#111;}" +
    ".aq-send{width:100%;margin-top:12px;padding:14px;border-radius:10px;background:#111;color:#fff;border:none;font-size:.9rem;font-weight:500;cursor:pointer;font-family:inherit;transition:background .2s;}" +
    ".aq-send:hover{background:#333;}.aq-send:disabled{opacity:.6;cursor:not-allowed;}" +
    ".aq-quick-wrap{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}" +
    ".aq-quick{display:inline-flex;align-items:center;padding:8px 16px;font-size:.82rem;border:1.5px solid #e5e5e5;border-radius:8px;background:#fff;cursor:pointer;font-family:inherit;transition:border-color .2s, background .2s;}" +
    ".aq-quick:hover{border-color:#111;background:#f9f9f9;}" +
    ".aq-quick.aq-selected{background:#111;color:#fff;border-color:#111;}" +
    ".aq-qualified-view{text-align:center;}" +
    ".aq-qualified-view .aq-question{margin-bottom:16px;}" +
    ".aq-cta{display:inline-block;margin-top:16px;padding:14px 24px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-size:.9rem;font-weight:500;transition:background .2s;}" +
    ".aq-cta:hover{background:#333;color:#fff;}" +
    ".aq-mini-btn{position:fixed;bottom:20px;right:24px;font-size:.75rem;color:#666;background:#fff;border:1px solid #e5e5e5;border-radius:20px;padding:7px 14px;cursor:pointer;font-family:system-ui,-apple-system,sans-serif;z-index:999997;transition:color .2s,border-color .2s;}" +
    ".aq-mini-btn:hover{color:#111;border-color:#111;}" +
    ".aq-slide-enter{opacity:0;transform:translateY(8px);}" +
    ".aq-slide-enter.aq-active{opacity:1;transform:translateY(0);transition:opacity .25s ease, transform .25s ease;}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ——— DOM
  var backdrop = document.createElement("div");
  backdrop.className = "aq-backdrop";

  var card = document.createElement("div");
  card.className = "aq-card";
  card.innerHTML =
    '<button type="button" class="aq-close-btn" aria-label="Fermer">×</button>' +
    '<div class="aq-content">' +
    '<div class="aq-progress-wrap"><div class="aq-progress-fill"></div></div>' +
    '<div class="aq-previous" style="display:none;"></div>' +
    '<div class="aq-question"></div>' +
    '<div class="aq-thinking" style="display:none;"><span class="aq-thinking-dots"><span></span><span></span><span></span></span></div>' +
    '<input type="text" class="aq-input" placeholder="Votre réponse..." autocomplete="off" style="display:none;">' +
    '<div class="aq-quick-wrap" style="display:none;"></div>' +
    '<button type="button" class="aq-send" style="display:none;">Envoyer</button>' +
    "</div>" +
    '<div class="aq-qualified-view" style="display:none;">' +
    '<div class="aq-question"></div>' +
    '<a href="#" class="aq-cta" target="_blank" rel="noopener"></a>' +
    "</div>";

  var progressFill = card.querySelector(".aq-progress-fill");
  var closeBtn = card.querySelector(".aq-close-btn");
  var contentBlock = card.querySelector(".aq-content");
  var qualifiedBlock = card.querySelector(".aq-qualified-view");
  var prevEl = card.querySelector(".aq-previous");
  var questionEl = contentBlock.querySelector(".aq-question");
  var thinkingEl = contentBlock.querySelector(".aq-thinking");
  var inputEl = contentBlock.querySelector(".aq-input");
  var quickWrap = contentBlock.querySelector(".aq-quick-wrap");
  var sendBtn = contentBlock.querySelector(".aq-send");
  var qualifiedQuestion = qualifiedBlock.querySelector(".aq-question");
  var ctaEl = qualifiedBlock.querySelector(".aq-cta");

  backdrop.appendChild(card);

  var miniBtn = document.createElement("button");
  miniBtn.type = "button";
  miniBtn.className = "aq-mini-btn";
  miniBtn.style.display = "none";

  var cleanupTriggers = [];

  function openOverlay() {
    if (getClosed()) return;
    backdrop.classList.add("aq-visible");
    userClosed = false;
    setOpened();
    cleanupTriggers.forEach(function (fn) {
      try {
        fn();
      } catch (e) {}
    });
    cleanupTriggers = [];
  }

  function closeOverlay() {
    backdrop.classList.remove("aq-visible");
    userClosed = true;
    setClosed();
    if (!isQualified) {
      miniBtn.textContent = "Parler à " + config.agentName + " →";
      miniBtn.style.display = "block";
    }
  }

  function updateProgress() {
    var pct = stepCount <= 5 ? stepCount * 20 : 100;
    progressFill.style.width = pct + "%";
  }

  function showQuestion(text, quickReplies) {
    contentBlock.style.display = "block";
    qualifiedBlock.style.display = "none";
    questionEl.textContent = text;
    questionEl.classList.add("aq-slide-enter");
    requestAnimationFrame(function () {
      questionEl.classList.add("aq-active");
    });
    thinkingEl.style.display = "none";
    inputEl.style.display = "block";
    inputEl.value = "";
    inputEl.placeholder = "Votre réponse...";
    sendBtn.style.display = "block";
    quickWrap.style.display = "none";
    quickWrap.innerHTML = "";
    if (quickReplies && quickReplies.length) {
      quickWrap.style.display = "flex";
      quickReplies.forEach(function (label) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "aq-quick";
        b.textContent = label;
        b.addEventListener("click", function () {
          quickWrap.querySelectorAll(".aq-quick").forEach(function (q) {
            q.classList.remove("aq-selected");
          });
          b.classList.add("aq-selected");
          inputEl.value = label;
        });
        quickWrap.appendChild(b);
      });
    }
  }

  function showPreviousAnswer(text) {
    prevEl.style.display = "block";
    prevEl.textContent = text;
  }

  function showThinking() {
    thinkingEl.style.display = "block";
    inputEl.style.display = "none";
    quickWrap.style.display = "none";
    sendBtn.style.display = "none";
  }

  function hideThinking() {
    thinkingEl.style.display = "none";
  }

  function showQualified(ctaText, ctaUrl) {
    isQualified = true;
    contentBlock.style.display = "none";
    qualifiedBlock.style.display = "block";
    qualifiedQuestion.textContent = "Merci ! Nous avons bien enregistré vos réponses. À très bientôt.";
    ctaEl.textContent = ctaText;
    ctaEl.href = ctaUrl || "#";
    if (!ctaUrl) ctaEl.style.display = "none";
  }

  function sendAnswer(text) {
    text = (text || "").trim();
    if (!text) return;
    messages.push({ role: "user", content: text });
    showPreviousAnswer(text);
    stepCount++;
    updateProgress();
    showThinking();

    var payload = { clientId: clientId, messages: messages, conversationId: conversationId };
    fetch(baseUrl + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(function (data) {
        hideThinking();
        messages.push({ role: "assistant", content: data.content });
        if (data.qualified) {
          showQualified(config.ctaText, config.ctaUrl);
        } else {
          showQuestion(data.content);
        }
      })
      .catch(function () {
        hideThinking();
        closeOverlay();
      });
  }

  closeBtn.addEventListener("click", function () {
    if (!isQualified) {
      prevEl.style.display = "none";
      questionEl.textContent = "On se retrouve quand vous voulez —";
      contentBlock.style.display = "block";
      qualifiedBlock.style.display = "none";
      inputEl.style.display = "none";
      sendBtn.style.display = "none";
      quickWrap.style.display = "none";
      setTimeout(closeOverlay, 800);
    } else {
      closeOverlay();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && backdrop.classList.contains("aq-visible")) {
      closeBtn.click();
    }
  });

  sendBtn.addEventListener("click", function () {
    sendAnswer(inputEl.value);
  });
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendAnswer(inputEl.value);
    }
  });

  miniBtn.addEventListener("click", function () {
    try {
      sessionStorage.removeItem(STORAGE_KEY_CLOSED);
    } catch (e) {}
    miniBtn.style.display = "none";
    openOverlay();
    showQuestion(config.greeting || "Bonjour, comment puis-je vous aider ?");
  });

  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeBtn.click();
  });

  function installTrigger(trigger) {
    if (!trigger || !trigger.active) return;
    var cfg = trigger.config || {};
    switch (trigger.type) {
      case "click": {
        var selector = cfg.selector;
        if (!selector) return;
        function bindClick(el) {
          if (el._aqBound) return;
          el._aqBound = true;
          el.addEventListener("click", function (e) {
            if (getOpened()) return;
            e.preventDefault();
            openOverlay();
            showQuestion(config.greeting || "Bonjour, comment puis-je vous aider ?");
          });
        }
        function run() {
          try {
            var el = document.querySelector(selector);
            if (el) bindClick(el);
          } catch (e) {}
        }
        run();
        var observer = new MutationObserver(run);
        observer.observe(document.body, { childList: true, subtree: true });
        cleanupTriggers.push(function () {
          observer.disconnect();
        });
        break;
      }
      case "page": {
        var path = cfg.path;
        if (path == null || path === "") return;
        var pathname = window.location.pathname || "";
        var href = window.location.href || "";
        var pathMatch = pathname.indexOf(path) !== -1 || href.indexOf(path) !== -1;
        if (!pathMatch) return;
        var delay = ((cfg.delaySeconds != null ? cfg.delaySeconds : 2) * 1000);
        var t = setTimeout(function () {
          if (getOpened() || getClosed()) return;
          openOverlay();
          showQuestion(config.greeting || "Bonjour, comment puis-je vous aider ?");
        }, delay);
        cleanupTriggers.push(function () {
          clearTimeout(t);
        });
        break;
      }
      case "timer": {
        var path = cfg.path;
        var pathname = window.location.pathname || "";
        var href = window.location.href || "";
        var pathMatch = !path || path === "" || pathname.indexOf(path) !== -1 || href.indexOf(path) !== -1;
        if (!pathMatch) return;
        var seconds = (cfg.seconds != null ? cfg.seconds : 30) * 1000;
        var t = setTimeout(function () {
          if (getOpened() || getClosed()) return;
          openOverlay();
          showQuestion(config.greeting || "Bonjour, comment puis-je vous aider ?");
        }, seconds);
        cleanupTriggers.push(function () {
          clearTimeout(t);
        });
        break;
      }
      case "scroll": {
        if (cfg.selector) {
          var target = null;
          var scrollObserver = new IntersectionObserver(
            function (entries) {
              if (entries[0].isIntersecting) {
                if (getOpened() || getClosed()) return;
                openOverlay();
                showQuestion(config.greeting || "Bonjour, comment puis-je vous aider ?");
                scrollObserver.disconnect();
              }
            },
            { threshold: 0.3 }
          );
          function observe() {
            try {
              var el = document.querySelector(cfg.selector);
              if (el && el !== target) {
                target = el;
                scrollObserver.observe(el);
              }
            } catch (e) {}
          }
          observe();
          var mo = new MutationObserver(observe);
          mo.observe(document.body, { childList: true, subtree: true });
          cleanupTriggers.push(function () {
            scrollObserver.disconnect();
            mo.disconnect();
          });
        } else {
          var threshold = (cfg.threshold != null ? cfg.threshold : 80) / 100;
          function onScroll() {
            if (getOpened() || getClosed()) return;
            var max = document.documentElement.scrollHeight - window.innerHeight;
            if (max <= 0) return;
            var scrolled = window.scrollY / max;
            if (scrolled >= threshold) {
              openOverlay();
              showQuestion(config.greeting || "Bonjour, comment puis-je vous aider ?");
              window.removeEventListener("scroll", onScroll);
            }
          }
          window.addEventListener("scroll", onScroll);
          onScroll();
          cleanupTriggers.push(function () {
            window.removeEventListener("scroll", onScroll);
          });
        }
        break;
      }
    }
  }

  function bindDataAqTrigger() {
    function bind(el) {
      if (el._aqBound) return;
      el._aqBound = true;
      el.addEventListener("click", function (e) {
        if (getOpened()) return;
        e.preventDefault();
        openOverlay();
        showQuestion(config.greeting || "Bonjour, comment puis-je vous aider ?");
      });
    }
    function run() {
      try {
        var nodes = document.querySelectorAll("[data-aq-trigger]");
        nodes.forEach(bind);
      } catch (e) {}
    }
    run();
    var observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });
    cleanupTriggers.push(function () {
      observer.disconnect();
    });
  }

  // ——— Init : fetch config puis attacher au DOM et installer les déclencheurs
  fetch(baseUrl + "/api/chat/init?clientId=" + encodeURIComponent(clientId))
    .then(function (res) {
      if (!res.ok) throw new Error("init failed");
      return res.json();
    })
    .then(function (data) {
      config.agentName = data.agentName || "Alex";
      config.greeting = data.greeting || "Bonjour, comment puis-je vous aider ?";
      config.widgetColor = data.widgetColor || "#1a1917";
      config.ctaText = data.ctaText || "Réserver une démo";
      config.ctaUrl = data.ctaUrl || "";
      var triggers = Array.isArray(data.triggers) ? data.triggers : [];
      if (!getOpened()) {
        triggers.forEach(installTrigger);
        bindDataAqTrigger();
      }
    })
    .catch(function () {})
    .then(function () {
      document.body.appendChild(backdrop);
      document.body.appendChild(miniBtn);
      // Mode debug : ?aq_debug=1 ou &aq_debug=1 → ouvre l'overlay immédiatement
      var search = window.location.search || "";
      if (search.indexOf("aq_debug=1") !== -1) {
        openOverlay();
        showQuestion(config.greeting || "Bonjour, comment puis-je vous aider ?");
      }
    });
})();
