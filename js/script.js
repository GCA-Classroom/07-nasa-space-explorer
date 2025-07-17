// Find our date picker inputs and button on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const button = document.querySelector('.filters button');

// Call the setupDateInputs function from dateRange.js
setupDateInputs(startInput, endInput);

// NASA API key and endpoint
const API_KEY = '3vbhPgf2SkAQ5hISfB583fN2fNVHe4craavCOTEc';
const API_URL = 'https://api.nasa.gov/planetary/apod';

// Array of fun "Did You Know?" space facts
const spaceFacts = [
  "One million Earths could fit inside the Sun!",
  "A day on Venus is longer than its year.",
  "Neutron stars can spin 600 times per second.",
  "There are more trees on Earth than stars in the Milky Way.",
  "Jupiter has 92 known moons!",
  "The footprints on the Moon will be there for millions of years.",
  "Space is completely silent.",
  "The hottest planet in our solar system is Venus.",
  "Saturn could float in water because it’s mostly gas.",
  "The largest volcano in the solar system is on Mars."
];

// Pick a random fact from the array
const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

// Show the heading and fact in the #space-fact section, each on its own line
const factSection = document.getElementById('space-fact');
if (factSection) {
  factSection.innerHTML = `
    <div class="space-fact-heading">Did You Know?</div>
    <div class="space-fact-text">${randomFact}</div>
  `;
}

// Listen for button click to fetch images
button.addEventListener('click', () => {
  // Get the selected dates
  const startDate = startInput.value;
  const endDate = endInput.value;

  // If dates are not selected, show an alert
  if (!startDate || !endDate) {
    alert('Please select both start and end dates.');
    return;
  }

  // Show a loading message before fetching images
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🚀</div>
      <p>Loading space photos…</p>
    </div>
  `;

  // Build the API URL with query parameters
  const url = `${API_URL}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;

  // Fetch images from NASA APOD API
  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Clear the gallery
      gallery.innerHTML = '';

      // If we get a single object, put it in an array
      const images = Array.isArray(data) ? data : [data];

      // Loop through each image and add to gallery
      images.forEach(item => {
        // Only show images (not videos)
        if (item.media_type === 'image') {
          // Create a div for each image
          const div = document.createElement('div');
          div.className = 'gallery-item';

          // Use template literals to build HTML
          div.innerHTML = `
            <img src="${item.url}" alt="${item.title}" />
            <p><strong>${item.title}</strong></p>
            <p>${item.date}</p>
          `;

          // Add click event to open modal with details
          div.addEventListener('click', () => {
            showModal(item);
          });

          // Add the image div to the gallery
          gallery.appendChild(div);
        }
      });

      // If no images found, show a message
      if (gallery.children.length === 0) {
        gallery.innerHTML = `
          <div class="placeholder">
            <div class="placeholder-icon">🚫</div>
            <p>No images found for this date range.</p>
          </div>
        `;
      }
    })
    .catch(error => {
      // Show error message
      gallery.innerHTML = `
        <div class="placeholder">
          <div class="placeholder-icon">⚠️</div>
          <p>Sorry, something went wrong. Please try again later.</p>
        </div>
      `;
      console.error('Error fetching NASA images:', error);
    });
});

// This function creates a popup view (modal) to show image details
function showModal(item) {
  // Create the background for the popup (modal)
  const modalBg = document.createElement('div');
  modalBg.className = 'modal-bg';

  // Create the popup content
  const modal = document.createElement('div');
  modal.className = 'modal';

  // Fill the popup with a larger image, title, date, and explanation
  modal.innerHTML = `
    <button class="modal-close">&times;</button>
    <img src="${item.url}" alt="${item.title}" class="modal-img" />
    <h2>${item.title}</h2>
    <p class="modal-date">${item.date}</p>
    <p class="modal-explanation">${item.explanation}</p>
  `;

  // Add the popup to the background
  modalBg.appendChild(modal);
  document.body.appendChild(modalBg);

  // Close the popup when clicking the close button
  modal.querySelector('.modal-close').addEventListener('click', () => {
    document.body.removeChild(modalBg);
  });

  // Close the popup when clicking outside the content
  modalBg.addEventListener('click', (event) => {
    if (event.target === modalBg) {
      document.body.removeChild(modalBg);
    }
  });
}