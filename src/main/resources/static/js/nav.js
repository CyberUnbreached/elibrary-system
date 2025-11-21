// Shared navbar renderer for all pages
// Renders role-based links and marks current page as active
(function() {
  function currentFile() {
    try {
      var p = window.location.pathname || '';
      var file = p.substring(p.lastIndexOf('/') + 1) || 'index.html';
      return file;
    } catch (e) {
      return 'index.html';
    }
  }

  function buildLinks(user, current) {
    var links = [];
    if (!user) return links;

    if (user.role === 'CUSTOMER') {
      links = [
        { href: 'borrow-book.html', text: 'Book Lending', icon: 'glyphicon-book' },
        { href: 'customer-transactions.html', text: 'History', icon: 'glyphicon-time' },
        { href: 'purchase-book.html', text: 'Purchase', icon: 'glyphicon-usd' },
        { href: 'customer-cart.html', text: 'Cart', icon: 'glyphicon-shopping-cart' },
        { href: 'profile.html', text: 'Profile', icon: 'glyphicon-cog' }
      ];
    } else if (user.role === 'STAFF') {
      links = [
        { href: 'staff.html', text: 'Dashboard', icon: 'glyphicon-dashboard' },
        { href: 'manage-books.html', text: 'Manage Books', icon: 'glyphicon-book' },
        { href: 'overdue.html', text: 'Overdue', icon: 'glyphicon-warning-sign' },
        { href: 'profile.html', text: 'Profile', icon: 'glyphicon-cog' }
      ];
    }

    return links.map(function(l) {
      var active = (current === l.href) ? ' class="active"' : '';
      return '<li' + active + '><a href="' + l.href + '"><span class="glyphicon ' + l.icon + '"></span> ' + l.text + '</a></li>';
    }).join('\n');
  }

  function renderNav() {
    var navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    var user = null;
    try { user = JSON.parse(localStorage.getItem('user')); } catch (e) {}
    var current = currentFile();

    if (!user) {
      navAuth.innerHTML = '<li><a href="login.html"><span class="glyphicon glyphicon-log-in"></span> Login</a></li>';
      return;
    }

    var linksHtml = buildLinks(user, current);
    var userHtml = '<li><a><span class="glyphicon glyphicon-user"></span> ' + (user.username || 'User') + ' (' + (user.role || '') + ')</a></li>';
    var logoutHtml = '<li><a href="#" id="logout-btn"><span class="glyphicon glyphicon-log-out"></span> Logout</a></li>';

    navAuth.innerHTML = linksHtml + '\n' + userHtml + '\n' + logoutHtml;

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        try { localStorage.removeItem('user'); } catch (err) {}
        window.location.href = 'home.html';
      });
    }
  }

  // Expose and auto-render on DOM ready
  window.renderNav = renderNav;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNav);
  } else {
    renderNav();
  }
})();
