export function initializeNavigation() {
  const navToggle = document.querySelector(".navbar .icon");
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      document.getElementById("myTopnav").classList.toggle("responsive");
    });
  }

}

export function initializeCollapsibleSections() {
  document.querySelectorAll(".collapsible").forEach(collapsible => {
    collapsible.addEventListener("click", function() {
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      if (content) {
        content.style.display = content.style.display === "block" ? "none" : "block";
      }
    });
  });
}
