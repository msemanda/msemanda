/* eHealth System — Authentication */
(function () {
  var SK = 'eh_session';

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SK)); } catch (e) { return null; }
  }
  function setSession(user) {
    try { sessionStorage.setItem(SK, JSON.stringify(user)); } catch (e) {}
  }
  function clearSession() {
    try { sessionStorage.removeItem(SK); } catch (e) {}
  }

  function updateHeader(session) {
    if (!session) return;
    var avatarEl = document.querySelector('.user-avatar');
    var nameEl   = document.querySelector('.user-name');
    var roleEl   = document.querySelector('.user-role');
    if (avatarEl) avatarEl.textContent = (session.avatar || session.name.charAt(0)).toUpperCase();
    if (nameEl)   nameEl.textContent   = session.name;
    if (roleEl)   roleEl.textContent   = session.role.charAt(0).toUpperCase() + session.role.slice(1);
  }

  window.EHAuth = {
    login: function (email, password, role) {
      var user = null;
      if (window.EH) user = EH.findUser(email, password);
      // Demo fallback: accept Moses.semanda / ehealth2026 as admin
      if (!user && password === 'ehealth2026' &&
          (email.toLowerCase() === 'moses.semanda' || email.toLowerCase() === 'admin@ehealth.ug')) {
        user = { id:'u1', name:'Moses Semanda', email:'admin@ehealth.ug', avatar:'M', role:'admin' };
      }
      // Generic demo: accept any credentials
      if (!user && email && password.length >= 4) {
        user = { id:'demo', name: email.split('@')[0].replace(/[._]/g,' '), email: email, avatar: email.charAt(0).toUpperCase(), role: 'admin' };
      }
      if (user) {
        user = Object.assign({}, user, { role: role || user.role });
        setSession(user);
        return user;
      }
      return null;
    },

    logout: function () {
      clearSession();
      window.location.href = 'login.html';
    },

    getSession: getSession,

    requireAuth: function () {
      var s = getSession();
      if (!s) { window.location.href = 'login.html'; return null; }
      return s;
    },

    init: function () {
      var s = this.requireAuth();
      if (s) {
        updateHeader(s);
        // Sync role-select on dashboard if present
        var rs = document.getElementById('role-select');
        if (rs && s.role) rs.value = s.role;
        if (window.switchRole && s.role) switchRole(s.role);
      }
      return s;
    }
  };

  /* Toast notification helper */
  window.ehToast = function (msg, type) {
    type = type || 'success';
    var t = document.createElement('div');
    t.className = 'eh-toast eh-toast-' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3000);
  };

  /* Modal helpers */
  window.ehOpenModal  = function (id) { var m = document.getElementById(id); if (m) { m.style.display = 'flex'; } };
  window.ehCloseModal = function (id) { var m = document.getElementById(id); if (m) { m.style.display = 'none';  } };
})();
