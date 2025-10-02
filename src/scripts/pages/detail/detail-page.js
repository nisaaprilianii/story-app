import { addStory } from "../../../scripts/idb";

const STORY_API = "https://story-api.dicoding.dev/v1";

export default {
  async render() {
    return `
      <section class="container detail-page">
        <div id="story-detail" class="detail-card">
          <p>Loading...</p>
        </div>
        <button id="back-button" class="btn-back">⬅ Kembali ke Beranda</button>
      </section>
    `;
  },

  async afterRender() {
    const { id } = window.location.hash.match(/\/detail\/(.+)/)
      ? { id: window.location.hash.split("/detail/")[1] }
      : {};

    const detailContainer = document.getElementById("story-detail");

    const backButton = document.getElementById("back-button");
    backButton.addEventListener("click", () => {
      window.location.hash = "/";
    });

    if (!id) {
      detailContainer.innerHTML = "<p>Story tidak ditemukan.</p>";
      return;
    }

    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`${STORY_API}/stories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengambil detail story");

      const story = data.story;

      detailContainer.innerHTML = `
        <img 
          src="${story?.photoUrl || 'https://via.placeholder.com/300'}" 
          alt="${story?.name || 'Story'}"
          class="detail-img"
        />
        <div class="detail-info">
          <h1 class="detail-title">${story.name}</h1>
          <p><strong>Deskripsi:</strong></p>
          <p class="desc">${story.description}</p>
          <p><strong>Lokasi:</strong> ${story.lat}, ${story.lon}</p>
        </div>
      `;
    } catch (err) {
      detailContainer.innerHTML = `<p>⚠️ ${err.message}</p>`;
    }
  },
};
