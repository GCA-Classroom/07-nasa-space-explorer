// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.querySelector('.filters button');
const imageModal = document.getElementById('imageModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalDescription = document.getElementById('modalDescription');

const apiKey = 'CBEzZl8N3d18kcS9YhEFJ6kOTcGmmV4yRKuiO7gO';
const boxCount = 9;
const nasaFacts = [
	'The Sun contains about 99.8% of the mass in our solar system.',
	'One day on Venus is longer than one year on Venus.',
	'Neutron stars can spin hundreds of times each second.',
	'Jupiter has the shortest day of all planets, about 10 hours long.',
	'Light from the Sun takes about 8 minutes to reach Earth.',
	'The International Space Station orbits Earth about every 90 minutes.',
	'Saturn could float in water because its average density is very low.',
	'Mars has the largest volcano in the solar system, Olympus Mons.',
	'The Milky Way is estimated to contain over 100 billion stars.'
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Return one random fact from the list each time we render a card.
function getRandomNasaFact() {
	const randomIndex = Math.floor(Math.random() * nasaFacts.length);
	return nasaFacts[randomIndex];
}

function openImageModal(item) {
	if (!imageModal || !modalImage || !modalTitle || !modalDate || !modalDescription) {
		return;
	}

	modalImage.src = item.url;
	modalImage.alt = item.title;
	modalTitle.textContent = item.title;
	modalDate.textContent = `Date: ${item.date}`;
	modalDescription.textContent = item.explanation;
//d
	imageModal.classList.add('show');
	imageModal.setAttribute('aria-hidden', 'false');
	document.body.classList.add('modal-open');
}

function closeImageModal() {
	if (!imageModal) {
		return;
	}

	imageModal.classList.remove('show');
	imageModal.setAttribute('aria-hidden', 'true');
	document.body.classList.remove('modal-open');
}

function renderBoxes(items, message = 'Waiting for images...') {
	gallery.innerHTML = '';

	for (let i = 0; i < boxCount; i += 1) {
		const item = items[i];

		if (item) {
			const randomFact = getRandomNasaFact();
			const card = document.createElement('article');
			card.className = 'gallery-item image-card';
			card.dataset.url = item.url;
			card.dataset.title = item.title;
			card.dataset.date = item.date;
			card.dataset.explanation = item.explanation;
			card.innerHTML = `
				<img src="${item.url}" alt="${item.title}" />
				<h2>${item.title}</h2>
				<p class="apod-date">Date: ${item.date}</p>
				<p class="nasa-fact"><strong>NASA Did You Know?</strong> ${randomFact}</p>
			`;
			gallery.appendChild(card);
			continue;
		}

		// Fill extra slots so we always show exactly 9 boxes.
		const placeholderCard = document.createElement('article');
		placeholderCard.className = 'gallery-item box-placeholder';
		placeholderCard.innerHTML = `
			<div class="placeholder-icon">🛰️</div>
			<p>${message}</p>
		`;
		gallery.appendChild(placeholderCard);
	}
}

async function getSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		renderBoxes([], 'Select both dates first.');
		return;
	}

	const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 12000);

	try {
		renderBoxes([], 'Loading images...');

		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok) {
			let apiMessage = 'NASA API request failed.';

			try {
				const errorData = await response.json();
				apiMessage = errorData.msg || errorData.error?.message || apiMessage;
			} catch (jsonError) {
				// If the error body is not JSON, keep the default message.
			}

			throw new Error(`${response.status}: ${apiMessage}`);
		}

		const data = await response.json();
		const items = Array.isArray(data) ? data : [data];

		const imageItems = items
			.filter((item) => item.media_type === 'image')
			.sort((a, b) => a.date.localeCompare(b.date))
			.slice(0, boxCount);

		if (imageItems.length === 0) {
			renderBoxes([], 'No image results for this date range.');
			return;
		}

		renderBoxes(imageItems, 'No additional image for this slot yet.');
	} catch (error) {
		if (error.name === 'AbortError') {
			renderBoxes([], 'Request timed out. Please try again.');
			return;
		}

		if (error.message.startsWith('429')) {
			renderBoxes([], 'NASA API rate limit reached. Please wait and try again.');
			return;
		}

		if (error.message.startsWith('503')) {
			renderBoxes([], 'NASA API is temporarily unavailable. Try again soon.');
			return;
		}

		console.error('APOD fetch error:', error.message);
		renderBoxes([], `Could not load NASA images. ${error.message}`);
	} finally {
		clearTimeout(timeoutId);
	}
}

getImagesButton.addEventListener('click', getSpaceImages);

gallery.addEventListener('click', (event) => {
	const card = event.target.closest('.image-card');
	if (!card) {
		return;
	}

	openImageModal({
		url: card.dataset.url,
		title: card.dataset.title,
		date: card.dataset.date,
		explanation: card.dataset.explanation
	});
});

if (closeModalBtn) {
	closeModalBtn.addEventListener('click', closeImageModal);
}

if (imageModal) {
	imageModal.addEventListener('click', (event) => {
		if (event.target === imageModal) {
			closeImageModal();
		}
	});
}

document.addEventListener('keydown', (event) => {
	if (imageModal && event.key === 'Escape' && imageModal.classList.contains('show')) {
		closeImageModal();
	}
});

// Show nine starter boxes right away.
renderBoxes([], 'Pick dates and click "Get Space Images".');
