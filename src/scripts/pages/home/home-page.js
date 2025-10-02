import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAllStories, deleteStory, saveStories, clearStories, getDeletedStories } from "../../idb";

const STORY_API = "https://story-api.dicoding.dev/v1";

function timeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now - past) / 1000);

  if (diff < 60) return `${diff} detik yang lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari yang lalu`;

  return past.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default {
  async render() {
    return `
      <section class="container">
        <h2>📖 Cerita Terbaru</h2>
        <input type="text" id="search-home" placeholder="Cari story..." class="search-input" />
        <div id="story-list" class="story-list"></div>
        <div id="map" style="height:300px;"></div>
      </section>
    `;
  },

  async afterRender() {
    const token = localStorage.getItem("auth_token");
    const storyList = document.querySelector("#story-list");
    const mapContainer = document.querySelector("#map");
    const searchInput = document.querySelector("#search-home");

    if (!token) {
      storyList.innerHTML = "<p>Silakan login untuk melihat cerita.</p>";
      mapContainer.style.display = "none";
      return;
    }

    let stories = [];

    try {
      if (navigator.onLine) {
        try {
          const res = await fetch(`${STORY_API}/stories`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (res.ok) {
            const data = await res.json()
            const online = Array.isArray(data.listStory) ? data.listStory : []

            if (online.length) {
              await saveStories(online)
            }
          } else {
            console.warn("Gagal fetch api: ", res.status)
          }
        } catch (err) {
          console.warn("fetch error: ", err)
        }
      }

      stories = await getAllStories()
      const deleted = await getDeletedStories();
      const deletedIds = deleted.map(d => d.id);

      stories = stories.filter(story => !deletedIds.includes(story.id.toString()));


      if (stories.length === 0) {
        storyList.innerHTML = "<p>Belum ada cerita.</p>";
        mapContainer.style.display = "none";
        return;
      }

      stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const renderStories = (list) => {
        if (!list || list.length === 0) {
          storyList.innerHTML = "<p>Tidak ada story yang cocok.</p>";
          return;
        }

        storyList.innerHTML = list
          .map(
            (story) => `
            <article class="story-item" data-id="${story.id}" data-offline="${story.offline}">
              <a href="#/detail/${story.id}"?>
                <img src="${story.photoUrl || "https://via.placeholder.com/150"
                  }" alt="Foto ${story.name}" />
                <div class="story-info">
                  <h3 class="story-title">${story.name}</h3>
                  <p>${story.description || "-"}</p>
                  <small class="story-time">🕒 ${timeAgo(story.createdAt)}</small>
                  <button type="button" class="delete-btn" data-id="${story.id}">Hapus</button>
                </div>
              </a>
            </article>
          `
          )
          .join("");
      };

      renderStories(stories);

      storyList.addEventListener("click", async (event) => {
        const item = event.target.closest(".story-item");
        if (!item) return;

        const id = item.dataset.id;

        if (event.target.classList.contains("delete-btn")) {
          event.stopPropagation();
          if (!confirm("Apakah yakin ingin menghapus story ini?")) return;

          try {
            await deleteStory(id);
            alert("Story berhasil dihapus!");

            stories = stories.filter((s) => s.id.toString() !== id);
            renderStories(stories);
          } catch (err) {
            console.error("Gagal menghapus story", err);
            alert("Gagal menghapus story!");
          }
        }
      });

      searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = stories.filter((story) =>
          (story.name || "").toLowerCase().includes(keyword)
        );
        renderStories(filtered);
      });

      if (mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null;
        mapContainer.innerHTML = "";
      }

      const map = L.map("map").setView([-6.200000, 106.816666], 5); // default Indonesia
      const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);
      const satellite = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenTopoMap contributors"
      });

      const baseMaps = {
        "Street Map": street,
        "Satellite": satellite
      };
      L.control.layers(baseMaps).addTo(map);

      const markers = {};

      stories.forEach(story => {
        if (story.lat && story.lon) {
          const marker = L.marker([story.lat, story.lon]).addTo(map);
          marker.bindPopup(`
            <b>${story.title}</b><br>
            ${story.description}
          `);

          markers[story.id] = marker;

          marker.on("click", () => {
            document.querySelectorAll(".story-item")
              .forEach(i => i.classList.remove("active-item"));

            const el = document.querySelector(`.story-item[data-id="${story.id}"]`);
            if (el) {
              el.classList.add("active-item");
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });
        }
      });


    } catch (err) {
      storyList.innerHTML = `<p>⚠️ Gagal memuat cerita: ${err.message}</p>`;
      mapContainer.style.display = "none";
      stories = await getAllStories()
    }
  },
};
