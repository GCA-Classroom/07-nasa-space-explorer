// Find our date picker inputs and the button on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.getElementById('getImagesButton');
const gallery = document.getElementById('gallery');
const factElement = document.getElementById('didYouKnowFact');
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const closeButton = document.querySelector('.modal-close');
const modalBackdrop = document.querySelector('.modal-backdrop');

const spaceFacts = [
  'The Sun is so massive that more than 1.3 million Earths could fit inside it.',
  'A day on Venus is longer than a year on Venus because it rotates very slowly.',
  'The Moon is slowly drifting away from Earth by about 3.8 centimeters each year.',
  'Neptune was the first planet discovered through mathematical prediction rather than direct observation.',
  'A single teaspoon of a neutron star would weigh billions of tons on Earth.'
];

if (factElement) {
  const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
  factElement.textContent = randomFact;
}

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

function openModal(spaceImage) {
  const isVideo = spaceImage.media_type === 'video';

  if (isVideo) {
    modalImage.src = '';
    modalImage.alt = '';
    modalImage.style.display = 'none';

    const videoLink = document.createElement('a');
    videoLink.href = spaceImage.url;
    videoLink.textContent = 'Watch the NASA video';
    videoLink.target = '_blank';
    videoLink.rel = 'noopener noreferrer';
    videoLink.classList.add('video-link');

    const existingVideoLink = document.querySelector('.video-link');
    if (existingVideoLink) {
      existingVideoLink.remove();
    }

    modalTitle.textContent = spaceImage.title;
    modalDate.textContent = spaceImage.date;
    modalExplanation.innerHTML = spaceImage.explanation || '';

    const copyContainer = document.querySelector('.modal-copy');
    copyContainer.appendChild(videoLink);

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    return;
  }

  modalImage.style.display = 'block';
  modalImage.src = spaceImage.hdurl || spaceImage.url;
  modalImage.alt = spaceImage.title;
  modalTitle.textContent = spaceImage.title;
  modalDate.textContent = spaceImage.date;
  modalExplanation.innerHTML = spaceImage.explanation || '';

  const existingVideoLink = document.querySelector('.video-link');
  if (existingVideoLink) {
    existingVideoLink.remove();
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  const existingVideoLink = document.querySelector('.video-link');
  if (existingVideoLink) {
    existingVideoLink.remove();
  }
  modalImage.style.display = 'block';
}

closeButton.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

// Read the API key from the page before this script loads.
// NASA migrated APOD to the WordPress endpoint, so use the current APOD API instead of the legacy endpoint.
const nasaApiKey = window.NASA_API_KEY;

// Build the current NASA APOD API URL using the selected date range.
// The legacy endpoint at api.nasa.gov/planetary/apod can return the placeholder NASA Science result.
function getApodUrl(startDate, endDate) {
  return `https://science.nasa.gov/wp-json/wp/v2/apod-basic?api_key=${nasaApiKey}&start_date=${startDate}&end_date=${endDate}`;
}

// Create a single gallery card for one APOD result
function createSpaceCard(spaceImage) {
  const card = document.createElement('article');
  card.classList.add('gallery-item');
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Open details for ${spaceImage.title}`);

  const image = document.createElement('img');
  const isVideo = spaceImage.media_type === 'video';

  if (isVideo) {
    image.src = spaceImage.thumbnail_url || 'img/nasa-worm-logo.png';
    image.alt = `${spaceImage.title} video thumbnail`;
  } else {
    image.src = spaceImage.hdurl || spaceImage.url;
    image.alt = spaceImage.title;
  }

  const title = document.createElement('h2');
  title.textContent = spaceImage.title;

  const date = document.createElement('p');
  date.textContent = spaceImage.date;
  date.classList.add('space-date');

  const mediaTag = document.createElement('p');
  mediaTag.textContent = isVideo ? 'Video entry' : 'Image entry';
  mediaTag.classList.add('media-type');

  card.appendChild(image);
  card.appendChild(title);
  card.appendChild(date);
  card.appendChild(mediaTag);

  card.addEventListener('click', () => {
    openModal(spaceImage);
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(spaceImage);
    }
  });

  return card;
}

// Fetch APOD data and display it in the gallery
function fetchSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!nasaApiKey) {
    gallery.innerHTML = '<p>⚠️ Add a valid NASA API key before loading images.</p>';
    return;
  }

  if (!startDate || !endDate) {
    gallery.innerHTML = '<p>Please choose a valid date range.</p>';
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    gallery.innerHTML = '<p>The start date must be before the end date.</p>';
    return;
  }

  gallery.innerHTML = '<p>🔄 Loading space photos…</p>';

  const apiUrl = getApodUrl(startDate, endDate);

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Unable to fetch NASA data.');
      }
      return response.json();
    })
    .then((data) => {
      gallery.innerHTML = '';

      if (!Array.isArray(data) || data.length === 0) {
        gallery.innerHTML = '<p>No space images found for this date range.</p>';
        return;
      }

      const hasPlaceholderData = data.some((spaceImage) => {
        const url = (spaceImage.url || '').toLowerCase();
        return spaceImage.title === 'NASA Science' && url.includes('nasa-logo');
      });

      if (hasPlaceholderData) {
        gallery.innerHTML = '<p>⚠️ The NASA API is returning the placeholder logo instead of real APOD images. Your current key may be invalid, expired, or missing. Generate a new NASA API key and paste it into the page script.</p>';
        return;
      }

      data.forEach((spaceImage) => {
        const card = createSpaceCard(spaceImage);
        gallery.appendChild(card);
      });
    })
    .catch((error) => {
      gallery.innerHTML = `<p>Something went wrong: ${error.message}</p>`;
    });
}

// Add the click handler so the button fetches the selected date range
getImagesButton.addEventListener('click', fetchSpaceImages);
