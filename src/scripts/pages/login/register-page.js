const STORY_API = "https://story-api.dicoding.dev/v1";

export default {
  async render() {
    return `
      <section class="container register-page">
        <h1>📝 Register</h1>
        <form id="register-form" class="register-form">
          <div class="form-group">
            <label for="name">Nama</label>
            <input id="name" name="name" type="text" placeholder="Nama lengkap" required />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="email@example.com" required />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" placeholder="••••••" required />
          </div>

          <button type="submit" class="btn-submit">Register</button>
          <p id="register-message" class="form-message"></p>
        </form>
        <p style="text-align:center; margin-top:1rem;">
          Sudah punya akun? <a href="#/login">Login di sini</a>
        </p>
      </section>
    `;
  },

  async afterRender() {
    const token = localStorage.getItem("auth_token");

    if (token) {
      window.location.hash = "/";
      setTimeout(() => window.dispatchEvent(new HashChangeEvent("hashchange")), 100);
      return;
    }

    const form = document.querySelector("#register-form");
    const message = document.querySelector("#register-message");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      message.textContent = "";
      message.className = "form-message";

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value.trim();

      if (!name || !email || !password) {
        message.textContent = "⚠️ Semua field wajib diisi.";
        message.classList.add("error");
        return;
      }

      // Loading state
      const submitButton = form.querySelector(".btn-submit");
      submitButton.disabled = true;
      submitButton.textContent = "Loading... ⏳";

      try {
        const res = await fetch(`${STORY_API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Register gagal");

        message.textContent = "✅ Register berhasil! Silakan login.";
        message.classList.add("success");

        setTimeout(() => {
          window.location.hash = "/login";
          setTimeout(() => window.dispatchEvent(new HashChangeEvent("hashchange")), 100);
        }, 1000);

      } catch (err) {
        message.textContent = `⚠️ ${err.message}`;
        message.classList.add("error");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Register";
      }
    });
  },
};
