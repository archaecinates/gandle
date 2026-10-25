const WA_ADMIN = "6281234567890";
const KEY = "gandle-cart";
const PROFILE_KEY = "gandle-profile";
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzs-Z6zpX10JxiCX_9pLtxfWGt4_t8auk60O2fkHQx9LMwbCbLWSyHWFstqjSJs3Jsl/exec";

const $ = (s) => document.querySelector(s);
const rp = (n) => "Rp" + n.toLocaleString("id-ID");
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

let products = [];
let cart = [];
let savedProfile = {};
let checkoutFiles = new Map();

try {
  savedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
} catch {
  savedProfile = {};
}
try {
  cart = JSON.parse(localStorage.getItem(KEY)) || [];
} catch {
  cart = [];
}

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {}
};
const find = (id) => products.find((p) => p.id === id);
const total = () =>
  cart.reduce((s, i) => s + (find(i.id)?.price || 0) * i.qty, 0);
const count = () => cart.reduce((s, i) => s + i.qty, 0);
const MAX_REFERENCE_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 1800);
}

function validateImage(file) {
  return file && IMAGE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE;
}

const menuToggle = document.getElementById("menu-toggle");
const nav = document.querySelector(".nav");

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("menu-open");

    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
  });

  //ini buat nutup menu setelah memilih link
  nav.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Buka menu");
    });
  });
}

const heroArt = document.querySelector(".hero-art");
const heroImg = heroArt?.querySelector("img");

if (heroArt && heroImg) {
  let offsetX = 0;
  let offsetY = 0;
  let lastDodge = 0;

  heroArt.addEventListener("pointermove", (e) => {
    const rect = heroArt.getBoundingClientRect();

    //posisi cursor ke gambar
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.hypot(dx, dy);

    //gambar ngehindar pas cursor mendekat
    if (distance < 982) {
      const now = performance.now();
      if (now - lastDodge < 380) return; //biar gambarnya ga sering pindah posisi
      lastDodge = now;

      //ini gambar ngejauh dari cursor
      const angle = Math.atan2(dy, dx);
      const force = 55 + Math.random() * 30;
      offsetX = -Math.cos(angle) * force;
      offsetY = -Math.sin(angle) * force;
      const rotate = (Math.random() - 0.5) * 24; //efek kek kepental
      heroImg.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`;
    }
  });

  heroArt.addEventListener("pointerleave", () => {
    heroImg.style.transform = "translate(0, 0) rotate(0deg)"; //gambar ke posisi awal pas gada cursor
  });
}

const bandTrack = document.getElementById("bandTrack");
if (bandTrack) {
  let items = [...bandTrack.children];
  function fillBand() {
    //ini buat biar seolah olah full
    const screenWidth = window.innerWidth;

    while (bandTrack.scrollWidth < screenWidth * 2) {
      items.forEach((item) => {
        bandTrack.appendChild(item.cloneNode(true));
      });
    }
  }

  fillBand();
  let position = 0;
  let speed = 0.7;
  let lastTime = performance.now();

  function animate(time) {
    const delta = time - lastTime;
    lastTime = time;
    position -= speed * (delta / 16.67);
    const firstItem = bandTrack.firstElementChild;
    if (firstItem) {
      const itemWidth = firstItem.offsetWidth;
      if (position <= -itemWidth) {
        //ini semacam looping, biar kalau uda lewat batas depan dia langsung muncul di belakang
        position += itemWidth;
        bandTrack.appendChild(firstItem);
      }
    }

    bandTrack.style.transform = `translate3d(${position}px, 0, 0)`;
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
  window.addEventListener("resize", fillBand);
}

function renderCatalog() {
  $("#catalog").innerHTML = products
    .map(
      (p, i) => `<article class="catalog-card">
      <div class="thumb tone-${i % 4}"><img src="${esc(p.img)}" alt="Contoh desain Gandle ${esc(p.name)}" loading="lazy"></div>
      <div class="card-foot">
        <div><h3>${esc(p.name)}</h3><p class="deskripsi">${esc(p.desc)}</p><p class="price">${rp(p.price)}</p></div>
        <button class="add" type="button" data-add="${esc(p.id)}" aria-label="Tambah ${esc(p.name)} ke keranjang">+</button>
      </div>
    </article>`,
    )
    .join("");
}

function renderCart() {
  const box = $("#cart-items");
  box.innerHTML = cart.length
    ? cart
        .map((i) => {
          const p = find(i.id);
          if (!p) return "";
          return `<div class="item" data-id="${esc(i.id)}">
      <img src="${esc(p.img)}" alt="">
      <div><h3>${esc(p.name)}</h3><small>${rp(p.price)}</small>
        <div class="item-row">
          <div class="qty"><button type="button" data-dec aria-label="Kurangi">&minus;</button><span>${i.qty}</span><button type="button" data-inc aria-label="Tambah">+</button></div>
          <button type="button" class="rm" data-rm>Hapus</button>
        </div></div>
      <textarea rows="2" data-note placeholder="Catatan untuk ${esc(p.name)} (nama, ciri khas, warna, dll)" aria-label="Catatan untuk ${esc(p.name)}">${esc(i.note)}</textarea>
    </div>`;
        })
        .join("")
    : '<p class="empty">Keranjangmu masih kosong.</p>';
  $("#cart-total").textContent = rp(total());
  $("#cart-count").textContent = count();
  $("#checkout-btn").disabled = !cart.length;
  $("#clear-btn").hidden = !cart.length;
}

function addToCart(id) {
  const it = cart.find((i) => i.id === id);
  it
    ? (it.qty = Math.min(it.qty + 1, 99))
    : cart.push({ id, qty: 1, note: "" });
  save();
  renderCart();
  toast("Ditambahkan ke keranjang");
}

function openCart(open) {
  $("#cart").classList.toggle("open", open);
  $("#cart").setAttribute("aria-hidden", String(!open));
  $("#overlay").hidden = !open;
  document.body.style.overflow = open ? "hidden" : "";
  if (open) $("#cart-close").focus();
  else $("#cart-btn").focus();
}

function applySavedProfile() {
  const form = $("#co-form");
  if (!form) return;
  if (savedProfile.name && !form.elements.name.value)
    form.elements.name.value = savedProfile.name;
  if (savedProfile.phone && !form.elements.phone.value)
    form.elements.phone.value = savedProfile.phone;
  $("#profile-clear").hidden = !(savedProfile.name || savedProfile.phone);
}

function clearSavedProfile() {
  savedProfile = {};
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {}
  $("#co-form").elements.name.value = "";
  $("#co-form").elements.phone.value = "";
  $("#profile-clear").hidden = true;
  $("#co-form").elements.name.focus();
}

function renderCheckoutItems() {
  const box = $("#co-items-detail");
  if (!box) return;
  box.innerHTML = cart
    .map((i, index) => {
      const p = find(i.id);
      const files = checkoutFiles.get(i.id) || [];
      return `<article class="co-item-detail" data-co-id="${esc(i.id)}">
      <div class="co-item-head">
        <div>
          <strong>${esc(p.name)}</strong>
          <span>${i.qty} pcs × ${rp(p.price)}</span>
        </div>
        <strong>${rp(p.price * i.qty)}</strong>
      </div>
      <label>Catatan untuk ${esc(p.name)}
        <textarea rows="2" data-co-note="${esc(i.id)}" placeholder="Contoh: rambut hitam, pakai kacamata, warna baju pink...">${esc(i.note || "")}</textarea>
      </label>
      <label class="upload-box item-upload-box">
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple data-item-photos="${esc(i.id)}">
        <span class="upload-icon">＋</span>
        <span><strong>Upload foto referensi</strong><small>${files.length ? `${files.length} foto dipilih` : "Bisa pilih hingga 5 foto • maksimal 5 MB/foto"}</small></span>
      </label>
      <div class="photo-preview item-photo-preview" data-preview-for="${esc(i.id)}" aria-live="polite"></div>
      <label class="link-field">Atau link foto referensi untuk ${esc(p.name)}
        <input type="url" data-item-ref="${esc(i.id)}" value="${esc(i.ref || "")}" placeholder="https://drive.google.com/...">
      </label>
    </article>`;
    })
    .join("");
  cart.forEach((i) => renderItemPhotoPreview(i.id));
}

function renderItemPhotoPreview(id) {
  const box = document.querySelector(`[data-preview-for="${CSS.escape(id)}"]`);
  if (!box) return;
  box.innerHTML = "";
  (checkoutFiles.get(id) || []).forEach((file, index) => {
    const url = URL.createObjectURL(file);
    const item = document.createElement("div");
    item.className = "preview-item";
    item.innerHTML = `<img src="${url}" alt="Preview ${esc(file.name)}">
      <button type="button" class="preview-remove" data-remove-item-photo="${esc(id)}" data-photo-index="${index}" aria-label="Hapus ${esc(file.name)}">&times;</button>
      <span>${esc(file.name)}</span>`;
    box.appendChild(item);
  });
}

function updateCheckoutItemNote(id, value) {
  const it = cart.find((i) => i.id === id);
  if (!it) return;
  it.note = value.slice(0, 500);
  save();
}

function updateCheckoutItemRef(id, value) {
  const it = cart.find((i) => i.id === id);
  if (!it) return;
  it.ref = value.slice(0, 1000);
  save();
}

function openCheckout() {
  if (!cart.length) return;
  renderCheckoutItems();
  $("#co-summary").innerHTML =
    cart
      .map((i) => {
        const p = find(i.id);
        return `<div><span>${i.qty}x ${esc(p.name)}</span><span>${rp(p.price * i.qty)}</span></div>`;
      })
      .join("") +
    `<div class="sum-total"><span>Total</span><span>${rp(total())}</span></div>`;
  $("#co-form").hidden = false;
  $("#co-done").hidden = true;
  $("#co-error").textContent = "";
  openCart(false);
  $("#checkout").showModal();
}

function renderQrisPreview() {
  const box = $("#qris-preview");
  box.innerHTML = "";
  const file = $("#qris-proof")?.files?.[0];
  if (file && validateImage(file)) {
    const url = URL.createObjectURL(file);
    box.innerHTML = `<div class="preview-item"><img src="${url}" alt="Preview bukti QRIS"><span>${esc(file.name)}</span></div>`;
  }
}

function updatePaymentFields() {
  const isQris = $("#payment-method").value === "QRIS";
  const wrap = $("#qris-proof-wrap");
  const input = $("#qris-proof");
  wrap.hidden = !isQris;
  input.required = isQris;
  if (!isQris) {
    input.value = "";
    $("#qris-preview").innerHTML = "";
  }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      // Hanya kirim bagian Base64, tanpa "data:image/png;base64,"
      const base64 = result.split(",")[1];

      resolve({
        name: file.name,
        mimeType: file.type,
        base64,
      });
    };

    reader.onerror = () =>
      reject(new Error(`Gagal membaca file ${file.name}.`));

    reader.readAsDataURL(file);
  });
}

async function submitOrder(e) {
  e.preventDefault();

  const form = e.target;
  const d = Object.fromEntries(new FormData(form).entries());
  const err = $("#co-error");

  form.querySelectorAll(".bad").forEach((el) => el.classList.remove("bad"));
  const bad = [];

  if (!d.name.trim()) bad.push("name");

  if (d.phone.replace(/\D/g, "").length < 9) {
    bad.push("phone");
  }

  if (!d.address.trim()) {
    bad.push("address");
  }

  // Validasi catatan, link, dan foto per produk.
  for (const i of cart) {
    const product = find(i.id);

    const note = (i.note || "").trim();
    const ref = (i.ref || "").trim();

    if (ref && !/^https?:\/\//i.test(ref)) {
      err.textContent = `Link foto untuk ${product.name} harus diawali http:// atau https://.`;

      document.querySelector(`[data-item-ref="${CSS.escape(i.id)}"]`)?.focus();

      return;
    }

    const files = checkoutFiles.get(i.id) || [];

    if (files.length > MAX_REFERENCE_PHOTOS) {
      err.textContent = `Maksimal ${MAX_REFERENCE_PHOTOS} foto untuk ${product.name}.`;

      return;
    }

    if (files.some((file) => !validateImage(file))) {
      err.textContent = `Foto ${product.name} harus JPG, PNG, atau WEBP dan maksimal 5 MB per foto.`;

      return;
    }

    i.note = note.slice(0, 500);
    i.ref = ref.slice(0, 1000);
  }

  // Validasi bukti QRIS.
  const qrisFile = $("#qris-proof")?.files?.[0];

  if (d.payment === "QRIS" && (!qrisFile || !validateImage(qrisFile))) {
    err.textContent =
      "Untuk pembayaran QRIS, bukti pembayaran wajib di-upload (JPG, PNG, atau WEBP, maksimal 5 MB).";

    $("#qris-proof").classList.add("bad");
    $("#qris-proof").focus();

    return;
  }

  if (bad.length) {
    bad.forEach((name) => {
      form.elements[name].classList.add("bad");
    });

    err.textContent = "Periksa kembali kolom yang bertanda merah.";

    form.elements[bad[0]].focus();

    return;
  }

  save();

  err.textContent = "";

  savedProfile = {
    name: d.name.trim(),
    phone: d.phone.trim(),
  };

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(savedProfile));
  } catch {}

  const btn = $("#co-submit");

  btn.disabled = true;
  btn.textContent = "Mengirim pesanan...";

  try {
    const customer = {
      name: d.name.trim(),
      phone: d.phone.trim(),
      address: d.address.trim(),
      payment: d.payment,
    };

    const items = cart.map((i) => ({
      id: i.id,
      qty: i.qty,
      note: i.note || "",
      ref: i.ref || "",
    }));

    const files = [];
    for (const i of cart) {
      const referencePhotos = checkoutFiles.get(i.id) || [];
      for (const file of referencePhotos) {
        const converted = await fileToBase64(file);

        files.push({
          ...converted,
          type: "reference",
          productId: i.id,
        });
      }
    }

    //untuk bukti qrish payment
    if (d.payment === "QRIS" && qrisFile) {
      const converted = await fileToBase64(qrisFile);

      files.push({
        ...converted,
        type: "qrisProof",
      });
    }

    const total = cart.reduce((sum, i) => {
      const product = find(i.id);
      return sum + product.price * i.qty;
    }, 0);

    const payload = {
      customer,
      items,
      files,
    };

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.ok) {
      throw new Error(out.error || "Pesanan gagal dikirim. Coba lagi.");
    }

    $("#co-done").innerHTML = `
      <h2>Pesanan diterima!</h2>
      <p>
        Terima kasih, pesanan kamu sudah berhasil dikirim.
      </p>

      <p>
        No. pesanan:
        <strong>${esc(out.orderId)}</strong>
        <br>
        Total:
        <strong>${rp(out.total)}</strong>
      </p>

      <p>
        Data pesanan dan file yang kamu upload
        sudah tersimpan.
      </p>

      <button class="btn-ghost" type="button" data-close>
        Tutup
      </button>
    `;

    $("#co-form").hidden = true;
    $("#co-done").hidden = false;

    // Kosongkan cart setelah berhasil pesan
    cart = [];
    checkoutFiles = new Map();

    save();
    renderCart();
    form.reset();
    updatePaymentFields();
  } catch (ex) {
    console.error(ex);

    err.textContent = ex.message || "Pesanan gagal dikirim. Coba lagi.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Pesan sekarang";
  }
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.add) return addToCart(t.dataset.add);
  if (t.closest("[data-close]")) return $("#checkout").close();

  const removePhoto = t.closest("[data-remove-item-photo]");
  if (removePhoto) {
    const id = removePhoto.dataset.removeItemPhoto;
    const index = Number(removePhoto.dataset.photoIndex);
    const files = checkoutFiles.get(id) || [];
    files.splice(index, 1);
    checkoutFiles.set(id, files);
    renderItemPhotoPreview(id);
    const input = document.querySelector(
      `[data-item-photos="${CSS.escape(id)}"]`,
    );
    if (input) input.value = "";
    return;
  }

  const row = t.closest(".item");
  if (!row) return;
  const it = cart.find((i) => i.id === row.dataset.id);
  if (!it) return;
  if (t.hasAttribute("data-inc")) it.qty = Math.min(it.qty + 1, 99);
  else if (t.hasAttribute("data-dec")) it.qty = Math.max(it.qty - 1, 1);
  else if (t.hasAttribute("data-rm")) {
    cart = cart.filter((i) => i !== it);
    checkoutFiles.delete(it.id);
  } else return;
  save();
  renderCart();
});

document.addEventListener("input", (e) => {
  if (e.target.hasAttribute("data-note")) {
    const it = cart.find((i) => i.id === e.target.closest(".item").dataset.id);
    if (it) {
      it.note = e.target.value.slice(0, 500);
      save();
    }
  }
  if (e.target.hasAttribute("data-co-note"))
    updateCheckoutItemNote(e.target.dataset.coNote, e.target.value);
  if (e.target.hasAttribute("data-item-ref"))
    updateCheckoutItemRef(e.target.dataset.itemRef, e.target.value);
});

document.addEventListener("change", (e) => {
  const input = e.target;
  if (!input.hasAttribute("data-item-photos")) return;
  const id = input.dataset.itemPhotos;
  const selected = Array.from(input.files || []);
  const current = checkoutFiles.get(id) || [];
  const valid = selected.filter(validateImage);
  const invalidCount = selected.length - valid.length;
  const merged = [...current, ...valid];
  if (invalidCount)
    toast("Ada foto yang ditolak: gunakan JPG, PNG, atau WEBP maksimal 5 MB.");
  if (merged.length > MAX_REFERENCE_PHOTOS)
    toast(`Maksimal ${MAX_REFERENCE_PHOTOS} foto per tipe.`);
  checkoutFiles.set(id, merged.slice(0, MAX_REFERENCE_PHOTOS));
  input.value = "";
  renderItemPhotoPreview(id);
  renderCheckoutItemsLabel(id);
});

function renderCheckoutItemsLabel(id) {
  const detail = document.querySelector(`[data-co-id="${CSS.escape(id)}"]`);
  if (!detail) return;
  const files = checkoutFiles.get(id) || [];
  const small = detail
    .querySelector("[data-item-photos]")
    ?.closest(".upload-box")
    ?.querySelector("small");
  if (small)
    small.textContent = files.length
      ? `${files.length} foto dipilih`
      : "Bisa pilih hingga 5 foto • maksimal 5 MB/foto";
}

$("#profile-clear").addEventListener("click", clearSavedProfile);
$("#payment-method").addEventListener("change", updatePaymentFields);
$("#qris-proof").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file && !validateImage(file)) {
    e.target.value = "";
    $("#qris-preview").innerHTML = "";
    $("#co-error").textContent =
      "Bukti QRIS harus JPG, PNG, atau WEBP dan maksimal 5 MB.";
    return;
  }
  $("#co-error").textContent = "";
  renderQrisPreview();
});

$("#cart-btn").onclick = () => openCart(true);
$("#cart-close").onclick = $("#overlay").onclick = () => openCart(false);
$("#checkout-btn").onclick = openCheckout;
$("#clear-btn").onclick = () => {
  if (confirm("Kosongkan semua isi keranjang?")) {
    cart = [];
    checkoutFiles = new Map();
    save();
    renderCart();
  }
};
$("#co-form").addEventListener("submit", submitOrder);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#cart").classList.contains("open"))
    openCart(false);
});

updatePaymentFields();
fetch("products.json")
  .then((r) => r.json())
  .then((data) => {
    products = data;
    cart = cart.filter((i) => find(i.id) && i.qty > 0);
    renderCatalog();
    renderCart();
  })
  .catch(() => {
    $("#catalog").innerHTML =
      '<p class="empty">Katalog gagal dimuat. Muat ulang halaman.</p>';
  });
