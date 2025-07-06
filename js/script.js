
// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesBtn = document.querySelector('button');
const gallery = document.getElementById('gallery');
const modal = document.getElementById('modal');
const modalMedia = document.getElementById('modal-media');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalExplanation = document.getElementById('modal-explanation');
const closeButton = document.querySelector('.close-button');
const factSection = document.getElementById('space-fact');

// Call the setupDateInputs function from dateRange.js
setupDateInputs(startInput, endInput);

// Show a random space fact on load
if (typeof getRandomSpaceFact === 'function') {
  factSection.textContent = `Did You Know? ${getRandomSpaceFact()}`;
}

// Helper: Show loading message
function showLoading() {
  gallery.innerHTML = `<div class="placeholder"><div class="placeholder-icon">🔄</div><p>Loading space photos…</p></div>`;
}

// Helper: Show error message
function showError(msg) {
  gallery.innerHTML = `<div class="placeholder"><div class="placeholder-icon">🚫</div><p>${msg}</p></div>`;
}

// Fetch images from NASA APOD API
async function fetchSpaceImages(start, end) {
  const apiKey = 'RCrBudSW7HeKRheBkWNmAomO3cIhVgj7asUsGrkU'; // Replace with your NASA API key for more requests
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${start}&end_date=${end}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch images.');
    const data = await res.json();
    // Always return as array (API returns object for single day)
    return Array.isArray(data) ? data : [data];
  } catch (err) {
    throw err;
  }
}

// Render the gallery
function renderGallery(items) {
  if (!items.length) {
    showError('No images found for this date range.');
    return;
  }
  gallery.innerHTML = '';
  items.forEach((item, idx) => {
    // Create gallery item
    const div = document.createElement('div');
    div.className = 'gallery-item';
    // Detect if item is image or video
    let mediaHtml = '';
    if (item.media_type === 'image') {
      // Show image thumbnail
      mediaHtml = `<img src="${item.url}" alt="${item.title}" data-idx="${idx}" style="cursor:pointer;" />`;
    } else if (item.media_type === 'video') {
      // For YouTube, show a clickable thumbnail image; for others, show a link
      if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
        // Try to extract YouTube video ID for thumbnail
        let videoId = '';
        const ytMatch = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        if (ytMatch && ytMatch[1]) {
          videoId = ytMatch[1];
        }
        if (videoId) {
          // Use YouTube's thumbnail image
          mediaHtml = `<img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${item.title}" data-idx="${idx}" style="cursor:pointer;" />`;
        } else {
          // Fallback: show a link
          mediaHtml = `<a href="${item.url}" target="_blank">Watch Video</a>`;
        }
      } else {
        mediaHtml = `<a href="${item.url}" target="_blank">Watch Video</a>`;
      }
    }
    div.innerHTML = `
      ${mediaHtml}
      <p><strong>${item.title}</strong></p>
      <p>${item.date}</p>
    `;
    // Add click event for modal (always, so both images and video thumbnails open modal)
    div.addEventListener('click', () => openModal(item));
    gallery.appendChild(div);
  });
}

// Open modal with details
function openModal(item) {
  modal.style.display = 'flex';
  // Show image or video
  if (item.media_type === 'image') {
    modalMedia.innerHTML = `<img src="${item.hdurl || item.url}" alt="${item.title}" />`;
  } else if (item.media_type === 'video') {
    // For all videos, just show a link
    modalMedia.innerHTML = `<a href="${item.url}" target="_blank">Watch Video on YouTube</a>`;
  }
  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation;
}

// Close modal
function closeModal() {
  modal.style.display = 'none';
  modalMedia.innerHTML = '';
}
closeButton.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Main event: Get Space Images button
getImagesBtn.addEventListener('click', async () => {
  showLoading();
  try {
    const items = await fetchSpaceImages(startInput.value, endInput.value);
    renderGallery(items);
  } catch (err) {
    showError('Could not load images. Please try again later.');
  }
});
