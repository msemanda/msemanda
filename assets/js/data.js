/* eHealth System — Multi-tenant data store (localStorage) */
(function () {
  var K = 'eh_';
  function g(k)    { try { return JSON.parse(localStorage.getItem(K+k)); } catch(e) { return null; } }
  function s(k, v) { try { localStorage.setItem(K+k, JSON.stringify(v)); } catch(e) {} }

  /* ── Seed data ─────────────────────────────────────────── */
  var SEED = {
    tenants: [],
    users: [
      { id:'u1', name:'Moses Semanda', email:'admin@ehealth.ug', password:'ehealth2026', role:'admin', tenantId:null, avatar:'M', status:'active', createdAt:'2026-01-01' }
    ],
    patients: [],
    doctors: [],
    appointments: [],
    departments: [
      { id:'dept1', name:'Cardiology',       status:'active', createdAt:'2026-05-27 06:40:51 PM' },
      { id:'dept2', name:'Dermatology',      status:'active', createdAt:'2026-05-27 06:40:51 PM' },
      { id:'dept3', name:'Pediatrics',       status:'active', createdAt:'2026-05-27 06:40:51 PM' },
      { id:'dept4', name:'Orthopedics',      status:'active', createdAt:'2026-05-27 06:40:51 PM' },
      { id:'dept5', name:'Neurology',        status:'active', createdAt:'2026-05-27 06:40:51 PM' },
      { id:'dept6', name:'Gastroenterology', status:'active', createdAt:'2026-05-27 06:40:51 PM' },
      { id:'dept7', name:'ENT',              status:'active', createdAt:'2026-05-27 06:40:51 PM' },
      { id:'dept8', name:'General Medicine', status:'active', createdAt:'2026-05-27 06:40:51 PM' }
    ],
    specialties: [
      { id:'sp1',  name:'General Practice', icon:'🩺', status:'active',   createdAt:'2026-05-27 06:35:05 PM' },
      { id:'sp2',  name:'Pediatrics',       icon:'👶', status:'active',   createdAt:'2026-05-27 06:35:05 PM' },
      { id:'sp3',  name:'Orthopedics',      icon:'🦴', status:'active',   createdAt:'2026-05-27 06:23:25 PM' },
      { id:'sp4',  name:'Gynaecology',      icon:'🤰', status:'active',   createdAt:'2026-05-27 06:34:19 PM' },
      { id:'sp5',  name:'Cardiology',       icon:'❤️', status:'active',   createdAt:'2026-05-27 06:35:05 PM' },
      { id:'sp6',  name:'Sexual Health',    icon:'💊', status:'active',   createdAt:'2026-05-27 06:36:57 PM' },
      { id:'sp7',  name:'Mental Wellness',  icon:'🧠', status:'active',   createdAt:'2026-05-27 06:37:53 PM' },
      { id:'sp8',  name:'Dentistry',        icon:'🦷', status:'active',   createdAt:'2026-05-27 06:39:47 PM' },
      { id:'sp9',  name:'Dermatology',      icon:'🧴', status:'active',   createdAt:'2026-05-27 06:40:55 PM' },
      { id:'sp10', name:'ENT',              icon:'👂', status:'active',   createdAt:'2026-05-27 06:41:48 PM' },
      { id:'sp11', name:'Homeopathy',       icon:'🌿', status:'active',   createdAt:'2026-05-27 06:42:45 PM' },
      { id:'sp12', name:'Diet & Nutrition', icon:'🥗', status:'active',   createdAt:'2026-05-27 06:44:38 PM' },
      { id:'sp13', name:'Urinary Issues',   icon:'🫧', status:'inactive', createdAt:'2026-05-27 06:38:57 PM' }
    ],
    labTests: [
      { id:'lt1', name:'Complete Blood Count (CBC)',  icon:'🩺', description:'Comprehensive blood test to evaluate overall health and detect infections or anemia.',    pathologist:'Dr. Amelia Brooks',   status:'active', createdAt:'2026-05-29 04:18:06 AM' },
      { id:'lt2', name:'Liver Function Test (LFT)',   icon:'🫁', description:'Measures liver enzymes and proteins to assess liver health and detect liver diseases.',    pathologist:'Dr. Lucas Bennett',   status:'active', createdAt:'2026-05-29 04:21:34 AM' },
      { id:'lt3', name:'Lipid Profile Test',          icon:'💉', description:'Measures cholesterol and triglyceride levels to assess heart disease risk.',               pathologist:'Dr. Ethan Collins',   status:'active', createdAt:'2026-05-29 04:30:47 AM' },
      { id:'lt4', name:'Thyroid Function Test (TFT)', icon:'⚡', description:'Detects thyroid hormone imbalances affecting metabolism and energy levels.',               pathologist:'Dr. Grace Mitchell',  status:'active', createdAt:'2026-05-29 04:33:19 AM' },
      { id:'lt5', name:'Blood Sugar Test',            icon:'🫀', description:'Measures glucose levels to diagnose and monitor diabetes conditions.',                      pathologist:'Dr. Grace Mitchell',  status:'active', createdAt:'2026-05-29 04:37:05 AM' },
      { id:'lt6', name:'Vitamin D Test',              icon:'🩸', description:'Determines Vitamin D levels important for bone and immune health.',                        pathologist:'Dr. Noah Richardson', status:'active', createdAt:'2026-05-29 04:40:14 AM' },
      { id:'lt7', name:'Allergy Test',                icon:'🔬', description:'Identifies allergic reactions to specific substances.',                                     pathologist:'Pathologist user',    status:'active', createdAt:'2026-06-03 12:10:10 PM' }
    ],
    ambulanceBookings: []
  };

  function seed() {
    if (!g('seeded_v4')) {
      /* Clear any previous seed keys so old dummy data is wiped */
      ['seeded_v1','seeded_v2','seeded_v3'].forEach(function(k){ try { localStorage.removeItem('eh_'+k); } catch(e){} });
      Object.keys(SEED).forEach(function(k) { s(k, SEED[k]); });
      s('seeded_v4', true);
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
    }
  };

  seed();
})();
