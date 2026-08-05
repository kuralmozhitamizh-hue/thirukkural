// Drawer Menu Handling
const openMenuBtn = document.getElementById('openMenuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const sideDrawer = document.getElementById('sideDrawer');

openMenuBtn.addEventListener('click', () => {
  sideDrawer.classList.add('open');
});

closeMenuBtn.addEventListener('click', () => {
  sideDrawer.classList.remove('open');
});

// Carousel Touch Swipe Auto-handling (HTML Native Scroll Snap manages swipe automatically)

// Next and Previous Kural Navigation Example
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let currentKural = 72;

nextBtn.addEventListener('click', () => {
  currentKural++;
  document.getElementById('kural-no').innerText = `குறள்: ${currentKural}`;
  // இங்கே உனது JSON ஃபைலில் இருந்து அடுத்த குறள் தரவுகளை எடுத்து மாற்றி அமைத்துக் கொள்ளலாம்.
});

prevBtn.addEventListener('click', () => {
  if(currentKural > 1) {
    currentKural--;
    document.getElementById('kural-no').innerText = `குறள்: ${currentKural}`;
  }
});
