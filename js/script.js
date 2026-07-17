// Find our date picker inputs and gallery elements on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const fetchButton = document.getElementById('getImagesButton');
const modal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const factText = document.getElementById('factText');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);
getRandomFact();

const apiKey = 'DEMO_KEY';
const apiUrl = 'https://api.nasa.gov/planetary/apod';
const spaceFacts = [
  'The Sun contains more than 99% of the mass in our solar system.',
  'A day on Venus is longer than a year on Venus.',
  'Neutron stars are so dense that a teaspoon of their material would weigh billions of tons.',
  'Jupiter has a storm larger than Earth that has lasted for hundreds of years.',
  'Mars has the tallest volcano in the solar system, Olympus Mons.'
];

function getRandomFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  factText.textContent = spaceFacts[randomIndex];
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function openModal(item) {
  if (item.media_type === 'video') {
    modalImage.style.display = 'none';
    modalImage.src = '';
    modalImage.alt = '';
    modalTitle.textContent = item.title;
    modalDate.textContent = item.date;
    modalExplanation.textContent = item.explanation;

    const existingVideo = document.getElementById('modalVideo');
    if (existingVideo) {
      existingVideo.remove();
    }

    const video = document.createElement('iframe');
    video.id = 'modalVideo';
    video.src = item.url;
    video.title = item.title;
    video.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    video.allowFullscreen = true;
    video.className = 'modal-video';

    const modalBody = document.querySelector('.modal-body');
    modalBody.insertAdjacentElement('beforebegin', video);
  } else {
    modalImage.style.display = 'block';
    modalImage.src = item.hdurl || item.url;
    modalImage.alt = item.title;

    const existingVideo = document.getElementById('modalVideo');
    if (existingVideo) {
      existingVideo.remove();
    }
  }

  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation;
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
      <p>Loading 9 days of APOD images...</p>
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

    if (item.media_type === 'image') {
      const image = document.createElement('img');
      image.src = item.url;
      image.alt = item.title;
      image.className = 'gallery-image';
      image.addEventListener('click', () => openModal(item));

      const explanation = document.createElement('p');
      explanation.textContent = item.explanation;

      card.appendChild(title);
      card.appendChild(date);
      card.appendChild(image);
      card.appendChild(explanation);
    } else if (item.media_type === 'video') {
      const videoPreview = document.createElement('iframe');
      videoPreview.src = item.url;
      videoPreview.title = item.title;
      videoPreview.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      videoPreview.allowFullscreen = true;
      videoPreview.className = 'gallery-video';

      const explanation = document.createElement('p');
      explanation.textContent = item.explanation;

      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open video in a new tab';

      card.appendChild(title);
      card.appendChild(date);
      card.appendChild(videoPreview);
      card.appendChild(explanation);
      card.appendChild(link);
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
