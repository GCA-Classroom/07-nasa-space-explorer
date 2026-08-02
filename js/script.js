// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const button = document.querySelector('button');
const gallery = document.getElementById('gallery');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const closeModalButton = document.getElementById('closeModal');

const API_KEY = 'cSc0eNRYHHBLUWsBcUG3alx8AKTEIzbHcnIE0zGg';
const spaceFacts = [
  'Did you know? Saturn has a moon named Titan, which has lakes and rivers made of liquid methane.',
  'Did you know? A day on Venus lasts longer than a year on Venus.',
  'Did you know? The Sun contains more than 99% of the mass in our solar system.',
  'Did you know? Jupiter has a storm that has been raging for hundreds of years called the Great Red Spot.',
  'Did you know? The Milky Way galaxy is about 100,000 light-years wide.'
];
const factSection = document.getElementById('factSection');

function showRandomFact() {
  const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

  if (factSection) {
    factSection.innerHTML = `
      <h2>Did You Know?</h2>
      <p>${randomFact}</p>
    `;
  }
}

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);
showRandomFact();

async function loadApod() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    gallery.innerHTML = '<p>Please choose a start and end date.</p>';
    return;
  }

  gallery.innerHTML = '<p>Loading images from NASA...</p>';

  try {
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`);
    const data = await response.json();

    if (data.error) {
      gallery.innerHTML = `<p>${data.error.message}</p>`;
      return;
    }

    if (!Array.isArray(data)) {
      gallery.innerHTML = '<p>No images available for that date range.</p>';
      return;
    }

    gallery.innerHTML = data
      .filter(function (item) {
        return item.url;
      })
      .map(function (item) {
        const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        let mediaContent = '';

        if (item.media_type === 'image') {
          mediaContent = `<img src="${item.url}" alt="${item.title}" />`;
        } else if (item.media_type === 'video') {
          mediaContent = `
            <div class="video-card">
              <p class="video-label">Video APOD</p>
              <a href="${item.url}" target="_blank" rel="noopener noreferrer">Watch video</a>
            </div>
          `;
        }

        return `
          <div class="gallery-item" data-title="${item.title}" data-date="${formattedDate}" data-explanation="${item.explanation}" data-url="${item.url}" data-media-type="${item.media_type}">
            ${mediaContent}
            <h2>${item.title}</h2>
            <p><strong>Date:</strong> ${formattedDate}</p>
          </div>
        `;
      })
      .join('');

    document.querySelectorAll('.gallery-item').forEach(function (card) {
      card.addEventListener('click', function () {
        if (card.dataset.mediaType === 'video') {
          modalImage.src = '';
          modalImage.alt = '';
          modalImage.style.display = 'none';
          modalTitle.textContent = card.dataset.title;
          modalDate.textContent = card.dataset.date;
          modalExplanation.innerHTML = `${card.dataset.explanation}<br><br><a href="${card.dataset.url}" target="_blank" rel="noopener noreferrer">Open video in a new tab</a>`;
        } else {
          modalImage.src = card.dataset.url;
          modalImage.alt = card.dataset.title;
          modalImage.style.display = 'block';
          modalTitle.textContent = card.dataset.title;
          modalDate.textContent = card.dataset.date;
          modalExplanation.textContent = card.dataset.explanation;
        }
        modal.classList.remove('hidden');
      });
    });
  } catch (error) {
    gallery.innerHTML = '<p>Unable to load images. Please try again later.</p>';
    console.error(error);
  }
}

button.addEventListener('click', loadApod);

closeModalButton.addEventListener('click', function () {
  modal.classList.add('hidden');
});

modal.addEventListener('click', function (event) {
  if (event.target === modal) {
    modal.classList.add('hidden');
  }
});



