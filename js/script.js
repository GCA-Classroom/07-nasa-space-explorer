// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
setupDateInputs(startInput, endInput);

// Global variables for modals and elements
const modal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const modalVideo = document.getElementById("modal-video");
const modalTitle = document.getElementById("modal-title");
const modalDate = document.getElementById("modal-date");
const modalDescription = document.getElementById("modal-description");
const closeBtn = document.querySelector(".close");

// Close modal when clicking the X button
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    modalVideo.src = "";
  });
}

// Close modal when clicking anywhere outside the modal content
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
    modalVideo.src = "";
  }
});

// Fetch space images from NASA APOD API
async function fetchSpaceImages(startDate, endDate) {
  const apiKey = "DEMO_KEY"; 
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;
  
  const loadingElement = document.getElementById("loading");
  const galleryContainer = document.getElementById("gallery-container");
  
  if (loadingElement) loadingElement.style.display = "block";
  if (galleryContainer) galleryContainer.innerHTML = "";

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (loadingElement) loadingElement.style.display = "none";
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        createGalleryCard(item);
      });
    }
  } catch (error) {
    console.error("Error fetching NASA data:", error);
    if (loadingElement) loadingElement.style.display = "none";
  }
}

// Create individual gallery items
function createGalleryCard(item) {
  const galleryContainer = document.getElementById("gallery-container");
  if (!galleryContainer) return;

  const card = document.createElement("div");
  card.className = "gallery-card";

  // Handle images vs videos for LevelUp
  let mediaElement = "";
  if (item.media_type === "video") {
    mediaElement = `<iframe src="${item.url}" frameborder="0" allowfullscreen></iframe>`;
  } else {
    mediaElement = `<img src="${item.url}" alt="${item.title}">`;
  }

  card.innerHTML = `
    ${mediaElement}
    <div class="card-info">
      <h3>${item.title}</h3>
      <p>${item.date}</p>
    </div>
  `;

  // Open modal on click
  card.addEventListener("click", () => {
    modal.style.display = "block";
    modalTitle.textContent = item.title;
    modalDate.textContent = item.date;
    modalDescription.textContent = item.explanation;

    if (item.media_type === "video") {
      modalImage.style.display = "none";
      modalVideo.style.display = "block";
      modalVideo.src = item.url;
    } else {
      modalVideo.style.display = "none";
      modalImage.style.display = "block";
      modalImage.src = item.url;
    }
  });

  galleryContainer.appendChild(card);
}

// Display random fact on load (LevelUp)
function displayRandomFact() {
  const facts = [
    "A day on Venus is longer than a year on Venus.",
    "Neutron stars can spin at a rate of 600 rotations per second.",
    "There are more trees on Earth than stars in the Milky Way.",
    "The footprints left on the Moon by Apollo astronauts will stay there for millions of years."
  ];
  
  const factContainer = document.getElementById("fact-container");
  if (factContainer) {
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    factContainer.textContent = `Did you know? ${randomFact}`;
  }
}

// Initial load events
window.addEventListener("DOMContentLoaded", () => {
  displayRandomFact();
  
  const today = new Date().toISOString().split('T')[0];
  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() - 8);
  const startDate = dateObj.toISOString().split('T')[0];
  
  fetchSpaceImages(startDate, today);
});

// Add an event listener to the "Get Space Images" button
const submitBtn = document.getElementById("submit-btn"); 

if (submitBtn) {
  submitBtn.addEventListener("click", () => {
    const startDate = startInput.value;
    const endDate = endInput.value;
    
    if (startDate && endDate) {
      fetchSpaceImages(startDate, endDate);
    } else {
      alert("Please select both a start and end date!");
    }
  });
}
