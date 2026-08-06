// 1. Side Drawer Menu Control
const openMenuBtn = document.getElementById('openMenuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const sideDrawer = document.getElementById('sideDrawer');

if (openMenuBtn) {
  openMenuBtn.addEventListener('click', () => {
    sideDrawer.classList.add('open');
  });
}

if (closeMenuBtn) {
  closeMenuBtn.addEventListener('click', () => {
    sideDrawer.classList.remove('open');
  });
}

// 2. Search Button Functionality
const searchBtn = document.getElementById('searchBtn');
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    const kuralNo = prompt("உங்களுக்கு வேண்டிய குறள் எண்ணை உள்ளிடுக (1 - 1330):");
    if (kuralNo) {
      const targetIndex = parseInt(kuralNo) - 1;
      if (kuralData.kural && targetIndex >= 0 && targetIndex < kuralData.kural.length) {
        currentIndex = targetIndex;
        displayKural(currentIndex);
      } else {
        alert("செல்லுபடியாகும் குறள் எண்ணை உள்ளிடுக!");
      }
    }
  });
}

// 3. Thirukkural Data Integration
let kuralData = { kural: [] };
let currentIndex = 0;

// JSON தரவை ஏற்றுதல் (சரிசெய்யப்பட்ட கோப்புப் பெயர்)
async function loadKuralData() {
  try {
    const response = await fetch('thirukkural.json'); // பெயர் thirukkural.json என மாற்றப்பட்டுள்ளது
    kuralData = await response.json();
    
    if (kuralData && kuralData.kural && kuralData.kural.length > 0) {
      displayKural(currentIndex);
    } else {
      console.error("thirukkural.json ஃபைலில் தரவுகள் சரியாக இல்லை!");
    }
  } catch (error) {
    console.error("JSON தரவை ஏற்றுவதில் பிழை ஏற்பட்டது:", error);
  }
}

// 4. UI-ல் குறள் மற்றும் உரைகளை மாற்றுவதற்கான பங்க்ஷன்
function displayKural(index) {
  if (!kuralData.kural || kuralData.kural.length === 0) return;

  const data = kuralData.kural[index];
  if (!data) return;

  // குறள் எண்
  const kuralNoElem = document.getElementById('kural-no');
  if (kuralNoElem) kuralNoElem.innerText = `குறள்: ${data.Number}`;

  // குறள் வரிகள்
  const line1Elem = document.getElementById('line1');
  const line2Elem = document.getElementById('line2');
  if (line1Elem) line1Elem.innerText = data.Line1 || "";
  if (line2Elem) line2Elem.innerText = data.Line2 || "";

  // உரைகள்
  const spElem = document.getElementById('sp-urai');
  const mvElem = document.getElementById('mv-urai');
  const mkElem = document.getElementById('mk-urai');
  const engElem = document.getElementById('eng-translation');

  if (spElem) spElem.innerText = data.sp || "உரை இல்லை";
  if (mvElem) mvElem.innerText = data.mv || "உரை இல்லை";
  if (mkElem) mkElem.innerText = data.mk || "உரை இல்லை";
  if (engElem) engElem.innerText = data.Translation || "Translation Not Available";

  // ஆங்கில உச்சரிப்பு (Transliteration)
  const transElem = document.getElementById('transliteration');
  if (transElem) {
    const t1 = data.transliteration1 || "";
    const t2 = data.transliteration2 || "";
    transElem.innerText = `${t1} ${t2}`;
  }
}

// 5. Next / Previous Navigation Controls
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (kuralData.kural && currentIndex < kuralData.kural.length - 1) {
      currentIndex++;
      displayKural(currentIndex);
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      displayKural(currentIndex);
    }
  });
}

// துவக்கம்
loadKuralData();
