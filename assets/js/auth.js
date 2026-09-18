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
      // Generic demo: any credentials work
      if (!user && email && password.length >= 4) {
        user = { id:'demo', name: email.split('@')[0].replace(/[._]/g,' '), email:email, avatar:email.charAt(0).toUpperCase(), role: role||'admin', tenantId: null };
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
      // Expose effective tenant globally
      window.EH_TENANT = s.activeContext || s.tenantId || null;
      updateHeader(s);
      // Sync role-select on dashboard
      var rs = document.getElementById('role-select');
      if (rs && s.role) { rs.value = s.role; if (window.switchRole) switchRole(s.role); }
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
