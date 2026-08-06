// Side Drawer Control
const openMenuBtn = document.getElementById('openMenuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const sideDrawer = document.getElementById('sideDrawer');

openMenuBtn.addEventListener('click', () => {
  sideDrawer.classList.add('open');
});

closeMenuBtn.addEventListener('click', () => {
  sideDrawer.classList.remove('open');
});

// Thirukkural Data Integration
let kuralData = [];
let currentIndex = 0;

// Load Data from JSON
async function loadKuralData() {
  try {
    const response = await fetch('kural.json');
    kuralData = await response.json();
    if (kuralData.kural && kuralData.kural.length > 0) {
      displayKural(currentIndex);
    }
  } catch (error) {
    console.error("JSON தரவை ஏற்றுவதில் பிழை ஏற்பட்ளது:", error);
  }
}

// Function to Update UI elements dynamically
function displayKural(index) {
  const data = kuralData.kural[index];
  if (!data) return;

  document.getElementById('kural-no').innerText = `குறள்: ${data.Number}`;
  document.getElementById('line1').innerText = data.Line1;
  document.getElementById('line2').innerText = data.Line2;

  // Set Urai
  document.getElementById('sp-urai').innerText = data.sp || "தரவு இல்லை";
  document.getElementById('mv-urai').innerText = data.mv || "தரவு இல்லை";
  document.getElementById('mk-urai').innerText = data.mk || "தரவு இல்லை";
  document.getElementById('eng-translation').innerText = data.Translation || "தரவு இல்லை";

  // Transliteration
  document.getElementById('transliteration').innerText = `${data.transliteration1} ${data.transliteration2}`;
}

// Next / Previous Navigation
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

nextBtn.addEventListener('click', () => {
  if (currentIndex < kuralData.kural.length - 1) {
    currentIndex++;
    displayKural(currentIndex);
  }
});

prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    displayKural(currentIndex);
  }
});

// Initialize App
loadKuralData();
