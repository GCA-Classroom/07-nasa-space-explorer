// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
const API_KEY = "BDd6HjcdjhCgNPFNDGzpMMMHmJHMBrmwwKrTh7Lp";
// "2026-11-04" -> "261104" (the legacy date code the endpoint expects)
function toLegacyCode(dateString) {
  return dateString.slice(2).replace(/-/g, "");
}
// ---------- Grab page elements once, store them in variables ----------
const loadButton = document.getElementById("loadImages");
const gallery = document.getElementById("gallery");
const statusText = document.getElementById("status");
 
const modal = document.getElementById("imageModal");
const modalTitle = document.getElementById("modalTitle");
const modalDate = document.getElementById("modalDate");
const modalMedia = document.getElementById("modalMedia");
const modalCredit = document.getElementById("modalCredit");
const modalExplanation = document.getElementById("modalExplanation");
 
let lastFocusedCard = null; // remembers which card opened the modal
 
// ---------- Small helper functions ----------
 
// Shows a message under the filters. isError=true turns it red.
function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}
 
// "2026-11-04" -> "November 4, 2026".
// Adding "T00:00:00" stops the browser shifting the day by your time zone.
function formatDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });
}
 
// Safely shows NASA explanation HTML, including clickable links.
function renderExplanation(container, htmlText) {
  container.replaceChildren();
 
  const template = document.createElement("template");
  template.innerHTML = htmlText || "";
 
  template.content.querySelectorAll("script, style, iframe, object, embed")
    .forEach(element => element.remove());
 
  const allowedTags = ["A", "P", "BR", "STRONG", "B", "EM", "I",
    "UL", "OL", "LI", "DIV", "SPAN"];
 
  template.content.querySelectorAll("*").forEach(element => {
    if (!allowedTags.includes(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }
 
    Array.from(element.attributes).forEach(attribute => {
      if (element.tagName === "A" && attribute.name === "href") {
        return;
      }
      element.removeAttribute(attribute.name);
    });
  });
 
  template.content.querySelectorAll("a").forEach(link => {
    const href = link.getAttribute("href") || "";
    if (!href.startsWith("http://") &&
      !href.startsWith("https://") &&
      !href.startsWith("mailto:")) {
      link.removeAttribute("href");
      return;
    }
 
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
 
  container.append(template.content);
}
 
// ---------- Load images ----------
async function loadImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;
 
  if (!startDate || !endDate || startDate > endDate) {
    setStatus("Choose a start date that is on or before the end date.", true);
    return;
  }
 
  const url = new URL("https://science.nasa.gov/wp-json/wp/v2/apod-basic");
  url.searchParams.set("date_from", toLegacyCode(startDate));
  url.searchParams.set("date_to", toLegacyCode(endDate));
  url.searchParams.set("per_page", "25"); // the guide's maximum
 
  loadButton.disabled = true;
  setStatus("Loading images…");
 
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // 429 = too many requests (rate limit); 403 = bad API key
      throw new Error("NASA returned status " + response.status);
    }
 
    const json = await response.json();
    // One date returns an object, a range returns an array: handle both.
    const items = Array.isArray(json) ? json : [json];
    // The guide says `url` is the post page, not an image, and `hdurl` may be
    // empty, so keep only image items that actually have an hdurl.
    const images = items.filter(item =>
      (item.media_type === "image" && item.hdurl) ||
      item.media_type === "video" || item.media_type === "iframe");
 
    gallery.replaceChildren(); // clear old cards
 
    if (images.length === 0) {
      setStatus("No images in that range (some days are videos). Try different dates.");
      return;
    }
 
    images.forEach(item => gallery.appendChild(buildCard(item)));
    setStatus(images.length + " items found. Select one to read more.");
 
  } catch (error) {
    console.error(error);
    setStatus("Couldn't load images (" + error.message + "). Check your key and dates, then try again.", true);
  } finally {
    loadButton.disabled = false; // runs on success AND failure
  }
}
 
// ---------- "Did you know?" facts ----------
// Written from commonly cited NASA figures: double-check before publishing.
const SPACE_FACTS = [
  "A day on Venus (one full rotation) is longer than its year: about 243 Earth days versus about 225 to orbit the Sun.",
  "Sunlight takes roughly 8 minutes and 20 seconds to travel from the Sun to Earth.",
  "Olympus Mons on Mars, the tallest known volcano in the solar system, rises about 22 km (13.6 miles), roughly two and a half times Mount Everest's height above sea level.",
  "Voyager 1, launched in 1977, is the most distant human-made object and has traveled in interstellar space since 2012.",
  "Mercury completes an orbit around the Sun in just 88 Earth days.",
  "Saturn is less dense than water, so in a bathtub big enough to hold it, it would float.",
  "The International Space Station circles Earth about every 90 minutes, so astronauts see about 16 sunrises and sunsets a day.",
  "The Moon drifts away from Earth by about 3.8 centimeters (1.5 inches) every year.",
  "Sunsets on Mars look blue, because fine Martian dust scatters light differently than Earth's air does.",
  "Jupiter's Great Red Spot is a giant storm that has been observed for well over a century."
];
 
function showRandomFact() {
  // Math.random() gives a decimal from 0 up to (but not including) 1.
  // Multiplying by the list length stretches that to 0..length, and
  // Math.floor() chops off the decimals, leaving a valid position in the list.
  const position = Math.floor(Math.random() * SPACE_FACTS.length);
  document.getElementById("factText").textContent = SPACE_FACTS[position];
}
 
// ---------- Media helpers (images and videos) ----------
 
// NASA image links carry ?w=...&h=... . Ask for a smaller width so cards
// don't download 6000px photos. Untested assumption: if the service ignores
// this, you just get the original image. Other URLs pass through unchanged.
function sizedUrl(url, width) {
  try {
    const u = new URL(url);
    if (u.searchParams.has("w")) {
      u.searchParams.set("w", width);
      u.searchParams.delete("h");
    }
    return u.toString();
  } catch (error) {
    return url;
  }
}
 
const VIDEO_HOSTS = ["assets.science.nasa.gov", "science.nasa.gov", "apod.nasa.gov"];
const EMBED_HOSTS = ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"];
 
// The feed has no "video URL" field, but each item's basic_html contains a
// <video> or <iframe>. Read it with DOMParser (an inert page: nothing runs or
// loads), then only accept https links from the allow-listed hosts above.
function findVideo(item) {
  const doc = new DOMParser().parseFromString(item.basic_html || "", "text/html");
 
  function clean(raw, hosts) {
    try {
      const u = new URL(raw, item.permalink);
      return (u.protocol === "https:" && hosts.includes(u.hostname)) ? u.href : null;
    } catch (error) {
      return null;
    }
  }
 
  const file = doc.querySelector("video source[src], video[src]");
  if (file) {
    const src = clean(file.getAttribute("src"), VIDEO_HOSTS);
    if (src) return { kind: "file", src: src };
  }
  const frame = doc.querySelector("iframe[src]");
  if (frame) {
    const src = clean(frame.getAttribute("src"), EMBED_HOSTS);
    if (src) return { kind: "frame", src: src };
  }
  return null; // no usable player found
}
 
// Builds the right element for an item: <img>, <video>, <iframe>, or a
// fallback link to NASA's page. `width` is the image size to request.
function buildMedia(item, width) {
  const poster = item.hdurl ? sizedUrl(item.hdurl, width) : "";
  const altText = item.alt || item.title; // the feed supplies real alt text
 
  if (item.media_type === "image") {
    const img = document.createElement("img");
    img.src = poster;
    img.alt = altText;
    img.loading = "lazy";
    return img;
  }
 
  const video = findVideo(item);
 
  if (video && video.kind === "file") {
    const el = document.createElement("video");
    el.controls = true;
    el.playsInline = true;
    el.preload = "none";            // don't download until Play is pressed
    if (poster) el.poster = poster; // still image shown before playing
    el.src = video.src;
    el.setAttribute("aria-label", item.title);
    return el;
  }
 
  if (video && video.kind === "frame") {
    const el = document.createElement("iframe");
    el.src = video.src;
    el.title = item.title;
    el.loading = "lazy";
    el.allowFullscreen = true;
    el.allow = "fullscreen; picture-in-picture";
    el.referrerPolicy = "strict-origin-when-cross-origin";
    el.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-popups");
    return el;
  }
 
  // Fallback: couldn't find a playable source, so link to NASA's page.
  const link = document.createElement("a");
  link.className = "video-fallback";
  link.href = item.permalink;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  if (poster) {
    const img = document.createElement("img");
    img.src = poster;
    img.alt = "";
    link.appendChild(img);
  }
  const label = document.createElement("span");
  label.textContent = "Watch on NASA's site \u2197";
  link.appendChild(label);
  return link;
}
 
// ---------- Gallery card ----------
function buildCard(item) {
  const isVideo = item.media_type !== "image";
 
  const card = document.createElement("article");
  card.className = "gallery-item" + (isVideo ? " is-video" : "");
 
  const media = document.createElement("div");
  media.className = "card-media";
  media.appendChild(buildMedia(item, 640));
 
  if (isVideo) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Video";
    media.appendChild(badge);
  }
 
  const body = document.createElement("div");
  body.className = "card-body";
 
  const title = document.createElement("h2");
  title.textContent = item.title;
 
  const date = document.createElement("p");
  date.textContent = formatDate(item.date);
 
  body.append(title, date);
 
  if (isVideo) {
    const more = document.createElement("p");
    more.className = "more";
    more.textContent = "Read details \u2192";
    body.appendChild(more);
  }
 
  card.append(media, body);
 
  // Image cards open the modal when clicked anywhere. Video cards open it from
  // the text area only, so using the player's controls doesn't trigger it.
  const opener = isVideo ? body : card;
  opener.tabIndex = 0;
  opener.setAttribute("role", "button");
  opener.addEventListener("click", () => openModal(item, opener));
  opener.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(item, opener);
    }
  });
 
  return card;
}
 
// ---------- Modal ----------
function openModal(item, opener) {
  lastFocusedCard = opener;
 
  modalTitle.textContent = item.title;
  modalDate.textContent = formatDate(item.date);
 
  modalMedia.className = "modal-media" + (item.media_type === "image" ? "" : " is-video");
  modalMedia.replaceChildren(buildMedia(item, 1600));
 
  const creditText = item.copyright
    ? "Image credit: " + item.copyright.replace(/\s+/g, " ").trim()
    : "";
  renderExplanation(modalCredit, creditText);
  renderExplanation(modalExplanation, item.explanation);
 
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modal.scrollTop = 0;
  document.getElementById("closeModal").focus();
}
 
function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  modalMedia.replaceChildren(); // removing the player also stops any playing video
  if (lastFocusedCard) lastFocusedCard.focus();
}
 
// ---------- Wire up events ----------
loadButton.addEventListener("click", loadImages);
document.getElementById("closeModal").addEventListener("click", closeModal);
 
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal(); // click on dark backdrop only
});
 
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("show")) closeModal();
});
 
// ---------- Date pickers ----------
// Use your dateRange.js if it loaded; otherwise default to the last 9 days.
if (typeof setupDateInputs === "function") {
  setupDateInputs(startInput, endInput);
} else {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 8);
  endInput.value = today.toISOString().slice(0, 10);
  startInput.value = start.toISOString().slice(0, 10);
  endInput.max = startInput.max = endInput.value;
}
 
// Pick a random fact each time the page loads
showRandomFact();