
import {
    auth, db,
    collection, doc, getDoc, getDocs,
    setDoc, deleteDoc, query, where,
    onAuthStateChanged, signOut
} from "./firebase.js";

let books = [];
let currentUser = null;
let category = "All";

const grid = document.getElementById("bookGrid");
const search = document.getElementById("searchInput");

function renderBooks() {
    const keyword = search?.value.toLowerCase() || "";

    const filtered = books.filter(book => {
        const matchCategory =
            category === "All" || book.category === category;

        const matchSearch =
            book.title.toLowerCase().includes(keyword) ||
            book.author.toLowerCase().includes(keyword) ||
            book.category.toLowerCase().includes(keyword);

        return matchCategory && matchSearch;
    });

    grid.innerHTML = "";

    if (!filtered.length) {
        grid.textContent = "No books found.";
        return;
    }

    filtered.forEach(book => {
        const card = document.createElement("div");
        card.className = "book-card";

        const image = document.createElement("img");
        image.src = book.cover;
        image.alt = book.title;

        const title = document.createElement("h3");
        title.textContent = book.title;

        const author = document.createElement("p");
        author.textContent = `${book.category} • ${book.author}`;

        card.append(image, title, author);

        card.addEventListener("click", () => {
            location.href = `reader.html?id=${encodeURIComponent(book.id)}`;
        });

        grid.appendChild(card);
    });
}

async function loadBooks() {
    try {
        const result = await getDocs(
            query(collection(db, "books"), where("status", "==", "published"))
        );

        books = result.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        renderBooks();
    } catch (error) {
        grid.textContent = "Unable to load books.";
        console.error(error);
    }
}

async function loadMyList() {
    const list = document.getElementById("myListGrid");

    if (!currentUser) {
        list.textContent = "Login to see your favourite books.";
        return;
    }

    const result = await getDocs(
        collection(db, "users", currentUser.uid, "favourites")
    );

    list.innerHTML = "";

    result.forEach(item => {
        const book = books.find(b => b.id === item.id);

        if (!book) return;

        const card = document.createElement("div");
        card.className = "book-card";

        const image = document.createElement("img");
        image.src = book.cover;

        const title = document.createElement("h3");
        title.textContent = book.title;

        card.append(image, title);
        card.onclick = () => {
            location.href = `reader.html?id=${encodeURIComponent(book.id)}`;
        };

        list.appendChild(card);
    });
}

async function startApp(user) {
    currentUser = user;

    const adminLink = document.getElementById("adminLink");
    const loginLink = document.getElementById("loginLink");
    const logoutBtn = document.getElementById("logoutBtn");
    const userName = document.getElementById("userName");

    if (user) {
        const profile = await getDoc(doc(db, "users", user.uid));

        if (profile.exists()) {
            const data = profile.data();

            userName.textContent = data.name || user.email;

            if (data.role === "admin") {
                adminLink.hidden = false;
            }
        }

        loginLink.hidden = true;
        logoutBtn.hidden = false;

        logoutBtn.onclick = async () => {
            await signOut(auth);
            location.reload();
        };

    } else {
        loginLink.hidden = false;
        logoutBtn.hidden = true;
        adminLink.hidden = true;
        userName.textContent = "Guest";
    }

    await loadBooks();
    await loadMyList();
}

search?.addEventListener("input", renderBooks);

document.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
        category = button.dataset.category;
        renderBooks();
    });
});

onAuthStateChanged(auth, startApp);


async function loadContinueReading() {
    const grid = document.getElementById("continueGrid");

    if (!currentUser) {
        grid.textContent = "Login to continue reading.";
        return;
    }

    const result = await getDocs(
        collection(db, "users", currentUser.uid, "progress")
    );

    grid.innerHTML = "";

    for (const item of result.docs) {
        const book = books.find(b => b.id === item.id);
        if (!book) continue;

        const card = document.createElement("div");
        card.className = "book-card";

        const image = document.createElement("img");
        image.src = book.cover;

        const title = document.createElement("h3");
        title.textContent = book.title;

        const chapter = document.createElement("p");
        chapter.textContent =
            "Chapter " + item.data().chapterNumber;

        card.append(image, title, chapter);

        card.onclick = () => {
            location.href =
                `reader.html?id=${encodeURIComponent(book.id)}`;
        };

        grid.appendChild(card);
    }
}
