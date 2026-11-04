
import { auth, googleProvider, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// ========================================
// HTML ELEMENTS
// ========================================

const form = document.getElementById("signupForm");

const profileFields = document.getElementById("profileFields");
const confirmGroup = document.getElementById("confirmGroup");
const confirmInput = document.getElementById("confirmPassword");

const nameInput = document.getElementById("name");
const meterInput = document.getElementById("meterNumber");
const stateInput = document.getElementById("state");
const cityInput = document.getElementById("city");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const submitBtn = document.getElementById("submitBtn");
const switchBtn = document.getElementById("switchBtn");
const switchText = document.getElementById("switchText");
const message = document.getElementById("message");

const googleBtn = document.getElementById("googleBtn");
const socialDivider = document.getElementById("socialDivider");

const forgotPasswordContainer = document.getElementById(
  "forgotPasswordContainer"
);

const forgotPasswordBtn = document.getElementById(
  "forgotPasswordBtn"
);


// GOOGLE PROFILE FORM ELEMENTS

const googleProfileOverlay = document.getElementById(
  "googleProfileOverlay"
);

const googleProfileForm = document.getElementById(
  "googleProfileForm"
);

const googleName = document.getElementById("googleName");
const googleEmail = document.getElementById("googleEmail");
const googleMeter = document.getElementById("googleMeter");
const googleState = document.getElementById("googleState");
const googleCity = document.getElementById("googleCity");

const googleProfileMessage = document.getElementById(
  "googleProfileMessage"
);

const saveGoogleProfile = document.getElementById(
  "saveGoogleProfile"
);

let googleUser = null;
let isLogin = false;


// ========================================
// CITY OPTIONS
// ========================================

const cities = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat"],
  Assam: ["Guwahati", "Dibrugarh", "Silchar"],
  Bihar: ["Patna", "Gaya", "Muzaffarpur"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur"],
  Goa: ["Panaji", "Margao", "Vasco da Gama"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Hisar"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Chhatrapati Sambhajinagar"],
  Manipur: ["Imphal", "Thoubal"],
  Meghalaya: ["Shillong", "Tura"],
  Mizoram: ["Aizawl", "Lunglei"],
  Nagaland: ["Kohima", "Dimapur"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  Sikkim: ["Gangtok", "Namchi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
  Telangana: ["Hyderabad", "Warangal", "Karimnagar"],
  Tripura: ["Agartala", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Noida"],
  Uttarakhand: ["Dehradun", "Haridwar", "Haldwani"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur"],
  "Andaman and Nicobar Islands": ["Port Blair"],
  Chandigarh: ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": [
    "Daman", "Silvassa", "Diu"
  ],
  Delhi: ["New Delhi", "Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  Ladakh: ["Leh", "Kargil"],
  Lakshadweep: ["Kavaratti"],
  Puducherry: ["Puducherry", "Karaikal"]
};


// ========================================
// REUSABLE CITY DROPDOWN FUNCTION
// ========================================

function populateCities(state, cityDropdown) {

  const availableCities = cities[state] || [];

  cityDropdown.innerHTML =
    '<option value="">Select your city</option>';

  availableCities.forEach((city) => {

    const option = document.createElement("option");

    option.value = city;
    option.textContent = city;

    cityDropdown.appendChild(option);

  });

  const otherOption = document.createElement("option");

  otherOption.value = "Other";
  otherOption.textContent = "Other";

  cityDropdown.appendChild(otherOption);

  cityDropdown.disabled = !state;
}


// ========================================
// NORMAL SIGNUP STATE / CITY DROPDOWN
// ========================================

stateInput.addEventListener("change", () => {

  populateCities(stateInput.value, cityInput);

});


// ========================================
// GOOGLE PROFILE STATE / CITY DROPDOWN
// ========================================

googleState.addEventListener("change", () => {

  populateCities(googleState.value, googleCity);

});


// ========================================
// SHOW / HIDE PASSWORD
// ========================================

document.querySelectorAll(".eye").forEach((button) => {

  button.addEventListener("click", () => {

    const input = document.getElementById(button.dataset.target);

    const showPassword = input.type === "password";

    input.type = showPassword ? "text" : "password";

    button.textContent = showPassword ? "Hide" : "Show";

    button.setAttribute(
      "aria-label",
      showPassword ? "Hide password" : "Show password"
    );

  });

});


// ========================================
// FEEDBACK MESSAGES
// ========================================

function showMessage(text, isError = true) {

  message.textContent = text;

  message.style.color = isError ? "#b91c1c" : "#166534";

}


// ========================================
// FIREBASE ERROR MESSAGES
// ========================================

function getFriendlyError(code) {

  const errors = {

    "auth/invalid-credential":
      "Incorrect email or password.",

    "auth/user-not-found":
      "No account found. Please sign up first.",

    "auth/wrong-password":
      "Incorrect email or password.",

    "auth/email-already-in-use":
      "This email is already registered. Please login.",

    "auth/weak-password":
      "Password must contain at least 6 characters.",

    "auth/invalid-email":
      "Please enter a valid email address.",

    "auth/popup-closed-by-user":
      "Google login was cancelled.",

    "auth/popup-blocked":
      "Your browser blocked the Google popup.",

    "auth/unauthorized-domain":
      "This domain is not authorized in Firebase.",

    "auth/operation-not-allowed":
      "Enable this authentication method in Firebase Console.",

    "auth/too-many-requests":
      "Too many attempts. Please try again later.",

    "auth/network-request-failed":
      "Network error. Check your internet connection."

  };

  return errors[code] || "Something went wrong. Please try again.";

}


// ========================================
// SWITCH LOGIN / SIGNUP
// ========================================

switchBtn.addEventListener("click", () => {

  isLogin = !isLogin;

  form.reset();

  message.textContent = "";

  cityInput.innerHTML =
    '<option value="">First select your state</option>';

  cityInput.disabled = true;

  profileFields.hidden = isLogin;

  confirmGroup.hidden = isLogin;

  nameInput.required = !isLogin;
  meterInput.required = !isLogin;
  stateInput.required = !isLogin;
  cityInput.required = !isLogin;
  confirmInput.required = !isLogin;

  passwordInput.autocomplete = isLogin
    ? "current-password"
    : "new-password";

  formTitle.textContent = isLogin
    ? "Welcome Back"
    : "Create Your Account";

  formSubtitle.textContent = isLogin
    ? "Login to your WattWise account."
    : "Join WattWise and monitor your electricity consumption.";

  submitBtn.textContent = isLogin
    ? "Login"
    : "Create Account";

  switchText.textContent = isLogin
    ? "Don't have an account?"
    : "Already have an account?";

  switchBtn.textContent = isLogin
    ? "Sign Up"
    : "Login";

  googleBtn.hidden = !isLogin;

  socialDivider.hidden = !isLogin;

  forgotPasswordContainer.hidden = !isLogin;

});


// ========================================
// EMAIL SIGNUP / EMAIL LOGIN
// ========================================

form.addEventListener("submit", async (event) => {

  event.preventDefault();

  message.textContent = "";

  const email = emailInput.value.trim();

  const password = passwordInput.value;

  if (!isLogin && password !== confirmInput.value) {

    showMessage("Passwords do not match.");

    return;

  }

  submitBtn.disabled = true;

  try {

    if (isLogin) {

      // EMAIL LOGIN

      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Load saved profile from Firestore

      const profileRef = doc(
        db,
        "consumers",
        credential.user.uid
      );

      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {

        sessionStorage.setItem(
          "wattwiseConsumer",
          JSON.stringify(profileSnap.data())
        );

      }

    } else {

      // CREATE NEW EMAIL ACCOUNT

      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // UPDATE USER NAME

      await updateProfile(credential.user, {

        displayName: nameInput.value.trim()

      });

      // CONSUMER PROFILE

      const consumer = {

        name: nameInput.value.trim(),

        meter: meterInput.value.trim(),

        state: stateInput.value,

        city: cityInput.value,

        email: email

      };

      // SAVE PERMANENTLY IN FIRESTORE

      await setDoc(
        doc(db, "consumers", credential.user.uid),
        consumer
      );

      // SAVE FOR CURRENT SESSION

      sessionStorage.setItem(
        "wattwiseConsumer",
        JSON.stringify(consumer)
      );

    }

    // REDIRECT TO DASHBOARD

    window.location.href = "dashboard.html";

  } catch (error) {

    console.error(
      "Firebase Error:",
      error.code,
      error.message
    );

    showMessage(getFriendlyError(error.code));

  } finally {

    submitBtn.disabled = false;

  }

});


// ========================================
// GOOGLE LOGIN
// ========================================

googleBtn.addEventListener("click", async () => {

  googleBtn.disabled = true;

  message.textContent = "";

  try {

    // GOOGLE AUTHENTICATION

    const result = await signInWithPopup(
      auth,
      googleProvider
    );

    googleUser = result.user;

    // CHECK FIRESTORE PROFILE

    const profileRef = doc(
      db,
      "consumers",
      googleUser.uid
    );

    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {

      const consumer = profileSnap.data();

      // Check whether profile is complete

      if (
        consumer.meter &&
        consumer.state &&
        consumer.city
      ) {

        // EXISTING USER: OPEN DASHBOARD

        sessionStorage.setItem(
          "wattwiseConsumer",
          JSON.stringify(consumer)
        );

        window.location.href = "dashboard.html";

        return;

      }

      // Existing incomplete profile:
      // Show form with previously saved values

      googleMeter.value = consumer.meter || "";

      googleState.value = consumer.state || "";

      if (consumer.state) {

        populateCities(consumer.state, googleCity);

        googleCity.value = consumer.city || "";

      }

    } else {

      // NEW GOOGLE USER

      googleMeter.value = "";

      googleState.value = "";

      googleCity.innerHTML =
        '<option value="">First select your state</option>';

      googleCity.disabled = true;

    }

    // FILL GOOGLE DETAILS AUTOMATICALLY

    googleName.value = googleUser.displayName || "";

    googleEmail.value = googleUser.email || "";

    googleProfileMessage.textContent = "";

    // SHOW PROFILE COMPLETION FORM

    googleProfileOverlay.hidden = false;

  } catch (error) {

    console.error(
      "Google Login Error:",
      error.code,
      error.message
    );

    showMessage(getFriendlyError(error.code));

  } finally {

    googleBtn.disabled = false;

  }

});


// ========================================
// SAVE GOOGLE PROFILE PERMANENTLY
// ========================================

googleProfileForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  if (!googleUser) {

    googleProfileMessage.textContent =
      "Please sign in with Google again.";

    return;

  }

  const meter = googleMeter.value.trim();

  const state = googleState.value;

  const city = googleCity.value;

  if (!meter || !state || !city) {

    googleProfileMessage.textContent =
      "Please complete all profile fields.";

    return;

  }

  saveGoogleProfile.disabled = true;

  googleProfileMessage.textContent = "Saving your profile...";

  try {

    // PROFILE DATA

    const consumer = {

      name: googleUser.displayName || "",

      email: googleUser.email || "",

      meter: meter,

      state: state,

      city: city

    };

    // SAVE TO FIRESTORE PERMANENTLY

    await setDoc(
      doc(db, "consumers", googleUser.uid),
      consumer
    );

    // SAVE FOR CURRENT SESSION

    sessionStorage.setItem(
      "wattwiseConsumer",
      JSON.stringify(consumer)
    );

    googleProfileMessage.textContent =
      "Profile saved successfully!";

    // OPEN DASHBOARD

    window.location.href = "dashboard.html";

  } catch (error) {

    console.error(
      "Google Profile Saving Error:",
      error.code,
      error.message
    );

    googleProfileMessage.textContent =
      "Unable to save profile. Please try again.";

  } finally {

    saveGoogleProfile.disabled = false;

  }

});


// ========================================
// FORGOT PASSWORD
// ========================================

forgotPasswordBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();

  if (!email) {

    showMessage("Enter your email address first.");

    emailInput.focus();

    return;

  }

  if (!emailInput.checkValidity()) {

    showMessage("Please enter a valid email address.");

    emailInput.focus();

    return;

  }

  forgotPasswordBtn.disabled = true;

  message.textContent = "";

  try {

    await sendPasswordResetEmail(
      auth,
      email
    );

    showMessage(
      "Password reset instructions have been requested. Check your inbox and spam folder.",
      false
    );

  } catch (error) {

    console.error(
      "Password Reset Error:",
      error.code,
      error.message
    );

    showMessage(getFriendlyError(error.code));

  } finally {

    forgotPasswordBtn.disabled = false;

  }

});


// ========================================
// INITIAL PAGE STATE
// ========================================

profileFields.hidden = false;

confirmGroup.hidden = false;

googleBtn.hidden = true;

socialDivider.hidden = true;

forgotPasswordContainer.hidden = true;

nameInput.required = true;

meterInput.required = true;

stateInput.required = true;

cityInput.required = true;

confirmInput.required = true;
