// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const modal = document.getElementById('imageModal');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalCloseButton = document.getElementById('modalClose');

// Your NASA API key for this project
const API_KEY = 'cQIbgD9qm3yQqojnn2skKowrbbgnp1FdB86zqeB5';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

function showMessage(message) {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🔭</div>
			<p>${message}</p>
		</div>
	`;
}

function getYouTubeVideoId(videoUrl) {
	try {
		const url = new URL(videoUrl);

		if (url.hostname.includes('youtu.be')) {
			return url.pathname.slice(1);
		}

		if (url.hostname.includes('youtube.com')) {
			return url.searchParams.get('v') || '';
		}

		return '';
	} catch (error) {
		return '';
	}
}

function getVideoPreviewUrl(item) {
	if (item.thumbnail_url) {
		return item.thumbnail_url;
	}

	// If NASA does not provide a thumbnail, use YouTube's thumbnail when possible.
	const youtubeId = getYouTubeVideoId(item.url);
	return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '';
}

function createCard(item) {
	const card = document.createElement('article');
	card.className = 'gallery-item';
	card.setAttribute('role', 'button');
	card.setAttribute('tabindex', '0');

	const isVideo = item.media_type === 'video';
	const previewUrl = isVideo ? getVideoPreviewUrl(item) : item.url;
	const typeLabel = isVideo ? 'VIDEO' : 'IMAGE';
	const mediaMarkup = previewUrl
		? `<img src="${previewUrl}" alt="${item.title}" loading="lazy" />`
		: `<video class="gallery-video-preview" muted loop autoplay playsinline preload="metadata" aria-label="${item.title}">
			<source src="${item.url}" type="video/mp4" />
		</video>`;

	card.innerHTML = `
		<div class="gallery-media">
			${mediaMarkup}
			<span class="media-type-badge">${typeLabel}</span>
		</div>
		<p><strong>${item.title}</strong> (${item.date})</p>
	`;

	card.addEventListener('click', () => {
		openModal(item);
	});

	// Keyboard support for students using tab + enter
	card.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openModal(item);
		}
	});

	return card;
}

function getYouTubeEmbedUrl(videoUrl) {
	const videoId = getYouTubeVideoId(videoUrl);
	return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}

function openModal(item) {
	if (item.media_type === 'video') {
		const embedUrl = getYouTubeEmbedUrl(item.url);
		const previewUrl = getVideoPreviewUrl(item);

		if (embedUrl) {
			modalMedia.innerHTML = `
				<div class="modal-video-wrapper">
					<iframe
						src="${embedUrl}"
						title="${item.title}"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				</div>
				<p class="video-link"><a href="${item.url}" target="_blank" rel="noopener noreferrer">Open video in a new tab</a></p>
			`;
		} else {
			modalMedia.innerHTML = `
				<video class="modal-native-video" controls ${previewUrl ? `poster="${previewUrl}"` : ''}>
					<source src="${item.url}" type="video/mp4" />
					Your browser does not support embedded video.
				</video>
				<p class="video-link"><a href="${item.url}" target="_blank" rel="noopener noreferrer">Open video in a new tab</a></p>
			`;
		}
	} else {
		modalMedia.innerHTML = `<img src="${item.hdurl || item.url}" alt="${item.title}" />`;
	}

	modalTitle.textContent = item.title;
	modalDate.textContent = item.date;
	modalExplanation.textContent = item.explanation;

	modal.classList.remove('hidden');
	modal.setAttribute('aria-hidden', 'false');
	document.body.classList.add('modal-open');
}

function closeModal() {
	modal.classList.add('hidden');
	modal.setAttribute('aria-hidden', 'true');
	modalMedia.innerHTML = '';
	document.body.classList.remove('modal-open');
}

function renderGallery(apodData) {
	gallery.innerHTML = '';

	// Show newest items first
	const sortedData = [...apodData].sort((a, b) => b.date.localeCompare(a.date));

	sortedData.forEach((item) => {
		const card = createCard(item);
		gallery.appendChild(card);
	});
}

async function loadApodImages() {
	closeModal();

	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		showMessage('Please choose both a start date and an end date.');
		return;
	}

	if (startDate > endDate) {
		showMessage('Start date must be before the end date.');
		return;
	}

	showMessage('🔄 Loading space photos…');

	try {
		const url = `${APOD_URL}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Request failed with status ${response.status}`);
		}

		const data = await response.json();

		if (!Array.isArray(data) || data.length === 0) {
			showMessage('No results found for this date range. Try different dates.');
			return;
		}

		renderGallery(data);
	} catch (error) {
		console.error('Error loading APOD images:', error);
		showMessage('Could not load NASA images right now. Please try again.');
	}
}

getImagesButton.addEventListener('click', loadApodImages);

modalCloseButton.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
	if (event.target === modal) {
		closeModal();
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
		closeModal();
	}
});
