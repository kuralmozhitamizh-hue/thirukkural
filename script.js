let currentKuralId = 1;
const maxKural = 1330;

let detailData = [], grammarData = [], thirukkuralData = [], wordMeaningsData = [], storyData = {};

// கோப்புகளைப் படிக்கும் செயல்பாடு
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
        return [];
    }
}

// JSON-க்குள் எந்த ரூபத்தில் Array இருந்தாலும் தேடி எடுக்க
function extractArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    for (let key in data) {
        if (Array.isArray(data[key])) return data[key];
    }
    return [data]; 
}

async function loadData() {
    // 5 கோப்புகளையும் சரியாக ஏற்றுகிறோம்
    const [d_detail, d_grammar, d_kural, d_words, d_story] = await Promise.all([
        fetchJSON('detail.json'),
        fetchJSON('thirukkural_full_grammar.json'),
        fetchJSON('thirukkural.json'),
        fetchJSON('thirukkural_word_meanings.json'),
        fetchJSON('thirukkural_data.json')
    ]);

    detailData = extractArray(d_detail);
    grammarData = extractArray(d_grammar);
    thirukkuralData = extractArray(d_kural);
    wordMeaningsData = extractArray(d_words);
    
    storyData = d_story ? (Array.isArray(d_story) ? d_story[0] : d_story) : {};

    renderKural(currentKuralId);
}

// குறள் எண்ணை வைத்துத் துல்லியமாகத் தேடும் செயல்பாடு
function findData(arr, id) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return {};
    return arr.find(item => {
        const itemID = item.number || item.Number || item.kural_no || item.kural_number || item.id || item.Id;
        return parseInt(itemID) === id;
    }) || arr[id - 1] || {};
}

// மாஸ்டர் தேடல்: எந்தப் பெயரில் தரவுகள் இருந்தாலும் கண்டுபிடிக்கும் மூளை
function getVal(obj, possibleKeys, fallback = '-') {
    if (!obj || typeof obj !== 'object') return fallback;
    
    // 1. நேரடித் தேடல் (பெரிய/சிறிய எழுத்துகளைப் பொருட்படுத்தாமல்)
    for (let pKey of possibleKeys) {
        for (let key in obj) {
            if (key.toLowerCase() === pKey.toLowerCase() && obj[key]) {
                return obj[key];
            }
        }
    }

    // 2. உள்ளே மறைந்திருக்கும் தேடல் (Nested Check - எ.கா: grammar: { ezhuthu: "..." })
    for (let key in obj) {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
            for (let pKey of possibleKeys) {
                for (let subKey in obj[key]) {
                    if (subKey.toLowerCase() === pKey.toLowerCase() && obj[key][subKey]) {
                        return obj[key][subKey];
                    }
                }
            }
        }
    }
    return fallback;
}

function renderKural(id) {
    if (id < 1 || id > maxKural) return;
    
    const basic = findData(thirukkuralData, id);
    const grammar = findData(grammarData, id);
    const detail = findData(detailData, id); 
    const words = findData(wordMeaningsData, id);
    const story = storyData[id] || {};

    // 1. அமைப்பு விவரங்கள்
    const paal = getVal(detail, ['paal', 'sect_tam', 'section']) !== '-' ? getVal(detail, ['paal', 'sect_tam', 'section']) : getVal(basic, ['paal', 'sect_tam', 'section'], 'தரவு இல்லை');
    const iyal = getVal(detail, ['iyal', 'chapgrp_tam', 'chapterGroup']) !== '-' ? getVal(detail, ['iyal', 'chapgrp_tam', 'chapterGroup']) : getVal(basic, ['iyal', 'chapgrp_tam', 'chapterGroup'], '-');
    const athigaram = getVal(detail, ['athigaram', 'chap_tam', 'chapter']) !== '-' ? getVal(detail, ['athigaram', 'chap_tam', 'chapter']) : getVal(basic, ['athigaram', 'chap_tam', 'chapter'], '-');

    document.getElementById('hierarchyDetails').innerHTML = `
        <div class="detail-box"><span>பால்</span><strong>${paal}</strong></div>
        <div class="detail-box"><span>இயல்</span><strong>${iyal}</strong></div>
        <div class="detail-box"><span>அதிகாரம்</span><strong>${athigaram}</strong></div>
        <div class="detail-box"><span>குறள் எண்</span><strong>${id}</strong></div>
    `;

    // 2. குறள் & மொழிபெயர்ப்பு
    const line1 = getVal(basic, ['line1'], 'தரவு கிடைக்கவில்லை');
    const line2 = getVal(basic, ['line2'], '');
    const translation = getVal(basic, ['translation', 'eng', 'english'], 'Not available');
    const couplet = getVal(basic, ['couplet', 'eng_couplet']) !== '-' ? getVal(basic, ['couplet', 'eng_couplet']) : translation;
    const transliteration = getVal(basic, ['transliteration', 'translit', 'tam_transliteration'], 'தரவு கிடைக்கவில்லை');

    document.getElementById('kuralCarousel').innerHTML = `
        <div class="carousel-item">
            <h3>தமிழ்</h3>
            <p><strong>குறள்:</strong><br> ${line1} <br> ${line2}</p>
        </div>
        <div class="carousel-item">
            <h3>English</h3>
            <p><strong>Couplet:</strong> ${couplet}</p>
            <p><strong>Translation:</strong> ${translation}</p>
        </div>
        <div class="carousel-item">
            <h3>Transliteration</h3>
            <p>${transliteration}</p>
        </div>
    `;

    // 3. உரைகள் (ஆங்கிலம், தமிழ் எனச் சரியாகப் பிரிக்கப்பட்டுள்ளது)
    const mv = getVal(basic, ['mv', 'mu_va', 'varadharajanar'], 'உரை கிடைக்கவில்லை');
    const sp = getVal(basic, ['sp', 'pappaiya', 'salamon'], 'உரை கிடைக்கவில்லை');
    const mk = getVal(basic, ['mk', 'manakkudavar'], 'உரை கிடைக்கவில்லை');
    
    const generalTamil = getVal(basic, ['tam_exp', 'tamil_exp', 'vilakkam', 'porul', 'urai', 'general_explanation_tamil']) !== '-' ? getVal(basic, ['tam_exp', 'tamil_exp', 'vilakkam', 'porul', 'urai']) : getVal(grammar, ['general_explanation', 'vilakkam'], 'விளக்கம் கிடைக்கவில்லை');
    const engExp = getVal(basic, ['eng_exp', 'eng_explanation', 'explanation', 'english_explanation'], 'Not available');

    document.getElementById('explanationCarousel').innerHTML = `
        <div class="carousel-item"><h3>மு. வரதராசனார் உரை</h3><p>${mv}</p></div>
        <div class="carousel-item"><h3>சாலமன் பாப்பையா உரை</h3><p>${sp}</p></div>
        <div class="carousel-item"><h3>மணக்குடவர் உரை</h3><p>${mk}</p></div>
        <div class="carousel-item"><h3>பொதுவான விளக்கம்</h3><p>${generalTamil}</p></div>
        <div class="carousel-item"><h3>English Explanation</h3><p>${engExp}</p></div>
    `;

    // 4. வார்த்தைக்கான அர்த்தங்கள்
    let wordsHTML = '';
    let wordsArray = words.words || words.Words || words.meaning || words.Meaning || (Array.isArray(words) ? words : null);
    
    if (Array.isArray(wordsArray) && wordsArray.length > 0) {
        wordsArray.forEach(w => {
            const tw = getVal(w, ['tamil_word', 'tamilword', 'word', 'tamil'], '-');
            const tm = getVal(w, ['tamil_meaning', 'tamilmeaning', 'meaning_tamil', 'porul'], '-');
            const em = getVal(w, ['english_meaning', 'englishmeaning', 'meaning_english', 'english', 'meaning'], '-');
            
            if (tw !== '-') {
                wordsHTML += `
                <div class="carousel-item">
                    <h3>${tw}</h3>
                    <p><strong>பொருள்:</strong> ${tm}</p>
                    <p><strong>Meaning:</strong> ${em}</p>
                </div>`;
            }
        });
    }
    
    if (wordsHTML === '') {
        wordsHTML = `<div class="carousel-item"><p>வார்த்தை விவரங்கள் கிடைக்கவில்லை</p></div>`;
    }
    document.getElementById('wordMeaningCarousel').innerHTML = wordsHTML;

    // 5. இலக்கணம்
    const ezhuthu = getVal(grammar, ['ezhuthu', 'eluthu'], '-');
    const sol = getVal(grammar, ['sol', 'chol'], '-');
    const vaetrumai = getVal(grammar, ['vaetrumai', 'vetrumai'], '-');
    const yaappu = getVal(grammar, ['yaappu', 'yappu'], '-');
    const ani = getVal(grammar, ['ani'], '-');
    const punarchi = getVal(grammar, ['punarchi'], '-');

    document.getElementById('grammarCarousel').innerHTML = `
        <div class="carousel-item"><h3>எழுத்து</h3><p>${ezhuthu}</p></div>
        <div class="carousel-item"><h3>சொல்</h3><p>${sol}</p></div>
        <div class="carousel-item"><h3>வேற்றுமை</h3><p>${vaetrumai}</p></div>
        <div class="carousel-item"><h3>யாப்பு</h3><p>${yaappu}</p></div>
        <div class="carousel-item"><h3>அணி</h3><p>${ani}</p></div>
        <div class="carousel-item"><h3>புணர்ச்சி</h3><p>${punarchi}</p></div>
    `;

    // 6. கதைகள்
    const storyTam = getVal(story, ['story_tamil', 'tamil_story', 'tamil'], 'இந்தக் குறளுக்கான கதை கிடைக்கவில்லை.');
    const storyEng = getVal(story, ['story_english', 'english_story', 'english'], 'Story not available for this kural.');
    document.getElementById('storyCarousel').innerHTML = `
        <div class="carousel-item">
            <h3>தமிழ் கதை</h3>
            <p>${storyTam}</p>
        </div>
        <div class="carousel-item">
            <h3>English Story</h3>
            <p>${storyEng}</p>
        </div>
    `;

    // Update UI Elements
    document.getElementById('currentKuralDisplay').innerText = `${id} / ${maxKural}`;
    document.getElementById('prevBtn').disabled = id === 1;
    document.getElementById('nextBtn').disabled = id === maxKural;
    
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

window.onload = loadData;
