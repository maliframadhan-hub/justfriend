// =========================================================
// ELEMEN UMUM
// =========================================================
const form = document.getElementById('contactForm');
const toast = document.getElementById('toast');

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const realtimeClock = document.getElementById('realtimeClock');
const realtimeDate = document.getElementById('realtimeDate');
const soundToggle = document.querySelector('.sound-toggle');
const backgroundMusic = document.getElementById('backgroundMusic');

let toastTimer = null;
function showToast(message, duration = 2000) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// =========================================================
// BACKSOUND
// =========================================================
if (soundToggle && backgroundMusic) {
  soundToggle.addEventListener('click', async () => {
    const isPlaying = soundToggle.classList.toggle('is-playing');
    soundToggle.setAttribute('aria-pressed', String(isPlaying));
    soundToggle.setAttribute('aria-label', isPlaying ? 'Matikan backsound' : 'Nyalakan backsound');
    soundToggle.textContent = isPlaying ? '♫' : '♪';
    if (isPlaying) {
      try {
        await backgroundMusic.play();
      } catch (error) {
        soundToggle.classList.remove('is-playing');
        soundToggle.setAttribute('aria-pressed', 'false');
        soundToggle.setAttribute('aria-label', 'Nyalakan backsound');
        soundToggle.textContent = '♪';
      }
    } else {
      backgroundMusic.pause();
    }
  });
}

// =========================================================
// JAM & TANGGAL REALTIME
// =========================================================
function updateRealtimeClock() {
  const now = new Date();
  if (realtimeClock) realtimeClock.textContent = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
  if (realtimeDate) realtimeDate.textContent = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);
}

updateRealtimeClock();
setInterval(updateRealtimeClock, 1000);

// =========================================================
// NAVIGASI MOBILE
// =========================================================
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.querySelectorAll(':scope > a').forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Buka menu navigasi');
    });
  });
}

// =========================================================
// CONTACT FORM
// =========================================================
if (form && toast) {
  // Disamakan dengan email yang tampil di halaman Kontak
  const BUSINESS_EMAIL = 'justfriendinpolmed@gmail.com';

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nama = document.getElementById('nama').value.trim();
    const email = document.getElementById('email').value.trim();
    const topik = document.getElementById('topik').value.trim();
    const pesan = document.getElementById('pesan').value.trim();

    const subject = `Pesan dari ${nama}${topik ? ' - ' + topik : ''}`;
    const body = `Nama: ${nama}\nEmail: ${email}\n\n${pesan}`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(BUSINESS_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    showToast('Membuka Gmail untuk mengirim pesanmu...', 1000);
    form.reset();

    setTimeout(() => {
      window.location.href = gmailUrl;
    }, 1000);
  });
}

// =========================================================
// PEMBAYARAN (QRIS)
// =========================================================
const WA_NUMBER = '6283107066531'; // nomor WhatsApp penerima konfirmasi (format internasional tanpa +)
const payModal = document.getElementById('payModal');

if (payModal) {
  const confirmBtn = document.getElementById('payConfirm');

  const openPay = () => {
    payModal.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const closePay = () => {
    payModal.hidden = true;
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-open-pay]').forEach((btn) => btn.addEventListener('click', openPay));
  payModal.querySelectorAll('[data-close-pay]').forEach((el) => el.addEventListener('click', closePay));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !payModal.hidden) closePay();
  });

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const nama = document.getElementById('payNama').value.trim();
      const nominal = Number(document.getElementById('payNominal').value);

      if (!nama || !nominal) {
        showToast('Isi nama dan nominal dulu ya');
        return;
      }

      const rupiah = new Intl.NumberFormat('id-ID').format(nominal);
      const metode = 'QRIS';
      const text = `Halo JusTFriend, saya sudah bayar.\n\nNama: ${nama}\nMetode: ${metode}\nNominal: Rp ${rupiah}\n\n(Bukti pembayaran saya lampirkan di chat ini)`;

      window.open(`https://wa.me/${6282273389081}?text=${encodeURIComponent(text)}`, '_blank');
      closePay();
    });
  }
}