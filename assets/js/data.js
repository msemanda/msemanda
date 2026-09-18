/* eHealth System — Multi-tenant data store (localStorage) */
(function () {
  var K = 'eh_';
  function g(k)    { try { return JSON.parse(localStorage.getItem(K+k)); } catch(e) { return null; } }
  function s(k, v) { try { localStorage.setItem(K+k, JSON.stringify(v)); } catch(e) {} }

  /* ── Seed data ─────────────────────────────────────────── */
  var SEED = {
    tenants:          [],
    users:            [{ id:'u1', name:'Moses Semanda', email:'admin@ehealth.ug', password:'ehealth2026', role:'admin', tenantId:null, avatar:'M', status:'active', createdAt:'2026-01-01' }],
    patients:         [],
    doctors:          [],
    appointments:     [],
    departments:      [],
    specialties:      [],
    labTests:         [],
    ambulanceBookings:[],
    mediaFiles:       [],
    services: [
      { id:'svc1', name:'Clinic Visit',       icon:'➕', bg:'#E0F7FA', status:'active', createdAt:'2026-01-01' },
      { id:'svc2', name:'Video Consultation', icon:'🎥', bg:'#E3F2FD', status:'active', createdAt:'2026-01-01' },
      { id:'svc3', name:'Home Visit',         icon:'🏠', bg:'#F3E5F5', status:'active', createdAt:'2026-01-01' },
      { id:'svc4', name:'Lab Test',           icon:'🧪', bg:'#FFF8E1', status:'active', createdAt:'2026-01-01' },
      { id:'svc5', name:'Book Ambulance',     icon:'🚑', bg:'#FFEBEE', status:'active', createdAt:'2026-01-01' },
      { id:'svc6', name:'Pharmacy',           icon:'💊', bg:'#E8F5E9', status:'active', createdAt:'2026-01-01' }
    ]
  };

  function seed() {
    if (!g('seeded_v5')) {
      ['seeded_v1','seeded_v2','seeded_v3','seeded_v4'].forEach(function(k){ try { localStorage.removeItem('eh_'+k); } catch(e){} });
      Object.keys(SEED).forEach(function(k) { s(k, SEED[k]); });
      s('seeded_v5', true);
    }
  }

  function nextId(prefix) { return prefix + Date.now() + Math.floor(Math.random()*1000); }
  function nowStr() {
    var d = new Date();
    return d.toISOString().slice(0,10) + ' ' + d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  }
  function filterByTenant(list, tenantId) {
    if (!tenantId) return list; // super-admin sees all
    return list.filter(function(r) { return r.tenantId === tenantId; });
  }

  window.EH = {
    /* ── Tenants ─────────────────────────────────────────── */
    getTenants: function() { return g('tenants') || []; },

    getTenant: function(id) {
      return this.getTenants().find(function(t){return t.id===id;}) || null;
    },

    addTenant: function(data) {
      var tenants = this.getTenants();
      var t = Object.assign({ id: nextId('t'), doctorCount:0, patientCount:0, createdAt: nowStr().slice(0,10) }, data);
      tenants.push(t);
      s('tenants', tenants);
      return t;
    },

    updateTenant: function(id, data) {
      var tenants = this.getTenants().map(function(t) { return t.id===id ? Object.assign(t,data) : t; });
      s('tenants', tenants);
    },

    deleteTenant: function(id) {
      s('tenants', this.getTenants().filter(function(t){return t.id!==id;}));
    },

    /* ── Users ───────────────────────────────────────────── */
    getUsers: function(tenantId) { return filterByTenant(g('users')||[], tenantId); },

    addUser: function(data) {
      var users = g('users') || [];
      var u = Object.assign({ id: nextId('u'), status:'active', avatar: (data.name||'U').charAt(0).toUpperCase(), createdAt: nowStr().slice(0,10) }, data);
      users.push(u);
      s('users', users);
      return u;
    },

    updateUser: function(id, data) {
      var users = (g('users')||[]).map(function(u){ return u.id===id ? Object.assign(u,data) : u; });
      s('users', users);
    },

    deleteUser: function(id) { s('users', (g('users')||[]).filter(function(u){return u.id!==id;})); },

    findUser: function(email, password) {
      return (g('users')||[]).find(function(u) {
        return u.email.toLowerCase() === (email||'').toLowerCase() && u.password === password;
      }) || null;
    },

    /* ── Patients ────────────────────────────────────────── */
    getPatients: function(tenantId) { return filterByTenant(g('patients')||[], tenantId); },

    addPatient: function(data, tenantId) {
      var list = g('patients') || [];
      var p = Object.assign({ id: nextId('p'), status:'active', tenantId: tenantId||null, createdAt: nowStr() }, data);
      list.unshift(p);
      s('patients', list);
      // update tenant patient count
      if (tenantId) {
        var tenant = this.getTenant(tenantId);
        if (tenant) this.updateTenant(tenantId, { patientCount: (tenant.patientCount||0)+1 });
      }
      return p;
    },

    /* ── Doctors ─────────────────────────────────────────── */
    getDoctors: function(tenantId) { return filterByTenant(g('doctors')||[], tenantId); },

    addDoctor: function(data, tenantId) {
      var list = g('doctors') || [];
      var d = Object.assign({ id: nextId('d'), status:'active', tenantId: tenantId||null }, data);
      list.push(d);
      s('doctors', list);
      if (tenantId) {
        var tenant = this.getTenant(tenantId);
        if (tenant) this.updateTenant(tenantId, { doctorCount: (tenant.doctorCount||0)+1 });
      }
      return d;
    },

    /* ── Appointments ────────────────────────────────────── */
    getAppointments: function(tenantId) { return filterByTenant(g('appointments')||[], tenantId); },

    addAppointment: function(data, tenantId) {
      var list = g('appointments') || [];
      var num  = '#' + (10246 + list.length);
      var a = Object.assign({ id: nextId('a'), num: num, status:'pending', tenantId: tenantId||null, createdAt: nowStr() }, data);
      list.unshift(a);
      s('appointments', list);
      return a;
    },

    updateAppointmentStatus: function(id, status) {
      var list = (g('appointments')||[]).map(function(a){ return a.id===id ? Object.assign(a,{status:status}) : a; });
      s('appointments', list);
    },

    /* ── Tenant stats ────────────────────────────────────── */
    getTenantStats: function(tenantId) {
      return {
        patients:     this.getPatients(tenantId).length,
        doctors:      this.getDoctors(tenantId).length,
        appointments: this.getAppointments(tenantId).length,
        pending:      this.getAppointments(tenantId).filter(function(a){return a.status==='pending';}).length,
        today:        this.getAppointments(tenantId).filter(function(a){return a.date==='2026-09-18';}).length
      };
    },

    /* ── Departments ─────────────────────────────────────── */
    getDepartments: function() { return g('departments') || []; },
    addDepartment: function(data) {
      var list = this.getDepartments();
      var d = Object.assign({ id: nextId('dept'), status:'active', createdAt: nowStr() }, data);
      list.push(d); s('departments', list); return d;
    },
    deleteDepartment: function(id) { s('departments', this.getDepartments().filter(function(d){return d.id!==id;})); },

    /* ── Specialties ─────────────────────────────────────── */
    getSpecialties: function() { return g('specialties') || []; },
    addSpecialty: function(data) {
      var list = this.getSpecialties();
      var sp = Object.assign({ id: nextId('sp'), status:'active', createdAt: nowStr() }, data);
      list.push(sp); s('specialties', list); return sp;
    },
    deleteSpecialty: function(id) { s('specialties', this.getSpecialties().filter(function(sp){return sp.id!==id;})); },

    /* ── Lab Tests ───────────────────────────────────────── */
    getLabTests: function() { return g('labTests') || []; },
    addLabTest: function(data) {
      var list = this.getLabTests();
      var lt = Object.assign({ id: nextId('lt'), status:'active', createdAt: nowStr() }, data);
      list.push(lt); s('labTests', list); return lt;
    },
    deleteLabTest: function(id) { s('labTests', this.getLabTests().filter(function(lt){return lt.id!==id;})); },

    /* ── Ambulance Bookings ──────────────────────────────── */
    getAmbulanceBookings: function(tenantId) { return filterByTenant(g('ambulanceBookings')||[], tenantId); },
    addAmbulanceBooking: function(data, tenantId) {
      var list = g('ambulanceBookings') || [];
      var ab = Object.assign({ id: nextId('ab'), status:'pending', tenantId: tenantId||null, createdAt: nowStr() }, data);
      list.unshift(ab); s('ambulanceBookings', list); return ab;
    },

    /* ── Services ────────────────────────────────────────── */
    getServices: function() { return g('services') || []; },
    updateService: function(id, data) {
      s('services', (g('services')||[]).map(function(sv){ return sv.id===id ? Object.assign(sv,data) : sv; }));
    },
    addService: function(data) {
      var list = g('services') || [];
      var sv = Object.assign({ id: nextId('svc'), status:'active', createdAt: nowStr().slice(0,10) }, data);
      list.push(sv); s('services', list); return sv;
    },
    deleteService: function(id) { s('services', (g('services')||[]).filter(function(sv){return sv.id!==id;})); },

    /* ── Media Files ─────────────────────────────────────── */
    getMediaFiles: function() { return g('mediaFiles') || []; },
    addMediaFile: function(data) {
      var list = g('mediaFiles') || [];
      var f = Object.assign({ id: nextId('mf'), createdAt: nowStr() }, data);
      list.unshift(f); s('mediaFiles', list); return f;
    },
    deleteMediaFile: function(id) { s('mediaFiles', (g('mediaFiles')||[]).filter(function(f){return f.id!==id;})); }
  };

  seed();
})();
