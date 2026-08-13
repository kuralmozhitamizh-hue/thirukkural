let currentKuralId = 1;
const maxKural = 1330;

// JSON தரவுகளைச் சேமிக்க
let detailData = [], grammarData = [], thirukkuralData = [], wordMeaningsData = [], storyData = {};

// மிகவும் பாதுகாப்பான முறையில் JSON தரவுகளை எடுக்க புதிய உதவிச் செயல்பாடு (Helper function)
async function fetchJSON(url, isObject = false) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`கவனிக்க: ${url} கோப்பு கிடைக்கவில்லை. (Status: ${response.status})`);
            return isObject ? {} : [];
        }
        // JSON கோப்பில் ஏதாவது எழுத்துப்பிழை (Syntax Error) இருந்தால் அதையும் பிடித்துவிடும்
        return await response.json(); 
    } catch (error) {
        console.error(`பிழை: ${url} கோப்பைப் படிப்பதில் சிக்கல் -`, error);
        return isObject ? {} : [];
    }
}

// அனைத்தையும் ஏற்றும் முதன்மைச் செயல்பாடு
async function loadData() {
    try {
        // ஒவ்வொரு கோப்பாகப் பாதுகாப்பாக எடுக்கிறோம் (எதில் பிழை இருந்தாலும் மற்றவை வேலை செய்யும்)
        detailData = await fetchJSON('detail.json', false);
        grammarData = await fetchJSON('thirukkural_full_grammar.json', false);
        thirukkuralData = await fetchJSON('thirukkural.json', false);
        wordMeaningsData = await fetchJSON('thirukkural_word_meanings.json', false);
        
        const storyRawData = await fetchJSON('thirukkural_data.json', true);
        storyData = Array.isArray(storyRawData) ? storyRawData[0] : storyRawData;

        // முதன்மை தரவு (thirukkural.json) சரியாக உள்ளதா எனச் சரிபார்க்கிறோம்
        if (!thirukkuralData || thirukkuralData.length === 0) {
            alert("திருக்குறள் முக்கிய தரவுகள் கிடைக்கவில்லை! உன்னுடைய 'thirukkural.json' கோப்பில் பிழை இருக்கலாம்.");
            return;
        }

        renderKural(currentKuralId);
    } catch (error) {
        console.error("எதிர்பாராத பிழை: ", error);
        alert("தரவுகளை ஏற்றுவதில் பிழை! உலாவி Console-ஐப் பார்க்கவும்.");
    }
}

function renderKural(id) {
    if (id < 1 || id > maxKural) return;
    
    // தரவுகள் காலியாக இருந்தால் அதற்கேற்ப கையாளுதல்
    const kuralGrammar = (grammarData && grammarData.length > 0) ? (grammarData.find(k => k.number === id) || grammarData[id-1] || {}) : {};
    const kuralBasic = (thirukkuralData && thirukkuralData.length > 0) ? (thirukkuralData.find(k => k.number === id) || thirukkuralData[id-1] || {}) : {};
    
    let kuralWords = [];
    if (wordMeaningsData && wordMeaningsData.length > 0) {
        kuralWords = wordMeaningsData.find(w => w.kural_number === id) || wordMeaningsData[id-1] || {};
    }

    const kuralStory = storyData ? (storyData[id] || {}) : {};

    // 1. அமைப்பு விவரங்கள்
    const hierarchyHTML = `
        <div class="detail-box"><span>பால்</span><strong>${kuralBasic.paal || 'தரவு இல்லை'}</strong></div>
        <div class="detail-box"><span>இயல்</span><strong>${kuralBasic.iyal || '-'}</strong></div>
        <div class="detail-box"><span>அதிகாரம்</span><strong>${kuralBasic.athigaram || '-'}</strong></div>
        <div class="detail-box"><span>குறள் எண்</span><strong>${id}</strong></div>
    `;
    document.getElementById('hierarchyDetails').innerHTML = hierarchyHTML;

    // 2. குறள் & மொழிபெயர்ப்பு
    const kuralHTML = `
        <div class="carousel-item">
            <h3>தமிழ்</h3>
            <p><strong>குறள்:</strong><br> ${kuralBasic.line1 || 'தரவு கிடைக்கவில்லை'} <br> ${kuralBasic.line2 || ''}</p>
        </div>
        <div class="carousel-item">
            <h3>English</h3>
            <p><strong>Couplet:</strong> ${kuralBasic.couplet || 'Not available'}</p>
            <p><strong>Translation:</strong> ${kuralBasic.translation || 'Not available'}</p>
        </div>
        <div class="carousel-item">
            <h3>Transliteration</h3>
            <p>${kuralBasic.transliteration || 'Not available'}</p>
        </div>
    `;
    document.getElementById('kuralCarousel').innerHTML = kuralHTML;

    // 3. உரைகள்
    const explanationHTML = `
        <div class="carousel-item"><h3>மு. வரதராசனார் உரை</h3><p>${kuralBasic.mv || 'உரை கிடைக்கவில்லை'}</p></div>
        <div class="carousel-item"><h3>சாலமன் பாப்பையா உரை</h3><p>${kuralBasic.sp || 'உரை கிடைக்கவில்லை'}</p></div>
        <div class="carousel-item"><h3>மணக்குடவர் உரை</h3><p>${kuralBasic.mk || 'உரை கிடைக்கவில்லை'}</p></div>
        <div class="carousel-item"><h3>பொதுவான விளக்கம்</h3><p>${kuralGrammar.general_explanation || kuralBasic.explanation || 'விளக்கம் கிடைக்கவில்லை'}</p></div>
        <div class="carousel-item"><h3>English Explanation</h3><p>${kuralBasic.eng_exp || 'Not available'}</p></div>
    `;
    document.getElementById('explanationCarousel').innerHTML = explanationHTML;

    // 4. வார்த்தைக்கான அர்த்தங்கள்
    let wordsHTML = '';
    if(kuralWords && Array.isArray(kuralWords.words)) {
        kuralWords.words.forEach(word => {
            wordsHTML += `
            <div class="carousel-item">
                <h3>${word.tamil_word || '-'}</h3>
                <p><strong>பொருள்:</strong> ${word.tamil_meaning || '-'}</p>
                <p><strong>Meaning:</strong> ${word.english_meaning || '-'}</p>
            </div>`;
        });
    } else {
        wordsHTML = `<div class="carousel-item"><p>வார்த்தை விவரங்கள் கிடைக்கவில்லை</p></div>`;
    }
    document.getElementById('wordMeaningCarousel').innerHTML = wordsHTML;

    // 5. இலக்கணம்
    const grammarHTML = `
        <div class="carousel-item"><h3>எழுத்து</h3><p>${kuralGrammar.ezhuthu || '-'}</p></div>
        <div class="carousel-item"><h3>சொல்</h3><p>${kuralGrammar.sol || '-'}</p></div>
        <div class="carousel-item"><h3>வேற்றுமை</h3><p>${kuralGrammar.vaetrumai || '-'}</p></div>
        <div class="carousel-item"><h3>யாப்பு</h3><p>${kuralGrammar.yaappu || '-'}</p></div>
        <div class="carousel-item"><h3>அணி</h3><p>${kuralGrammar.ani || '-'}</p></div>
        <div class="carousel-item"><h3>புணர்ச்சி</h3><p>${kuralGrammar.punarchi || '-'}</p></div>
    `;
    document.getElementById('grammarCarousel').innerHTML = grammarHTML;

    // 6. கதைகள்
    const storyHTML = `
        <div class="carousel-item">
            <h3>தமிழ் கதை</h3>
            <p>${kuralStory.story_tamil || 'இந்தக் குறளுக்கான கதை கிடைக்கவில்லை.'}</p>
        </div>
        <div class="carousel-item">
            <h3>English Story</h3>
            <p>${kuralStory.story_english || 'Story not available for this kural.'}</p>
        </div>
    `;
    document.getElementById('storyCarousel').innerHTML = storyHTML;

    // Update UI Elements
    document.getElementById('currentKuralDisplay').innerText = `${id} / ${maxKural}`;
    document.getElementById('prevBtn').disabled = id === 1;
    document.getElementById('nextBtn').disabled = id === maxKural;
    
    // கரோசல்களை முதலில் இருந்து தொடங்கச் செய்தல்
    document.querySelectorAll('.carousel').forEach(c => c.scrollLeft = 0);
}

function navigateKural(step) {
    const newId = currentKuralId + step;
    if (newId >= 1 && newId <= maxKural) {
        currentKuralId = newId;
        renderKural(currentKuralId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function searchKural() {
    const input = document.getElementById('searchInput').value;
    const num = parseInt(input);
    if (num >= 1 && num <= maxKural) {
        currentKuralId = num;
        renderKural(currentKuralId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        alert("தயவுசெய்து 1 முதல் 1330 வரையிலான எண்ணை உள்ளிடவும் செல்லம்!");
    }
}

// ஆரம்பிக்கும் போது தரவுகளை ஏற்றுக
window.onload = loadData;
