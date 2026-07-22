// Find our date picker inputs and gallery elements on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const fetchButton = document.getElementById('getImagesButton');
const modal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModal');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Use the requested APOD date range for the default view.
startInput.value = '2026-07-08';
endInput.value = '2026-07-17';

const apiKey = 'IRbfeE57sfL9eokc4YjHtmPeSUnWgMkpQr7tnoWU';
const apiUrl = 'https://api.nasa.gov/planetary/apod';

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getVideoEmbedUrl(url) {
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url;
}

function renderMedia(item, container, isModal = false) {
  container.innerHTML = '';

  if (item.media_type === 'image') {
    const image = document.createElement('img');
    image.src = item.hdurl || item.url;
    image.alt = item.title;
    image.className = isModal ? 'modal-image' : 'gallery-image';
    container.appendChild(image);
    return;
  }

  if (item.media_type === 'video') {
    const iframe = document.createElement('iframe');
    iframe.src = getVideoEmbedUrl(item.url);
    iframe.title = item.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.className = isModal ? 'modal-video' : 'gallery-video';
    container.appendChild(iframe);

    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open video in a new tab';
    container.appendChild(link);
    return;
  }

  const fallbackLink = document.createElement('a');
  fallbackLink.href = item.url;
  fallbackLink.target = '_blank';
  fallbackLink.rel = 'noopener noreferrer';
  fallbackLink.textContent = 'Open media';
  container.appendChild(fallbackLink);
}

function openModal(item) {
  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation;
  renderMedia(item, modalMedia, true);
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function showLoadingState() {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🛰️</div>
      <p>Loading APOD entries...</p>
    </div>
  `;
}

function showMessageState(message, icon = '⚠️') {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">${icon}</div>
      <p>${message}</p>
    </div>
  `;
}

function renderGallery(items) {
  gallery.innerHTML = '';

  const galleryItems = items.slice(0, 9);

  if (!galleryItems.length) {
    gallery.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">🔭</div>
        <p>No space images were returned for that date range.</p>
      </div>
    `;
    return;
  }

  galleryItems.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'gallery-item';

    const title = document.createElement('h3');
    title.textContent = item.title;

    const date = document.createElement('p');
    date.textContent = item.date;

    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'media-container';

    if (item.media_type === 'image' || item.media_type === 'video') {
      renderMedia(item, mediaContainer);
      mediaContainer.addEventListener('click', () => openModal(item));

      const explanation = document.createElement('p');
      explanation.textContent = item.explanation;

      card.appendChild(title);
      card.appendChild(date);
      card.appendChild(mediaContainer);
      card.appendChild(explanation);
    } else {
      const mediaMessage = document.createElement('p');
      mediaMessage.textContent = `Media type: ${item.media_type}`;
      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open media';

      card.appendChild(title);
      card.appendChild(date);
      card.appendChild(mediaMessage);
      card.appendChild(link);
    }

    gallery.appendChild(card);
  });
}

async function fetchApodData(startDate, endDate) {
  const response = await fetch(`${apiUrl}?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`);

  if (!response.ok) {
    throw new Error('Unable to load APOD images right now.');
  }

  return response.json();
}

closeModalButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

fetchButton.addEventListener('click', async () => {
  const selectedStartDate = startInput.value;
  const selectedEndDate = endInput.value;

  if (!selectedStartDate || !selectedEndDate) {
    showMessageState('Please choose a start and end date.');
    return;
  }

  showLoadingState();

  try {
    const data = await fetchApodData(selectedStartDate, selectedEndDate);
    renderGallery(data);
  } catch (error) {
    showMessageState(error.message);
  }
});
