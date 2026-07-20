// NASA APOD API endpoint
const API_URL = "https://api.nasa.gov/planetary/apod";

// For a public school project, DEMO_KEY can be used temporarily.
// Replace it locally with your own NASA API key.
const API_KEY = "DEMO_KEY";

// HTML elements
const startDateInput = document.querySelector("#startDate");
const endDateInput = document.querySelector("#endDate");
const getImagesButton = document.querySelector("#getImagesButton");
const gallery = document.querySelector("#gallery");
const statusMessage = document.querySelector("#statusMessage");
const spaceFact = document.querySelector("#spaceFact");

// Modal elements
const modal = document.querySelector("#apodModal");
const closeModalButton = document.querySelector("#closeModalButton");
const modalMedia = document.querySelector("#modalMedia");
const modalTitle = document.querySelector("#modalTitle");
const modalDate = document.querySelector("#modalDate");
const modalExplanation = document.querySelector("#modalExplanation");

// Store the element that opened the modal.
// This allows keyboard focus to return to it when the modal closes.
let lastFocusedElement = null;

/* =====================================================
   Random Space Fact
===================================================== */

const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "The Sun contains more than 99% of the mass in our solar system.",
  "Light from the Sun takes about eight minutes to reach Earth.",
  "One million Earths could fit inside the Sun.",
  "Jupiter has the shortest day of any planet in our solar system.",
  "Mars has the largest known volcano in the solar system.",
  "Saturn is less dense than water.",
  "Footprints on the Moon may remain for millions of years.",
  "Neutron stars can rotate hundreds of times per second.",
  "The Milky Way contains billions of stars."
];

function displayRandomFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  spaceFact.textContent = spaceFacts[randomIndex];
}

/* =====================================================
   NASA API Request
===================================================== */

async function fetchAPODData(startDate, endDate) {
  const requestURL =
    `${API_URL}?api_key=${API_KEY}` +
    `&start_date=${encodeURIComponent(startDate)}` +
    `&end_date=${encodeURIComponent(endDate)}` +
    `&thumbs=true`;

  const response = await fetch(requestURL);

  if (!response.ok) {
    let errorMessage = `NASA request failed with status ${response.status}.`;

    try {
      const errorData = await response.json();

      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch (error) {
      console.error("Could not read NASA's error message:", error);
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Date-range requests normally return an array.
  // This protects the app if NASA returns one object.
  return Array.isArray(data) ? data : [data];
}

/* =====================================================
   Gallery
===================================================== */

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

  entries.forEach((entry) => {
    const galleryCard = createGalleryCard(entry);
    gallery.appendChild(galleryCard);
  });
}

function createGalleryCard(entry) {
  const card = document.createElement("article");
  card.className = "gallery-item";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute(
    "aria-label",
    `Open details for ${entry.title || "NASA astronomy content"}`
  );

  const mediaContainer = document.createElement("div");
  mediaContainer.className = "gallery-media";

  if (entry.media_type === "image") {
    const image = document.createElement("img");

    image.src = entry.url;
    image.alt = entry.title || "NASA Astronomy Picture of the Day";
    image.loading = "lazy";

    image.addEventListener("error", () => {
      mediaContainer.innerHTML = `
        <div class="media-fallback">
          Image unavailable
        </div>
      `;
    });

    mediaContainer.appendChild(image);
  } else if (entry.media_type === "video") {
    displayVideoPreview(entry, mediaContainer);
  } else {
    mediaContainer.innerHTML = `
      <div class="media-fallback">
        NASA media
      </div>
    `;
  }

  const information = document.createElement("div");
  information.className = "gallery-info";

  const date = document.createElement("p");
  date.className = "gallery-date";
  date.textContent = formatDate(entry.date);

  const title = document.createElement("h2");
  title.textContent = entry.title || "Untitled NASA Entry";

  information.appendChild(date);
  information.appendChild(title);

  card.appendChild(mediaContainer);
  card.appendChild(information);

  card.addEventListener("click", () => {
    openModal(entry, card);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(entry, card);
    }
  });

  return card;
}

function displayVideoPreview(entry, container) {
  if (entry.thumbnail_url) {
    const thumbnail = document.createElement("img");

    thumbnail.src = entry.thumbnail_url;
    thumbnail.alt = `Video thumbnail for ${entry.title}`;
    thumbnail.loading = "lazy";

    container.appendChild(thumbnail);
  } else {
    const videoPlaceholder = document.createElement("div");

    videoPlaceholder.className = "media-fallback";
    videoPlaceholder.textContent = "NASA Video";

    container.appendChild(videoPlaceholder);
  }

  const videoBadge = document.createElement("span");

  videoBadge.className = "video-badge";
  videoBadge.textContent = "▶ Video";

  container.appendChild(videoBadge);
}

/* =====================================================
   Modal
===================================================== */

function openModal(entry, openingElement) {
  lastFocusedElement = openingElement;
  modalMedia.innerHTML = "";

  if (entry.media_type === "image") {
    const image = document.createElement("img");

    image.src = entry.hdurl || entry.url;
    image.alt = entry.title || "NASA Astronomy Picture of the Day";

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
      thumbnail.alt = `Video thumbnail for ${entry.title}`;

      videoLink.appendChild(thumbnail);
    }

    const linkText = document.createElement("span");
    linkText.textContent = "Watch this NASA video ↗";

    videoLink.appendChild(linkText);
    modalMedia.appendChild(videoLink);
  }

  modalTitle.textContent = entry.title || "Untitled NASA Entry";
  modalDate.textContent = formatDate(entry.date);
  modalExplanation.textContent =
    entry.explanation || "No explanation is available for this entry.";

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  closeModalButton.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

closeModalButton.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});

/* =====================================================
   Button Event
===================================================== */

getImagesButton.addEventListener("click", async () => {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

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

  try {
    const entries = await fetchAPODData(startDate, endDate);

    statusMessage.textContent = "";
    statusMessage.className = "status-message";

    displayGallery(entries);
  } catch (error) {
    console.error("NASA APOD error:", error);
    showError(`We could not load the NASA content. ${error.message}`);
  } finally {
    getImagesButton.disabled = false;
    getImagesButton.textContent = "Get Space Images";
  }
});

/* =====================================================
   Status Messages
===================================================== */

function showLoading() {
  gallery.innerHTML = "";

  statusMessage.className = "status-message loading-message";
  statusMessage.innerHTML = `
    <span class="loading-spinner" aria-hidden="true"></span>
    <span>Loading space photos...</span>
  `;
}

function showError(message) {
  gallery.innerHTML = "";

  statusMessage.className = "status-message error-message";
  statusMessage.textContent = message;
}

/* =====================================================
   Helpers
===================================================== */

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

/* =====================================================
   Initial Page Setup
===================================================== */

displayRandomFact();
