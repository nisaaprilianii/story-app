import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

class App {
  #content;
  #drawerButton;
  #navigationDrawer;

  constructor({ content, drawerButton, navigationDrawer }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#setupDrawer();
    this.renderNavbar(); 
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });
  }

  renderNavbar() {
    const navList = this.#navigationDrawer.querySelector('.nav-list');
    if (!navList) return;

    const token = localStorage.getItem("auth_token");
    let html = `
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/about">About</a></li>
    `;

    if (token) {
      html += `
        <li><a href="#/add">Tambah Data</a></li>
        <li><a href="#" id="logout-link">Logout</a></li>
      `;
    } else {
      html += `<li><a href="#/login">Login</a></li>`;
    }

    navList.innerHTML = html;

    // ===== Tombol toggle push notification =====
    let toggleButton = this.#navigationDrawer.querySelector('#toggle-push');
    if (!toggleButton) {
      toggleButton = document.createElement('button');
      toggleButton.id = 'toggle-push';
      toggleButton.className = 'btn-toggle-push';
      toggleButton.innerHTML = '🔔';
      this.#navigationDrawer.appendChild(toggleButton);
    }

    // Tombol selalu tampil
    toggleButton.style.display = 'inline-block';

    // update tooltip sesuai status push
    const updateTooltip = () => {
      toggleButton.setAttribute(
        'title',
        localStorage.getItem('push_enabled') === 'true' ? 'Nonaktifkan Notifikasi' : 'Aktifkan Notifikasi'
      );
    };
    updateTooltip();

    // pastikan hanya satu listener
    toggleButton.replaceWith(toggleButton.cloneNode(true));
    toggleButton = this.#navigationDrawer.querySelector('#toggle-push');
    toggleButton.addEventListener('click', async () => {
      if (window.togglePushNotification) await window.togglePushNotification();
      updateTooltip();
    });

    // handle logout
    const logoutLink = document.querySelector("#logout-link");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        this.renderNavbar(); 
        window.location.hash = "/";
        setTimeout(() => window.dispatchEvent(new HashChangeEvent("hashchange")), 100);
      });
    }
  }

  async renderPage() {
    const route = getActiveRoute();
    const page = routes[route];

    if (this.#content.innerHTML) {
      this.#content.classList.remove('fade-in');
      this.#content.classList.add('fade-out');
      await new Promise((res) => setTimeout(res, 300)); 
    }

    this.#content.innerHTML = await page.render();
    await page.afterRender();

    this.#content.classList.remove('fade-out');
    this.#content.classList.add('fade-in');

    this.renderNavbar(); // refresh navbar setelah render page
  }
}

export default App;
