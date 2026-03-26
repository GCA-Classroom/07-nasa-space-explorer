// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const funfacts = [
  'Venus is slower than its own year. Venus takes 243 Earth days to rotate once, but only 225 Earth days to orbit the Sun.',
  'In space, two clean pieces of the same metal can stick together permanently. This is called cold welding.',
  'Space is silent. Because it is a vacuum, sound waves cannot travel through it.',
  'There are more stars in the universe than grains of sand on all of Earth\'s beaches.',
  'Neutron stars are incredibly dense. A teaspoon of neutron star material would weigh about a billion tons, and some can spin up to 600 times each second.'
];
const funFactText = document.getElementById('funFactText');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Get the gallery and button elements from the page
const gallery = document.getElementById('gallery');
const getImagesButton = document.getElementById('getImagesButton');

// Get modal elements
const modal = document.getElementById('imageModal');
const closeButton = document.querySelector('.close');

// Store the current images data for the modal
let imagesData = [];

// Cache to store previously fetched images (to avoid rate limiting)
const imageCache = {};

// NASA API key
// DEMO_KEY works reliably on public deployments like GitHub Pages.
const NASA_API_KEY = 'DEMO_KEY';
const NASA_API_URL = 'https://api.nasa.gov/planetary/apod';

// Show one random fun fact each time the page loads/refreshed
function displayRandomFunFact() {
  if (!funFactText || funfacts.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * funfacts.length);
  funFactText.textContent = funfacts[randomIndex];
}

displayRandomFunFact();

// Function to fetch images from NASA APOD API
async function fetchSpaceImages(startDate, endDate) {
  try {
    // Create a cache key for this date range
    const cacheKey = `${startDate}-${endDate}`;
    
    // Check if we already have this data cached
    if (imageCache[cacheKey]) {
      console.log('Loading from cache...');
      displayGallery(imageCache[cacheKey]);
      return;
    }
    
    // Build the API URL with the date range
    const url = `${NASA_API_URL}?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;
    
    // Show a loading message
    gallery.innerHTML = '<p style="text-align: center; width: 100%;">Loading space images...</p>';
    
    // Fetch the data from NASA API
    const response = await fetch(url);
    
    // Check if the request was successful
    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 429) {
        throw new Error('API rate limit exceeded. The DEMO_KEY has strict limits. For better reliability, get your own free API key at https://api.nasa.gov/ and replace DEMO_KEY in the code.');
      } else if (response.status === 400) {
        throw new Error('Invalid date range. Please ensure dates are in the past and in valid format (YYYY-MM-DD).');
      } else {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
    }
    
    // Convert the response to JSON format
    const data = await response.json();
    
    // Store in cache for future use
    imageCache[cacheKey] = data;
    
    // Store the data for modal use
    imagesData = data;
    
    // Generate and display the gallery
    displayGallery(data);
  } catch (error) {
    // Show an error message if something goes wrong
    console.error('Error fetching images:', error);
    gallery.innerHTML = `<div style="text-align: center; width: 100%; padding: 20px; background-color: #fee; border-radius: 4px; color: #c33;">
      <p><strong>Error loading images:</strong></p>
      <p>${error.message}</p>
    </div>`;
  }
}

// Function to display the gallery of images
function displayGallery(images) {
  // Clear the gallery
  gallery.innerHTML = '';
  
  // Check if we have images to display
  if (!images || images.length === 0) {
    gallery.innerHTML = '<p style="text-align: center; width: 100%;">No images found for this date range.</p>';
    return;
  }
  
  // Loop through each image and create a gallery item
  images.forEach((image, index) => {
    // Helper to extract YouTube video IDs for thumbnail previews
    const getYouTubeId = (url) => {
      if (!url) return '';

      if (url.includes('youtube.com/watch')) {
        const parsedUrl = new URL(url);
        return parsedUrl.searchParams.get('v') || '';
      }

      if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1]?.split('?')[0] || '';
      }

      return '';
    };

    // Create a container for each gallery item
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    
    // Create the image element - some items might be videos, so check first
    let imageHTML = '';
    if (image.media_type === 'image') {
      imageHTML = `<img src="${image.url}" alt="${image.title}" loading="lazy" />`;
    } else if (image.media_type === 'video') {
      // For videos, show a thumbnail preview when possible instead of embedding
      const youtubeId = getYouTubeId(image.url);
      if (youtubeId) {
        imageHTML = `
          <div style="position: relative; width: 100%; height: 200px; overflow: hidden; border-radius: 4px;">
            <img src="https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg" alt="Video preview for ${image.title}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 48px; background: rgba(0,0,0,0.25);">▶</div>
          </div>
        `;
      } else {
        imageHTML = `<div style="width: 100%; height: 200px; background-color: #1a1a1a; display: flex; align-items: center; justify-content: center; color: white; border-radius: 4px;">Video preview unavailable</div>`;
      }
    }
    
    // Add HTML content to the gallery item
    // Include the image, title, date, and click for more info text
    galleryItem.innerHTML = `
      ${imageHTML}
      <p><strong>${image.title}</strong></p>
      <p style="font-size: 12px; color: #999;">${image.date}</p>
      <p style="font-size: 13px; margin-top: 8px;">
        <a href="${image.url}" target="_blank" rel="noopener noreferrer">${image.media_type === 'video' ? 'Watch video in new tab' : 'Open full image in new tab'}</a>
      </p>
      <p style="font-size: 13px; color: #999; cursor: pointer; margin-top: auto; padding-top: 10px;">Click for more information</p>
    `;
    
    // Add a click event listener to open the modal
    galleryItem.addEventListener('click', () => openModal(index));
    
    // Add the gallery item to the page
    gallery.appendChild(galleryItem);
  });
}

// Function to open the modal with image details
function openModal(imageIndex) {
  const image = imagesData[imageIndex];
  
  // Set the modal content
  document.getElementById('modalTitle').textContent = image.title;
  document.getElementById('modalDate').textContent = `Date: ${image.date}`;
  document.getElementById('modalExplanation').textContent = image.explanation;
  
  // Handle image or video display
  if (image.media_type === 'image') {
    // Display image
    document.getElementById('modalImage').style.display = 'block';
    document.getElementById('modalImage').src = image.url;
    document.getElementById('modalVideo').innerHTML = '';
  } else if (image.media_type === 'video') {
    // Instead of embedding, provide a reliable external link for videos
    document.getElementById('modalImage').style.display = 'none';
    document.getElementById('modalVideo').innerHTML = `
      <div style="background-color: #f7f7f7; border: 1px solid #e1e1e1; border-radius: 6px; padding: 16px; margin: 8px 0 14px;">
        <p style="margin-bottom: 10px; color: #555;">This video is opened outside the app to avoid embed blocking issues.</p>
        <a href="${image.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 14px; background-color: #0b3d91; color: #fff; text-decoration: none; border-radius: 4px;">Watch video in new tab</a>
      </div>
      <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
        Tip: If your browser blocks popups, allow popups for this page and click the button again.
      </p>
    `;
  }
  
  // Show the modal by adding the 'active' class
  modal.hidden = false;
  modal.classList.add('active');
  
  // Prevent scrolling on the body when modal is open
  document.body.style.overflow = 'hidden';
}

// Function to close the modal
function closeModal() {
  // Hide the modal by removing the 'active' class
  modal.classList.remove('active');
  modal.hidden = true;
  
  // Allow scrolling on the body again
  document.body.style.overflow = 'auto';
}

// Add click event listener to the close button
closeButton.addEventListener('click', closeModal);

// Close modal when clicking outside the modal content
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

// Add click event listener to the "Get Space Images" button
getImagesButton.addEventListener('click', () => {
  // Get the selected dates
  const startDate = startInput.value;
  const endDate = endInput.value;
  
  // Validate that we have valid dates
  if (!startDate || !endDate) {
    alert('Please select both a start and end date');
    return;
  }
  
  // Fetch the images for the selected date range
  fetchSpaceImages(startDate, endDate);
});

