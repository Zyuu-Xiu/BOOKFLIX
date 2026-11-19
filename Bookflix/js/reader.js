
import {
    auth, db, collection, doc, getDoc, getDocs,
    setDoc, addDoc, query, orderBy, onAuthStateChanged,
    serverTimestamp
} from "./firebase.js";

const bookId = new URLSearchParams(location.search).get("id");

let book = null;
let chapters = [];
let currentChapter = 0;
let user = null;

const storyContent = document.getElementById("storyContent");
const chapterTitle = document.getElementById("chapterTitle");

async function loadBook() {
    if (!bookId) {
        document.getElementById("bookInfo").textContent =
            "Book not found.";
        return;
    }

    const result = await getDoc(doc(db, "books", bookId));

    if (!result.exists() || result.data().status !== "published") {
        document.getElementById("bookInfo").textContent =
            "This book is unavailable.";
        return;
    }

    book = result.data();

    document.getElementById("bookInfo").innerHTML = `
        <h1>${escapeHTML(book.title)}</h1>
        <p>Author: ${escapeHTML(book.author)}</p>
        <p>${escapeHTML(book.synopsis || "")}</p>
        ${book.video ? `<video src="${escapeHTML(book.video)}" controls style="width:100%;max-height:300px;margin-top:20px"></video>` : ""}
    `;

    const chapterResult = await getDocs(
        query(
            collection(db, "books", bookId, "chapters"),
            orderBy("number")
        )
    );

    chapters = chapterResult.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

    if (!chapters.length) {
        storyContent.textContent = "No chapters published yet.";
        return;
    }

    renderChapterList();

    if (user) {
        const progress = await getDoc(
            doc(db, "users", user.uid, "progress", bookId)
        );

        if (progress.exists()) {
            const saved = progress.data().chapterId;
            const found = chapters.findIndex(c => c.id === saved);
            if (found >= 0) currentChapter = found;
        }
    }

    showChapter();
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function renderChapterList() {
    const list = document.getElementById("chapterList");
    list.innerHTML = "<h2>Chapters</h2>";

    chapters.forEach((chapter, index) => {
        const button = document.createElement("button");
        button.className = "red-button";
        button.style.margin = "5px";
        button.textContent = `Chapter ${chapter.number}: ${chapter.title}`;

        button.onclick = () => {
            currentChapter = index;
            showChapter();
        };

        list.appendChild(button);
    });
}

async function showChapter() {
    const chapter = chapters[currentChapter];
    if (!chapter) return;

    chapterTitle.textContent =
        `Chapter ${chapter.number}: ${chapter.title}`;

    storyContent.textContent = chapter.content;

    document.getElementById("previousBtn").disabled =
        currentChapter === 0;

    document.getElementById("nextBtn").disabled =
        currentChapter === chapters.length - 1;

    if (user) {
        try {
            await setDoc(
                doc(db, "users", user.uid, "progress", bookId),
                {
                    chapterId: chapter.id,
                    chapterNumber: chapter.number,
                    updatedAt: serverTimestamp()
                }
            );

            document.getElementById("progressMessage").textContent =
                "Reading progress saved.";
        } catch (error) {
            document.getElementById("progressMessage").textContent =
                "Unable to save progress.";
        }
    } else {
        document.getElementById("progressMessage").textContent =
            "Login to save your reading progress.";
    }
}

document.getElementById("previousBtn").onclick = () => {
    if (currentChapter > 0) {
        currentChapter--;
        showChapter();
    }
};

document.getElementById("nextBtn").onclick = () => {
    if (currentChapter < chapters.length - 1) {
        currentChapter++;
        showChapter();
    }
};

document.getElementById("commentForm").onsubmit = async event => {
    event.preventDefault();

    if (!user) {
        alert("Please login to comment.");
        return;
    }

    const content = document.getElementById("commentText").value.trim();

    if (!content) return;

    await addDoc(collection(db, "books", bookId, "comments"), {
        uid: user.uid,
        name: user.displayName || user.email,
        content,
        createdAt: serverTimestamp()
    });

    document.getElementById("commentText").value = "";
    loadComments();
};

async function loadComments() {
    const result = await getDocs(
        query(
            collection(db, "books", bookId, "comments"),
            orderBy("createdAt", "desc")
        )
    );

    const container = document.getElementById("comments");
    container.innerHTML = "";

    result.forEach(d => {
        const data = d.data();
        const item = document.createElement("div");
        item.className = "table-row";

        const text = document.createElement("p");
        text.textContent = `${data.name}: ${data.content}`;

        item.appendChild(text);
        container.appendChild(item);
    });
}

document.getElementById("rateBtn").onclick = async () => {
    if (!user) {
        alert("Login to rate this book.");
        return;
    }

    const value = Number(document.getElementById("rating").value);

    await setDoc(
        doc(db, "books", bookId, "ratings", user.uid),
        {
            uid: user.uid,
            rating: value,
            updatedAt: serverTimestamp()
        }
    );

    document.getElementById("ratingResult").textContent =
        "Your rating has been submitted.";
};

onAuthStateChanged(auth, async currentUser => {
    user = currentUser;

    await loadBook();
    await loadComments();
});

document.getElementById("favouriteBtn").onclick = async () => {
    if (!user) {
        alert("Please login first.");
        return;
    }

    await setDoc(
        doc(db, "users", user.uid, "favourites", bookId),
        {
            bookId,
            addedAt: serverTimestamp()
        }
    );

    alert("Book added to My List!");
};