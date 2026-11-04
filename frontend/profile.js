
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// =====================================
// PROFILE ELEMENTS
// =====================================

const profileBtn = document.getElementById("profileBtn");
const profilePopup = document.getElementById("profilePopup");
const logoutBtn = document.getElementById("logoutBtn");

const profileName = document.getElementById("profileName");
const userEmail = document.getElementById("userEmail");

const profileInitial = document.getElementById("profileInitial");
const profileInitialPopup = document.getElementById("profileInitialPopup");

const userMeter = document.getElementById("userMeter");
const userState = document.getElementById("userState");
const userCity = document.getElementById("userCity");

// =====================================
// DISPLAY PROFILE INFORMATION
// =====================================

function displayProfile(data, user) {

    const name = data.name || user.displayName || "WattWise User";
    const email = data.email || user.email || "-";
    const initial = name.charAt(0).toUpperCase();

    // Name and email
    profileName.textContent = name;
    userEmail.textContent = email;

    // Profile initials
    profileInitial.textContent = initial;

    if (profileInitialPopup) {
        profileInitialPopup.textContent = initial;
    }

    // Electricity details
    userMeter.textContent = data.meter || "-";
    userState.textContent = data.state || "-";
    userCity.textContent = data.city || "-";
}

// =====================================
// CHECK LOGGED-IN USER
// =====================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.replace("index.html");
        return;
    }

    try {

        // Get the user's Firestore document
        const profileRef = doc(db, "consumers", user.uid);

        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {

            const consumerData = profileSnap.data();

            // Display saved profile
            displayProfile(consumerData, user);

            // Update local session
            sessionStorage.setItem(
                "wattwiseConsumer",
                JSON.stringify(consumerData)
            );

            console.log("WattWise profile loaded successfully.");

        } else {

            // Fallback if profile document does not exist
            displayProfile({
                name: user.displayName || "WattWise User",
                email: user.email || "",
                meter: "",
                state: "",
                city: ""
            }, user);

            console.warn(
                "No Firestore profile found for UID:",
                user.uid
            );
        }

    } catch (error) {

        console.error("Profile loading error:", error);

        profileName.textContent = "Unable to load profile";

        alert(
            "Unable to load your profile. Please check your internet connection."
        );
    }

});

// =====================================
// OPEN / CLOSE PROFILE POPUP
// =====================================

function closeProfilePopup() {
    profilePopup.hidden = true;
    profileBtn.setAttribute("aria-expanded", "false");
}

profileBtn.addEventListener("click", (event) => {

    event.stopPropagation();

    const isOpening = profilePopup.hidden;

    profilePopup.hidden = !isOpening;

    profileBtn.setAttribute(
        "aria-expanded",
        String(isOpening)
    );

});

// Close when clicking outside
document.addEventListener("click", (event) => {

    if (
        !profilePopup.contains(event.target) &&
        !profileBtn.contains(event.target)
    ) {
        closeProfilePopup();
    }

});

// Close with Escape key
document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {
        closeProfilePopup();
    }

});

// =====================================
// LOGOUT
// =====================================

logoutBtn.addEventListener("click", async () => {

    try {

        logoutBtn.disabled = true;
        logoutBtn.textContent = "Logging out...";

        await signOut(auth);

        sessionStorage.removeItem("wattwiseConsumer");

        window.location.replace("index.html");

    } catch (error) {

        console.error("Logout error:", error);

        alert("Unable to logout. Please try again.");

        logoutBtn.disabled = false;
        logoutBtn.textContent = "Logout ↗";

    }

});
