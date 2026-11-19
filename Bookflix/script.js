const starterBooks = [
  { id: "b1", title: "The Lost Kingdom", author: "Aiman Hakim", category: "Fantasy", cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=700", synopsis: "Sebuah kisah pengembaraan seorang remaja yang menemui kerajaan misteri yang hilang daripada peta dunia.", story: "Malam itu, hujan turun dengan lebat. Aiman terlihat cahaya aneh di sebalik pokok tua. Di situ, dia menemui buku lama berlambang kerajaan misteri. Pengembaraannya baru sahaja bermula..." },
  { id: "b2", title: "Midnight Secrets", author: "Nur Aisyah", category: "Mystery", cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=700", synopsis: "Satu rahsia lama mula terbongkar apabila seorang pelajar menemui surat misteri di perpustakaan sekolah.", story: "Perpustakaan sekolah hampir kosong apabila Sara terlihat sampul surat hitam di atas rak. Namanya tertulis di sampul itu. Di dalamnya hanya ada satu ayat: Jangan percaya kepada semua yang kamu tahu." },
  { id: "b3", title: "Love in December", author: "Mia Sofea", category: "Romance", cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=700", synopsis: "Kisah dua insan yang bertemu secara tidak sengaja dan mula mengenali erti persahabatan serta kepercayaan.", story: "Disember merupakan bulan yang paling disukai Alya. Pada suatu petang, dia bertemu seorang pemuda di kedai buku. Pertemuan ringkas itu menjadi permulaan kepada persahabatan yang tidak pernah dijangkakan." },
  { id: "b4", title: "The Dark House", author: "Farid Zulkifli", category: "Horror", cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700", synopsis: "Sebuah rumah lama menyimpan kisah misteri yang tidak pernah diketahui penduduk kampung.", story: "Di hujung kampung terdapat sebuah rumah lama. Pada suatu hari, Daniel menemui gambar lama di dalam kotak kayu. Gambar itu menunjukkan sesuatu yang sangat mengejutkan." },
  { id: "b5", title: "Beyond The Stars", author: "Adam Firdaus", category: "Adventure", cover: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=700", synopsis: "Pengembaraan sekumpulan sahabat yang mencari jawapan tentang fenomena misteri di langit.", story: "Langit malam dipenuhi bintang. Empat orang sahabat memerhatikan satu cahaya bergerak di angkasa. Mereka membuat keputusan untuk menyiasat fenomena itu." },
  { id: "b6", title: "The Forgotten Diary", author: "Hana Irdina", category: "Mystery", cover: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700", synopsis: "Sebuah diari lama menjadi kunci kepada kisah silam sebuah keluarga.", story: "Nadia menemui sebuah diari lama di dalam almari neneknya. Setiap halaman menyimpan catatan yang semakin lama semakin misteri." }
];

const BOOKS_KEY = "bookflix-books-v2";
const LIST_KEY = "bookflix-my-list-v2";
function readStorage(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch { return fallback; }
}
let books = readStorage(BOOKS_KEY, starterBooks);
let myList = new Set(readStorage(LIST_KEY, []));
let activeCategory = "All";
let selectedBook = null;

const grid = document.querySelector("#bookGrid");
const listGrid = document.querySelector("#myListGrid");
const searchInput = document.querySelector("#search");
const addDialog = document.querySelector("#addBookDialog");
const addForm = document.querySelector("#addBookForm");
let uploadedCover = "";

const coverFileInput = document.querySelector("#coverFile");
const coverPasteZone = document.querySelector("#coverPasteZone");
const coverPreview = document.querySelector("#coverPreview");
const clearCoverButton = document.querySelector("#clearCoverImage");

async function useCoverImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    showToast("Pilih fail gambar seperti JPG, PNG atau WebP.");
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    showToast("Saiz gambar maksimum ialah 8 MB.");
    return;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 700 / bitmap.width, 1000 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    uploadedCover = canvas.toDataURL("image/jpeg", 0.82);
    coverPreview.src = uploadedCover;
    coverPreview.hidden = false;
    clearCoverButton.hidden = false;
    showToast("Gambar kulit buku dah dipilih.");
  } catch {
    showToast("Gambar tak dapat dibuka. Cuba fail gambar lain.");
  }
}

function clearCoverImage() {
  uploadedCover = "";
  coverFileInput.value = "";
  coverPreview.removeAttribute("src");
  coverPreview.hidden = true;
  clearCoverButton.hidden = true;
}

document.querySelector("#chooseCoverImage").addEventListener("click", () => coverFileInput.click());
coverFileInput.addEventListener("change", () => useCoverImage(coverFileInput.files[0]));
clearCoverButton.addEventListener("click", clearCoverImage);
coverPasteZone.addEventListener("paste", event => {
  const imageItem = [...(event.clipboardData?.items || [])].find(item => item.type.startsWith("image/"));
  if (!imageItem) return;
  event.preventDefault();
  useCoverImage(imageItem.getAsFile());
});
coverPasteZone.addEventListener("dragover", event => {
  event.preventDefault();
  coverPasteZone.classList.add("dragging");
});
coverPasteZone.addEventListener("dragleave", () => coverPasteZone.classList.remove("dragging"));
coverPasteZone.addEventListener("drop", event => {
  event.preventDefault();
  coverPasteZone.classList.remove("dragging");
  useCoverImage(event.dataTransfer.files[0]);
});

function saveStorage() {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  localStorage.setItem(LIST_KEY, JSON.stringify([...myList]));
}

function makeCard(book, savedArea = false) {
  const card = document.createElement("article");
  card.className = "book-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View ${book.title}`);

  const actions = document.createElement("div");
  actions.className = "card-actions";
  const heart = document.createElement("button");
  heart.className = `heart-button${myList.has(book.id) ? " saved" : ""}`;
  heart.type = "button";
  heart.textContent = myList.has(book.id) ? "♥" : "♡";
  heart.title = myList.has(book.id) ? "Remove from My List" : "Add to My List";
  heart.setAttribute("aria-label", heart.title);
  heart.addEventListener("click", event => {
    event.stopPropagation();
    toggleSaved(book.id);
  });
  actions.appendChild(heart);
  if (book.custom) {
    const remove = document.createElement("button");
    remove.className = "delete-book";
    remove.type = "button";
    remove.textContent = "×";
    remove.title = "Delete book";
    remove.setAttribute("aria-label", `Delete ${book.title}`);
    remove.addEventListener("click", event => {
      event.stopPropagation();
      books = books.filter(item => item.id !== book.id);
      myList.delete(book.id);
      saveStorage();
      render();
      showToast("Book removed.");
    });
    actions.appendChild(remove);
  }

  if (book.cover) {
    const image = document.createElement("img");
    image.src = book.cover;
    image.alt = `Cover of ${book.title}`;
    image.loading = "lazy";
    image.onerror = () => { image.replaceWith(makeCoverPlaceholder(book.title)); };
    card.appendChild(image);
  } else card.appendChild(makeCoverPlaceholder(book.title));

  const info = document.createElement("div");
  info.className = "book-info";
  const title = document.createElement("h3");
  title.textContent = book.title;
  const meta = document.createElement("p");
  meta.textContent = `${book.category} · ${book.author}`;
  info.append(title, meta);
  card.append(actions, info);
  card.addEventListener("click", () => openBook(book));
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openBook(book); }
  });
  return card;
}

function makeCoverPlaceholder(title) {
  const placeholder = document.createElement("div");
  placeholder.className = "cover-placeholder";
  placeholder.textContent = title;
  return placeholder;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const visible = books.filter(book => {
    const matchesCategory = activeCategory === "All" || book.category === activeCategory;
    const matchesSearch = `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  grid.replaceChildren(...visible.map(book => makeCard(book)));
  document.querySelector("#noBooks").hidden = visible.length > 0;
  document.querySelector("#popularHeading").textContent = activeCategory === "All" ? "Popular Books" : `${activeCategory} Books`;
  document.querySelectorAll("[data-category]").forEach(button => button.classList.toggle("active", button.dataset.category === activeCategory));

  const savedBooks = books.filter(book => myList.has(book.id));
  listGrid.replaceChildren(...savedBooks.map(book => makeCard(book, true)));
  document.querySelector("#emptyList").hidden = savedBooks.length > 0;
}

function toggleSaved(id) {
  if (myList.has(id)) myList.delete(id); else myList.add(id);
  saveStorage();
  render();
}

function openBook(book) {
  selectedBook = book;
  const cover = document.querySelector("#detailCover");
  cover.src = book.cover || "";
  cover.hidden = !book.cover;
  cover.alt = `Cover of ${book.title}`;
  document.querySelector("#detailTitle").textContent = book.title;
  document.querySelector("#detailAuthor").textContent = `✍️ Author: ${book.author}`;
  document.querySelector("#detailCategory").textContent = `Category: ${book.category}`;
  document.querySelector("#detailSynopsis").textContent = book.synopsis || "No synopsis provided.";
  document.querySelector("#storyPanel").hidden = true;
  document.querySelector("#storyHeading").textContent = `Reading: ${book.title}`;
  document.querySelector("#storyText").textContent = book.story || "No story has been added yet.";
  document.querySelector("#readBook").disabled = !book.story;
  const saveButton = document.querySelector("#saveBook");
  saveButton.textContent = myList.has(book.id) ? "♥ In My List" : "♡ My List";
  document.querySelector("#bookDialog").showModal();
}

document.querySelector("#openAddBook").addEventListener("click", () => addDialog.showModal());
document.querySelector("#cancelAddBook").addEventListener("click", () => {
  addForm.reset();
  clearCoverImage();
  addDialog.close();
});
addForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(addForm);
  const title = data.get("title").trim();
  const author = data.get("author").trim();
  if (books.some(book => book.title.toLowerCase() === title.toLowerCase() && book.author.toLowerCase() === author.toLowerCase())) {
    showToast("This book is already in the catalogue.");
    return;
  }
  books.unshift({
    id: `custom-${Date.now()}`,
    title,
    author,
    category: data.get("category"),
    cover: uploadedCover || data.get("cover").trim(),
    synopsis: data.get("synopsis").trim(),
    story: "",
    custom: true
  });
  saveStorage();
  addForm.reset();
  clearCoverImage();
  addDialog.close();
  activeCategory = "All";
  searchInput.value = "";
  render();
  showToast("Book added to Bookflix!");
  document.querySelector("#popular").scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#saveBook").addEventListener("click", () => {
  if (selectedBook) toggleSaved(selectedBook.id);
  if (selectedBook) document.querySelector("#saveBook").textContent = myList.has(selectedBook.id) ? "♥ In My List" : "♡ My List";
});
document.querySelector("#readBook").addEventListener("click", () => {
  document.querySelector("#storyPanel").hidden = false;
  document.querySelector("#storyPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
});
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => document.getElementById(button.dataset.close).close()));
document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
}));
document.querySelector("#categoryList").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  render();
});
searchInput.addEventListener("input", render);

const menuToggle = document.querySelector("#menuToggle");
const mainMenu = document.querySelector("#mainMenu");
function closeMenu() {
  mainMenu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Buka menu");
}
menuToggle.addEventListener("click", () => {
  const open = mainMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
});
mainMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("click", event => { if (!event.target.closest(".navbar")) closeMenu(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });

let toastTimer;
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

document.querySelector("#year").textContent = new Date().getFullYear();
render();


