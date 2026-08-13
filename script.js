let currentKuralId = 1;
const maxKural = 1330;

let kuralData = [], detailData = [], grammarData = [], wordsData = [], storyData = {};

// கோப்புகளைப் படிக்கும் செயல்பாடு
async function loadAllData() {
    const files = [
        'thirukkural.json',
        'detail.json',
        'thirukkural_full_grammar.json',
        'thirukkural_word_meanings.json',
        'thirukkural_data.json'
    ];

    try {
        const responses = await Promise.all(
            files.map(file => fetch(file).then(res => res.ok ? res.json() : null).catch(() => null))
        );

        kuralData = formatData(responses[0]);
        detailData = formatData(responses[1]);
        grammarData = formatData(responses[2]);
        wordsData = formatData(responses[3]);
        
        let sData = responses[4];
        storyData = sData ? (Array.isArray(sData) ? (sData[0] || {}) : sData) : {};

        renderKural(currentKuralId);
    } catch (error) {
        console.error("Data loading error:", error);
    }
}

// JSON அமைப்பைச் சீராக்கும் செயல்பாடு
function formatData(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    
    // உள்ளே Array இருந்தால் அதை எடுப்பது (எ.கா: { "kural": [...] })
    for (let key in data) {
        if (Array.isArray(data[key])) return data[key];
    }
    
    // { "1": {...}, "2": {...} } என்று இருந்தால் அதை Array ஆக மாற்றுவது
    const keys = Object.keys(data);
    if (keys.length > 0 && keys.every(k => !isNaN(k) && Number(k) > 0)) {
        return keys.map(k => ({ id: Number(k), ...data[k] }));
    }
    
    return [data];
}

// குறள் எண்ணை வைத்துச் சரியாகப் பிடிக்கும் மூளை
function findById(arr, id) {
    if (!arr || !arr.length) return {};
    let found = arr.find(item => {
        let itemId = item.number || item.Number || item.kural_no || item.kural_number || item.id || item.Id || item.kuralId;
        return Number(itemId) === id;
    });
    return found || arr[id - 1] || {};
}

// [object Object] வராமல், வார்த்தையை மட்டும் உருவி எடுக்கும் மாயாஜாலம்!
function extractText(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    
    if (typeof val === 'object' && !Array.isArray(val)) {
        // பெட்டிக்குள் இருந்தால் தமிழ் வார்த்தையை முதலில் தேடு
        if (val.tamil) return val.tamil;
        if (val.tam) return val.tam;
        if (val.name) return val.name;
        if (val.translation) return val.translation;
        
        // எதுவும் இல்லை என்றால் இருக்கும் முதல் வார்த்தையை எடு
        let firstString = Object.values(val).find(v => typeof v === 'string');
        if (firstString) return firstString;
    }
    return null;
}

// பல பெயர்களில் ஒளிந்திருக்கும் தரவைத் தேடும் செயல்பாடு
function getVal(obj, possibleKeys, fallback = '-') {
    if (!obj || Object.keys(obj).length === 0) return fallback;
    
    for (let pKey of possibleKeys) {
        // நேரடித் தேடல்
        let key = Object.keys(obj).find(k => k.toLowerCase() === pKey.toLowerCase());
        if (key && obj[key]) {
            let text = extractText(obj[key]);
            if (text) return text;
        }
        
        // பெட்டிக்குள் பெட்டி தேடல் (Nested Check)
        for (let innerObj in obj) {
            if (typeof obj[innerObj] === 'object' && obj[innerObj] !== null) {
                let innerKey = Object.keys(obj[innerObj]).find(k => k.toLowerCase() === pKey.toLowerCase());
                if (innerKey && obj[innerObj][innerKey]) {
                    let text = extractText(obj[innerObj][innerKey]);
                    if (text) return text;
                }
            }
        }
    }
    return fallback;
}

function renderKural(id) {
    if (id < 1 || id > maxKural) return;
    
    const basic = findById(kuralData, id);
    const detail = findById(detailData, id);
    const grammar = findById(grammarData, id);
    const words = findById(wordsData, id);
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

    // 2. குறள் & Transliteration
    const line1 = getVal(basic, ['line1', 'Line1'], 'தரவு கிடைக்கவில்லை');
    const line2 = getVal(basic, ['line2', 'Line2'], '');
    const translation = getVal(basic, ['translation', 'eng', 'english'], 'Not available');
    const couplet = getVal(basic, ['couplet', 'eng_couplet']) !== '-' ? getVal(basic, ['couplet', 'eng_couplet']) : translation;
    
    let transliteration = getVal(basic, ['transliteration', 'translit', 'tam_transliteration'], '-');
    if (transliteration === '-') {
        // Transliteration இரண்டு வரியாகப் பிரிந்திருந்தால்
        let t1 = getVal(basic, ['transliteration1', 'translit1'], '');
        let t2 = getVal(basic, ['transliteration2', 'translit2'], '');
        if (t1 || t2) transliteration = `${t1} <br> ${t2}`;
        else transliteration = 'தரவு கிடைக்கவில்லை';
    }

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

    // 3. உரைகள்
    const mv = getVal(basic, ['mv', 'mu_va', 'varadharajanar'], 'உரை கிடைக்கவில்லை');
    const sp = getVal(basic, ['sp', 'pappaiya', 'salamon'], 'உரை கிடைக்கவில்லை');
    const mk = getVal(basic, ['mk', 'manakkudavar'], 'உரை கிடைக்கவில்லை');
    const general = getVal(basic, ['tam_exp', 'tamil_exp', 'vilakkam', 'porul', 'urai', 'explanation_tamil']) !== '-' ? getVal(basic, ['tam_exp', 'tamil_exp', 'vilakkam', 'porul', 'urai']) : getVal(grammar, ['general_explanation', 'vilakkam'], 'விளக்கம் கிடைக்கவில்லை');
    const engExp = getVal(basic, ['eng_exp', 'eng_explanation', 'explanation', 'english_explanation'], 'Not available');

    document.getElementById('explanationCarousel').innerHTML = `
        <div class="carousel-item"><h3>மு. வரதராசனார் உரை</h3><p>${mv}</p></div>
        <div class="carousel-item"><h3>சாலமன் பாப்பையா உரை</h3><p>${sp}</p></div>
        <div class="carousel-item"><h3>மணக்குடவர் உரை</h3><p>${mk}</p></div>
        <div class="carousel-item"><h3>பொதுவான விளக்கம்</h3><p>${general}</p></div>
        <div class="carousel-item"><h3>English Explanation</h3><p>${engExp}</p></div>
    `;

    // 4. வார்த்தைக்கான அர்த்தங்கள்
    let wordsHTML = '';
    let wArray = words.words || words.Words || words.meaning || (Array.isArray(words) ? words : Object.values(words));
    
    if (Array.isArray(wArray) && wArray.length > 0) {
        wArray.forEach(w => {
            if (typeof w === 'object') {
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
            }
        });
    }
    if (wordsHTML === '') wordsHTML = `<div class="carousel-item"><p>வார்த்தை விவரங்கள் கிடைக்கவில்லை</p></div>`;
    document.getElementById('wordMeaningCarousel').innerHTML = wordsHTML;

    // 5. இலக்கணம்
    const ezhuthu = getVal(grammar, ['ezhuthu', 'eluthu'], '-');
    const sol = getVal(grammar, ['sol', 'chol'], '-');
    const vaetrumai = getVal(grammar, ['vaetrumai', 'vetrumai'], '-');
    const yaappu = getVal(grammar, ['yaappu', 'yappu'], '-');
    const ani = getVal(grammar, ['ani'], '-');
    const punarchi = getVal(grammar, ['punarchi'], '-');

    let isGrammarEmpty = (ezhuthu === '-' && sol === '-' && vaetrumai === '-' && yaappu === '-' && ani === '-' && punarchi === '-');
    
    if(isGrammarEmpty) {
        document.getElementById('grammarCarousel').innerHTML = `<div class="carousel-item"><p>இலக்கண விவரங்கள் கிடைக்கவில்லை</p></div>`;
    } else {
        document.getElementById('grammarCarousel').innerHTML = `
            <div class="carousel-item"><h3>எழுத்து</h3><p>${ezhuthu}</p></div>
            <div class="carousel-item"><h3>சொல்</h3><p>${sol}</p></div>
            <div class="carousel-item"><h3>வேற்றுமை</h3><p>${vaetrumai}</p></div>
            <div class="carousel-item"><h3>யாப்பு</h3><p>${yaappu}</p></div>
            <div class="carousel-item"><h3>அணி</h3><p>${ani}</p></div>
            <div class="carousel-item"><h3>புணர்ச்சி</h3><p>${punarchi}</p></div>
        `;
    }

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

window.onload = loadAllData;
