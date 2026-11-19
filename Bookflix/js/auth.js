
import {
    auth, db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    doc, setDoc, getDoc
} from "./firebase.js";

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const result = await createUserWithEmailAndPassword(
                auth, email, password
            );

            await setDoc(doc(db, "users", result.user.uid), {
                name,
                email,
                role: "user",
                createdAt: new Date()
            });

            message.textContent = "Registration successful!";
            window.location.href = "index.html";

        } catch (error) {
            message.textContent = error.message;
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const result = await signInWithEmailAndPassword(
                auth, email, password
            );

            const profile = await getDoc(
                doc(db, "users", result.user.uid)
            );

            if (!profile.exists()) {
                message.textContent = "Profil pengguna tidak dijumpai.";
                return;
            }

            window.location.replace("index.html");

        } catch (error) {
            console.error("Login error:", error);

            if (error.code === "auth/invalid-credential") {
                message.textContent = "E-mel atau kata laluan tidak betul.";
            } else if (error.code === "auth/user-disabled") {
                message.textContent = "Akaun ini telah dinyahaktifkan.";
            } else {
                message.textContent = "Login gagal. Sila cuba lagi.";
            }
        }
    });
}