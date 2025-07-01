// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Your NASA API key
const apiKey = 'V0e1Cf0uWMJaOj1PjDuRLN4EjsWuxjRdcn0UtlaO';

// Find the button by its text content ("Get Space Images")
// and the gallery container by its id
const fetchButton = Array.from(document.getElementsByTagName('button'))
  .find(btn => btn.textContent.trim() === 'Get Space Images');
const imageContainer = document.getElementById('gallery');

// Create a modal element and add it to the page (hidden by default)
const modal = document.createElement('div');
modal.id = 'imageModal';
modal.style.display = 'none';
modal.style.position = 'fixed';
modal.style.top = '0';
modal.style.left = '0';
modal.style.width = '100vw';
modal.style.height = '100vh';
modal.style.background = 'rgba(0,0,0,0.8)';
modal.style.justifyContent = 'center';
modal.style.alignItems = 'center';
modal.style.zIndex = '1000';
modal.innerHTML = `
  <div id="modalContent" style="background: #111; color: #fff; padding: 20px; border-radius: 8px; max-width: 90vw; max-height: 90vh; overflow: auto; text-align: center; position: relative;">
    <button id="closeModal" style="position: absolute; top: 10px; right: 10px; font-size: 1.5em; background: none; border: none; color: #fff; cursor: pointer;">&times;</button>
    <img id="modalImg" src="" alt="" style="max-width: 80vw; max-height: 60vh; border-radius: 8px; margin-bottom: 20px;" />
    <h2 id="modalTitle"></h2>
    <p id="modalDate" style="font-weight: bold;"></p>
    <p id="modalExplanation" style="margin-top: 10px;"></p>
  </div>
`;
document.body.appendChild(modal);

// Function to open the modal with image details
function openModal(item) {
  document.getElementById('modalImg').src = item.hdurl || item.url;
  document.getElementById('modalImg').alt = item.title;
  document.getElementById('modalTitle').textContent = item.title;
  document.getElementById('modalDate').textContent = item.date;
  document.getElementById('modalExplanation').textContent = item.explanation;
  modal.style.display = 'flex';
}

// Function to close the modal
function closeModal() {
  modal.style.display = 'none';
}

// Listen for close button click
modal.querySelector('#closeModal').addEventListener('click', closeModal);
// Also close modal when clicking outside the modal content
modal.addEventListener('click', function(event) {
  if (event.target === modal) closeModal();
});

// NASA "Did You Know?" facts
const nasaFacts = [
  "Did you know? NASA was founded in 1958.",
  "Did you know? The Hubble Space Telescope has been in orbit since 1990!",
  "Did you know? NASA’s Mars rovers have traveled over 45 kilometers on Mars.",
  "Did you know? The first American in space was Alan Shepard in 1961.",
  "Did you know? NASA’s logo is called the ‘meatball’.",
  "Did you know? The International Space Station orbits Earth every 90 minutes.",
  "Did you know? NASA’s Voyager 1 is the farthest human-made object from Earth.",
  "Did you know? NASA’s Artemis program aims to return humans to the Moon.",
  "Did you know? The James Webb Space Telescope launched in 2021.",
  "Did you know? NASA’s Perseverance rover landed on Mars in 2021."
];

function getRandomFact() {
  const i = Math.floor(Math.random() * nasaFacts.length);
  return nasaFacts[i];
}

// Function to fetch and display 9 NASA images based on selected date range
function fetchNasaImages() {
  // Show loading message and random fact
  imageContainer.innerHTML = `
    <div id="loadingMessage">Loading NASA images...</div>
    <div id="didYouKnow">${getRandomFact()}</div>
  `;

  // Get the selected start and end dates from the inputs
  const startDate = startInput.value;
  const endDate = endInput.value;

  // Build the API URL with the date range and API key
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;

  // Fetch the images from NASA's API
  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Clear any previous images or placeholders
      imageContainer.innerHTML = '';
      // Make sure we only show up to 9 images
      const imagesToShow = data.slice(0, 9);
      // Loop through each image and add it to the page
      imagesToShow.forEach(item => {
        if (item.media_type === 'image') {
          // Create a div for the gallery item
          const itemDiv = document.createElement('div');
          itemDiv.className = 'gallery-item';
          itemDiv.style.display = 'inline-block';
          itemDiv.style.margin = '10px';
          itemDiv.style.cursor = 'pointer';
          itemDiv.style.background = '#eee'; // Light grey background
          itemDiv.style.borderRadius = '8px';
          itemDiv.style.padding = '10px';
          itemDiv.style.width = '220px';
          itemDiv.style.boxSizing = 'border-box';
          // Create the image
          const img = document.createElement('img');
          img.src = item.url;
          img.alt = item.title;
          img.style.width = '200px';
          img.style.borderRadius = '6px';
          // Create the title and date
          const title = document.createElement('div');
          title.textContent = item.title;
          title.style.fontWeight = 'bold';
          title.style.margin = '8px 0 4px 0';
          title.style.color = 'red'; // Red text
          const date = document.createElement('div');
          date.textContent = item.date;
          date.style.fontSize = '0.9em';
          date.style.color = 'red'; // Red text
          // Add image, title, and date to the item div
          itemDiv.appendChild(img);
          itemDiv.appendChild(title);
          itemDiv.appendChild(date);
          // When clicked, open the modal with details
          itemDiv.addEventListener('click', () => openModal(item));
          // Add the item to the gallery
          imageContainer.appendChild(itemDiv);
        }
      });
      // If no images were found, show a message
      if (imageContainer.children.length === 0) {
        imageContainer.textContent = 'No images found for this date range.';
      }
    })
    .catch(error => {
      // Show an error message if something goes wrong
      imageContainer.innerHTML = 'Error fetching images.';
      console.error('Error fetching NASA images:', error);
    });
}

// Listen for button clicks to fetch images
fetchButton.addEventListener('click', fetchNasaImages);
