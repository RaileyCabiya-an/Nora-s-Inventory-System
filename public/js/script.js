document.addEventListener("DOMContentLoaded", function () {
document.body.style.opacity = 1;
  console.log("Inventory Management System Loaded");

  // Confirm before deleting a supplier or product
  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", function (event) {
      if (!confirm("Are you sure you want to delete this item?")) {
        event.preventDefault();
      }
    });
  });

  // Toggle navigation menu for mobile
  document.querySelector(".menu-toggle")?.addEventListener("click", function () {
    document.querySelector(".nav-links").classList.toggle("active");
  });
});
