// ==========================================
// 🌐 Connect Frontend to Live Backend (MySQL)
// ==========================================
const API_BASE = "http://localhost:3000/api";

/* ---------- Utilities ---------- */
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function toast(msg, timeout = 2600) {
  let t = document.getElementById("site-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "site-toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), timeout);
}

/* ---------- Home Page Floating Paw ---------- */
function initHome() {
  const pawContainer = qs(".paw-floating-area");
  if (!pawContainer) return;
  for (let i = 0; i < 12; i++) {
    const d = document.createElement("div");
    d.style.position = "absolute";
    d.style.opacity = "0.12";
    d.style.fontSize = Math.random() * 36 + 18 + "px";
    d.style.top = Math.random() * 100 + "%";
    d.style.left = Math.random() * 100 + "%";
    d.style.transform = "translate(-50%,-50%)";
    d.innerHTML = "🐾";
    pawContainer.appendChild(d);
  }
}

/* ---------- PETS PAGE ---------- */
async function fetchPets() {
  const res = await fetch(`${API_BASE}/pets`);
  if (!res.ok) throw new Error("Failed to load pets");
  return res.json();
}

function renderPetCard(pet) {
  const imageSrc = pet.Image_URL && pet.Image_URL.trim() !== ""
    ? pet.Image_URL
    : "images/default.jpg";

  const wrap = document.createElement("div");
  wrap.className = "card";
  wrap.style.margin = "12px";
  wrap.innerHTML = `
    <div>
      <img src="${imageSrc}" alt="${pet.Name}" style="width:100%;height:220px;object-fit:cover;border-radius:8px">
    </div>
    <div class="card-body">
      <div class="space-between">
        <h3>${pet.Name}</h3>
        <span class="badge">${pet.Category}</span>
      </div>
      <p class="small">🐾 <strong>Breed:</strong> ${pet.Breed || "-"} • 🎂 <strong>Age:</strong> ${pet.Age || "-"}</p>
      <div style="margin-top:12px">
        <a href="pet-detail.html?id=${pet.Pet_ID}" class="btn btn-primary" style="display:block;text-align:center">✨ View Details</a>
      </div>
    </div>
  `;
  return wrap;
}

async function initPetsPage() {
  const petsRoot = qs("#pets-grid");
  if (!petsRoot) return;

  const searchEl = qs("#search-input");
  const catEl = qs("#category-select");

  async function populate() {
    try {
      const all = await fetchPets();
      console.log("🐾 Loaded pets:", all);
      const term = (searchEl.value || "").toLowerCase();
      const cat = catEl.value;
      const filtered = all.filter(p => {
        const matchesSearch =
          (p.Name || "").toLowerCase().includes(term) ||
          (p.Breed || "").toLowerCase().includes(term);
        const matchesCategory = cat === "all" || p.Category === cat;
        return matchesSearch && matchesCategory;
      });

      petsRoot.innerHTML = "";
      if (filtered.length === 0) {
        petsRoot.innerHTML = `<div class="center p-8"><p class="small">No pets found 😢</p></div>`;
        return;
      }
      filtered.forEach(p => petsRoot.appendChild(renderPetCard(p)));
    } catch (err) {
      console.error("❌ Error fetching pets:", err);
      petsRoot.innerHTML = `<p style="text-align:center;color:red;margin-top:20px;">Failed to load pets.</p>`;
    }
  }

  searchEl.addEventListener("input", populate);
  catEl.addEventListener("change", populate);
  populate();
}

/* ---------- PET DETAIL PAGE ---------- */
function getQueryParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

async function fetchPetById(id) {
  const res = await fetch(`${API_BASE}/pets/${id}`);
  if (!res.ok) throw new Error("Pet not found");
  return res.json();
}

function getUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

async function initPetDetailPage() {
  const id = getQueryParam("id");
  if (!id) return;

  const pet = await fetchPetById(id);
  qs("#pet-name").textContent = pet.Name;
  qs("#pet-category").textContent = pet.Category;
  qs("#pet-desc").textContent = pet.Description || "No description available.";
  qs("#pet-image").src = pet.Image_URL || "images/default.jpg";
  qs("#pet-age").textContent = pet.Age || "";
  qs("#pet-breed").textContent = pet.Breed || "";
  qs("#pet-gender").textContent = pet.Gender || "";
  qs("#pet-weight").textContent = pet.Weight || "--";
  qs("#pet-health").textContent = pet.Health_Status || "--";

  const adoptForm = qs("#adopt-form");
  adoptForm.addEventListener("submit", async e => {
    e.preventDefault();

    const user = getUser();
    if (!user) return toast("⚠️ Please login first!");

    const contact = qs("#adopter-contact").value.trim();
    const reason = qs("#adopter-reason").value.trim();
    if (!contact || !reason) return toast("⚠️ Please fill in all fields");

    try {
      const res = await fetch(`${API_BASE}/adoptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adopter_id: user.Adopter_ID,
          pet_id: pet.Pet_ID,
          contact_number: contact,
          reason
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast(data.error || "❌ Failed to submit request");
        return;
      }
      toast("🎉 Adoption request submitted!");
      setTimeout(() => window.location.href = "my-adoptions.html", 1200);
    } catch (err) {
      console.error("Adoption error:", err);
      toast("❌ Unable to connect to server.");
    }
  });
}

/* ---------- MY ADOPTIONS PAGE ---------- */
async function initMyAdoptionsPage() {
  const user = getUser();
  if (!user) return toast("⚠️ Please login first!");

  const res = await fetch(`${API_BASE}/adoptions?adopter_id=${user.Adopter_ID}`);
  const adoptions = await res.json();

  const root = qs("#my-adoptions-root");
  if (!root) return;
  root.innerHTML = "";

  if (adoptions.length === 0) {
    root.innerHTML = `<div class="card p-8 center"><p class="small">You haven't submitted any adoption requests yet</p><a href="pets.html" class="btn btn-primary mt-8">🐾 Browse Available Pets</a></div>`;
    return;
  }

  adoptions.forEach(r => {
    const div = document.createElement("div");
    div.className = "card p-8";
    div.innerHTML = `
      <div class="flex" style="gap:14px;align-items:center">
        <div style="width:120px;height:120px;flex-shrink:0;overflow:hidden;border-radius:12px">
          <img src="${r.petImage || "images/default.jpg"}" style="width:100%;height:100%;object-fit:cover">
        </div>
        <div style="flex:1">
          <div class="space-between">
            <h3>${r.petName} 🐾</h3>
            <span class="badge">${r.Status}</span>
          </div>
          <p class="small text-muted">Submitted: ${r.Adoption_Date}</p>
          <p class="small"><strong>Reason:</strong> ${r.Reason || "N/A"}</p>
        </div>
      </div>
    `;
    root.appendChild(div);
  });
}

/* ---------- LOGIN / REGISTER ---------- */
async function initLoginPage() {
  const form = qs("#login-form");
  if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const email = qs("#login-email").value.trim();
    if (!email) return toast("⚠️ Please enter your email");

    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok || !data.success) return toast(data.message || "❌ Invalid login");

      localStorage.setItem("user", JSON.stringify(data.user));
      toast("✨ Login successful!");
      setTimeout(() => window.location.href = "pets.html", 1000);
    } catch (err) {
      console.error("Login error:", err);
      toast("❌ Unable to connect to server.");
    }
  });
}

async function initRegisterPage() {
  const form = qs("#register-form");
  if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = qs("#reg-name").value.trim();
    const email = qs("#reg-email").value.trim();
    const phone = qs("#reg-phone")?.value || "";
    const address = qs("#reg-address")?.value || "";
    if (!name || !email) return toast("⚠️ Please fill in all fields");

    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, address })
      });
      const data = await res.json();
      if (!res.ok || !data.success) return toast(data.error || "❌ Registration failed");

      toast("🎉 Registered successfully! Redirecting...");
      setTimeout(() => window.location.href = "login.html", 1200);
    } catch (err) {
      console.error("Register error:", err);
      toast("❌ Unable to connect to server.");
    }
  });
}

/* ---------- CARE TIPS ---------- */
const CARE_TIPS = {
  dog: [
    { category: "Feeding", emoji: "🍖", tips: [{ title: "Balanced Diet", description: "Feed high-quality dog food appropriate for age and activity." }] },
    { category: "Grooming", emoji: "✂️", tips: [{ title: "Brushing", description: "Brush regularly to remove loose hair and dirt." }] }
  ],
  cat: [
    { category: "Feeding", emoji: "🍽️", tips: [{ title: "Protein-Rich Diet", description: "Cats need high animal protein." }] },
    { category: "Grooming", emoji: "🐈", tips: [{ title: "Brushing", description: "Long-haired cats should be brushed daily." }] }
  ],
  bird: [
    { category: "Feeding", emoji: "🥜", tips: [{ title: "Varied Diet", description: "Pellets + fresh veggies and fruits for variety." }] }
  ]
};

function initCareTips() {
  const tabs = qs("#care-tabs");
  if (!tabs) return;
  const content = qs("#care-content");
  const tabButtons = qsa(".tab");
  function render(type) {
    tabButtons.forEach(b => b.classList.toggle("active", b.dataset.type === type));
    content.innerHTML = "";
    (CARE_TIPS[type] || []).forEach(cat => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div style="padding:16px;background:linear-gradient(90deg,#34d399,#06b6d4);color:white">
          <h3 style="margin:0">${cat.emoji} ${cat.category}</h3>
        </div>
        <div style="padding:16px">
          ${cat.tips.map(t => `<div class="accordion-item"><div class="accordion-title">${t.title}</div><div class="small text-muted">${t.description}</div></div>`).join("")}
        </div>`;
      content.appendChild(card);
    });
  }
  tabButtons.forEach(b => b.addEventListener("click", () => render(b.dataset.type)));
  render("dog");
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initHome();
  initCareTips();
  if (document.body.classList.contains("page-pets")) initPetsPage();
  if (document.body.classList.contains("page-pet-detail")) initPetDetailPage();
  if (document.body.classList.contains("page-my-adoptions")) initMyAdoptionsPage();
  if (document.body.classList.contains("page-login")) initLoginPage();
  if (document.body.classList.contains("page-register")) initRegisterPage();

  const user = getUser();
  if (user) qsa(".nav-user").forEach(el => (el.textContent = user.Name || user.name));
});
