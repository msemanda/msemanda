/* eHealth System — Multi-tenant data store (localStorage) */
(function () {
  var K = 'eh_';
  function g(k)    { try { return JSON.parse(localStorage.getItem(K+k)); } catch(e) { return null; } }
  function s(k, v) { try { localStorage.setItem(K+k, JSON.stringify(v)); } catch(e) {} }

  /* ── Seed data ─────────────────────────────────────────── */
  var SEED = {
    tenants: [
      { id:'t1', name:'Sunrise Care Hospital',  slug:'sunrise-care', email:'admin@sunrise.ug',   phone:'+256700100001', address:'Kampala Central, Uganda', plan:'premium', status:'active', adminName:'Dr. James Muyingo', adminEmail:'james@sunrise.ug',   createdAt:'2026-01-15', doctorCount:3, patientCount:7  },
      { id:'t2', name:'MapleCare Medical',       slug:'maplecare',    email:'admin@maplecare.ug', phone:'+256700100002', address:'Wakiso, Uganda',          plan:'basic',   status:'active', adminName:'Dr. Sarah Auma',    adminEmail:'sarah@maplecare.ug',  createdAt:'2026-02-20', doctorCount:3, patientCount:6  },
      { id:'t3', name:'BlueCross General',       slug:'bluecross',    email:'admin@bluecross.ug', phone:'+256700100003', address:'Mukono, Uganda',          plan:'basic',   status:'active', adminName:'Dr. Tom Kato',      adminEmail:'tom@bluecross.ug',    createdAt:'2026-03-10', doctorCount:2, patientCount:4  }
    ],
    users: [
      /* Super admin */
      { id:'u1',  name:'Moses Semanda',      email:'admin@ehealth.ug',       password:'ehealth2026', role:'admin',        tenantId:null, avatar:'M', status:'active', createdAt:'2026-01-01' },
      /* Hospital admins (one per tenant) */
      { id:'u11', name:'Dr. James Muyingo',  email:'james@sunrise.ug',       password:'sunrise123',  role:'hospital',     tenantId:'t1', avatar:'J', status:'active', createdAt:'2026-01-15' },
      { id:'u12', name:'Dr. Sarah Auma',     email:'sarah@maplecare.ug',     password:'maple123',    role:'hospital',     tenantId:'t2', avatar:'S', status:'active', createdAt:'2026-02-20' },
      { id:'u13', name:'Dr. Tom Kato',       email:'tom@bluecross.ug',       password:'bluecross123',role:'hospital',     tenantId:'t3', avatar:'T', status:'active', createdAt:'2026-03-10' },
      /* Doctors */
      { id:'u2',  name:'Dr. Sophia Reed',    email:'sophia@ehealth.ug',      password:'doctor123',   role:'doctor',       tenantId:'t1', avatar:'S', status:'active', createdAt:'2026-01-20' },
      { id:'u3',  name:'Dr. Ethan Walker',   email:'ethan@ehealth.ug',       password:'doctor123',   role:'doctor',       tenantId:'t2', avatar:'E', status:'active', createdAt:'2026-02-22' },
      { id:'u4',  name:'Dr. Ava Richardson', email:'ava@ehealth.ug',         password:'doctor123',   role:'doctor',       tenantId:'t3', avatar:'A', status:'active', createdAt:'2026-03-12' },
      { id:'u14', name:'Dr. Olivia Bennett', email:'olivia@ehealth.ug',      password:'doctor123',   role:'doctor',       tenantId:'t1', avatar:'O', status:'active', createdAt:'2026-01-25' },
      { id:'u15', name:'Dr. Benjamin Clark', email:'benjamin@ehealth.ug',    password:'doctor123',   role:'doctor',       tenantId:'t2', avatar:'B', status:'active', createdAt:'2026-02-28' },
      { id:'u16', name:'Dr. Noah Carter',    email:'noah@ehealth.ug',        password:'doctor123',   role:'doctor',       tenantId:'t3', avatar:'N', status:'active', createdAt:'2026-03-15' },
      /* Staff */
      { id:'u5',  name:'Sarah Nakato',       email:'sarah.n@ehealth.ug',     password:'nurse123',    role:'nurse',        tenantId:'t1', avatar:'S', status:'active', createdAt:'2026-01-22' },
      { id:'u6',  name:'Tom Kiggundu',       email:'reception@ehealth.ug',   password:'recept123',   role:'receptionist', tenantId:'t1', avatar:'T', status:'active', createdAt:'2026-01-23' },
      { id:'u7',  name:'Dr. Pat Lab',        email:'lab@ehealth.ug',         password:'path123',     role:'pathologist',  tenantId:'t2', avatar:'P', status:'active', createdAt:'2026-02-25' },
      { id:'u9',  name:'James Okello',       email:'collector@ehealth.ug',   password:'collect123',  role:'collector',    tenantId:'t2', avatar:'J', status:'active', createdAt:'2026-02-26' },
      { id:'u10', name:'Pharm Akello',       email:'pharma@ehealth.ug',      password:'pharm123',    role:'pharmacist',   tenantId:'t3', avatar:'P', status:'active', createdAt:'2026-03-14' }
    ],
    patients: [
      { id:'p1',  tenantId:'t1', name:'Madhuranjan Thakur', email:'madhuranjan@example.com', phone:'+256700000001', status:'active', createdAt:'2026-09-11 04:10 AM' },
      { id:'p2',  tenantId:'t1', name:'Srinivas',           email:'srinivas@example.com',    phone:'+256700000002', status:'active', createdAt:'2026-09-08 03:58 AM' },
      { id:'p3',  tenantId:'t1', name:'Priya',              email:'priya@example.com',       phone:'+256700000003', status:'active', createdAt:'2026-09-01 07:00 AM' },
      { id:'p4',  tenantId:'t1', name:'Liza Matt',          email:'liza@example.com',        phone:'+256700000004', status:'active', createdAt:'2026-06-03 03:56 AM' },
      { id:'p5',  tenantId:'t1', name:'Maira Mehta',        email:'maira@example.com',       phone:'+256700000005', status:'active', createdAt:'2026-06-02 07:08 AM' },
      { id:'p6',  tenantId:'t1', name:'Harper Lewis',       email:'harper@example.com',      phone:'+256700000007', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p7',  tenantId:'t1', name:'Daniel Clark',       email:'daniel@example.com',      phone:'+256700000008', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p8',  tenantId:'t2', name:'John Katende',       email:'john@example.com',        phone:'+256700000012', status:'active', createdAt:'2026-05-20 08:00 AM' },
      { id:'p9',  tenantId:'t2', name:'Aisha Namukasa',     email:'aisha@example.com',       phone:'+256700000013', status:'active', createdAt:'2026-05-19 09:00 AM' },
      { id:'p10', tenantId:'t2', name:'Peter Wasswa',       email:'peter@example.com',       phone:'+256700000014', status:'active', createdAt:'2026-05-18 10:00 AM' },
      { id:'p11', tenantId:'t2', name:'Grace Nakato',       email:'grace@example.com',       phone:'+256700000015', status:'active', createdAt:'2026-05-17 11:00 AM' },
      { id:'p12', tenantId:'t2', name:'Charlotte Garcia',   email:'charlotte@example.com',   phone:'+256700000011', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p13', tenantId:'t2', name:'Henry Robinson',     email:'henry@example.com',       phone:'+256700000010', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p14', tenantId:'t3', name:'David Mugisha',      email:'david@example.com',       phone:'+256700000016', status:'active', createdAt:'2026-05-16 12:00 PM' },
      { id:'p15', tenantId:'t3', name:'Rita Nalwoga',       email:'rita@example.com',        phone:'+256700000017', status:'active', createdAt:'2026-05-15 01:00 PM' },
      { id:'p16', tenantId:'t3', name:'Test User',          email:'testuser@example.com',    phone:'+256700000006', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p17', tenantId:'t3', name:'Amelia Lee',         email:'amelia@example.com',      phone:'+256700000009', status:'active', createdAt:'2026-05-27 06:54 PM' }
    ],
    doctors: [
      { id:'d1', tenantId:'t1', name:'Dr. Sophia Reed',    email:'sophia@ehealth.ug',   specialty:'General Practice', hospital:'Sunrise Care Hospital', status:'active' },
      { id:'d4', tenantId:'t1', name:'Dr. Olivia Bennett', email:'olivia@ehealth.ug',   specialty:'Gynaecology',      hospital:'Sunrise Care Hospital', status:'active' },
      { id:'d7', tenantId:'t1', name:'Dr. James Odongo',   email:'james@ehealth.ug',    specialty:'Dentistry',        hospital:'Sunrise Care Hospital', status:'active' },
      { id:'d2', tenantId:'t2', name:'Dr. Ethan Walker',   email:'ethan@ehealth.ug',    specialty:'Pediatrics',       hospital:'MapleCare Medical',     status:'active' },
      { id:'d5', tenantId:'t2', name:'Dr. Benjamin Clark', email:'benjamin@ehealth.ug', specialty:'Cardiology',       hospital:'MapleCare Medical',     status:'active' },
      { id:'d8', tenantId:'t2', name:'Dr. Lydia Auma',     email:'lydia@ehealth.ug',    specialty:'Sexual Health',    hospital:'MapleCare Medical',     status:'active' },
      { id:'d3', tenantId:'t3', name:'Dr. Ava Richardson', email:'ava@ehealth.ug',      specialty:'Orthopedics',      hospital:'BlueCross General',     status:'active' },
      { id:'d6', tenantId:'t3', name:'Dr. Noah Carter',    email:'noah@ehealth.ug',     specialty:'Mental Wellness',  hospital:'BlueCross General',     status:'active' }
    ],
    appointments: [
      { id:'a1', tenantId:'t2', num:'#10245', patientId:'p8',  patient:'John Katende',       patientEmail:'john@example.com',   doctorId:'d2', doctor:'Dr. Ethan Walker',   type:'In-Person', date:'2026-09-18', time:'09:00 AM', status:'pending',     hospital:'MapleCare Medical',     createdAt:'2026-09-17 08:32 AM' },
      { id:'a2', tenantId:'t2', num:'#10244', patientId:'p9',  patient:'Aisha Namukasa',     patientEmail:'aisha@example.com',  doctorId:'d2', doctor:'Dr. Ethan Walker',   type:'Virtual',   date:'2026-09-18', time:'10:30 AM', status:'confirmed',   hospital:'MapleCare Medical',     createdAt:'2026-09-17 09:14 AM' },
      { id:'a3', tenantId:'t3', num:'#10243', patientId:'p14', patient:'Peter Wasswa',       patientEmail:'peter@example.com',  doctorId:'d3', doctor:'Dr. Ava Richardson', type:'In-Person', date:'2026-09-16', time:'02:00 PM', status:'completed',   hospital:'BlueCross General',     createdAt:'2026-09-15 10:05 AM' },
      { id:'a4', tenantId:'t1', num:'#10242', patientId:'p11', patient:'Grace Nakato',       patientEmail:'grace@example.com',  doctorId:'d1', doctor:'Dr. Sophia Reed',    type:'In-Person', date:'2026-09-15', time:'11:00 AM', status:'visited',     hospital:'Sunrise Care Hospital', createdAt:'2026-09-14 07:50 AM' },
      { id:'a5', tenantId:'t2', num:'#10241', patientId:'p10', patient:'Peter Wasswa',       patientEmail:'peter@example.com',  doctorId:'d5', doctor:'Dr. Benjamin Clark', type:'In-Person', date:'2026-09-20', time:'03:30 PM', status:'rescheduled', hospital:'MapleCare Medical',     createdAt:'2026-09-14 03:11 AM' },
      { id:'a6', tenantId:'t3', num:'#10240', patientId:'p15', patient:'Rita Nalwoga',       patientEmail:'rita@example.com',   doctorId:'d6', doctor:'Dr. Noah Carter',    type:'Virtual',   date:'2026-09-13', time:'08:00 AM', status:'rejected',    hospital:'BlueCross General',     createdAt:'2026-09-12 11:44 AM' },
      { id:'a7', tenantId:'t1', num:'#10239', patientId:'p1',  patient:'Madhuranjan Thakur', patientEmail:'madhuranjan@example.com', doctorId:'d1', doctor:'Dr. Sophia Reed', type:'In-Person', date:'2026-09-18', time:'11:30 AM', status:'pending', hospital:'Sunrise Care Hospital', createdAt:'2026-09-11 06:00 AM' },
      { id:'a8', tenantId:'t1', num:'#10238', patientId:'p2',  patient:'Srinivas',           patientEmail:'srinivas@example.com',   doctorId:'d4', doctor:'Dr. Olivia Bennett', type:'Virtual', date:'2026-09-18', time:'02:00 PM', status:'confirmed', hospital:'Sunrise Care Hospital', createdAt:'2026-09-10 04:00 PM' },
      { id:'a9', tenantId:'t3', num:'#10237', patientId:'p16', patient:'Test User',          patientEmail:'testuser@example.com',   doctorId:'d3', doctor:'Dr. Ava Richardson', type:'In-Person', date:'2026-09-18', time:'03:00 PM', status:'cancelled', hospital:'BlueCross General', createdAt:'2026-09-09 02:30 PM' }
    ],
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
    ambulanceBookings: [
      { id:'ab1', tenantId:'t1', num:'#10002', patientId:'p1',  patient:'Madhuranjan Thakur', patientEmail:'madhuranjan@example.com', ambulance:'AMB-001', hospital:'Sunrise Care Hospital', type:'Emergency',    total:'UGX 50,000', status:'pending', createdAt:'2026-06-06 09:40:00 AM' },
      { id:'ab2', tenantId:'t2', num:'#10001', patientId:'p8',  patient:'John Katende',       patientEmail:'john@example.com',        ambulance:'AMB-002', hospital:'MapleCare Medical',     type:'Non-Emergency', total:'UGX 30,000', status:'pending', createdAt:'2026-06-05 08:20:00 AM' },
      { id:'ab3', tenantId:'t3', num:'#10000', patientId:'p14', patient:'David Mugisha',      patientEmail:'david@example.com',       ambulance:'AMB-003', hospital:'BlueCross General',     type:'Emergency',    total:'UGX 60,000', status:'pending', createdAt:'2026-06-04 11:15:00 AM' }
    ]
  };

  function seed() {
    if (!g('seeded_v3')) {
      Object.keys(SEED).forEach(function(k) { s(k, SEED[k]); });
      s('seeded_v3', true);
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
