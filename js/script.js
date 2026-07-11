// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalVideoLink = document.getElementById('modalVideoLink');
const modalExplanation = document.getElementById('modalExplanation');
const randomSpaceFact = document.getElementById('randomSpaceFact');

// NASA APOD API endpoint and public demo key
const APOD_URL = 'https://api.nasa.gov/planetary/apod';
const API_KEY = 'DEMO_KEY';

// Fun space facts shown at page load.
const spaceFacts = [
	'A day on Venus is longer than a year on Venus.',
	'Neutron stars can spin more than 600 times each second.',
	'One million Earths could fit inside the Sun.',
	'Jupiter has the shortest day of any planet: about 10 hours.',
	'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
	'There are more stars in the universe than grains of sand on Earth.',
	'The footprints left on the Moon can last for millions of years.',
	'Saturn is so low-density it could float in water (in a giant enough ocean).'
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Pick one random fact each time the app loads.
function showRandomSpaceFact() {
	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	randomSpaceFact.textContent = spaceFacts[randomIndex];
}

showRandomSpaceFact();

// Build one gallery card from APOD data
function createGalleryItem(imageData) {
	const card = document.createElement('article');
	card.className = 'gallery-item';
	card.tabIndex = 0;

	const isVideo = imageData.media_type === 'video';
	const previewUrl = isVideo ? imageData.thumbnail_url : imageData.url;
	const previewMarkup = previewUrl
		? `<img src="${previewUrl}" alt="${imageData.title}" loading="lazy" />`
		: '<div class="video-placeholder">Video Entry - Click to Open</div>';

	card.innerHTML = `
		${previewMarkup}
		<p><strong>${imageData.title}</strong></p>
		<p>${imageData.date}</p>
		<p>${isVideo ? 'Video' : 'Image'}</p>
	`;

	card.addEventListener('click', () => openModal(imageData));

	card.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openModal(imageData);
		}
	});

	return card;
}

// Show selected APOD item in the modal
function openModal(imageData) {
	const isVideo = imageData.media_type === 'video';

	if (isVideo) {
		if (imageData.thumbnail_url) {
			modalImage.src = imageData.thumbnail_url;
			modalImage.alt = imageData.title;
			modalImage.classList.remove('hidden');
		} else {
			modalImage.src = '';
			modalImage.classList.add('hidden');
		}

		modalVideoLink.textContent = 'Watch this APOD video: ';
		const link = document.createElement('a');
		link.href = imageData.url;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		link.textContent = 'Open video';
		modalVideoLink.appendChild(link);
		modalVideoLink.classList.remove('hidden');
	} else {
		modalImage.src = imageData.hdurl || imageData.url;
		modalImage.alt = imageData.title;
		modalImage.classList.remove('hidden');
		modalVideoLink.classList.add('hidden');
		modalVideoLink.textContent = '';
	}

	modalTitle.textContent = imageData.title;
	modalDate.textContent = imageData.date;
	modalExplanation.textContent = imageData.explanation;

	imageModal.classList.remove('hidden');
	imageModal.setAttribute('aria-hidden', 'false');
	document.body.style.overflow = 'hidden';
}

function closeModal() {
	imageModal.classList.add('hidden');
	imageModal.setAttribute('aria-hidden', 'true');
	modalImage.src = '';
	modalImage.classList.remove('hidden');
	modalVideoLink.classList.add('hidden');
	modalVideoLink.textContent = '';
	document.body.style.overflow = '';
}

// Display a message in the gallery area
function showGalleryMessage(message) {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🔭</div>
			<p>${message}</p>
		</div>
	`;
}

async function getSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		showGalleryMessage('Please choose a start date and end date.');
		return;
	}

	if (startDate > endDate) {
		showGalleryMessage('Start date must be before end date.');
		return;
	}

	showGalleryMessage('Loading space images...');

	try {
		const url = `${APOD_URL}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error('Could not load data from NASA API.');
		}

		const data = await response.json();
		const items = Array.isArray(data) ? data : [data];

		gallery.innerHTML = '';

		if (items.length === 0) {
			showGalleryMessage('No APOD entries found for that date range. Try another range.');
			return;
		}

		// Newest entries first for easier browsing
		items.reverse().forEach((item) => {
			const card = createGalleryItem(item);
			gallery.appendChild(card);
		});
	} catch (error) {
		showGalleryMessage('Something went wrong while loading images. Please try again.');
	}
}

getImagesButton.addEventListener('click', getSpaceImages);

imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		closeModal();
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !imageModal.classList.contains('hidden')) {
		closeModal();
	}
});
