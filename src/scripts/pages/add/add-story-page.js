import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { addStory } from '../../../scripts/idb';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STORY_API = 'https://story-api.dicoding.dev/v1/stories';
const getToken = () => localStorage.getItem("auth_token");

export default {
  async render() {
    return `
      <section class="container add-page">
        <h2>Tambah Cerita Baru</h2>
        <form id="add-form" class="add-form">
          <div class="form-group">
            <label for="title">Judul Cerita</label>
            <input id="title" name="title" type="text" required />
          </div>
          <div class="form-group">
            <label for="description">Cerita</label>
            <textarea id="description" name="description" rows="4" required></textarea>
          </div>
          <div class="form-group">
            <label>Pilih/Gunakan Gambar</label>
            <input id="picture" name="picture" type="file" accept="image/*" />
            <button type="button" id="camera-btn">📷 Ambil Foto</button>
            <video id="camera-stream" autoplay playsinline style="display:none; width:100%; max-height:300px;"></video>
            <canvas id="snapshot" style="display:none;"></canvas>
            <img id="preview-img" style="display:none; width:100%; margin-top:10px; border-radius:8px;" />
          </div>
          <div class="form-group">
            <label>Pilih Lokasi Cerita di Peta</label>
            <div id="map" class="map" style="height:300px;"></div>
            <p>Latitude: <span id="lat-preview">-</span>, Longitude: <span id="lng-preview">-</span></p>
            <input id="lat" name="lat" type="hidden" />
            <input id="lng" name="lng" type="hidden" />
          </div>
          <button type="submit" class="btn-submit">Tambah Cerita</button>
          <p id="form-message" class="form-message"></p>
        </form>
      </section>
    `;
  },

  async afterRender() {
    const map = L.map('map').setView([-6.2, 106.816666], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    let marker = null;
    const latInput = document.querySelector('#lat');
    const lngInput = document.querySelector('#lng');
    const latPreview = document.querySelector('#lat-preview');
    const lngPreview = document.querySelector('#lng-preview');

    map.on('click', e => {
      const { lat, lng } = e.latlng;
      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map);
      latInput.value = lat;
      lngInput.value = lng;
      latPreview.textContent = lat.toFixed(6);
      lngPreview.textContent = lng.toFixed(6);
    });

    const form = document.querySelector('#add-form');
    const pictureInput = document.querySelector('#picture');
    const previewImg = document.querySelector('#preview-img');
    const message = document.querySelector('#form-message');
    const cameraBtn = document.querySelector('#camera-btn');
    const video = document.querySelector('#camera-stream');
    const canvas = document.querySelector('#snapshot');

    let imageFile = null;
    let stream = null;

    pictureInput.addEventListener('change', () => {
      const file = pictureInput.files[0];
      if (!file) return;
      imageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        previewImg.src = reader.result;
        previewImg.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });

    cameraBtn.addEventListener('click', async () => {
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          video.srcObject = stream;
          video.style.display = 'block';
          cameraBtn.textContent = '📸 Ambil Foto';
        } catch {
          alert('Tidak bisa mengakses kamera.');
        }
      } else {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg');
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--) u8arr[n] = bstr.charCodeAt(n);
        imageFile = new File([u8arr], 'camera.jpg', { type: mime });

        previewImg.src = dataURL;
        previewImg.style.display = 'block';
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.style.display = 'none';
        cameraBtn.textContent = '📷 Ambil Foto';
      }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      message.textContent = '';
      message.className = 'form-message';

      if (!latInput.value || !lngInput.value) {
        message.textContent = '⚠️ Pilih lokasi di peta.';
        message.classList.add('error');
        return;
      }

      const newStory = {
        id: Date.now(),
        title: form.title.value,
        description: form.description.value,
        lat: parseFloat(latInput.value),
        lon: parseFloat(lngInput.value),
        photoUrl: previewImg.src || ''
      };

      try {
        await addStory(newStory);
        console.log('Story berhasil disimpan di IndexedDB');
      } catch (err) {
        console.error('Gagal simpan ke IndexedDB', err);
      }

      try {
        const formData = new FormData();
        formData.append('description', newStory.description);
        formData.append('lat', newStory.lat);
        formData.append('lon', newStory.lon);
        if (imageFile) formData.append('photo', imageFile);

        const res = await fetch(STORY_API, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData
        });

        if (!res.ok) throw new Error('Gagal mengirim ke API');
        await res.json();
        message.textContent = '✅ Cerita berhasil dikirim ke API!';
        message.classList.add('success');
      } catch {
        message.textContent = '⚠️ Gagal mengirim ke API. Data tersimpan di browser.';
        message.classList.add('error');
      }

      form.reset();
      previewImg.style.display = 'none';
      if (marker) map.removeLayer(marker);
      latInput.value = '';
      lngInput.value = '';
      imageFile = null;
      if (stream) stream.getTracks().forEach(track => track.stop());

      window.location.hash = '/';
    });
  }
};
