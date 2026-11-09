// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.querySelector('.filters button');
const infoModal = document.getElementById('infoModal');
const modalDate = document.getElementById('modalDate');
const modalDescription = document.getElementById('modalDescription');
const closeModalButton = document.getElementById('closeModal');
const imagesPerPage = 100;
let imagesByDate = new Map();

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

getImagesButton.addEventListener('click', getSpaceImages);
closeModalButton.addEventListener('click', () => infoModal.close());

gallery.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const infoButton = event.target.closest('.info-button');

  if (infoButton) {
    const image = imagesByDate.get(infoButton.dataset.date);

    if (image) {
      modalDate.textContent = image.date;
      modalDescription.textContent = getPlainText(image.explanation) || 'No description is available for this image.';
      infoModal.showModal();
    }
  }
});

async function getSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate || startDate > endDate) {
    gallery.innerHTML = `
      <p class="placeholder">Choose a valid start and end date.</p>
    `;
    return;
  }

  gallery.innerHTML = `
    <p class="placeholder">Loading space images...</p>
  `;
  getImagesButton.disabled = true;

  try {
    const images = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const parameters = new URLSearchParams({
        per_page: imagesPerPage,
        page,
        orderby: 'date',
        order: 'desc'
      });
      const response = await fetch(`https://science.nasa.gov/wp-json/wp/v2/apod-basic?${parameters}`);

      if (!response.ok) {
        throw new Error(`NASA's API returned an error (${response.status}).`);
      }

      const pageImages = await response.json();

      if (!Array.isArray(pageImages)) {
        throw new Error('NASA returned data in an unexpected format.');
      }

      images.push(...pageImages.filter((image) => image.date >= startDate && image.date <= endDate));
      hasMorePages = pageImages.length === imagesPerPage && pageImages[pageImages.length - 1].date >= startDate;
      page += 1;
    }

    images.sort((firstImage, secondImage) => firstImage.date.localeCompare(secondImage.date));

    if (images.length === 0) {
      throw new Error('NASA did not return any images for those dates.');
    }

    imagesByDate = new Map(images.map((image) => [image.date, image]));
    gallery.innerHTML = images.map((image) => {
      // Use the high-resolution image when available; videos use their thumbnail.
      const imageUrl = image.media_type === 'video'
        ? image.thumbnail_url
        : image.hdurl || image.url;

      if (!image.date || !imageUrl || !imageUrl.startsWith('https://')) {
        throw new Error('NASA returned an item without a valid date or image.');
      }

      return `
        <div class="gallery-item">
          <img src="${escapeHtml(imageUrl)}" alt="Astronomy picture for ${escapeHtml(image.date)}" loading="lazy" />
          <p>${escapeHtml(image.date)}</p>
          <button class="info-button" type="button" data-date="${escapeHtml(image.date)}">info</button>
        </div>
      `;
    }).join('');
  } catch (error) {
    imagesByDate.clear();
    gallery.innerHTML = `
      <p class="placeholder">${escapeHtml(error.message)}</p>
    `;
  } finally {
    getImagesButton.disabled = false;
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const htmlCharacters = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return htmlCharacters[character];
  });
}

function getPlainText(html) {
  const parsedHtml = new DOMParser().parseFromString(html || '', 'text/html');
  return parsedHtml.body.textContent.trim();
}
