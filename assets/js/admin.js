// Toggle sidebar sub-menus
document.querySelectorAll('.nav-item[data-toggle]').forEach(item => {
  item.addEventListener('click', () => {
    const targetId = item.dataset.toggle;
    const sub = document.getElementById(targetId);
    if (!sub) return;
    const isOpen = sub.style.display !== 'none' && sub.style.display !== '';
    sub.style.display = isOpen ? 'none' : 'block';
    const chevron = item.querySelector('.nav-chevron');
    if (chevron) chevron.classList.toggle('open', !isOpen);
  });
});

// Filter tabs
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const group = tab.closest('.filter-tabs');
    group.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// Time slots
document.querySelectorAll('.time-slot:not(.booked)').forEach(slot => {
  slot.addEventListener('click', () => {
    slot.closest('.time-slots').querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');
  });
});

// Payment options
document.querySelectorAll('.pay-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    opt.closest('.payment-opts').querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
  });
});

// Specialty cards
document.querySelectorAll('.specialty-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.specialty-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });
});

// Check-in tabs
document.querySelectorAll('.checkin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.checkin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// Select all checkbox
const selAll = document.getElementById('sel-all');
if (selAll) {
  selAll.addEventListener('change', () => {
    document.querySelectorAll('.row-cb').forEach(cb => { cb.checked = selAll.checked; });
  });
}
