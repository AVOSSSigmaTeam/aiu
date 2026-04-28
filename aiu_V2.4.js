// OSMO PAGE TRANSITION BOILERPLATE

import { restartWebflow } from 'https://cdn.jsdelivr.net/npm/@finsweet/ts-utils/+esm';

gsap.registerPlugin(CustomEase, SplitText, ScrollTrigger, SplitText);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("default", "0.625, 0.05, 0, 1");
CustomEase.create("loader", "0.65, 0.01, 0.05, 0.99");
gsap.defaults({ ease: "default", duration: durationDefault });

const DEBUG = true; // Set to 'false' in production


// FUNCTION REGISTRY

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  initLogoRevealLoader();


  initfaviconAlert();

  // Runs once on first load
  // if (has('[data-something]')) initSomething();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Runs before the enter animation
  // if (has('[data-something]')) initSomething();
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // Runs after enter animation completes
  // if (has('[data-something]')) initSomething();


  if (hasLenis) {
    lenis.resize();
  }

  initCopyrightYear();

  const pageName = nextPage.getAttribute("data-page-name") || '';
  switch (pageName) {
    case "home":
      initHomeHeroSectionAnimation(nextPage);
      // initMarqueeScrollDirection(nextPage);
      initLogoMarquee();
      initFaqItemAnimation(nextPage);
      break;
    case "blog":
      formatDates();
      initBlogItemHoverAnimation(nextPage);
      break;
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}



// PAGE TRANSITIONS

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  return tl;
}

function runPageLeaveAnimation(current, next) {

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    }
  })

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.to(current, {
    autoAlpha: 0,
    ease: "power1.in",
    duration: 0.5,
  }, 0);

  return tl;
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline();

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady")
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 0);

  tl.fromTo(next, {
    autoAlpha: 0,
  }, {
    autoAlpha: 1,
    ease: "power1.inOut",
    duration: 0.75,
  }, "startEnter");

  //   tl.fromTo(next.querySelector('h1'), {
  //     yPercent: 25,
  //     autoAlpha: 0,
  //   }, {
  //     yPercent: 0,
  //     autoAlpha: 1,
  //     ease: "expo.out",
  //     duration: 1,
  //   }, "< 0.3");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}


// BARBA HOOKS + INIT

barba.hooks.beforeEnter(data => {
  // Position new container on top
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
})

barba.hooks.afterEnter(async data => {
  // Run page functions
  initAfterEnterFunctions(data.next.container);

  //Restart Finsweet
  if (window.FinsweetAttributes) {
    try {
      await window.FinsweetAttributes.modules.list.restart();
      await window.FinsweetAttributes.modules.copyclip.restart();
      //   await window.FinsweetAttributes.modules.socialshare.restart();
    }
    catch (e) {
      if (DEBUG) console.warn('Finsweet restart error:', e);
    }
  }
  if (DEBUG) console.log(window.FinsweetAttributes);

  // Settle
  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: true, // Set to 'false' in production
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      // First load
      async once(data) {
        initOnceFunctions();

        return runPageOnceAnimation(data.next.container);
      },

      // Current page leaves
      async leave(data) {

        // Restart Webflow IX2 interactions
        await restartWebflow();

        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      // New page enters
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }
  ],
});



// GENERIC + HELPERS

const themeConfig = {
  light: {
    nav: "dark",
    transition: "light"
  },
  dark: {
    nav: "light",
    transition: "dark"
  }
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector('[data-theme-nav]');
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return; // already created
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth,
    timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement('template');
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  var currentNodes = document.querySelectorAll('nav [data-barba-update]');

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    // Aria-current sync
    var newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) {
      curr.setAttribute('aria-current', newStatus);
    } else {
      curr.removeAttribute('aria-current');
    }

    // Class list sync
    var newClassList = next.getAttribute('class') || '';
    curr.setAttribute('class', newClassList);
  });
}



// YOUR FUNCTIONS GO BELOW HERE

function initLogoRevealLoader() {

  const wrap = document.querySelector("[data-load-wrap]");
  if (!wrap) return;

  const container = wrap.querySelector("[data-load-container]");
  const bg = wrap.querySelector("[data-load-bg]");
  const progressBar = wrap.querySelector("[data-load-progress]");
  const logo = wrap.querySelector("[data-load-logo]");

  // Reset targets that are * not * split text targets
  const resetTargets = Array.from(
    wrap.querySelectorAll('[data-load-reset]:not([data-load-text])')
  );

  // Main loader timeline
  const loadTimeline = gsap.timeline({
    defaults: {
      ease: "loader",
      duration: 3
    }
  })
    .set(wrap, { display: "block" })
    .to(progressBar, { scaleX: 1 })
    .to(logo, { clipPath: "inset(0% 0% 0% 0%)" }, "<")
    .to(container, { autoAlpha: 0, duration: 0.5 })
    .add("hideContent", "<")
    // .to(bg, { yPercent: -101, duration: 1 }, "hideContent")
    .to(bg, { autoAlpha: 0, duration: 1 }, "hideContent")
    .set(wrap, { display: "none" });


  // If there are items to hide FOUC for, reset them at the start
  if (resetTargets.length) {
    loadTimeline.set(resetTargets, { autoAlpha: 1 }, 0);
  }
}


function initfaviconAlert() {
  const faviconLinks = {
    lightMode: "https://cdn.prod.website-files.com/69a01797c8c6ee71b29e70fa/69c7c629a16bf8eef65ac7e4_favicon_dark.png",
    lightModeAlert: "https://cdn.prod.website-files.com/69a01797c8c6ee71b29e70fa/69c7c65f9a45cdc736c0b6e9_favicon_dark-alert.png",
    darkMode: "https://cdn.prod.website-files.com/69a01797c8c6ee71b29e70fa/69c7c4e05419883cf7438127_favicon_light.png",
    darkModeAlert: "https://cdn.prod.website-files.com/69a01797c8c6ee71b29e70fa/69c7c65f02a297474b5480f1_favicon_light-alert.png",
  };

  const lightFavicon = document.querySelector(
    'link[rel*="icon"][media="(prefers-color-scheme: light)"]'
  );

  const darkFavicon = document.querySelector(
    'link[rel*="icon"][media="(prefers-color-scheme: dark)"]'
  );

  if (!lightFavicon || !darkFavicon) {
    if (DEBUG) { console.warn("Missing light/dark favicons"); }
    return;
  }

  function setIdleState() {
    lightFavicon.href = faviconLinks.lightModeAlert;
    darkFavicon.href = faviconLinks.darkModeAlert;
  }

  function setActiveState() {
    lightFavicon.href = faviconLinks.lightMode;
    darkFavicon.href = faviconLinks.darkMode;
  }

  // ---- Idle detection (your logic cleaned up) ----
  let timeout;

  function startTimer() {
    timeout = setTimeout(goIdle, 10000);
    document.addEventListener("mousemove", resetTimer);
    document.addEventListener("keypress", resetTimer);
  }

  function goIdle() {
    timeout = null;
    setIdleState();
  }

  function resetTimer() {
    if (timeout) {
      clearTimeout(timeout);
    } else {
      // returning from idle
      setActiveState();
    }

    document.removeEventListener("mousemove", resetTimer);
    document.removeEventListener("keypress", resetTimer);

    setTimeout(startTimer, 1000);
  }

  startTimer();
}

function initCopyrightYear() {
  const el = document.querySelector("[data-copyright-year]");
  if (!el) return;
  const currentYear = new Date().getFullYear();
  el.textContent = currentYear;
}

function initHomeHeroSectionAnimation(page) {
  const heroSection = page.querySelector("[data-home-hero-section]");
  if (!heroSection) return;

  const heroContent = heroSection.querySelector("[data-home-hero-content]");
  const heroBackground = heroSection.querySelector("[data-home-hero-background]");
  const heroBackgroundOverlay = heroSection.querySelector("[data-home-hero-background-overlay]");

  if (!heroContent || !heroBackground || !heroBackgroundOverlay) {
    if (DEBUG) console.warn("Missing hero section elements");
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: heroSection,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      markers: DEBUG
    }
  });

  // Fade out content by 33% and move up by 10% over first 33% of scroll
  tl.to(heroContent, {
    opacity: 0,
    yPercent: -10,
    ease: "none",
    duration: 0.33
  }, 0);

  // Fade out overlay by 33%
  tl.to(heroBackgroundOverlay, {
    opacity: 0,
    ease: "none",
    duration: 0.33
  }, 0);

  // Scale background to 1 over full scroll
  tl.to(heroBackground, {
    scale: 1,
    ease: "none",
    duration: 0.95
  }, 0);
}

function formatDates() {
  const dateElements = document.querySelectorAll('[data-creation-date]');
  if (dateElements == null) return;

  dateElements.forEach(dateElement => {
    const date = new Date(dateElement.getAttribute('data-creation-date'));
    const monthText = ["Januar", "Februar", "Mart", "April", "Maj", "Jun", "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"];
    dateElement.textContent = date.getDate() + ". " + monthText[date.getMonth()] + " " + date.getFullYear();
  });
}

function initLogoMarquee() {
  const marqueeWraps = document.querySelectorAll("[data-logo-marquee-wrap]");
  if (!marqueeWraps.length) return;

  marqueeWraps.forEach(wrap => {
    const marquees = wrap.querySelectorAll("[data-logo-marquee]");
    if (!marquees.length) return;

    marquees.forEach(marquee => {
      gsap.to(marquee, {
        xPercent: -100,
        repeat: -1,
        duration: 20,
        ease: "linear"
      });
    });
  });
}

function initMarqueeScrollDirection(page) {
  page.querySelectorAll('[data-marquee-scroll-direction-target]').forEach((marquee) => {
    // Query marquee elements
    const marqueeContent = marquee.querySelector('[data-marquee-collection-target]');
    const marqueeScroll = marquee.querySelector('[data-marquee-scroll-target]');
    if (!marqueeContent || !marqueeScroll) return;

    // Get data attributes
    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;

    // Convert data attributes to usable types
    const marqueeSpeedAttr = parseFloat(speed);
    const marqueeDirectionAttr = direction === 'right' ? 1 : -1; // 1 for right, -1 for left
    const duplicateAmount = parseInt(duplicate || 0);
    const scrollSpeedAttr = parseFloat(scrollSpeed);
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    let marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

    // Precompute styles for the scroll container
    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
    marqueeScroll.style.width = `${(scrollSpeedAttr * 2) + 100}%`;

    // Duplicate marquee content
    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true));
      }
      marqueeScroll.appendChild(fragment);
    }

    // GSAP animation for marquee content
    const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]');
    const animation = gsap.to(marqueeItems, {
      xPercent: -100, // Move completely out of view
      repeat: -1,
      duration: marqueeSpeed,
      ease: 'linear'
    }).totalProgress(0.5);

    // Initialize marquee in the correct direction
    gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(marqueeDirectionAttr); // Set correct direction
    animation.play(); // Start animation immediately

    // Set initial marquee status
    marquee.setAttribute('data-marquee-status', 'normal');

    // ScrollTrigger logic for direction inversion
    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const isInverted = self.direction === 1; // Scrolling down
        const currentDirection = isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr;

        // Update animation direction and marquee status
        animation.timeScale(currentDirection);
        marquee.setAttribute('data-marquee-status', isInverted ? 'normal' : 'inverted');
      }
    });

    // Extra speed effect on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: '0% 100%',
        end: '100% 0%',
        scrub: 0
      }
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    const scrollEnd = -scrollStart;

    tl.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${scrollEnd}vw`, ease: 'none' });
  });
}

function initBlogItemHoverAnimation(page) {
  const blogItems = page.querySelectorAll('[data-blog-item]');
  if (!blogItems.length) return;

  blogItems.forEach((item) => {
    const hoverTrigger = item.querySelector('[data-blog-item-hover-trigger]');
    const hoverGradient = item.querySelector('[data-blog-item-hover-gardient]');
    const hoverText = item.querySelector('[data-blog-item-hover-text]');

    if (!hoverTrigger || !hoverGradient || !hoverText) return;

    // Split text into characters
    const split = new SplitText(hoverText, { type: "chars" });
    const chars = split.chars;

    // Initial state
    gsap.set(hoverText, {
      opacity: 1
    });

    const tl = gsap.timeline({ paused: true });

    tl.to(hoverGradient, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    }, 0)
    .fromTo(chars, {
      y: "0.25em",
      opacity: 0
    }, {
      y: "0em",
      opacity: 1,
      duration: 0.2,
      ease: "power2.out",
      stagger: 0.015
    }, 0);

    hoverTrigger.addEventListener('mouseenter', () => tl.play());
    hoverTrigger.addEventListener('mouseleave', () => tl.reverse());
  });
}

function initFaqItemAnimation(page) {
  const faqWrap = page.querySelectorAll("[data-faq-wrap]");
  if (!faqWrap.length) return;

  faqWrap.forEach((wrap) => {
    const faqItems = wrap.querySelectorAll("[data-faq-item]");
    if (!faqItems.length) return;

    let itemNumber = 1; // each faq wrap on page will start numbering from 1

    faqItems.forEach((item) => {
      const question = item.querySelector("[data-faq-question]");
      const answer = item.querySelector("[data-faq-answer]");
      const openIndicator = item.querySelector("[data-faq-open-indicator]");
      const faqItemNumber = item.querySelector("[data-faq-item-number]");
      if (!question || !answer || !openIndicator || !faqItemNumber) return;

      faqItemNumber.textContent = itemNumber;
      itemNumber++;

      const tl = gsap.timeline({ paused: true });

      let isOpen = false;

      tl.fromTo(answer, {
        height: "0px",
        opacity: 0,
      }, {
        height: "auto",
        opacity: 1,
        duration: 0.3,
        ease: "power1.inOut",
      }, 0)
      .fromTo(openIndicator, {
        rotation: 0,
      }, {
        rotation: 225,
        duration: 0.3,
        ease: "power1.inOut",
      }, 0);

      question.addEventListener("click", () => {
        if (isOpen) {
          tl.reverse();
          isOpen = false;
        } else {
          tl.play();
          isOpen = true;
        }
      });
    });
  });
}
