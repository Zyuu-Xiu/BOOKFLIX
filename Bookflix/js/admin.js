
import {
    auth, db, storage,
    onAuthStateChanged,
    doc, getDoc, getDocs, collection,
    addDoc, updateDoc, deleteDoc,
    query, orderBy,
    ref, uploadBytes, getDownloadURL,
    serverTimestamp
} from "./firebase.js";

const status = document.getElementById("adminStatus");
const content = document.getElementById("adminContent");

let currentAdmin = null;

onAuthStateChanged(auth, async user => {
    if (!user) {
        status.textContent = "Please login first.";
        return;
    }

    const profile = await getDoc(doc(db, "users", user.uid));

    if (!profile.exists() || profile.data().role !== "admin") {
        status.textContent = "Access denied. Administrator only.";
        return;
    }

    currentAdmin = user;
    status.textContent = "Administrator access verified.";
    content.hidden = false;

    loadAdminBooks();
});

async function uploadFile(file, path) {
    if (!file) return "";

    const location = ref(storage, path);
    await uploadBytes(location, file);
    return await getDownloadURL(location);
}

document.getElementById("bookForm").onsubmit = async event => {
    event.preventDefault();

    if (!currentAdmin) return;

    const message = document.getElementById("adminMessage");
    message.textContent = "Saving book...";

    try {
        const id = document.getElementById("bookId").value;

        const coverFile = document.getElementById("cover").files[0];
        const videoFile = document.getElementById("video").files[0];

        const cover = await uploadFile(
            coverFile,
            `books/${id || crypto.randomUUID()}/cover-${crypto.randomUUID()}`
        );

        const video = await uploadFile(
            videoFile,
            `books/${id || crypto.randomUUID()}/video-${crypto.randomUUID()}`
        );

        const bookData = {
            title: document.getElementById("title").value.trim(),
            author: document.getElementById("author").value.trim(),
            category: document.getElementById("category").value,
            synopsis: document.getElementById("synopsis").value.trim(),
            status: document.getElementById("status").value,
            updatedAt: serverTimestamp()
        };

        if (cover) bookData.cover = cover;
        if (video) bookData.video = video;

        if (id) {
            await updateDoc(doc(db, "books", id), bookData);
        } else {
            bookData.createdBy = currentAdmin.uid;
            bookData.createdAt = serverTimestamp();

            await addDoc(collection(db, "books"), bookData);
        }

        message.textContent = "Book saved successfully!";

        event.target.reset();
        document.getElementById("bookId").value = "";

        loadAdminBooks();

    } catch (error) {
        console.error(error);
        message.textContent = "Error: " + error.message;
    }
};

async function loadAdminBooks() {
    const result = await getDocs(
        query(collection(db, "books"), orderBy("updatedAt", "desc"))
    );

    const container = document.getElementById("manageBooks");
    const select = document.getElementById("chapterBook");

    container.innerHTML = "";
    select.innerHTML = "";

    result.forEach(d => {
        const book = d.data();

        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = book.title;
        select.appendChild(option);

        const row = document.createElement("div");
        row.className = "table-row";

        const name = document.createElement("span");
        name.textContent = `${book.title} (${book.status})`;

        const edit = document.createElement("button");
        edit.textContent = "Edit";
        edit.onclick = () => editBook(d.id, book);

        const remove = document.createElement("button");
        remove.textContent = "Delete";
        remove.onclick = () => removeBook(d.id);

        row.append(name, edit, remove);
        container.appendChild(row);
    });
}

function editBook(id, book) {
    document.getElementById("bookId").value = id;
    document.getElementById("title").value = book.title;
    document.getElementById("author").value = book.author;
    document.getElementById("category").value = book.category;
    document.getElementById("synopsis").value = book.synopsis;
    document.getElementById("status").value = book.status;

    document.getElementById("cover").value = "";
    document.getElementById("video").value = "";

    window.scrollTo({top: 0, behavior: "smooth"});
}

async function removeBook(id) {
    if (!confirm("Delete this book?")) return;

    await deleteDoc(doc(db, "books", id));

    document.getElementById("adminMessage").textContent =
        "Book deleted.";

    loadAdminBooks();
}

document.getElementById("cancelEdit").onclick = () => {
    document.getElementById("bookForm").reset();
    document.getElementById("bookId").value = "";
};

document.getElementById("chapterForm").onsubmit = async event => {
    event.preventDefault();

    if (!currentAdmin) return;

    const bookId = document.getElementById("chapterBook").value;

    if (!bookId) return;

    try {
        const number = Number(
            document.getElementById("chapterNumber").value
        );

        const existing = await getDocs(
            collection(db, "books", bookId, "chapters")
        );

        if (existing.docs.some(d => d.data().number === number)) {
            alert("Chapter number already exists.");
            return;
        }

        await addDoc(
            collection(db, "books", bookId, "chapters"),
            {
                number,
                title: document.getElementById("chapterName").value.trim(),
                content: document.getElementById("chapterContent").value,
                createdAt: serverTimestamp()
            }
        );

        alert("Chapter added successfully!");
        event.target.reset();

    } catch (error) {
        alert("Unable to add chapter: " + error.message);
    }
};
