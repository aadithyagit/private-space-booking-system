// ========== CORE APP JS ==========

// ---- Toast ----
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = "toast", 3000);
}

// ---- Modal ----
function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
}
function hideModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}
window.addEventListener("click", e => {
  document.querySelectorAll(".modal-bg.open").forEach(m => {
    if (e.target === m) m.classList.remove("open");
  });
});

// ---- Nav ----
function toggleNav() {
  document.getElementById("mobileNav").classList.toggle("open");
}

// ---- Fake Auth ----
function fakeLogin() {
  localStorage.setItem("sbUser", JSON.stringify({ name: "Rajesh Kumar", email: "rajesh@example.com" }));
  hideModal("loginModal");
  showToast("✅ Logged in successfully!");
  setTimeout(() => location.reload(), 800);
}
function fakeRegister() {
  localStorage.setItem("sbUser", JSON.stringify({ name: "New User", email: "user@example.com" }));
  showToast("✅ Account created! Welcome to SpaceBook.");
  setTimeout(() => window.location.href = "user-dashboard.html", 1000);
}

// ---- Search ----
function doSearch() {
  const type = document.getElementById("sType")?.value || "";
  const city = document.getElementById("sCity")?.value || "";
  const date = document.getElementById("sDate")?.value || "";
  const guests = document.getElementById("sGuests")?.value || "";
  let url = `listings.html?type=${type}&city=${city}&date=${date}&guests=${guests}`;
  window.location.href = url;
}

// ---- Render Space Card ----
function renderCard(space) {
  return `
    <div class="listing-card" onclick="window.location.href='property.html?id=${space.id}'">
      <div class="card-img" style="cursor:pointer">${space.emoji}</div>
      <div class="card-body">
        <div class="card-meta">
          <span class="badge">${space.type}</span>
          <span class="badge green">${space.available ? "Available" : "Booked"}</span>
        </div>
        <h3>${space.name}</h3>
        <p>📍 ${space.city} &nbsp;•&nbsp; 👥 Up to ${space.capacity}</p>
        <div class="card-footer">
          <div class="card-price">₹${space.price.toLocaleString()} <small>/day</small></div>
          <div class="card-rating">⭐ ${space.rating} (${space.reviews})</div>
        </div>
      </div>
    </div>`;
}

// ---- Load Featured on Home ----
function loadFeatured() {
  const grid = document.getElementById("featuredGrid");
  if (!grid) return;
  grid.innerHTML = SPACES.slice(0, 6).map(renderCard).join("");
}

// ---- Get URL params ----
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key) || "";
}

// ---- Format currency ----
function fmt(n) { return "₹" + Number(n).toLocaleString("en-IN"); }

// ---- Format date ----
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ---- Status badge ----
function statusBadge(s) {
  const map = { confirmed: "status-confirmed", pending: "status-pending", cancelled: "status-cancelled" };
  return `<span class="status-badge ${map[s] || ''}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadFeatured();

  // Set today as min and today+1 month as max for all date inputs
  const today = new Date().toISOString().split("T")[0];
  const _maxD = new Date();
  _maxD.setMonth(_maxD.getMonth() + 1);
  const maxDate = _maxD.toISOString().split("T")[0];
  document.querySelectorAll('input[type=date]').forEach(i => { i.min = today; i.max = maxDate; });

  // Update nav if logged in
  const user = JSON.parse(localStorage.getItem("sbUser") || "null");
  const navAuth = document.querySelector(".nav-auth");
  if (user && navAuth) {
    navAuth.innerHTML = `
      <span style="font-size:13px;color:var(--text-muted)">Hi, ${user.name.split(" ")[0]}</span>
      <a href="user-dashboard.html" class="btn-primary">Dashboard</a>
      <button class="btn-outline" onclick="logout()">Logout</button>`;
  }
});

function logout() {
  localStorage.removeItem("sbUser");
  showToast("Logged out.");
  setTimeout(() => location.reload(), 600);
}
