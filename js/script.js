// ==========================================
// Date inputs
// ==========================================

const startInput = document.getElementById("startDate");
const endInput = document.getElementById("endDate");

// This function comes from dateRange.js.
// Do not modify dateRange.js.
setupDateInputs(startInput, endInput);

// ==========================================
// NASA API
// ==========================================

const API_KEY = "VtV1OqiTIjyqB9Ej9z7HLnL03IHKVxh5Quifs40N";
const API_URL = "https://api.nasa.gov/planetary/apod";

// ==========================================
// HTML elements
// ==========================================

const getImagesButton = document.getElementById("getImagesButton");
const gallery = document.getElementById("gallery");
const statusMessage = document.getElementById("statusMessage");
const spaceFactElement = document.getElementById("spaceFact");

// Modal elements
const modal = document.getElementById("apodModal");
const closeModalButton = document.getElementById("closeModalButton");
const modalMedia = document.getElementById("modalMedia");
const modalTitle = document.getElementById("modalTitle");
const modalDate = document.getElementById("modalDate");
const modalExplanation = document.getElementById("modalExplanation");

let lastFocusedCard = null;

// ==========================================
// Extra credit: random space fact
// ==========================================

const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "The Sun contains more than 99% of the mass in our solar system.",
  "Light from the Sun takes about eight minutes to reach Earth.",
  "One million Earths could fit inside the Sun.",
  "Jupiter has the shortest day of any planet in our solar system.",
  "Mars is home to the largest known volcano in the solar system.",
  "Saturn has a lower average density than water.",
  "Footprints on the Moon may remain there for millions of years.",
  "Neutron stars can rotate hundreds of times per second.",
  "The Milky Way contains billions of stars.",
  "Some planets may travel through space without orbiting a star.",
  "The Moon is slowly moving away from Earth."
];

function displayRandomSpaceFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);

  spaceFactElement.textContent = spaceFacts[randomIndex];
}

// ==========================================
// Button click
// ==========================================

getImagesButton.addEventListener("click", loadImages);

// ==========================================
// Fetch NASA APOD data
// ==========================================

async function loadImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showError("Please select both a start date and an end date.");
    return;
  }

  if (startDate > endDate) {
    showError("The start date cannot be later than the end date.");
    return;
  }

  showLoading();

  getImagesButton.disabled = true;
  getImagesButton.textContent = "Loading...";

  const url =
    `${API_URL}?api_key=${API_KEY}` +
    `&start_date=${encodeURIComponent(startDate)}` +
    `&end_date=${encodeURIComponent(endDate)}` +
    `&thumbs=true`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage =
        `NASA API request failed with status ${response.status}.`;

      try {
        const errorData = await response.json();

        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch (error) {
        console.error("Could not read NASA error response:", error);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    const entries = Array.isArray(data) ? data : [data];

    clearStatusMessage();
    displayGallery(entries);
  } catch (error) {
    console.error("NASA APOD error:", error);

    showError(
      `Unable to load NASA content. ${error.message}`
    );
  } finally {
    getImagesButton.disabled = false;
    getImagesButton.textContent = "Get Space Images";
  }
}

// ==========================================
// Gallery
// ==========================================

function displayGallery(entries) {
  gallery.innerHTML = "";

  if (entries.length === 0) {
    gallery.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">🛰️</div>
        <p>No NASA content was found for this date range.</p>
      </div>
    `;

    return;
  }

  entries.forEach(function (entry) {
    const card = createGalleryCard(entry);

    gallery.appendChild(card);
  });
}

function createGalleryCard(entry) {
  const card = document.createElement("article");

  card.className = "gallery-item";
  card.tabIndex = 0;
  card.setAttribute("role", "button");

  card.setAttribute(
    "aria-label",
    `Open details for ${entry.title || "NASA content"}`
  );

  const mediaContainer = document.createElement("div");
  mediaContainer.className = "gallery-media";

  if (entry.media_type === "image") {
    const image = document.createElement("img");

    image.src = entry.url;
    image.alt =
      entry.title || "NASA Astronomy Picture of the Day";
    image.loading = "lazy";

    image.addEventListener("error", function () {
      mediaContainer.innerHTML = `
        <div class="media-fallback">
          Image unavailable
        </div>
      `;
    });

    mediaContainer.appendChild(image);
  } else if (entry.media_type === "video") {
    createVideoPreview(entry, mediaContainer);
  } else {
    mediaContainer.innerHTML = `
      <div class="media-fallback">
        NASA media
      </div>
    `;
  }

  const information = document.createElement("div");
  information.className = "gallery-information";

  const title = document.createElement("h2");
  title.textContent = entry.title || "Untitled NASA Entry";

  const date = document.createElement("p");
  date.className = "gallery-date";
  date.textContent = formatDate(entry.date);

  information.appendChild(title);
  information.appendChild(date);

  card.appendChild(mediaContainer);
  card.appendChild(information);

  card.addEventListener("click", function () {
    openModal(entry, card);
  });

  card.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(entry, card);
    }
  });

  return card;
}

// ==========================================
// Extra credit: APOD video entries
// ==========================================

function createVideoPreview(entry, container) {
  if (entry.thumbnail_url) {
    const thumbnail = document.createElement("img");

    thumbnail.src = entry.thumbnail_url;
    thumbnail.alt =
      `Video thumbnail for ${entry.title || "NASA video"}`;

    thumbnail.loading = "lazy";

    container.appendChild(thumbnail);
  } else {
    const videoPlaceholder = document.createElement("div");

    videoPlaceholder.className = "video-placeholder";
    videoPlaceholder.textContent = "NASA Video";

    container.appendChild(videoPlaceholder);
  }

  const videoBadge = document.createElement("span");

  videoBadge.className = "video-badge";
  videoBadge.textContent = "▶ Video";

  container.appendChild(videoBadge);
}

// ==========================================
// Modal
// ==========================================

function openModal(entry, card) {
  lastFocusedCard = card;

  modalMedia.innerHTML = "";

  if (entry.media_type === "image") {
    const image = document.createElement("img");

    image.src = entry.hdurl || entry.url;
    image.alt =
      entry.title || "NASA Astronomy Picture of the Day";

    modalMedia.appendChild(image);
  } else if (entry.media_type === "video") {
    const videoLink = document.createElement("a");

    videoLink.href = entry.url;
    videoLink.target = "_blank";
    videoLink.rel = "noopener noreferrer";
    videoLink.className = "modal-video-link";

    if (entry.thumbnail_url) {
      const thumbnail = document.createElement("img");

      thumbnail.src = entry.thumbnail_url;
      thumbnail.alt =
        `Video thumbnail for ${entry.title || "NASA video"}`;

      videoLink.appendChild(thumbnail);
    }

    const linkText = document.createElement("span");

    linkText.textContent = "Watch this NASA video ↗";

    videoLink.appendChild(linkText);
    modalMedia.appendChild(videoLink);
  }

  modalTitle.textContent =
    entry.title || "Untitled NASA Entry";

  modalDate.textContent =
    formatDate(entry.date);

  modalExplanation.textContent =
    entry.explanation || "No explanation is available.";

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");

  closeModalButton.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");

  if (lastFocusedCard) {
    lastFocusedCard.focus();
  }
}

closeModalButton.addEventListener("click", closeModal);

modal.addEventListener("click", function (event) {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", function (event) {
  if (
    event.key === "Escape" &&
    modal.classList.contains("is-open")
  ) {
    closeModal();
  }
});

// ==========================================
// Loading and error messages
// ==========================================

function showLoading() {
  gallery.innerHTML = "";

  statusMessage.className =
    "status-message loading-message";

  statusMessage.innerHTML = `
    <span
      class="loading-spinner"
      aria-hidden="true"
    ></span>

    <span>Loading space photos...</span>
  `;
}

function showError(message) {
  gallery.innerHTML = "";

  statusMessage.className =
    "status-message error-message";

  statusMessage.textContent = message;
}

function clearStatusMessage() {
  statusMessage.className = "status-message";
  statusMessage.textContent = "";
}

// ==========================================
// Helper
// ==========================================

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// ==========================================
// Initial page setup
// ==========================================

displayRandomSpaceFact();
