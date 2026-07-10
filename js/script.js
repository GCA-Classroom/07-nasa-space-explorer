/*
	js/script.js
	Beginner-friendly JavaScript for the Space Explorer app.
	- Reads date inputs
	- Calls NASA APOD API for a date range
	- Builds a gallery of cards
	- Shows a modal with a larger image and details
*/

// -------------------------
// DOM references
// -------------------------
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

// Modal elements
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// -------------------------
// Initialize date inputs (from dateRange.js)
// -------------------------
// This helper sets sensible defaults and min/max values for the date pickers.
setupDateInputs(startInput, endInput);

// -------------------------
// NASA API key
// Replace 'DEMO_KEY' with your real API key from https://api.nasa.gov
// -------------------------
const API_KEY = 'DEMO_KEY';

// -------------------------
// Random Space Facts
// -------------------------
const spaceFacts = [
  "One day on Venus is longer than one year on Venus.",
  "The Sun contains over 99% of the Solar System's mass.",
  "There are more stars in the universe than grains of sand on Earth.",
  "Neutron stars can spin hundreds of times every second.",
  "Jupiter has over 90 known moons."
];

const factText = document.querySelector(".did-you-know-text");

const randomFact =
  spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

factText.textContent = randomFact;

// -------------------------
// Fetch APOD data for a date range
// Returns an array of APOD items
// -------------------------
async function fetchApodRange(startDate, endDate) {
	const url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;

	const response = await fetch(url);
	if (!response.ok) {
		// Throw an error so callers can handle it with try/catch
		throw new Error(`Network response was not ok (${response.status})`);
	}

	const data = await response.json();
	return data;
}

// -------------------------
// Build HTML for a single gallery card (uses template literals)
// Stores full item data in data-attributes so the modal can read them later.
// -------------------------
function buildCardHtml(item) {
	const safe = str => (str || '').replace(/"/g, '&quot;');

	const mediaHtml = item.media_type === 'image'
		? `<img src="${item.url}" alt="${item.title || 'NASA APOD image'}" />`
		: `<div class="video-note"><p>Video — <a href="${item.url}" target="_blank" rel="noopener">Watch video</a></p></div>`;

	return `
		<article class="gallery-item" data-url="${safe(item.url)}" data-title="${safe(item.title)}" data-date="${safe(item.date)}" data-explanation="${safe(item.explanation)}" data-media-type="${safe(item.media_type)}" data-hdurl="${safe(item.hdurl || item.url)}">
			<h3>${item.title || ''}</h3>
			${mediaHtml}
			<p class="date">${item.date || ''}</p>
		</article>
	`;
}

// -------------------------
// Render gallery of items and attach click handlers
// -------------------------
function renderGallery(items) {
	// Clear any previous content
	gallery.innerHTML = '';

	if (!items || items.length === 0) {
		gallery.innerHTML = '<div class="placeholder"><p>No images found for that range.</p></div>';
		return;
	}

	// Create HTML for all cards and insert into the gallery
	const html = items.map(buildCardHtml).join('');
	gallery.innerHTML = html;

	// Attach click listeners to open modal with details for each card
	const cards = gallery.querySelectorAll('.gallery-item');
	cards.forEach(card => {
		card.addEventListener('click', () => {
			const item = {
        url: card.dataset.url,
        hdurl: card.dataset.hdurl,
        title: card.dataset.title,
        date: card.dataset.date,
        explanation: card.dataset.explanation,
        media_type: card.dataset.mediaType
      };
			openModal(item);
		});
	});
}

// -------------------------
// Modal helpers
// -------------------------
function openModal(item) {
	modalMedia.innerHTML = '';

	if (item.media_type === 'image') {
		const img = document.createElement('img');
		img.src = item.hdurl || item.url;
		img.alt = item.title || 'NASA APOD image';
		modalMedia.appendChild(img);
	} else {
		modalMedia.innerHTML = `<div class="video-note"><p>Video — <a href="${item.url}" target="_blank" rel="noopener">Watch video</a></p></div>`;
	}

	modalTitle.textContent = item.title || '';
	modalDate.textContent = item.date || '';
	modalExplanation.textContent = item.explanation || '';

	modal.classList.add('show');
	modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
	modal.classList.remove('show');
	modal.setAttribute('aria-hidden', 'true');
}

// Close modal when clicking close button or outside content
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// -------------------------
// Button click: load images
// -------------------------
getButton.addEventListener('click', async () => {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		alert('Please choose both a start date and an end date.');
		return;
	}

	// Show a simple loading message while we fetch data
	gallery.innerHTML = '<div class="placeholder"><p>🔄 Loading space photos...</p></div>';

	try {
		// Fetch and render
		const items = await fetchApodRange(startDate, endDate);
    items.reverse();
		renderGallery(items);
	} catch (err) {
		// Developer log
		console.error('Error fetching APOD range:', err);

		// Friendly user message in the gallery area
		gallery.innerHTML = `
			<div class="placeholder">
				<p>Could not load space images. Please check your network or API key and try again.</p>
				<p style="margin-top:8px;color:var(--muted);">Error: ${err.message}</p>
			</div>
		`;
	}
});
