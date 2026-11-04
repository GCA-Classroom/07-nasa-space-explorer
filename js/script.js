// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
const API_KEY = "MR8B7JgPhhtWk6nHhdwNnLndjpWK9QLF6BkMGJrC";
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
const modalImage = document.getElementById("modalImage");
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
    const images = items.filter(item => item.media_type === "image" && item.hdurl);
 
    gallery.replaceChildren(); // clear old cards
 
    if (images.length === 0) {
      setStatus("No images in that range (some days are videos). Try different dates.");
      return;
    }
 
    images.forEach(item => gallery.appendChild(buildCard(item)));
    setStatus(images.length + " images found. Select one to read more.");
 
  } catch (error) {
    console.error(error);
    setStatus("Couldn't load images (" + error.message + "). Check your key and dates, then try again.", true);
  } finally {
    loadButton.disabled = false; // runs on success AND failure
  }
}
 
// Builds one gallery card from one NASA item.
function buildCard(item) {
  const card = document.createElement("article");
  card.className = "gallery-item";
  card.tabIndex = 0;                 // lets keyboard users reach it
  card.setAttribute("role", "button");
 
  const image = document.createElement("img");
  image.src = item.hdurl;            // the only image URL the feed provides
  image.alt = item.title;
  image.loading = "lazy";            // only download when scrolled near
 
  const body = document.createElement("div");
  body.className = "card-body";
 
  const title = document.createElement("h2");
  title.textContent = item.title;
 
  const date = document.createElement("p");
  date.textContent = formatDate(item.date);
 
  body.append(title, date);
  card.append(image, body);
 
  card.addEventListener("click", () => openModal(item, card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(item, card);
    }
  });
 
  return card;
}
 
// ---------- Modal ----------
function openModal(item, card) {
  lastFocusedCard = card;
 
  modalTitle.textContent = item.title;
  modalDate.textContent = formatDate(item.date);
 
  modalImage.src = item.hdurl;
  modalImage.alt = item.title;
  modalImage.hidden = false;
 
  // NASA says copyrighted images need credit to the owner
  const creditText = item.copyright
    ? "Image credit: " + item.copyright.replace(/\s+/g, " ").trim()
    : "";
  renderExplanation(modalCredit, creditText);
  renderExplanation(modalExplanation, item.explanation);
 
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // stop page scrolling behind modal
  modal.scrollTop = 0;
  document.getElementById("closeModal").focus();
}
 
function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  modalImage.hidden = true;
  modalImage.removeAttribute("src");   // avoids the broken-image icon next time
  if (lastFocusedCard) lastFocusedCard.focus(); // return keyboard users to where they were
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