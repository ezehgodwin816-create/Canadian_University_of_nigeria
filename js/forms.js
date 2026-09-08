/**
 * Form validation helpers
 */

function validateRequired(form) {
  let valid = true;
  form.querySelectorAll("[required]").forEach((el) => {
    const errorEl = el.parentElement.querySelector(".form-error");
    if (!el.value || (el.type === "checkbox" && !el.checked)) {
      el.classList.add("error");
      if (errorEl) {
        errorEl.textContent = "This field is required";
        errorEl.classList.add("show");
      }
      valid = false;
    } else {
      el.classList.remove("error");
      if (errorEl) errorEl.classList.remove("show");
    }
  });
  return valid;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clearFormErrors(form) {
  form.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));
  form.querySelectorAll(".form-error").forEach((el) => el.classList.remove("show"));
}

window.validateRequired = validateRequired;
window.validateEmail = validateEmail;
window.clearFormErrors = clearFormErrors;
