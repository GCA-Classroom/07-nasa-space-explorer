// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Get references to DOM elements
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

// Your NASA API key
const apiKey = 'ys3fIypeuvF7wBmjPcG19itadVqZO1vHA8k53lIk';

// Function to fetch images from NASA APOD API
const fetchImages = async (startDate, endDate) => {
  // Build the API URL with the selected dates
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;

  try {
    // Fetch data from NASA API
    const response = await fetch(url);
    const data = await response.json();

    // Clear the gallery before adding new images
    gallery.innerHTML = '';

    // Check if we got an array of images
    if (Array.isArray(data)) {
      // Loop through each image and add to gallery
      data.forEach(item => addImageCard(item));
    } else if (data.media_type === 'image') {
      addImageCard(data);
    } else {
      gallery.innerHTML = '<p>No images found for this date range.</p>';
    }
  } catch (error) {
    // Show error message if something goes wrong
    gallery.innerHTML = `<p>Error fetching images. Please try again.</p>`;
  }
};

// Create the modal HTML and add it to the page
const modal = document.createElement('div');
modal.id = 'imageModal';
modal.style.display = 'none'; // Hide modal by default
modal.innerHTML = `
  <div class="modal-content">
    <span class="close-button">&times;</span>
    <img id="modal-img" src="" alt="" />
    <h2 id="modal-title"></h2>
    <p id="modal-date"></p>
    <p id="modal-explanation"></p>
  </div>
`;
document.body.appendChild(modal);

// Function to open the modal with image details
function openModal(item) {
  // Set modal content using template literals
  const modalImg = document.getElementById('modal-img');
  modalImg.src = item.hdurl || item.url;
  modalImg.alt = item.title;

  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-date').textContent = item.date;
  document.getElementById('modal-explanation').textContent = item.explanation;

  // Show the modal (centered by CSS)
  modal.style.display = 'block';
}

// Function to close the modal
function closeModal() {
  modal.style.display = 'none';
}

// Close modal when clicking the close button
modal.querySelector('.close-button').onclick = closeModal;

// Close modal when clicking outside the modal content
modal.onclick = function(event) {
  if (event.target === modal) {
    closeModal();
  }
};

// Function to add an item (image or video) to the gallery
function addImageCard(item) {
  // If the entry is an image, show it as usual
  if (item.media_type === 'image') {
    const imgDiv = document.createElement('div');
    imgDiv.className = 'gallery-item';
    imgDiv.innerHTML = `
      <img src="${item.url}" alt="${item.title}" />
      <h3>${item.title}</h3>
      <p>${item.date}</p>
    `;
    // When clicked, open modal with image details
    imgDiv.onclick = () => openModal(item);
    gallery.appendChild(imgDiv);
  }
  // If the entry is a video, handle it for beginners
  else if (item.media_type === 'video') {
    const videoDiv = document.createElement('div');
    videoDiv.className = 'gallery-item';
    // Check if it's a YouTube video and embed it
    let videoEmbed = '';
    if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
      // Extract YouTube video ID for embedding
      let videoId = '';
      if (item.url.includes('youtube.com')) {
        const urlParams = new URLSearchParams(item.url.split('?')[1]);
        videoId = urlParams.get('v');
      } else if (item.url.includes('youtu.be')) {
        videoId = item.url.split('/').pop();
      }
      if (videoId) {
        videoEmbed = `
          <iframe width="100%" height="220" src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" allowfullscreen style="border-radius:8px; margin-bottom:10px;"></iframe>
        `;
      }
    }
    videoDiv.innerHTML = `
      <div style="font-size:2em; margin-bottom:8px;">🎬</div>
      ${videoEmbed}
      <h3>${item.title}</h3>
      <p>${item.date}</p>
      <a href="${item.url}" target="_blank" style="color:#e03c31; font-weight:bold;">
        Watch Video
      </a>
    `;
    gallery.appendChild(videoDiv);
  }
}

// Add event listener to the button
getImagesButton.addEventListener('click', () => {
  // Get the selected dates
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  // Check if both dates are selected
  if (startDate && endDate) {
    // Fetch and display images
    fetchImages(startDate, endDate);
  } else {
    gallery.innerHTML = '<p>Please select both start and end dates.</p>';
  }
});

// Beginner-friendly: Array of fun space facts
const spaceFacts = [
  "The footprints on the Moon will remain for millions of years.",
  "One million Earths could fit inside the Sun.",
  "A day on Venus is longer than its year.",
  "Neutron stars can spin 600 times per second.",
  "There are more trees on Earth than stars in the Milky Way.",
  "Jupiter has 92 known moons.",
  "Space is completely silent.",
  "The largest volcano in the solar system is on Mars.",
  "Saturn could float in water because it’s mostly gas.",
  "The International Space Station travels at 28,000 km/h."
];

// Pick a random fact from the array
const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

// Show the fact in the spaceFact div
const spaceFactDiv = document.getElementById('spaceFact');
if (spaceFactDiv) {
  // Only add "Did You Know?" once
  spaceFactDiv.innerHTML = `<strong>Did You Know?</strong> ${randomFact}`;
}
