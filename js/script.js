// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("getImageBtn");
  const gallery = document.getElementById("gallery");

  // Modal setup
  const modal = document.createElement("div");
  modal.id = "modal";
  modal.style.display = "none";
  modal.innerHTML = `
    <div id="modal-content">
      <span id="modal-close">&times;</span>
      <div id="modal-media"></div>
      <h2 id="modal-title"></h2>
      <p id="modal-date"></p>
      <p id="modal-expl"></p>
    </div>
  `;
  document.body.appendChild(modal);

  const closeModal = () => modal.style.display = "none";
  document.getElementById("modal-close")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  button.addEventListener("click", async () => {
    gallery.innerHTML = `<p style="text-align:center;">🔄 Loading space images...</p>`;

    try {
      const response = await fetch(apodData);
      const data = await response.json();

      // Use the most recent 9 items
      const items = data.slice(-9).reverse();
      gallery.innerHTML = "";

      items.forEach(item => {
        const card = document.createElement("div");
        card.className = "gallery-item";

        // Determine preview media
        let media;
        if (item.media_type === "image") {
          media = document.createElement("img");
          media.src = item.url;
          media.alt = item.title;
        } else {
          media = document.createElement("img");
          media.src = item.thumbnail_url || "img/video-placeholder.png";
          media.alt = item.title + " (video)";
        }

        const caption = document.createElement("p");
        caption.innerHTML = `<strong>${item.title}</strong><br>${item.date}`;

        card.appendChild(media);
        card.appendChild(caption);

        // Click to open modal
        card.addEventListener("click", () => {
          document.getElementById("modal-title").textContent = item.title;
          document.getElementById("modal-date").textContent = item.date;
          document.getElementById("modal-expl").textContent = item.explanation;

          const modalMedia = document.getElementById("modal-media");
          modalMedia.innerHTML = "";

          if (item.media_type === "image") {
            const img = document.createElement("img");
            img.src = item.hdurl || item.url;
            modalMedia.appendChild(img);
          } else {
            const iframe = document.createElement("iframe");
            iframe.src = item.url;
            iframe.allowFullscreen = true;
            iframe.width = "100%";
            iframe.height = "400px";
            modalMedia.appendChild(iframe);
          }

          modal.style.display = "block";
        });

        gallery.appendChild(card);
      });

    } catch (err) {
      console.error(err);
      gallery.innerHTML = `<p style="text-align:center;">❌ Failed to load data, try again.</p>`;
    }
  });
});
