// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Get the button and gallery elements from the page
const button = document.querySelector('button');
const gallery = document.getElementById('gallery');

// Your NASA API key
const apiKey = '9G0pWsHrFeNPZBpcdLRZFSgyvzTKmrSjR1stYrcr';

// Listen for clicks on the button
button.addEventListener('click', () => {
  // Get the selected start and end dates
  const startDate = startInput.value;
  const endDate = endInput.value;

  // Build the API URL with the selected dates and your API key
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;

  // Show a loading message
  gallery.innerHTML = '<p>Loading images...</p>';

  // Fetch data from NASA's APOD API
  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Clear the gallery
      gallery.innerHTML = '';
      // Check if we got an array of images
      if (Array.isArray(data)) {
        // Sort the data by date (earliest first)
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        // Loop through each image and add it to the gallery
        data.forEach(item => {
          // Only show images (not videos)
          if (item.media_type === 'image') {
            // Create HTML for each image (explanation is hidden for now)
            const imageHtml = `
              <div class="gallery-item" style="cursor:pointer;">
                <img src="${item.url}" alt="${item.title}" />
                <h3>${item.title}</h3>
                <p>${item.date}</p>
                <!-- <p>${item.explanation}</p> -->
              </div>
            `;
            // Add the image to the gallery
            gallery.innerHTML += imageHtml;
          }
        });
        // Add click event listeners to gallery items to open modal
        const galleryItems = document.querySelectorAll('.gallery-item');
        let imageIndex = 0;
        data.forEach(item => {
          if (item.media_type === 'image') {
            const galleryItem = galleryItems[imageIndex];
            galleryItem.onclick = function() {
              showModal(item);
            };
            imageIndex++;
          }
        });
        // If no images were found, show a message
        if (gallery.innerHTML === '') {
          gallery.innerHTML = '<p>No images found for this date range.</p>';
        }
      } else {
        // If the API returns an error, show it
        gallery.innerHTML = `<p>Error: ${data.msg || 'Could not fetch images.'}</p>`;
      }
    })
    .catch(error => {
      // Show an error message if something goes wrong
      gallery.innerHTML = `<p>Error: ${error.message}</p>`;
    });
});

// Function to create and show the modal
function showModal(item) {
  // Check if modal already exists, if not, create it
  let modal = document.getElementById('imageModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <img class="modal-img" src="" alt="" />
        <h2 class="modal-title"></h2>
        <p class="modal-date"></p>
        <p class="modal-explanation"></p>
      </div>
    `;
    document.body.appendChild(modal);
  }
  // Set modal content
  modal.querySelector('.modal-img').src = item.hdurl || item.url;
  modal.querySelector('.modal-img').alt = item.title;
  modal.querySelector('.modal-title').textContent = item.title;
  modal.querySelector('.modal-date').textContent = item.date;
  modal.querySelector('.modal-explanation').textContent = item.explanation;
  // Show the modal
  modal.style.display = 'flex';
  // Close modal on button click
  modal.querySelector('.close-button').onclick = function() {
    modal.style.display = 'none';
  };
  // Close modal when clicking outside the content
  modal.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}
