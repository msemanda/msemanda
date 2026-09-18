/* eHealth System — Multi-tenant data store (localStorage) */
(function () {
  var K = 'eh_';
  function g(k)    { try { return JSON.parse(localStorage.getItem(K+k)); } catch(e) { return null; } }
  function s(k, v) { try { localStorage.setItem(K+k, JSON.stringify(v)); } catch(e) {} }

  /* ── Seed data ─────────────────────────────────────────── */
  var SEED = {
    tenants:          [],
    users:            [{ id:'u1', name:'Moses Semanda', email:'semandamoses91@gmail.com', password:'ehealth2026', role:'admin', tenantId:null, avatar:'M', status:'active', createdAt:'2026-01-01' }],
    patients:         [],
    doctors:          [],
    appointments:     [],
    departments:      [],
    specialties:      [],
    labTests: [
      { id:'lt1', title:'Complete Blood Count (CBC)',    slug:'cbc',         description:'Comprehensive blood test used to evaluate overall health and detect infections or anemia.', pathologist:'Dr. Amelia Brooks',    categories:['cat1'], image:'', price:25000, discount:10, reportIn:24, status:'active', createdAt:'2026-01-01' },
      { id:'lt2', title:'Liver Function Test (LFT)',     slug:'lft',         description:'Measures liver enzymes and proteins to assess liver health and detect liver diseases.',         pathologist:'Dr. Lucas Bennett',    categories:['cat4'], image:'', price:35000, discount:15, reportIn:48, status:'active', createdAt:'2026-01-01' },
      { id:'lt3', title:'Lipid Profile Test',            slug:'lipid',       description:'Measures cholesterol and triglyceride levels to assess heart disease risk.',                   pathologist:'Dr. Ethan Collins',    categories:['cat7'], image:'', price:30000, discount:5,  reportIn:24, status:'active', createdAt:'2026-01-01' },
      { id:'lt4', title:'Thyroid Function Test (TFT)',   slug:'tft',         description:'Detects thyroid hormone imbalances affecting metabolism and energy levels.',                    pathologist:'Dr. Grace Mitchell',   categories:['cat2'], image:'', price:28000, discount:10, reportIn:24, status:'active', createdAt:'2026-01-01' },
      { id:'lt5', title:'Blood Sugar Test',              slug:'blood-sugar', description:'Measures glucose levels to diagnose and monitor diabetes conditions.',                          pathologist:'Dr. Grace Mitchell',   categories:['cat3'], image:'', price:15000, discount:0,  reportIn:12, status:'active', createdAt:'2026-01-01' },
      { id:'lt6', title:'Vitamin D Test',                slug:'vitamin-d',   description:'Determines Vitamin D levels important for bone and immune health.',                            pathologist:'Dr. Noah Richardson',  categories:['cat8'], image:'', price:22000, discount:5,  reportIn:24, status:'active', createdAt:'2026-01-01' },
      { id:'lt7', title:'Allergy Test',                  slug:'allergy',     description:'Identifies allergic reactions to specific substances.',                                         pathologist:'Dr. Charlotte Hayes',  categories:['cat9'], image:'', price:40000, discount:10, reportIn:48, status:'active', createdAt:'2026-01-01' }
    ],
    ambulanceBookings:[],
    mediaFiles:       [],
    categories:       [
      { id:'cat1', name:'Blood Tests',      slug:'blood-tests',      parentId:null, image:'', metaTitle:'', metaDesc:'', createdAt:'2026-01-01' },
      { id:'cat2', name:'Thyroid Tests',    slug:'thyroid-tests',    parentId:null, image:'', metaTitle:'', metaDesc:'', createdAt:'2026-01-01' },
      { id:'cat3', name:'Diabetes Tests',   slug:'diabetes-tests',   parentId:null, image:'', metaTitle:'', metaDesc:'', createdAt:'2026-01-01' },
      { id:'cat4', name:'Liver Function',   slug:'liver-function',   parentId:'cat3', image:'', metaTitle:'', metaDesc:'', createdAt:'2026-01-01' },
      { id:'cat5', name:'CBC and RBC test', slug:'cbc-rbc-test',     parentId:'cat4', image:'', metaTitle:'', metaDesc:'', createdAt:'2026-01-01' },
      { id:'cat6', name:'Kidney Function',  slug:'kidney-function',  parentId:null, image:'', metaTitle:'', metaDesc:'', createdAt:'2026-01-01' },
      { id:'cat7', name:'Heart Health',     slug:'heart-health',     parentId:null, image:'', metaTitle:'', metaDesc:'', createdAt:'2026-01-01' },
      { id:'cat8', name:'Vitamin Tests',    slug:'vitamin-tests',    parentId:null, image:'', metaTitle:'', metaDesc:'', createdAt:'2026-01-01' },
      { id:'cat9', name:'Allergy Tests',    slug:'allergy-tests',    parentId:null, image:'', metaTitle:'', metaDesc:'', createdAt:'2026-01-01' }
    ],
    medicines:        [
      { id:'med1', name:'Ibuprofen 200mg',    description:'Anti-inflammatory pain relief.',      status:'active', createdAt:'2026-01-01' },
      { id:'med2', name:'Amoxicillin 500mg',  description:'Antibiotic for bacterial infections.', status:'active', createdAt:'2026-01-01' },
      { id:'med3', name:'Cetirizine 10mg',    description:'Allergy relief.',                     status:'active', createdAt:'2026-01-01' },
      { id:'med4', name:'Omeprazole 20mg',    description:'Reduces stomach acid.',               status:'active', createdAt:'2026-01-01' },
      { id:'med5', name:'Metformin 500mg',    description:'Supports blood sugar management.',    status:'active', createdAt:'2026-01-01' },
      { id:'med6', name:'Atorvastatin 10mg',  description:'Supports cholesterol management.',    status:'active', createdAt:'2026-01-01' },
      { id:'med7', name:'Amlodipine 5mg',     description:'Supports blood pressure management.', status:'active', createdAt:'2026-01-01' },
      { id:'med8', name:'Azithromycin 250mg', description:'Antibiotic for bacterial infections.', status:'active', createdAt:'2026-01-01' }
    ],
    roles: [
      { id:'r1', name:'Admin',        permissions:'all', createdAt:'2026-01-01', userCount:0 },
      { id:'r2', name:'Doctor',       permissions:'appointments,patients,prescriptions,lab_tests,video_consultations', createdAt:'2026-01-01', userCount:0 },
      { id:'r3', name:'Nurse',        permissions:'patients,appointments,check_ins,bed_assigns', createdAt:'2026-01-01', userCount:0 },
      { id:'r4', name:'Receptionist', permissions:'appointments,check_ins,patients,calendars', createdAt:'2026-01-01', userCount:0 },
      { id:'r5', name:'Pathologist',  permissions:'lab_tests,lab_test_bookings,lab_categories,reports', createdAt:'2026-01-01', userCount:0 },
      { id:'r6', name:'Hospital',     permissions:'hospitals,departments,doctors,patients,appointments', createdAt:'2026-01-01', userCount:0 },
      { id:'r7', name:'Collector',    permissions:'lab_test_bookings,patients,reports', createdAt:'2026-01-01', userCount:0 },
      { id:'r8', name:'Pharmacist',   permissions:'medicines,prescriptions,patients', createdAt:'2026-01-01', userCount:0 }
    ],
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
    if (!g('seeded_v10')) {
      ['seeded_v1','seeded_v2','seeded_v3','seeded_v4','seeded_v5','seeded_v6','seeded_v7','seeded_v8','seeded_v9'].forEach(function(k){ try { localStorage.removeItem('eh_'+k); } catch(e){} });
      Object.keys(SEED).forEach(function(k) { s(k, SEED[k]); });
      s('seeded_v10', true);
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
    updateDepartment: function(id, data) {
      var list = this.getDepartments();
      var i = list.findIndex(function(d){return d.id===id;});
      if (i > -1) { list[i] = Object.assign({}, list[i], data); s('departments', list); return list[i]; }
      return null;
    },
    deleteDepartment: function(id) { s('departments', this.getDepartments().filter(function(d){return d.id!==id;})); },

    /* ── Specialties ─────────────────────────────────────── */
    getSpecialties: function() { return g('specialties') || []; },
    addSpecialty: function(data) {
      var list = this.getSpecialties();
      var sp = Object.assign({ id: nextId('sp'), status:'active', createdAt: nowStr() }, data);
      list.push(sp); s('specialties', list); return sp;
    },
    updateSpecialty: function(id, data) {
      var list = this.getSpecialties();
      var i = list.findIndex(function(sp){return sp.id===id;});
      if (i > -1) { list[i] = Object.assign({}, list[i], data); s('specialties', list); return list[i]; }
      return null;
    },
    deleteSpecialty: function(id) { s('specialties', this.getSpecialties().filter(function(sp){return sp.id!==id;})); },

    /* ── Lab Tests ───────────────────────────────────────── */
    getLabTests: function() { return g('labTests') || []; },
    addLabTest: function(data) {
      var list = this.getLabTests();
      var lt = Object.assign({ id: nextId('lt'), status:'active', createdAt: nowStr() }, data);
      list.push(lt); s('labTests', list); return lt;
    },
    updateLabTest: function(id, data) {
      var list = this.getLabTests();
      var i = list.findIndex(function(lt){return lt.id===id;});
      if (i > -1) { list[i] = Object.assign({}, list[i], data); s('labTests', list); return list[i]; }
      return null;
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

    /* ── Roles ───────────────────────────────────────────── */
    getRoles: function() { return g('roles') || []; },
    addRole: function(data) {
      var list = this.getRoles();
      var r = Object.assign({ id: nextId('r'), userCount:0, createdAt: nowStr().slice(0,10) }, data);
      list.unshift(r); s('roles', list); return r;
    },
    updateRole: function(id, data) {
      s('roles', (g('roles')||[]).map(function(r){ return r.id===id ? Object.assign(r,data) : r; }));
    },
    deleteRole: function(id) { s('roles', (g('roles')||[]).filter(function(r){return r.id!==id;})); },

    /* ── Media Files ─────────────────────────────────────── */
    getMediaFiles: function() { return g('mediaFiles') || []; },
    addMediaFile: function(data) {
      var list = g('mediaFiles') || [];
      var f = Object.assign({ id: nextId('mf'), createdAt: nowStr() }, data);
      list.unshift(f); s('mediaFiles', list); return f;
    },
    deleteMediaFile: function(id) { s('mediaFiles', (g('mediaFiles')||[]).filter(function(f){return f.id!==id;})); },

    /* ── Medicines ──────────────────────────────────────────── */
    getMedicines: function() { return g('medicines') || []; },
    addMedicine: function(data) {
      var list = this.getMedicines();
      var m = Object.assign({ id: nextId('med'), status:'active', createdAt: nowStr().slice(0,10) }, data);
      list.push(m); s('medicines', list); return m;
    },
    updateMedicine: function(id, data) {
      var list = this.getMedicines();
      var i = list.findIndex(function(m){return m.id===id;});
      if (i > -1) { list[i] = Object.assign({}, list[i], data); s('medicines', list); return list[i]; }
      return null;
    },
    deleteMedicine: function(id) { s('medicines', this.getMedicines().filter(function(m){return m.id!==id;})); },

    /* ── Categories ─────────────────────────────────────────── */
    getCategories: function() { return g('categories') || []; },
    addCategory: function(data) {
      var list = this.getCategories();
      var c = Object.assign({ id: nextId('cat'), parentId:null, image:'', metaTitle:'', metaDesc:'', createdAt: nowStr().slice(0,10) }, data);
      list.push(c); s('categories', list); return c;
    },
    updateCategory: function(id, data) {
      var list = this.getCategories();
      var i = list.findIndex(function(c){return c.id===id;});
      if (i > -1) { list[i] = Object.assign({}, list[i], data); s('categories', list); return list[i]; }
      return null;
    },
    deleteCategory: function(id) {
      var list = this.getCategories();
      /* also clear parentId on children */
      list = list.map(function(c){ return c.parentId===id ? Object.assign({},c,{parentId:null}) : c; });
      list = list.filter(function(c){return c.id!==id;});
      s('categories', list);
    }
  };

  seed();
})();
