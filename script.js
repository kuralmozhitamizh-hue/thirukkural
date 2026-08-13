let currentKuralId = 1;
const maxKural = 1330;

let detailData = [], grammarData = [], thirukkuralData = [], wordMeaningsData = [], storyData = {};

// கோப்புகளைப் படிக்கும் செயல்பாடு
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
        return null;
    }
}

// JSON-க்குள் தரவுகள் எப்படி மறைந்திருந்தாலும் (Object or Array) கண்டுபிடிக்கும் மாயாஜாலம்
function extractArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    for (let key in data) {
        if (Array.isArray(data[key])) return data[key];
    }
    return [];
}

async function loadData() {
    const [d_grammar, d_kural, d_words, d_story] = await Promise.all([
        fetchJSON('thirukkural_full_grammar.json'),
        fetchJSON('thirukkural.json'),
        fetchJSON('thirukkural_word_meanings.json'),
        fetchJSON('thirukkural_data.json')
    ]);

    // தரவுகளைச் சரியாகப் பிரித்தெடுத்தல்
    grammarData = extractArray(d_grammar);
    thirukkuralData = extractArray(d_kural);
    wordMeaningsData = extractArray(d_words);
    
    // கதை மட்டும் உனக்குச் சரியாக வேலை செய்வதால், அதை அப்படியே வைத்துள்ளேன்
    storyData = d_story ? (Array.isArray(d_story) ? d_story[0] : d_story) : {};

    renderKural(currentKuralId);
}

// குறள் எண் எந்தப் பெயரில் இருந்தாலும் (number, Number, id) தேடி எடுக்கும் செயல்பாடு
function findKuralData(arr, id) {
    if (!arr || arr.length === 0) return {};
    return arr.find(item => 
        parseInt(item.number) === id || 
        parseInt(item.Number) === id || 
        parseInt(item.kural_number) === id || 
        parseInt(item.id) === id
    ) || arr[id - 1] || {};
}

function renderKural(id) {
    if (id < 1 || id > maxKural) return;
    
    const kuralBasic = findKuralData(thirukkuralData, id);
    const kuralGrammar = findKuralData(grammarData, id);
    const kuralWords = findKuralData(wordMeaningsData, id);
    const kuralStory = storyData[id] || {};

    // 1. அமைப்பு விவரங்கள் (பெரிய/சிறிய எழுத்துகளைச் சமாளிக்க)
    const paal = kuralBasic.paal || kuralBasic.Paal || kuralBasic.sect_tam || 'தரவு இல்லை';
    const iyal = kuralBasic.iyal || kuralBasic.Iyal || kuralBasic.chapgrp_tam || '-';
    const athigaram = kuralBasic.athigaram || kuralBasic.Athigaram || kuralBasic.chap_tam || '-';
    
    const hierarchyHTML = `
        <div class="detail-box"><span>பால்</span><strong>${paal}</strong></div>
        <div class="detail-box"><span>இயல்</span><strong>${iyal}</strong></div>
        <div class="detail-box"><span>அதிகாரம்</span><strong>${athigaram}</strong></div>
        <div class="detail-box"><span>குறள் எண்</span><strong>${id}</strong></div>
    `;
    document.getElementById('hierarchyDetails').innerHTML = hierarchyHTML;

    // 2. குறள் & மொழிபெயர்ப்பு
    const line1 = kuralBasic.line1 || kuralBasic.Line1 || 'தரவு கிடைக்கவில்லை';
    const line2 = kuralBasic.line2 || kuralBasic.Line2 || '';
    const couplet = kuralBasic.couplet || kuralBasic.eng || 'Not available';
    const translation = kuralBasic.translation || kuralBasic.Translation || 'Not available';
    const transliteration = kuralBasic.transliteration || kuralBasic.Transliteration || 'Not available';

    const kuralHTML = `
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
    document.getElementById('kuralCarousel').innerHTML = kuralHTML;

    // 3. உரைகள்
    const mv = kuralBasic.mv || kuralBasic.tam_exp || 'உரை கிடைக்கவில்லை';
    const sp = kuralBasic.sp || 'உரை கிடைக்கவில்லை';
    const mk = kuralBasic.mk || 'உரை கிடைக்கவில்லை';
    const general = kuralGrammar.general_explanation || kuralGrammar.General_explanation || kuralBasic.explanation || 'விளக்கம் கிடைக்கவில்லை';
    const engExp = kuralBasic.eng_exp || kuralBasic.eng_explanation || 'Not available';

    const explanationHTML = `
        <div class="carousel-item"><h3>மு. வரதராசனார் உரை</h3><p>${mv}</p></div>
        <div class="carousel-item"><h3>சாலமன் பாப்பையா உரை</h3><p>${sp}</p></div>
        <div class="carousel-item"><h3>மணக்குடவர் உரை</h3><p>${mk}</p></div>
        <div class="carousel-item"><h3>பொதுவான விளக்கம்</h3><p>${general}</p></div>
        <div class="carousel-item"><h3>English Explanation</h3><p>${engExp}</p></div>
    `;
    document.getElementById('explanationCarousel').innerHTML = explanationHTML;

    // 4. வார்த்தைக்கான அர்த்தங்கள்
    let wordsHTML = '';
    let wordsArray = kuralWords.words || kuralWords.Words;
    if(Array.isArray(wordsArray)) {
        wordsArray.forEach(word => {
            const tw = word.tamil_word || word.TamilWord || word.tamil || '-';
            const tm = word.tamil_meaning || word.TamilMeaning || word.meaning || '-';
            const em = word.english_meaning || word.EnglishMeaning || word.english || '-';
            wordsHTML += `
            <div class="carousel-item">
                <h3>${tw}</h3>
                <p><strong>பொருள்:</strong> ${tm}</p>
                <p><strong>Meaning:</strong> ${em}</p>
            </div>`;
        });
    } else {
        wordsHTML = `<div class="carousel-item"><p>வார்த்தை விவரங்கள் கிடைக்கவில்லை</p></div>`;
    }
    document.getElementById('wordMeaningCarousel').innerHTML = wordsHTML;

    // 5. இலக்கணம்
    const grammarHTML = `
        <div class="carousel-item"><h3>எழுத்து</h3><p>${kuralGrammar.ezhuthu || kuralGrammar.Ezhuthu || '-'}</p></div>
        <div class="carousel-item"><h3>சொல்</h3><p>${kuralGrammar.sol || kuralGrammar.Sol || '-'}</p></div>
        <div class="carousel-item"><h3>வேற்றுமை</h3><p>${kuralGrammar.vaetrumai || kuralGrammar.Vaetrumai || '-'}</p></div>
        <div class="carousel-item"><h3>யாப்பு</h3><p>${kuralGrammar.yaappu || kuralGrammar.Yaappu || '-'}</p></div>
        <div class="carousel-item"><h3>அணி</h3><p>${kuralGrammar.ani || kuralGrammar.Ani || '-'}</p></div>
        <div class="carousel-item"><h3>புணர்ச்சி</h3><p>${kuralGrammar.punarchi || kuralGrammar.Punarchi || '-'}</p></div>
    `;
    document.getElementById('grammarCarousel').innerHTML = grammarHTML;

    // 6. கதைகள்
    const storyHTML = `
        <div class="carousel-item">
            <h3>தமிழ் கதை</h3>
            <p>${kuralStory.story_tamil || kuralStory.Story_tamil || 'இந்தக் குறளுக்கான கதை கிடைக்கவில்லை.'}</p>
        </div>
        <div class="carousel-item">
            <h3>English Story</h3>
            <p>${kuralStory.story_english || kuralStory.Story_english || 'Story not available for this kural.'}</p>
        </div>
    `;
    document.getElementById('storyCarousel').innerHTML = storyHTML;

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
