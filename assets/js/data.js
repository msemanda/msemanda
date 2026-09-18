/* eHealth System — Central data store (localStorage) */
(function () {
  var K = 'eh_';
  function g(k) { try { return JSON.parse(localStorage.getItem(K + k)); } catch (e) { return null; } }
  function s(k, v) { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch (e) {} }

  var SEED = {
    users: [
      { id:'u1', name:'Moses Semanda',    email:'admin@ehealth.ug',      password:'ehealth2026', role:'admin',        avatar:'M' },
      { id:'u2', name:'Dr. Sophia Reed',  email:'sophia@ehealth.ug',     password:'doctor123',   role:'doctor',       avatar:'S' },
      { id:'u3', name:'Dr. Ethan Walker', email:'ethan@ehealth.ug',      password:'doctor123',   role:'doctor',       avatar:'E' },
      { id:'u4', name:'Dr. Ava Richardson',email:'ava@ehealth.ug',       password:'doctor123',   role:'doctor',       avatar:'A' },
      { id:'u5', name:'Sarah Nakato',     email:'sarah@ehealth.ug',      password:'nurse123',    role:'nurse',        avatar:'S' },
      { id:'u6', name:'Tom Kiggundu',     email:'reception@ehealth.ug',  password:'recept123',   role:'receptionist', avatar:'T' },
      { id:'u7', name:'Dr. Pat Lab',      email:'lab@ehealth.ug',        password:'path123',     role:'pathologist',  avatar:'P' },
      { id:'u8', name:'Sunrise Hospital', email:'hospital@ehealth.ug',   password:'hosp123',     role:'hospital',     avatar:'H' },
      { id:'u9', name:'James Okello',     email:'collector@ehealth.ug',  password:'collect123',  role:'collector',    avatar:'J' },
      { id:'u10',name:'Pharm Akello',     email:'pharma@ehealth.ug',     password:'pharm123',    role:'pharmacist',   avatar:'P' }
    ],
    patients: [
      { id:'p1',  name:'Madhuranjan Thakur', email:'madhuranjan@example.com', phone:'+256700000001', status:'active', createdAt:'2026-09-11 04:10 AM' },
      { id:'p2',  name:'Srinivas',           email:'srinivas@example.com',    phone:'+256700000002', status:'active', createdAt:'2026-09-08 03:58 AM' },
      { id:'p3',  name:'Priya',              email:'priya@example.com',       phone:'+256700000003', status:'active', createdAt:'2026-09-01 07:00 AM' },
      { id:'p4',  name:'Liza Matt',          email:'liza@example.com',        phone:'+256700000004', status:'active', createdAt:'2026-06-03 03:56 AM' },
      { id:'p5',  name:'Maira Mehta',        email:'maira@example.com',       phone:'+256700000005', status:'active', createdAt:'2026-06-02 07:08 AM' },
      { id:'p6',  name:'Test User',          email:'testuser@example.com',    phone:'+256700000006', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p7',  name:'Harper Lewis',       email:'harper@example.com',      phone:'+256700000007', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p8',  name:'Daniel Clark',       email:'daniel@example.com',      phone:'+256700000008', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p9',  name:'Amelia Lee',         email:'amelia@example.com',      phone:'+256700000009', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p10', name:'Henry Robinson',     email:'henry@example.com',       phone:'+256700000010', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p11', name:'Charlotte Garcia',   email:'charlotte@example.com',   phone:'+256700000011', status:'active', createdAt:'2026-05-27 06:54 PM' },
      { id:'p12', name:'John Katende',       email:'john@example.com',        phone:'+256700000012', status:'active', createdAt:'2026-05-20 08:00 AM' },
      { id:'p13', name:'Aisha Namukasa',     email:'aisha@example.com',       phone:'+256700000013', status:'active', createdAt:'2026-05-19 09:00 AM' },
      { id:'p14', name:'Peter Wasswa',       email:'peter@example.com',       phone:'+256700000014', status:'active', createdAt:'2026-05-18 10:00 AM' },
      { id:'p15', name:'Grace Nakato',       email:'grace@example.com',       phone:'+256700000015', status:'active', createdAt:'2026-05-17 11:00 AM' },
      { id:'p16', name:'David Mugisha',      email:'david@example.com',       phone:'+256700000016', status:'active', createdAt:'2026-05-16 12:00 PM' },
      { id:'p17', name:'Rita Nalwoga',       email:'rita@example.com',        phone:'+256700000017', status:'active', createdAt:'2026-05-15 01:00 PM' }
    ],
    doctors: [
      { id:'d1', name:'Dr. Sophia Reed',     email:'sophia@ehealth.ug',    specialty:'General Practice', hospital:'Sunrise Care Hospital', status:'active' },
      { id:'d2', name:'Dr. Ethan Walker',    email:'ethan@ehealth.ug',     specialty:'Pediatrics',       hospital:'MapleCare Medical',     status:'active' },
      { id:'d3', name:'Dr. Ava Richardson',  email:'ava@ehealth.ug',       specialty:'Orthopedics',      hospital:'BlueCross General',     status:'active' },
      { id:'d4', name:'Dr. Olivia Bennett',  email:'olivia@ehealth.ug',    specialty:'Gynaecology',      hospital:'Sunrise Care Hospital', status:'active' },
      { id:'d5', name:'Dr. Benjamin Clark',  email:'benjamin@ehealth.ug',  specialty:'Cardiology',       hospital:'MapleCare Medical',     status:'active' },
      { id:'d6', name:'Dr. Noah Carter',     email:'noah@ehealth.ug',      specialty:'Mental Wellness',  hospital:'BlueCross General',     status:'active' },
      { id:'d7', name:'Dr. James Odongo',    email:'james@ehealth.ug',     specialty:'Dentistry',        hospital:'Sunrise Care Hospital', status:'active' },
      { id:'d8', name:'Dr. Lydia Auma',      email:'lydia@ehealth.ug',     specialty:'Sexual Health',    hospital:'MapleCare Medical',     status:'active' }
    ],
    appointments: [
      { id:'a1', num:'#10245', patientId:'p12', patient:'John Katende',       patientEmail:'john@example.com',         doctorId:'d1', doctor:'Dr. Sophia Reed',    type:'In-Person', date:'2026-09-18', time:'09:00 AM', status:'pending',     hospital:'Sunrise Care Hospital', createdAt:'2026-09-17 08:32 AM' },
      { id:'a2', num:'#10244', patientId:'p13', patient:'Aisha Namukasa',     patientEmail:'aisha@example.com',        doctorId:'d2', doctor:'Dr. Ethan Walker',   type:'Virtual',   date:'2026-09-18', time:'10:30 AM', status:'confirmed',   hospital:'MapleCare Medical',     createdAt:'2026-09-17 09:14 AM' },
      { id:'a3', num:'#10243', patientId:'p14', patient:'Peter Wasswa',       patientEmail:'peter@example.com',        doctorId:'d3', doctor:'Dr. Ava Richardson', type:'In-Person', date:'2026-09-16', time:'02:00 PM', status:'completed',   hospital:'BlueCross General',     createdAt:'2026-09-15 10:05 AM' },
      { id:'a4', num:'#10242', patientId:'p15', patient:'Grace Nakato',       patientEmail:'grace@example.com',        doctorId:'d4', doctor:'Dr. Olivia Bennett', type:'In-Person', date:'2026-09-15', time:'11:00 AM', status:'visited',     hospital:'Sunrise Care Hospital', createdAt:'2026-09-14 07:50 AM' },
      { id:'a5', num:'#10241', patientId:'p16', patient:'David Mugisha',      patientEmail:'david@example.com',        doctorId:'d5', doctor:'Dr. Benjamin Clark', type:'In-Person', date:'2026-09-20', time:'03:30 PM', status:'rescheduled', hospital:'MapleCare Medical',     createdAt:'2026-09-14 03:11 AM' },
      { id:'a6', num:'#10240', patientId:'p17', patient:'Rita Nalwoga',       patientEmail:'rita@example.com',         doctorId:'d6', doctor:'Dr. Noah Carter',    type:'Virtual',   date:'2026-09-13', time:'08:00 AM', status:'rejected',    hospital:'BlueCross General',     createdAt:'2026-09-12 11:44 AM' },
      { id:'a7', num:'#10239', patientId:'p1',  patient:'Madhuranjan Thakur', patientEmail:'madhuranjan@example.com',  doctorId:'d1', doctor:'Dr. Sophia Reed',    type:'In-Person', date:'2026-09-18', time:'11:30 AM', status:'pending',     hospital:'Sunrise Care Hospital', createdAt:'2026-09-11 06:00 AM' },
      { id:'a8', num:'#10238', patientId:'p2',  patient:'Srinivas',           patientEmail:'srinivas@example.com',     doctorId:'d2', doctor:'Dr. Ethan Walker',   type:'Virtual',   date:'2026-09-18', time:'02:00 PM', status:'confirmed',   hospital:'MapleCare Medical',     createdAt:'2026-09-10 04:00 PM' },
      { id:'a9', num:'#10237', patientId:'p3',  patient:'Priya',              patientEmail:'priya@example.com',        doctorId:'d3', doctor:'Dr. Ava Richardson', type:'In-Person', date:'2026-09-18', time:'03:00 PM', status:'cancelled',   hospital:'BlueCross General',     createdAt:'2026-09-09 02:30 PM' }
    ]
  };

  function seed() {
    if (!g('seeded')) {
      Object.keys(SEED).forEach(function (k) { s(k, SEED[k]); });
      s('seeded', true);
    }
  }

  function nextId(prefix) { return prefix + Date.now() + Math.floor(Math.random()*1000); }
  function nextNum(list) { return '#' + (10246 + list.length); }
  function nowStr() {
    var d = new Date();
    return d.toISOString().slice(0,10) + ' ' + d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  }
  function letterColor(name) {
    var colors = ['#0DA7A7','#7C3AED','#DB2777','#D97706','#059669','#2563EB','#DC2626','#0891B2'];
    var i = (name || 'A').charCodeAt(0) % colors.length;
    return colors[i];
  }

  window.EH = {
    letterColor: letterColor,
    getUsers:        function () { return g('users') || []; },
    getPatients:     function () { return g('patients') || []; },
    getDoctors:      function () { return g('doctors') || []; },
    getAppointments: function () { return g('appointments') || []; },

    findUser: function (email, password) {
      return this.getUsers().find(function (u) {
        return u.email.toLowerCase() === (email||'').toLowerCase() && u.password === password;
      }) || null;
    },

    addPatient: function (data) {
      var list = this.getPatients();
      var p = Object.assign({ id: nextId('p'), status:'active', createdAt: nowStr() }, data);
      list.unshift(p);
      s('patients', list);
      return p;
    },

    addAppointment: function (data) {
      var list = this.getAppointments();
      var a = Object.assign({ id: nextId('a'), num: nextNum(list), status:'pending', createdAt: nowStr() }, data);
      list.unshift(a);
      s('appointments', list);
      return a;
    },

    updateAppointmentStatus: function (id, status) {
      var list = this.getAppointments();
      list.forEach(function (a) { if (a.id === id) a.status = status; });
      s('appointments', list);
    }
  };

  seed();
})();
