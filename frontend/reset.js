
import { auth } from "./firebase.js";

import {
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const form = document.getElementById("resetForm");
const emailInput = document.getElementById("email");
const message = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";
    message.textContent = "";

    try {
        await sendPasswordResetEmail(auth, email);

        message.textContent =
            "Reset link sent successfully! Check your Gmail inbox.";

        message.className = "success";

        form.reset();

    } catch (error) {
        console.error(error);

        if (error.code === "auth/invalid-email") {
            message.textContent = "Please enter a valid email.";
        } else if (error.code === "auth/user-not-found") {
            message.textContent = "No account found with this email.";
        } else {
            message.textContent =
                "Unable to send reset link. Please try again.";
        }

        message.className = "error";

    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send Reset Link";
    }
});
