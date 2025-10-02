const STORY_API = "https://story-api.dicoding.dev/v1";

export default {
  async render() {
    return `
      <section class="container login-page">
        <h1>🔑 Login</h1>
        <form id="login-form" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="email@example.com" required />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" placeholder="••••••" required />
          </div>

          <button type="submit" class="btn-submit">Login</button>
          <p id="login-message" class="form-message"></p>
        </form>
        <p style="text-align:center; margin-top:1rem;">
          Belum punya akun? <a href="#/register">Register di sini</a>
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

    const form = document.querySelector("#login-form");
    const message = document.querySelector("#login-message");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      message.textContent = "";
      message.className = "form-message";

      const email = form.email.value.trim();
      const password = form.password.value.trim();

      if (!email || !password) {
        message.textContent = "⚠️ Email dan password wajib diisi.";
        message.classList.add("error");
        return;
      }

      // Loading state
      const submitButton = form.querySelector(".btn-submit");
      submitButton.disabled = true;
      submitButton.textContent = "Logging in... ⏳";

      try {
        const res = await fetch(`${STORY_API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Login gagal");

        localStorage.setItem("auth_token", data.loginResult.token);
        localStorage.setItem("user_name", data.loginResult.name);
        localStorage.setItem("user_email", email);

        message.textContent = "✅ Login berhasil! Mengalihkan...";
        message.classList.add("success");

        setTimeout(() => {
          window.location.hash = "/";
          setTimeout(() => window.dispatchEvent(new HashChangeEvent("hashchange")), 100);
        }, 800);

      } catch (err) {
        message.textContent = `⚠️ ${err.message}`;
        message.classList.add("error");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Login";
      }
    });
  },
};
