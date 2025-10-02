export default {
  async render() {
    return `
      <section class="container about-card">
        <h2>📖 Tentang Berbagi Cerita</h2>
        <p>Selamat datang di platform Berbagi Cerita, tempat kamu bisa membaca dan membagikan cerita menarik dari siapa saja!</p>
        <ul>
          <li>Membaca cerita dari user lain</li>
          <li>Menambahkan cerita sendiri</li>
          <li>Login dan register untuk pengalaman penuh</li>
        </ul>
      </section>
    `;
  },

  async afterRender() {
    // optional: bisa tambah script khusus
  }
};
