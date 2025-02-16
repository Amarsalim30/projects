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
  const navbar = document.getElementById("myTopnav");
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navLinks = document.querySelectorAll(".nav-link");
  let lastScroll = window.scrollY;
  let scrollTimer = null;

  // Create and append overlay if it doesn't exist
  let overlay = document.querySelector('.menu-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);
  }

  // Toggle mobile menu
  navbarToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    navbar.classList.toggle('responsive');
    navbarToggle.classList.toggle('active');
    document.body.classList.toggle('menu-open');
  });

  // Close mobile menu when clicking overlay
  overlay.addEventListener('click', () => {
    navbar.classList.remove('responsive');
    navbarToggle?.classList.remove('active');
    document.body.classList.remove('menu-open');
  });

  // Handle link clicks
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navbar.classList.remove('responsive');
      navbarToggle?.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar-menu') && !e.target.closest('.navbar-toggle')) {
      navbar.classList.remove('responsive');
      navbarToggle?.classList.remove('active');
      document.body.classList.remove('menu-open'); // Remove menu-open class to restore scrolling
      overlay.style.visibility = 'hidden'; // Hide overlay
      overlay.style.opacity = '0';
    }
  });

  // Handle dropdown separately from menu
  const dropdown = document.querySelector('.dropdown');
  const userProfile = dropdown.querySelector('.user-profile');
  const dropdownContent = dropdown.querySelector('.dropdown-content');

  userProfile.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active'); // Simply toggle the active class
  });

  // Close dropdown when clicking dropdown content or outside
  document.addEventListener('click', (e) => {
    if (!userProfile.contains(e.target)) { // Check if click is outside user profile button
      dropdown.classList.remove('active');
    }
  });

  // Close dropdown on mobile menu close
  navbarToggle?.addEventListener('click', () => {
    dropdown.classList.remove('active');
  });

  // Handle scroll behavior
  function handleScroll() {
    if (scrollTimer) {
      window.cancelAnimationFrame(scrollTimer);
    }

    scrollTimer = window.requestAnimationFrame(() => {
      const currentScroll = window.scrollY;
      
      if (!navbar.classList.contains('responsive')) {
        navbar.classList.toggle('scrolled', currentScroll > 50);
        
        if (currentScroll > lastScroll && currentScroll > 100) {
          navbar.classList.add('nav-hidden');
        } else {
          navbar.classList.remove('nav-hidden');
        }
      }
      
      lastScroll = currentScroll;
    });
  }

  // Initialize scroll handler
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Handle link clicks
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      navbar.classList.remove('responsive');
      navbarToggle?.classList.remove('active');
      
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        const headerOffset = navbar.offsetHeight + 10;
        const elementPosition = targetElement.offsetTop;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Initialize sidebar functionality
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
