function initializeSidebar() {
  // Open sidebar
  document.querySelectorAll('[id^="open-add-"]').forEach(button => {
    button.addEventListener('click', () => {
      const sidebarId = button.id.replace('open-', '');
      const sidebar = document.getElementById(sidebarId);
      if (sidebar) {
        document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('active'));
        sidebar.classList.add('active');
      }
    });
  });

  // Close sidebar
  document.querySelectorAll('.closebtn').forEach(button => {
    button.addEventListener('click', () => {
      button.closest('.sidebar').classList.remove('active');
    });
  });

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar') && !e.target.closest('[id^="open-add-"]')) {
      document.querySelectorAll('.sidebar').forEach(sidebar => {
        sidebar.classList.remove('active');
      });
    }
  });
}

export function initializeNavigation() {
  const navToggle = document.querySelector(".navbar .icon");
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      document.getElementById("myTopnav").classList.toggle("responsive");
    });
  }
  initializeSidebar();
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
