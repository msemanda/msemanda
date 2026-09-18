/* eHealth System — Multi-tenant Authentication */
(function () {
  var SK = 'eh_session';

  function getSession() { try { return JSON.parse(sessionStorage.getItem(SK)); } catch(e) { return null; } }
  function setSession(u) { try { sessionStorage.setItem(SK, JSON.stringify(u)); } catch(e) {} }
  function clearSession() { try { sessionStorage.removeItem(SK); } catch(e) {} }

  function updateHeader(session) {
    if (!session) return;
    var avatarEl = document.querySelector('.user-avatar');
    var nameEl   = document.querySelector('.user-name');
    var roleEl   = document.querySelector('.user-role');
    if (avatarEl) avatarEl.textContent = (session.avatar || session.name.charAt(0)).toUpperCase();
    if (nameEl)   nameEl.textContent   = session.name;
    if (roleEl) {
      var label = session.role.charAt(0).toUpperCase() + session.role.slice(1);
      // Append tenant name for non-super-admin
      if (session.tenantId && window.EH) {
        var t = EH.getTenant(session.tenantId);
        if (t) label += ' · ' + t.name;
      }
      // Append context override for super-admin
      if (!session.tenantId && session.activeContext && window.EH) {
        var ct = EH.getTenant(session.activeContext);
        if (ct) label = 'Admin (viewing: ' + ct.name + ')';
      }
      roleEl.textContent = label;
    }
  }

  function injectLogoutDropdown() {
    var chip = document.querySelector('.header-right .user-chip, .header .user-chip');
    if (!chip || chip.querySelector('.user-chip-dd')) return; // already injected
    var dd = document.createElement('div');
    dd.className = 'user-chip-dd';
    dd.innerHTML = '<a class="user-dd-item" href="users.html">'
      + '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Profile</a>'
      + '<div class="user-dd-sep"></div>'
      + '<a class="user-dd-item danger" href="#" onclick="EHAuth.logout();return false;">'
      + '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout</a>';
    chip.appendChild(dd);
    chip.addEventListener('click', function(e) {
      if (!e.target.closest('.user-chip-dd')) chip.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (!chip.contains(e.target)) chip.classList.remove('open');
    }, true);
  }

  window.EHAuth = {
    /* ── Login ─────────────────────────────────────────── */
    login: function(email, password, role) {
      var user = null;
      if (window.EH) user = EH.findUser(email, password);
      // Demo fallback for Moses.semanda
      if (!user && password === 'ehealth2026' &&
          (email.toLowerCase() === 'moses.semanda' || email.toLowerCase() === 'admin@ehealth.ug')) {
        user = { id:'u1', name:'Moses Semanda', email:'admin@ehealth.ug', avatar:'M', role:'admin', tenantId:null };
      }
      if (user) {
        user = Object.assign({}, user, { role: role||user.role, activeContext: null });
        setSession(user);
        return user;
      }
      return null;
    },

    /* ── Logout ─────────────────────────────────────────── */
    logout: function() { clearSession(); window.location.href = 'login.html'; },

    /* ── Session access ─────────────────────────────────── */
    getSession: getSession,

    isSuperAdmin: function() {
      var s = getSession();
      return s && s.role === 'admin' && !s.tenantId;
    },

    /* Effective tenant: activeContext (super-admin override) or user's own tenantId */
    getTenantId: function() {
      var s = getSession();
      if (!s) return null;
      return s.activeContext || s.tenantId || null;
    },

    /* Super-admin can switch context to view as a specific hospital */
    switchContext: function(tenantId) {
      var s = getSession();
      if (!s || s.role !== 'admin') return;
      s.activeContext = tenantId || null;
      setSession(s);
      updateHeader(s);
      // Expose to page
      window.EH_TENANT = tenantId || null;
      // Fire custom event so pages can re-render
      try { window.dispatchEvent(new CustomEvent('eh:tenantchange', { detail: { tenantId: tenantId } })); } catch(e) {}
    },

    /* ── Require auth guard ─────────────────────────────── */
    requireAuth: function() {
      var s = getSession();
      if (!s) { window.location.href = 'login.html'; return null; }
      return s;
    },

    /* ── Init (call on DOMContentLoaded for each protected page) ── */
    init: function() {
      var s = this.requireAuth();
      if (!s) return null;
      window.EH_TENANT = s.activeContext || s.tenantId || null;
      updateHeader(s);
      var rs = document.getElementById('role-select');
      if (rs && s.role) { rs.value = s.role; if (window.switchRole) switchRole(s.role); }
      injectLogoutDropdown();
      return s;
    }
  };

  /* ── Toast ─────────────────────────────────────────────── */
  window.ehToast = function(msg, type) {
    type = type || 'success';
    var t = document.createElement('div');
    t.className = 'eh-toast eh-toast-' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.classList.add('show'); }, 10);
    setTimeout(function() { t.classList.remove('show'); setTimeout(function(){ t.remove(); }, 300); }, 3000);
  };

  /* ── Modal helpers ─────────────────────────────────────── */
  window.ehOpenModal  = function(id) { var m=document.getElementById(id); if(m) m.style.display='flex'; };
  window.ehCloseModal = function(id) { var m=document.getElementById(id); if(m) m.style.display='none';  };
})();
