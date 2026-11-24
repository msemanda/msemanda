/* Shared sidebar — injected into every page via <div id="sidebar-mount"></div> */
(function () {
  var p = window.ACTIVE_PAGE || '';

  function a(href, label, icon, pg) {
    var cls = 'nav-item' + (pg && p === pg ? ' active' : '');
    return '<a class="' + cls + '" href="' + href + '"><span class="nav-left">' + icon + label + '</span></a>';
  }

  function grp(id, label, icon, pg, subs, open) {
    var cls = 'nav-item' + (pg && p === pg ? ' active' : '');
    var chvCls = 'nav-chevron' + (open ? ' open' : '');
    var subStyle = open ? '' : ' style="display:none"';
    var html = '<div class="' + cls + '" data-toggle="' + id + '"><span class="nav-left">' + icon + label + '</span>'
      + '<svg class="' + chvCls + '" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>'
      + '<div class="nav-sub" id="' + id + '"' + subStyle + '>' + subs + '</div>';
    return html;
  }

  function sub(href, label, pg) {
    var cls = 'nav-sub-item' + (p === pg ? ' active' : '');
    return '<a class="' + cls + '" href="' + href + '">' + label + '</a>';
  }

  var I = {
    grid: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    img: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    zone: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    pulse: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    cal: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    vid: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    flask: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>',
    amb: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="9" width="22" height="11" rx="1"/><path d="M5 9V5a2 2 0 0 1 2-2h6l4 4v2"/><circle cx="7" cy="20" r="2"/><circle cx="17" cy="20" r="2"/></svg>',
    rx: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    home: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    pill: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    doc: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    users: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    hosp: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>',
    fam: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="17" cy="10" r="3"/></svg>',
    nurse: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M9.5 11 11 14l1-1 1 1 1.5-3"/></svg>',
    clip: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
    cart: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    box: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
    orders: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    truck: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    star2: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    coin: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    wallet: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14v4"/><path d="M20 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v-6z"/><circle cx="18" cy="14" r="1" fill="currentColor"/></svg>',
    bar: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    banner: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    mobile: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    bell: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    msg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    blog: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    page: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    review: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>',
    refund: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.63"/></svg>',
    quote: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>',
    store: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  };

  var apptOpen  = ['appointments','add-appointment','checkin'].indexOf(p) >= 0;
  var deptOpen  = p === 'departments';
  var specOpen  = p === 'specialties';
  var labOpen   = p === 'lab-tests';
  var docOpen   = p === 'doctors';
  var patOpen   = p === 'patients';
  var userOpen  = ['users','roles'].indexOf(p) >= 0;

  // Build tenant context pill for super-admin
  var tenantPill = '';
  if (window.EHAuth && window.EH) {
    var _sess = EHAuth.getSession();
    if (_sess && _sess.role === 'admin' && !_sess.tenantId && _sess.email === 'semandamoses91@gmail.com') {
      var _tenants = EH.getTenants();
      var _activeCtx = _sess.activeContext || '';
      var _activeName = _activeCtx ? (EH.getTenant(_activeCtx)||{}).name||'Unknown' : 'All Hospitals';
      var _opts = '<option value="">All Hospitals</option>' + _tenants.map(function(t){
        return '<option value="'+t.id+'"'+(t.id===_activeCtx?' selected':'')+'>'+t.name+'</option>';
      }).join('');
      tenantPill = '<div class="tenant-ctx-wrap"><div class="tenant-ctx-label"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>Hospital Context</div>'
        + '<select class="tenant-ctx-sel" onchange="EHAuth.switchContext(this.value||null);location.reload()">'+_opts+'</select></div>';
    }
  }

  var html = '\
<a class="sidebar-logo" href="index.html">\
  <div class="logo-icon"><svg viewBox="0 0 24 24" fill="white"><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/></svg></div>\
  <div class="logo-text">eHealth<span>Hospital Management</span></div>\
</a>' + tenantPill + '\
<div class="sidebar-search">\
  <span class="s-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>\
  <input type="text" placeholder="Search...">\
</div>\
<div class="nav-section-label">Home</div>'
  + a('index.html', 'Dashboard', I.grid, 'dashboard')
  + a('media-library.html', 'Media', I.img, 'media')
  + a('zones.html', 'Zones', I.zone, 'zones')
  + a('medical-services.html', 'Medical Services', I.pulse, 'medical-services')
  + '<div class="nav-section-label">Appointment Management</div>'
  + grp('sub-appt', 'Appointments', I.cal, 'appointments',
      sub('appointments.html', 'Appointments', 'appointments')
      + sub('add-appointment.html', 'Add Appointment', 'add-appointment')
      + sub('checkin.html', 'Checkin', 'checkin'),
    apptOpen)
  + a('video-consultations.html', 'Video Consultations', I.vid, 'video-consultations')
  + a('lab-test-bookings.html', 'All Lab Test Bookings', I.flask, 'lab-test-bookings')
  + a('ambulance-bookings.html', 'All Ambulance Bookings', I.amb, 'ambulance-bookings')
  + a('prescriptions.html', 'Prescriptions', I.rx, 'prescriptions')
  + '<div class="nav-section-label">Hospital Management</div>'
  + grp('sub-dept', 'Departments', I.home, 'departments',
      sub('departments.html', 'All Departments', 'departments'),
    deptOpen)
  + grp('sub-spec', 'Specialties', I.star, 'specialties',
      sub('specialties.html', 'All Specialties', 'specialties'),
    specOpen)
  + grp('sub-med', 'Medicines', I.pill, '', sub('#', 'All Medicines', ''), false)
  + a('#', 'Categories', I.tag, '')
  + grp('sub-lab', 'Lab Tests', I.flask, 'lab-tests',
      sub('lab-tests.html', 'All Lab Tests', 'lab-tests')
      + sub('lab-tests.html', 'Lab Test Packages', ''),
    labOpen)
  + grp('sub-labpkg', 'Lab Test Packages', I.flask, '', sub('#', 'All Packages', ''), false)
  + grp('sub-ambs', 'Ambulances', I.amb, '', sub('#', 'All Ambulances', ''), false)
  + a('#', 'Documents', I.doc, '')
  + '<div class="nav-section-label">User Management</div>'
  + grp('sub-users', 'Users', I.users, 'users',
      sub('users.html', 'All Users', 'users')
      + sub('users.html?view=add', 'Add User', '')
      + sub('roles.html', 'Role &amp; Permissions', 'roles'),
    userOpen)
  + grp('sub-hosp', 'Hospitals', I.hosp, 'hospitals',
      sub('hospitals.html', 'All Hospitals', 'hospitals')
      + sub('hospitals.html?view=add', 'Add Hospital', ''),
    p === 'hospitals')
  + grp('sub-doc', 'Doctors', I.users, 'doctors',
      sub('doctors.html', 'All Doctors', 'doctors'),
    docOpen)
  + grp('sub-pat', 'Patients', I.user, 'patients',
      sub('patients.html', 'All Patients', 'patients'),
    patOpen)
  + grp('sub-fam', 'Family Members', I.fam, '', sub('#', 'All Members', ''), false)
  + grp('sub-nur', 'Nurses', I.nurse, '', sub('#', 'All Nurses', ''), false)
  + grp('sub-rec', 'Receptionists', I.clip, '', sub('#', 'All Receptionists', ''), false)
  + grp('sub-path', 'Pathologists', I.users, '', sub('#', 'All Pathologists', ''), false)
  + grp('sub-col', 'Collectors', I.clip, '', sub('#', 'All Collectors', ''), false)
  + '<div class="nav-section-label">Ecommerce Management</div>'
  + grp('sub-stores', 'Stores', I.store, '', sub('#', 'All Stores', ''), false)
  + grp('sub-prods', 'Products', I.box, '', sub('#', 'All Products', ''), false)
  + grp('sub-orders', 'Orders', I.orders, '', sub('#', 'All Orders', ''), false)
  + grp('sub-quote', 'Quote', I.quote, '', sub('#', 'All Quotes', ''), false)
  + grp('sub-ship', 'Shipping', I.truck, '', sub('#', 'All Shipping', ''), false)
  + grp('sub-refund', 'Refunds', I.refund, '', sub('#', 'All Refunds', ''), false)
  + grp('sub-rev', 'Reviews', I.review, '', sub('#', 'All Reviews', ''), false)
  + a('#', 'Points', I.coin, '')
  + a('#', 'Wallet', I.wallet, '')
  + a('#', 'Coupons', I.tag, '')
  + a('#', 'Reports', I.bar, '')
  + '<div class="nav-section-label">Promotion Management</div>'
  + a('#', 'Banners', I.banner, '')
  + a('#', 'On Boardings Screens', I.mobile, '')
  + a('#', 'Coupons', I.tag, '')
  + grp('sub-notif', 'Notify Templates', I.bell, '', sub('#', 'All Templates', ''), false)
  + grp('sub-test', 'Testimonials', I.msg, '', sub('#', 'All Testimonials', ''), false)
  + '<div class="nav-section-label">Content Management</div>'
  + grp('sub-blog', 'Blogs', I.blog, '', sub('#', 'All Blogs', ''), false)
  + grp('sub-pages', 'Pages', I.page, '', sub('#', 'All Pages', ''), false);

  var mount = document.getElementById('sidebar-mount');
  if (mount) { mount.innerHTML = html; mount.className = 'sidebar'; }

  // Wire up toggles and tabs after injection
  document.querySelectorAll('.nav-item[data-toggle]').forEach(function (item) {
    item.addEventListener('click', function () {
      var targetId = item.dataset.toggle;
      var sub2 = document.getElementById(targetId);
      if (!sub2) return;
      var isOpen = sub2.style.display !== 'none' && sub2.style.display !== '';
      sub2.style.display = isOpen ? 'none' : 'block';
      var chevron = item.querySelector('.nav-chevron');
      if (chevron) chevron.classList.toggle('open', !isOpen);
    });
  });

  document.querySelectorAll('.filter-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var group = tab.closest('.filter-tabs');
      if (group) group.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
    });
  });

  document.querySelectorAll('.time-slot:not(.booked)').forEach(function (slot) {
    slot.addEventListener('click', function () {
      var wrap = slot.closest('.time-slots');
      if (wrap) wrap.querySelectorAll('.time-slot').forEach(function (s) { s.classList.remove('selected'); });
      slot.classList.add('selected');
    });
  });

  document.querySelectorAll('.pay-opt').forEach(function (opt) {
    opt.addEventListener('click', function () {
      var wrap = opt.closest('.payment-opts');
      if (wrap) wrap.querySelectorAll('.pay-opt').forEach(function (o) { o.classList.remove('selected'); });
      opt.classList.add('selected');
    });
  });

  document.querySelectorAll('.specialty-card').forEach(function (card) {
    card.addEventListener('click', function () {
      document.querySelectorAll('.specialty-card').forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
    });
  });

  var selAll = document.getElementById('sel-all');
  if (selAll) {
    selAll.addEventListener('change', function () {
      document.querySelectorAll('.row-cb').forEach(function (cb) { cb.checked = selAll.checked; });
    });
  }
})();
