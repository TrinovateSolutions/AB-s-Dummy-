/* AB'S Dental & Aesthetics — site script (loaded with `defer` on every page).
   Every block checks that its elements exist, so one script is safe on all pages. */
(function () {
  "use strict";

  var doc = document;
  var $ = function (sel, root) { return (root || doc).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };

  /* ---------- Sticky header shadow ---------- */
  var navbar = $(".navbar");
  if (navbar) {
    var onScroll = function () { navbar.classList.toggle("scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var nav = $("#primary-nav");
  var navToggle = $(".nav-toggle");
  var navClose = $(".nav-close");

  function setMenu(open) {
    if (!nav) return;
    nav.classList.toggle("open", open);
    doc.body.classList.toggle("menu-open", open);
    if (navToggle) navToggle.setAttribute("aria-expanded", String(open));
    if (open && navClose) navClose.focus();
    if (!open && navToggle && doc.activeElement && nav.contains(doc.activeElement)) navToggle.focus();
  }
  if (navToggle) navToggle.addEventListener("click", function () { setMenu(true); });
  if (navClose) navClose.addEventListener("click", function () { setMenu(false); });
  if (nav) {
    $$("a", nav).forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ---------- Treatments dropdown (touch + keyboard) ---------- */
  $$(".has-dd").forEach(function (dd) {
    var btn = $(".dd-toggle", dd);
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !dd.classList.contains("open");
      dd.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    doc.addEventListener("click", function (e) {
      if (!dd.contains(e.target)) {
        dd.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  });

  /* ---------- Highlight current page in the nav ---------- */
  var here = decodeURIComponent(location.pathname).replace(/\/index\.html$/, "/");
  $$(".nav a[href]").forEach(function (a) {
    var href = a.getAttribute("href").replace(/\/index\.html$/, "/");
    if (href !== "#" && href === here) a.setAttribute("aria-current", "page");
  });

  /* ---------- Appointment modal ---------- */
  var modal = $("#appointment-modal");
  var form = $("#appointmentForm");
  var note = $(".form-note", modal || doc);
  var lastFocus = null;

  function openPopup(service) {
    if (!modal) return;
    lastFocus = doc.activeElement;
    modal.classList.add("open");
    doc.body.classList.add("modal-open");
    var svc = $("#svc", modal);
    var cat = $("#category", modal);
    if (svc) svc.value = service || "";
    if (service && cat && !cat.value) cat.value = "Dental";
    if (note) { note.textContent = ""; note.className = "form-note"; }
    var first = $("input[name='name']", modal);
    if (first) setTimeout(function () { first.focus(); }, 30);
  }
  function closePopup() {
    if (!modal) return;
    modal.classList.remove("open");
    doc.body.classList.remove("modal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  // Kept as globals so any old inline onclick="openPopup()" still works.
  window.openPopup = openPopup;
  window.closePopup = closePopup;

  doc.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-open-popup]");
    if (trigger) {
      e.preventDefault();
      setMenu(false);
      openPopup(trigger.getAttribute("data-service") || "");
      return;
    }
    if (e.target.closest("[data-close-popup]") || e.target === modal) closePopup();
  });

  doc.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (modal && modal.classList.contains("open")) closePopup();
    else if (nav && nav.classList.contains("open")) setMenu(false);
  });

  // Keep keyboard focus inside the open modal
  if (modal) {
    modal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = $$("button, input, select, a[href]", modal).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!f.length) return;
      var firstEl = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && doc.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    });
  }

  if (form) {
    var dateInput = $("#appt-date", form);
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = $("button[type='submit']", form);
      var original = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";
      note.className = "form-note";
      note.textContent = "";

      fetch(form.getAttribute("action"), {
        method: "POST",
        body: new FormData(form),
        headers: { "X-Requested-With": "XMLHttpRequest" }
      })
        .then(function (res) { return res.text(); })
        .then(function (text) {
          if (text.trim() === "success") {
            form.reset();
            note.className = "form-note ok";
            note.textContent = "Thank you! We have received your request and will call you shortly.";
            setTimeout(closePopup, 2600);
          } else {
            throw new Error("send failed");
          }
        })
        .catch(function () {
          note.className = "form-note err";
          note.textContent = "Sorry, we could not send that. Please call +91 93470 62933.";
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = original;
        });
    });
  }

  /* ---------- Testimonial slider (scroll-snap + arrows) ---------- */
  var track = $(".t-track");
  if (track) {
    var step = function () {
      var card = $(".t-card", track);
      return card ? card.getBoundingClientRect().width + 20 : 340;
    };
    var prev = $(".slider-ctrl .prev");
    var next = $(".slider-ctrl .next");
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () {
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step(), behavior: "smooth" });
    });
  }
  /* ---------- Scroll reveal: animate in when a section arrives, reset when it leaves ---------- */
  var root = doc.documentElement;
  var revealEls = $$("[data-reveal]");
  if (revealEls.length) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduce) {
      revealEls.forEach(function (el) { el.classList.add("in", "done"); });
    } else {
      var seen = new Map(); // stagger siblings that share a parent
      revealEls.forEach(function (el) {
        var n = seen.get(el.parentElement) || 0;
        seen.set(el.parentElement, n + 1);
        el.style.setProperty("--d", Math.min(n, 5) * 90 + "ms");
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var el = en.target;
          var big = en.intersectionRect.height >= window.innerHeight * 0.35; // very tall blocks
          if (en.isIntersecting && (en.intersectionRatio >= 0.12 || big)) {
            if (!el.classList.contains("in")) {
              el.classList.add("in");
              clearTimeout(el._t);
              el._t = setTimeout(function () { el.classList.add("done"); }, 1100 + (parseInt(el.style.getPropertyValue("--d"), 10) || 0));
            }
          } else if (!en.isIntersecting) {          // fully out of view -> back to start state
            clearTimeout(el._t);
            el.classList.remove("in", "done");
          }
        });
      }, { threshold: [0, 0.12, 0.35], rootMargin: "0px 0px -6% 0px" });
      revealEls.forEach(function (el) { io.observe(el); });
    }
    root.classList.add("reveal-ready");
  }
})();
