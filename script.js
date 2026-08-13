let currentKuralId = 1;
const maxKural = 1330;

// JSON தரவுகளைச் சேமிக்க
let detailData = [], grammarData = [], thirukkuralData = [], wordMeaningsData = [], storyData = {};

// அனைத்தையும் ஏற்றும் முதன்மைச் செயல்பாடு
async function loadData() {
    try {
        // உன்னுடைய GitHub-இல் உள்ள கோப்புகளின் பாதையை (paths) சரியாக உறுதி செய்யவும்
        const [resDetail, resGrammar, resThirukkural, resWords, resStory] = await Promise.all([
            fetch('detail.json').catch(() => []),
            fetch('thirukkural_full_grammar.json').catch(() => []),
            fetch('thirukkural.json').catch(() => []),
            fetch('thirukkural_word_meanings.json').catch(() => []),
            fetch('thirukkural_data.json').catch(() => ({}))
        ]);

        detailData = await (resDetail.ok ? resDetail.json() : []);
        grammarData = await (resGrammar.ok ? resGrammar.json() : []);
        thirukkuralData = await (resThirukkural.ok ? resThirukkural.json() : []);
        wordMeaningsData = await (resWords.ok ? resWords.json() : []);
        
        const storyRawData = await (resStory.ok ? resStory.json() : {});
        // array-ஆக இருந்தால் அதை object-ஆக மாற்றிக் கொள்ள
        storyData = Array.isArray(storyRawData) ? storyRawData[0] : storyRawData;

        renderKural(currentKuralId);
    } catch (error) {
        console.error("தரவுகளை ஏற்றுவதில் பிழை ஏற்பட்டது செல்லம்: ", error);
        alert("JSON கோப்புகளை ஏற்றுவதில் பிழை. கோப்புகளின் பெயர்கள் சரியாக உள்ளதா எனப் பார்க்கவும்.");
    }
}

function renderKural(id) {
    if (id < 1 || id > maxKural) return;
    
    // தரவுகளை குறள் எண்ணை வைத்துத் தேடுதல்
    // (உன் JSON அமைப்பிற்கு ஏற்ப இதைச் சிறிய மாற்றம் செய்ய வேண்டியிருக்கலாம்)
    const kuralGrammar = grammarData.find(k => k.number === id) || grammarData[id-1] || {};
    const kuralBasic = thirukkuralData.find(k => k.number === id) || thirukkuralData[id-1] || {};
    const kuralWords = wordMeaningsData.find(w => w.kural_number === id) || wordMeaningsData[id-1] || [];
    const kuralStory = storyData[id] || {};

    // 1. அமைப்பு விவரங்கள் (detail.json)
    // பால், இயல், அதிகாரம் கணக்கீடு (எளிய எடுத்துக்காட்டு)
    const hierarchyHTML = `
        <div class="detail-box"><span>பால்</span><strong>${kuralBasic.paal || 'அறத்துப்பால்'}</strong></div>
        <div class="detail-box"><span>இயல்</span><strong>${kuralBasic.iyal || 'பாயிரவியல்'}</strong></div>
        <div class="detail-box"><span>அதிகாரம்</span><strong>${kuralBasic.athigaram || 'கடவுள் வாழ்த்து'}</strong></div>
        <div class="detail-box"><span>குறள் எண்</span><strong>${id}</strong></div>
    `;
    document.getElementById('hierarchyDetails').innerHTML = hierarchyHTML;

    // 2. குறள் & மொழிபெயர்ப்பு (Carousel)
    const kuralHTML = `
        <div class="carousel-item">
            <h3>தமிழ்</h3>
            <p><strong>குறள்:</strong><br> ${kuralBasic.line1 || ''} <br> ${kuralBasic.line2 || ''}</p>
        </div>
        <div class="carousel-item">
            <h3>English</h3>
            <p><strong>Couplet:</strong> ${kuralBasic.couplet || ''}</p>
            <p><strong>Translation:</strong> ${kuralBasic.translation || ''}</p>
        </div>
        <div class="carousel-item">
            <h3>Transliteration</h3>
            <p>${kuralBasic.transliteration || ''}</p>
        </div>
    `;
    document.getElementById('kuralCarousel').innerHTML = kuralHTML;

    // 3. உரைகள் (Carousel)
    const explanationHTML = `
        <div class="carousel-item"><h3>மு. வரதராசனார் உரை</h3><p>${kuralBasic.mv || ''}</p></div>
        <div class="carousel-item"><h3>சாலமன் பாப்பையா உரை</h3><p>${kuralBasic.sp || ''}</p></div>
        <div class="carousel-item"><h3>மணக்குடவர் உரை</h3><p>${kuralBasic.mk || ''}</p></div>
        <div class="carousel-item"><h3>பொதுவான விளக்கம்</h3><p>${kuralGrammar.general_explanation || kuralBasic.explanation || ''}</p></div>
        <div class="carousel-item"><h3>English Explanation</h3><p>${kuralBasic.eng_exp || ''}</p></div>
    `;
    document.getElementById('explanationCarousel').innerHTML = explanationHTML;

    // 4. வார்த்தைக்கான அர்த்தங்கள் (Carousel)
    let wordsHTML = '';
    if(Array.isArray(kuralWords.words)) {
        kuralWords.words.forEach(word => {
            wordsHTML += `
            <div class="carousel-item">
                <h3>${word.tamil_word || ''}</h3>
                <p><strong>பொருள்:</strong> ${word.tamil_meaning || ''}</p>
                <p><strong>Meaning:</strong> ${word.english_meaning || ''}</p>
            </div>`;
        });
    } else {
        wordsHTML = `<div class="carousel-item"><p>வார்த்தை விவரங்கள் கிடைக்கவில்லை</p></div>`;
    }
    document.getElementById('wordMeaningCarousel').innerHTML = wordsHTML;

    // 5. இலக்கணம் (Carousel)
    const grammarHTML = `
        <div class="carousel-item"><h3>எழுத்து</h3><p>${kuralGrammar.ezhuthu || '-'}</p></div>
        <div class="carousel-item"><h3>சொல்</h3><p>${kuralGrammar.sol || '-'}</p></div>
        <div class="carousel-item"><h3>வேற்றுமை</h3><p>${kuralGrammar.vaetrumai || '-'}</p></div>
        <div class="carousel-item"><h3>யாப்பு</h3><p>${kuralGrammar.yaappu || '-'}</p></div>
        <div class="carousel-item"><h3>அணி</h3><p>${kuralGrammar.ani || '-'}</p></div>
        <div class="carousel-item"><h3>புணர்ச்சி</h3><p>${kuralGrammar.punarchi || '-'}</p></div>
    `;
    document.getElementById('grammarCarousel').innerHTML = grammarHTML;

    // 6. கதைகள் (Carousel)
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
