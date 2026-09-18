/* eHealth System — Neon DB backend via Express API */
(function () {

  /* ── Internal store (in-memory cache) ──────────────── */
  var _cache = {};

  function _get(k)    { return _cache[k] || []; }
  function _set(k, v) {
    _cache[k] = v;
    /* fire-and-forget write to Neon via Express */
    fetch('/api/store/' + k, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v)
    }).catch(function(e){ console.warn('EH write error:', k, e); });
  }

  function nextId(prefix) { return prefix + Date.now() + Math.floor(Math.random() * 1000); }
  function nowStr() {
    var d = new Date();
    return d.toISOString().slice(0, 10) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  function filterByTenant(list, tenantId) {
    if (!tenantId) return list;
    return list.filter(function(r) { return r.tenantId === tenantId; });
  }

  /* ── Seed defaults (written once if key absent) ────── */
  var SEED = {
    users: [{ id:'u1', name:'Moses Semanda', email:'semandamoses91@gmail.com', password:'ehealth2026', role:'admin', tenantId:null, avatar:'M', status:'active', createdAt:'2026-01-01' }],
    tenants:[], patients:[], doctors:[], appointments:[], departments:[], specialties:[],
    ambulanceBookings:[], mediaFiles:[],
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
    ],
    medicines: [
      { id:'med1', name:'Ibuprofen 200mg',    description:'Anti-inflammatory pain relief.',       status:'active', createdAt:'2026-01-01' },
      { id:'med2', name:'Amoxicillin 500mg',  description:'Antibiotic for bacterial infections.', status:'active', createdAt:'2026-01-01' },
      { id:'med3', name:'Cetirizine 10mg',    description:'Allergy relief.',                      status:'active', createdAt:'2026-01-01' },
      { id:'med4', name:'Omeprazole 20mg',    description:'Reduces stomach acid.',                status:'active', createdAt:'2026-01-01' },
      { id:'med5', name:'Metformin 500mg',    description:'Supports blood sugar management.',     status:'active', createdAt:'2026-01-01' },
      { id:'med6', name:'Atorvastatin 10mg',  description:'Supports cholesterol management.',     status:'active', createdAt:'2026-01-01' },
      { id:'med7', name:'Amlodipine 5mg',     description:'Supports blood pressure management.',  status:'active', createdAt:'2026-01-01' },
      { id:'med8', name:'Azithromycin 250mg', description:'Antibiotic for bacterial infections.', status:'active', createdAt:'2026-01-01' }
    ],
    categories: [
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
    labTests: [
      { id:'lt1', title:'Complete Blood Count (CBC)',  slug:'cbc',         description:'Comprehensive blood test used to evaluate overall health and detect infections or anemia.', pathologist:'Dr. Amelia Brooks',   categories:['cat1'], image:'', price:25000, discount:10, reportIn:24, status:'active', createdAt:'2026-01-01' },
      { id:'lt2', title:'Liver Function Test (LFT)',   slug:'lft',         description:'Measures liver enzymes and proteins to assess liver health and detect liver diseases.',        pathologist:'Dr. Lucas Bennett',   categories:['cat4'], image:'', price:35000, discount:15, reportIn:48, status:'active', createdAt:'2026-01-01' },
      { id:'lt3', title:'Lipid Profile Test',          slug:'lipid',       description:'Measures cholesterol and triglyceride levels to assess heart disease risk.',                  pathologist:'Dr. Ethan Collins',   categories:['cat7'], image:'', price:30000, discount:5,  reportIn:24, status:'active', createdAt:'2026-01-01' },
      { id:'lt4', title:'Thyroid Function Test (TFT)', slug:'tft',         description:'Detects thyroid hormone imbalances affecting metabolism and energy levels.',                   pathologist:'Dr. Grace Mitchell',  categories:['cat2'], image:'', price:28000, discount:10, reportIn:24, status:'active', createdAt:'2026-01-01' },
      { id:'lt5', title:'Blood Sugar Test',            slug:'blood-sugar', description:'Measures glucose levels to diagnose and monitor diabetes conditions.',                         pathologist:'Dr. Grace Mitchell',  categories:['cat3'], image:'', price:15000, discount:0,  reportIn:12, status:'active', createdAt:'2026-01-01' },
      { id:'lt6', title:'Vitamin D Test',              slug:'vitamin-d',   description:'Determines Vitamin D levels important for bone and immune health.',                           pathologist:'Dr. Noah Richardson', categories:['cat8'], image:'', price:22000, discount:5,  reportIn:24, status:'active', createdAt:'2026-01-01' },
      { id:'lt7', title:'Allergy Test',                slug:'allergy',     description:'Identifies allergic reactions to specific substances.',                                        pathologist:'Dr. Charlotte Hayes', categories:['cat9'], image:'', price:40000, discount:10, reportIn:48, status:'active', createdAt:'2026-01-01' }
    ],
    labPackages: [
      { id:'lp1', title:'Basic Health Package',    slug:'basic-health',    description:'Complete health checkup package',        pathologist:'Dr. Amelia Brooks',   labTests:['lt1','lt5'], price:60000, discount:10, reportIn:24, homeVisit:false, zones:['World'], tax:'gst', status:'active', createdAt:'2026-01-01' },
      { id:'lp2', title:'Diabetes Care Package',   slug:'diabetes-care',   description:'Complete health checkup package',        pathologist:'Dr. Grace Mitchell',  labTests:['lt5','lt3'], price:45000, discount:5,  reportIn:24, homeVisit:false, zones:['World'], tax:'gst', status:'active', createdAt:'2026-01-01' },
      { id:'lp3', title:'Thyroid Profile Package', slug:'thyroid-profile', description:'Tests to assess thyroid gland function', pathologist:'Dr. Grace Mitchell',  labTests:['lt4','lt6'], price:55000, discount:10, reportIn:24, homeVisit:false, zones:['World'], tax:'gst', status:'active', createdAt:'2026-01-01' },
      { id:'lp4', title:'Senior Citizen Package',  slug:'senior-citizen',  description:'Comprehensive senior wellness panel',    pathologist:'Dr. Noah Richardson', labTests:['lt1','lt2','lt3'], price:90000, discount:15, reportIn:48, homeVisit:true,  zones:['World'], tax:'gst', status:'active', createdAt:'2026-01-01' },
      { id:'lp5', title:'Hormone Balance Package', slug:'hormone-balance', description:'Comprehensive hormone screening for thyroid, reproductive, adrenal and metabolic hormones.', pathologist:'Dr. Charlotte Hayes', labTests:['lt4','lt6'], price:80000, discount:10, reportIn:48, homeVisit:false, zones:['World'], tax:'gst', status:'active', createdAt:'2026-01-01' },
      { id:'lp6', title:"Women's Hormone Package", slug:'womens-hormone',  description:"Hormonal health screening for women assessing reproductive, thyroid, and adrenal hormone levels.", pathologist:'Dr. Charlotte Hayes', labTests:['lt4','lt6','lt7'], price:95000, discount:10, reportIn:48, homeVisit:false, zones:['World'], tax:'gst', status:'active', createdAt:'2026-01-01' }
    ]
  };

  /* ── Load all data from Neon, seed missing keys ────── */
  window.EH_LOADING = true;

  window.EH = {

    /* Called once on page load — fetches all store keys */
    _load: async function() {
      try {
        var res = await fetch('/api/store');
        if (!res.ok) throw new Error('API ' + res.status);
        var data = await res.json();

        /* Merge server data into cache */
        Object.keys(data).forEach(function(k) { _cache[k] = data[k]; });

        /* Seed any missing keys */
        var seedNeeded = false;
        Object.keys(SEED).forEach(function(k) {
          if (!_cache[k] || (Array.isArray(_cache[k]) && _cache[k].length === 0 && SEED[k].length > 0)) {
            _cache[k] = SEED[k];
            seedNeeded = true;
            _set(k, SEED[k]);
          }
        });

      } catch (e) {
        console.warn('EH: falling back to localStorage —', e.message);
        /* Graceful fallback: use localStorage if API is unavailable */
        Object.keys(SEED).forEach(function(k) {
          try {
            var stored = JSON.parse(localStorage.getItem('eh_' + k));
            _cache[k] = stored || SEED[k];
          } catch(_) { _cache[k] = SEED[k]; }
        });
      }

      window.EH_LOADING = false;
      document.dispatchEvent(new CustomEvent('eh:ready'));
    },

    /* ── Tenants ───────────────────────────────────────── */
    getTenants:    function() { return _get('tenants'); },
    addTenant:     function(data) { var list=this.getTenants(); var t=Object.assign({id:nextId('t'),status:'active',createdAt:nowStr().slice(0,10)},data); list.push(t); _set('tenants',list); return t; },
    updateTenant:  function(id,data) { var list=this.getTenants(); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('tenants',list); return list[i];} return null; },
    deleteTenant:  function(id) { _set('tenants',this.getTenants().filter(function(x){return x.id!==id;})); },
    getTenant:     function(id) { return this.getTenants().find(function(t){return t.id===id;})||null; },

    /* ── Users ─────────────────────────────────────────── */
    getUsers:      function(tenantId) { return filterByTenant(_get('users'), tenantId); },
    findUser:      function(email, password) { return _get('users').find(function(u){return u.email===email&&u.password===password;})||null; },
    addUser:       function(data) { var list=_get('users'); var u=Object.assign({id:nextId('u'),status:'active',createdAt:nowStr().slice(0,10)},data); list.push(u); _set('users',list); return u; },
    updateUser:    function(id,data) { var list=_get('users'); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('users',list); return list[i];} return null; },
    deleteUser:    function(id) { _set('users',_get('users').filter(function(x){return x.id!==id;})); },

    /* ── Patients ──────────────────────────────────────── */
    getPatients:   function(tenantId) { return filterByTenant(_get('patients'), tenantId); },
    addPatient:    function(data,tid) { var list=_get('patients'); var p=Object.assign({id:nextId('p'),tenantId:tid||null,status:'active',createdAt:nowStr().slice(0,10)},data); list.push(p); _set('patients',list); return p; },
    updatePatient: function(id,data)  { var list=_get('patients'); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('patients',list); return list[i];} return null; },
    deletePatient: function(id) { _set('patients',_get('patients').filter(function(x){return x.id!==id;})); },

    /* ── Doctors ───────────────────────────────────────── */
    getDoctors:    function(tenantId) { return filterByTenant(_get('doctors'), tenantId); },
    addDoctor:     function(data,tid) { var list=_get('doctors'); var d=Object.assign({id:nextId('d'),tenantId:tid||null,status:'active',createdAt:nowStr().slice(0,10)},data); list.push(d); _set('doctors',list); return d; },
    updateDoctor:  function(id,data)  { var list=_get('doctors'); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('doctors',list); return list[i];} return null; },
    deleteDoctor:  function(id) { _set('doctors',_get('doctors').filter(function(x){return x.id!==id;})); },

    /* ── Appointments ──────────────────────────────────── */
    getAppointments:   function(tenantId) { return filterByTenant(_get('appointments'), tenantId); },
    addAppointment:    function(data,tid) { var list=_get('appointments'); var a=Object.assign({id:nextId('a'),tenantId:tid||null,status:'pending',createdAt:nowStr()},data); list.unshift(a); _set('appointments',list); return a; },
    updateAppointment: function(id,data)  { var list=_get('appointments'); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('appointments',list); return list[i];} return null; },
    deleteAppointment: function(id) { _set('appointments',_get('appointments').filter(function(x){return x.id!==id;})); },

    /* ── Departments ───────────────────────────────────── */
    getDepartments:   function() { return _get('departments'); },
    addDepartment:    function(data) { var list=this.getDepartments(); var d=Object.assign({id:nextId('dept'),status:'active',createdAt:nowStr().slice(0,10)},data); list.push(d); _set('departments',list); return d; },
    updateDepartment: function(id,data) { var list=this.getDepartments(); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('departments',list); return list[i];} return null; },
    deleteDepartment: function(id) { _set('departments',this.getDepartments().filter(function(x){return x.id!==id;})); },

    /* ── Specialties ───────────────────────────────────── */
    getSpecialties:   function() { return _get('specialties'); },
    addSpecialty:     function(data) { var list=this.getSpecialties(); var s=Object.assign({id:nextId('sp'),status:'active',createdAt:nowStr()},data); list.push(s); _set('specialties',list); return s; },
    updateSpecialty:  function(id,data) { var list=this.getSpecialties(); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('specialties',list); return list[i];} return null; },
    deleteSpecialty:  function(id) { _set('specialties',this.getSpecialties().filter(function(x){return x.id!==id;})); },

    /* ── Lab Tests ─────────────────────────────────────── */
    getLabTests:   function() { return _get('labTests'); },
    addLabTest:    function(data) { var list=this.getLabTests(); var lt=Object.assign({id:nextId('lt'),status:'active',createdAt:nowStr().slice(0,10)},data); list.push(lt); _set('labTests',list); return lt; },
    updateLabTest: function(id,data) { var list=this.getLabTests(); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('labTests',list); return list[i];} return null; },
    deleteLabTest: function(id) { _set('labTests',this.getLabTests().filter(function(x){return x.id!==id;})); },

    /* ── Lab Packages ──────────────────────────────────── */
    getLabPackages:   function() { return _get('labPackages'); },
    addLabPackage:    function(data) { var list=this.getLabPackages(); var p=Object.assign({id:nextId('lp'),status:'active',createdAt:nowStr().slice(0,10)},data); list.push(p); _set('labPackages',list); return p; },
    updateLabPackage: function(id,data) { var list=this.getLabPackages(); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('labPackages',list); return list[i];} return null; },
    deleteLabPackage: function(id) { _set('labPackages',this.getLabPackages().filter(function(x){return x.id!==id;})); },

    /* ── Ambulance Bookings ────────────────────────────── */
    getAmbulanceBookings: function(tenantId) { return filterByTenant(_get('ambulanceBookings'), tenantId); },
    addAmbulanceBooking:  function(data,tid) { var list=_get('ambulanceBookings'); var ab=Object.assign({id:nextId('ab'),status:'pending',tenantId:tid||null,createdAt:nowStr()},data); list.unshift(ab); _set('ambulanceBookings',list); return ab; },

    /* ── Services ──────────────────────────────────────── */
    getServices:   function() { return _get('services'); },
    addService:    function(data) { var list=_get('services'); var sv=Object.assign({id:nextId('svc'),status:'active',createdAt:nowStr().slice(0,10)},data); list.push(sv); _set('services',list); return sv; },
    updateService: function(id,data) { _set('services',(_get('services')).map(function(sv){ return sv.id===id ? Object.assign(sv,data) : sv; })); },
    deleteService: function(id) { _set('services',_get('services').filter(function(sv){return sv.id!==id;})); },

    /* ── Roles ─────────────────────────────────────────── */
    getRoles:   function() { return _get('roles'); },
    addRole:    function(data) { var list=this.getRoles(); var r=Object.assign({id:nextId('r'),userCount:0,createdAt:nowStr().slice(0,10)},data); list.unshift(r); _set('roles',list); return r; },
    updateRole: function(id,data) { _set('roles',(_get('roles')).map(function(r){ return r.id===id ? Object.assign(r,data) : r; })); },
    deleteRole: function(id) { _set('roles',_get('roles').filter(function(r){return r.id!==id;})); },

    /* ── Media Files ───────────────────────────────────── */
    getMediaFiles: function() { return _get('mediaFiles'); },
    addMediaFile:  function(data) { var list=_get('mediaFiles'); var f=Object.assign({id:nextId('mf'),createdAt:nowStr()},data); list.unshift(f); _set('mediaFiles',list); return f; },
    deleteMediaFile: function(id) { _set('mediaFiles',_get('mediaFiles').filter(function(f){return f.id!==id;})); },

    /* ── Medicines ─────────────────────────────────────── */
    getMedicines:   function() { return _get('medicines'); },
    addMedicine:    function(data) { var list=this.getMedicines(); var m=Object.assign({id:nextId('med'),status:'active',createdAt:nowStr().slice(0,10)},data); list.push(m); _set('medicines',list); return m; },
    updateMedicine: function(id,data) { var list=this.getMedicines(); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('medicines',list); return list[i];} return null; },
    deleteMedicine: function(id) { _set('medicines',this.getMedicines().filter(function(x){return x.id!==id;})); },

    /* ── Categories ────────────────────────────────────── */
    getCategories:   function() { return _get('categories'); },
    addCategory:     function(data) { var list=this.getCategories(); var c=Object.assign({id:nextId('cat'),parentId:null,image:'',metaTitle:'',metaDesc:'',createdAt:nowStr().slice(0,10)},data); list.push(c); _set('categories',list); return c; },
    updateCategory:  function(id,data) { var list=this.getCategories(); var i=list.findIndex(function(x){return x.id===id;}); if(i>-1){list[i]=Object.assign({},list[i],data); _set('categories',list); return list[i];} return null; },
    deleteCategory:  function(id) { var list=this.getCategories().map(function(c){ return c.parentId===id ? Object.assign({},c,{parentId:null}) : c; }).filter(function(c){return c.id!==id;}); _set('categories',list); },

    /* ── Migration helper ──────────────────────────────── */
    migrateToTenant: function(tenantId) {
      ['patients','doctors','appointments','labTests','ambulanceBookings'].forEach(function(k) {
        var list = _get(k).map(function(r){ return r.tenantId ? r : Object.assign({},r,{tenantId:tenantId}); });
        _set(k, list);
      });
    }
  };

  /* Auto-load when DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ window.EH._load(); });
  } else {
    window.EH._load();
  }

})();
