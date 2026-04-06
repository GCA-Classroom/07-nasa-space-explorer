// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const fetchButton = document.querySelector('button');
const gallery = document.getElementById('gallery');
const modal = document.getElementById('imageModal');
const modalCloseButton = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const spaceFactText = document.getElementById('spaceFactText');

let currentImageItems = [];

// Your personal NASA API key
const apiKey = 'd7kQnA7D3ekxe6nr2h4eFvyQeJUV3Q5uM1lpgbbU';

// Base APOD endpoint
const apodUrl = 'https://api.nasa.gov/planetary/apod';

// Fun space facts shown above the gallery
const spaceFacts = [
	'One day on Venus is longer than one year on Venus.',
	'Jupiter has the shortest day of all planets: about 10 hours.',
	'Neutron stars are so dense that one teaspoon of material would weigh billions of tons on Earth.',
	'The footprints astronauts left on the Moon can last for millions of years.',
	'The International Space Station orbits Earth about every 90 minutes.',
	'Saturn could float in water because its average density is lower than water.'
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Show one random fact each time the page loads
function showRandomSpaceFact() {
	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	spaceFactText.textContent = spaceFacts[randomIndex];
}

showRandomSpaceFact();

// Build one gallery card for each APOD item
function createGalleryCard(item, index) {
	return `
		<article class="gallery-item" data-index="${index}">
			<img src="${item.url}" alt="${item.title}" />
			<p><strong>${item.title}</strong></p>
			<p>${item.date}</p>
		</article>
	`;
}

// Show temporary status text while data loads
function showStatus(message) {
	currentImageItems = [];
	gallery.innerHTML = `
		<div class="placeholder">
			<p>${message}</p>
		</div>
	`;
}

// Fill and show the modal with one APOD item
function openModal(item) {
	modalImage.src = item.hdurl || item.url;
	modalImage.alt = item.title;
	modalTitle.textContent = item.title;
	modalDate.textContent = item.date;
	modalExplanation.textContent = item.explanation;

	modal.classList.remove('hidden');
	modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
	modal.classList.add('hidden');
	modal.setAttribute('aria-hidden', 'true');
	modalImage.src = '';
}

// Fetch APOD data for selected date range and render results
function getSpaceImages() {
	showStatus('Loading space images...');

	const startDate = startInput.value;
	const endDate = endInput.value;

	// Prevent invalid requests before calling the API
	if (startDate > endDate) {
		showStatus('Start date cannot be after end date.');
		return;
	}

	// The APOD API accepts start_date and end_date query parameters
	fetch(`${apodUrl}?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`)
		.then((response) => {
			if (!response.ok) {
				throw new Error('Could not fetch APOD data. Please try again.');
			}

			return response.json();
		})
		.then((data) => {
			// Sometimes APOD returns videos. This app displays image entries only.
			const imageItems = data.filter((item) => item.media_type === 'image');

			if (imageItems.length === 0) {
				showStatus('No images found for that date range. Try a different range.');
				return;
			}

			// Newest first makes the gallery feel more natural for users
			imageItems.reverse();
			currentImageItems = imageItems;

			gallery.innerHTML = imageItems.map(createGalleryCard).join('');
		})
		.catch((error) => {
			showStatus(error.message);
		});
}

// Open modal when a user clicks any gallery card
gallery.addEventListener('click', (event) => {
	const clickedCard = event.target.closest('.gallery-item');

	if (!clickedCard) {
		return;
	}

	const index = Number(clickedCard.dataset.index);
	const selectedItem = currentImageItems[index];

	if (!selectedItem) {
		return;
	}

	openModal(selectedItem);
});

// Close modal with close button
modalCloseButton.addEventListener('click', closeModal);

// Close modal when user clicks the dark background area
modal.addEventListener('click', (event) => {
	if (event.target.dataset.close === 'true') {
		closeModal();
	}
});

// Close modal with Escape key for better usability
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
		closeModal();
	}
});

// Run the API request when the user clicks the button
fetchButton.addEventListener('click', getSpaceImages);
