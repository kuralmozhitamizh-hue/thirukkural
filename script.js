let currentKuralId = 1;
const maxKural = 1330;

let kuralData = [];
let detailData = [];
let grammarData = [];
let wordsData = [];
let storyData = {};

// 1. அனைத்து JSON கோப்புகளையும் ஒரே நேரத்தில் வாசித்தல்
async function loadAllData() {
    try {
        const [kuralRes, detailRes, grammarRes, wordsRes, storyRes] = await Promise.all([
            fetch('thirukkural.json').then(res => res.ok ? res.json() : null).catch(() => null),
            fetch('detail.json').then(res => res.ok ? res.json() : null).catch(() => null),
            fetch('thirukkural_full_grammar.json').then(res => res.ok ? res.json() : null).catch(() => null),
            fetch('thirukkural_word_meanings.json').then(res => res.ok ? res.json() : null).catch(() => null),
            fetch('thirukkural_data.json').then(res => res.ok ? res.json() : null).catch(() => null)
        ]);

        kuralData = kuralRes && kuralRes.kural ? kuralRes.kural : (Array.isArray(kuralRes) ? kuralRes : []);
        detailData = Array.isArray(detailRes) ? detailRes : (detailRes ? [detailRes] : []);
        grammarData = Array.isArray(grammarRes) ? grammarRes : [];
        wordsData = Array.isArray(wordsRes) ? wordsRes : [];
        
        if (storyRes) {
            storyData = Array.isArray(storyRes) ? (storyRes[0] || {}) : storyRes;
        }

        renderKural(currentKuralId);
    } catch (error) {
        console.error("Data loading error:", error);
    }
}

// 2. thirukkural.json தரவைத் தேடும் செயல்பாடு
function findKuralBasic(id) {
    if (!kuralData.length) return {};
    return kuralData.find(item => Number(item.Number || item.number || item.kural_no) === id) || {};
}

// 3. thirukkural_word_meanings.json தரவைத் தேடும் செயல்பாடு
function findWords(id) {
    if (!wordsData.length) return {};
    return wordsData.find(item => Number(item.kural_number || item.number) === id) || {};
}

// 4. thirukkural_full_grammar.json தரவைத் தேடும் செயல்பாடு
function findGrammar(id) {
    if (!grammarData.length) return {};
    return grammarData.find(item => Number(item.kural_number || item.number) === id) || {};
}

// 5. detail.json கோப்பிலிருந்து பால், இயல், அதிகாரம் கண்டறியும் சிறப்பு செயல்பாடு
function findHierarchy(id) {
    let result = { paal: "-", iyal: "-", athigaram: "-" };
    if (!detailData.length) return result;

    // detail.json பொதுவாக முதல் திருக்குறள் தொகுப்பாக இருக்கும்
    let root = detailData[0];
    let sections = root.section || root.sections || [];
    if (!Array.isArray(sections)) return result;

    for (let sec of sections) {
        let paalName = sec.name || sec.tamil || "-";
        let chapterGroups = sec.detail || sec.chapterGroups || [];
        if (!Array.isArray(chapterGroups)) continue;

        for (let cg of chapterGroups) {
            let iyalName = cg.name || cg.tamil || "-";
            let chapters = cg.chapters || cg.detail || [];
            if (!Array.isArray(chapters)) continue;

            for (let ch of chapters) {
                let start = Number(ch.start || 0);
                let end = Number(ch.end || 0);
                
                // குறள் எண் இந்த அதிகார எல்லைக்குள் இருக்கிறதா எனப் பார்த்தல்
                if (id >= start && id <= end) {
                    return {
                        paal: paalName,
                        iyal: iyalName,
                        athigaram: ch.name || "-"
                    };
                }
            }
        }
    }
    return result;
}

// 6. திரையில் குறள் மற்றும் அனைத்து விவரங்களையும் காட்டுதல்
function renderKural(id) {
    if (id < 1 || id > maxKural) return;

    const basic = findKuralBasic(id);
    const wordsObj = findWords(id);
    const grammar = findGrammar(id);
    const hierarchy = findHierarchy(id);
    const story = storyData[id] || {};

    // அமைப்பு விவரங்கள் (Hierarchy)
    document.getElementById('hierarchyDetails').innerHTML = `
        <div class="detail-box"><span>பால்</span><strong>${hierarchy.paal}</strong></div>
        <div class="detail-box"><span>இயல்</span><strong>${hierarchy.iyal}</strong></div>
        <div class="detail-box"><span>அதிகாரம்</span><strong>${hierarchy.athigaram}</strong></div>
        <div class="detail-box"><span>குறள் எண்</span><strong>${id}</strong></div>
    `;

    // குறள் & Transliteration
    const line1 = basic.Line1 || basic.line1 || 'தரவு கிடைக்கவில்லை';
    const line2 = basic.Line2 || basic.line2 || '';
    const translation = basic.Translation || basic.translation || 'Not available';
    const couplet = basic.couplet || translation;
    
    let t1 = basic.transliteration1 || '';
    let t2 = basic.transliteration2 || '';
    let transliteration = (t1 || t2) ? `${t1} <br> ${t2}` : (basic.transliteration || 'தரவு கிடைக்கவில்லை');

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

    // உரைகள் (Explanations)
    const mv = basic.mv || 'உரை கிடைக்கவில்லை';
    const sp = basic.sp || 'உரை கிடைக்கவில்லை';
    const mk = basic.mk || 'உரை கிடைக்கவில்லை';
    const general = basic.explanation || grammar.porul || 'விளக்கம் கிடைக்கவில்லை';

    document.getElementById('explanationCarousel').innerHTML = `
        <div class="carousel-item"><h3>மு. வரதராசனார் உரை</h3><p>${mv}</p></div>
        <div class="carousel-item"><h3>சாலமன் பாப்பையா உரை</h3><p>${sp}</p></div>
        <div class="carousel-item"><h3>மணக்குடவர் உரை</h3><p>${mk}</p></div>
        <div class="carousel-item"><h3>பொதுவான விளக்கம்</h3><p>${general}</p></div>
    `;

    // வார்த்தைக்கான அர்த்தங்கள் (Word Meanings)
    let wordsHTML = '';
    let tamilWords = wordsObj.words_tamil || [];
    let englishWords = wordsObj.words_english || [];

    if (Array.isArray(tamilWords) && tamilWords.length > 0) {
        tamilWords.forEach((tw, index) => {
            let tWord = tw.word || '-';
            let tMeaning = tw.meaning || '-';
            let eMeaning = (englishWords[index] && englishWords[index].meaning) ? englishWords[index].meaning : '-';

            wordsHTML += `
                <div class="carousel-item">
                    <h3>${tWord}</h3>
                    <p><strong>பொருள்:</strong> ${tMeaning}</p>
                    <p><strong>Meaning:</strong> ${eMeaning}</p>
                </div>
            `;
        });
    }
    if (wordsHTML === '') {
        wordsHTML = `<div class="carousel-item"><p>வார்த்தை விவரங்கள் கிடைக்கவில்லை</p></div>`;
    }
    document.getElementById('wordMeaningCarousel').innerHTML = wordsHTML;

    // இலக்கணம் (Grammar)
    const ezhuthu = grammar.ezhuthu_ilakkanam || '-';
    const sol = grammar.sol_ilakkanam || '-';
    const vaetrumai = grammar.vaetrumai_ilakkanam || '-';
    const yaappuObj = grammar.yaappu_ilakkanam;
    
    let yaappuText = '-';
    if (yaappuObj) {
        if (typeof yaappuObj === 'string') {
            yaappuText = yaappuObj;
        } else if (typeof yaappuObj === 'object') {
            let paaVagai = yaappuObj.paa_vagai || '';
            let adiSeer = yaappuObj.adi_matrum_seer_amaippu || '';
            yaappuText = `${paaVagai} <br> ${adiSeer}`;
        }
    }

    const ani = grammar.ani_ilakkanam || '-';
    const punarchi = grammar.punarchi_matrum_piravai || '-';

    let isGrammarEmpty = (ezhuthu === '-' && sol === '-' && vaetrumai === '-' && yaappuText === '-' && ani === '-' && punarchi === '-');

    if (isGrammarEmpty) {
        document.getElementById('grammarCarousel').innerHTML = `<div class="carousel-item"><p>இலக்கண விவரங்கள் கிடைக்கவில்லை</p></div>`;
    } else {
        document.getElementById('grammarCarousel').innerHTML = `
            <div class="carousel-item"><h3>எழுத்து இலக்கணம்</h3><p>${ezhuthu}</p></div>
            <div class="carousel-item"><h3>சொல் இலக்கணம்</h3><p>${sol}</p></div>
            <div class="carousel-item"><h3>வேற்றுமை இலக்கணம்</h3><p>${vaetrumai}</p></div>
            <div class="carousel-item"><h3>யாப்பு இலக்கணம்</h3><p>${yaappuText}</p></div>
            <div class="carousel-item"><h3>அணி இலக்கணம்</h3><p>${ani}</p></div>
            <div class="carousel-item"><h3>புணர்ச்சி மற்றும் பிறவடி</h3><p>${punarchi}</p></div>
        `;
    }

    // கதைகள் (Stories)
    const storyTam = story.story_tamil || story.tamil || 'இந்தக் குறளுக்கான கதை கிடைக்கவில்லை.';
    const storyEng = story.story_english || story.english || 'Story not available for this kural.';
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

    // பொத்தான்கள் மற்றும் குறள் எண் புதுப்பித்தல்
    document.getElementById('currentKuralDisplay').innerText = `${id} / ${maxKural}`;
    document.getElementById('prevBtn').disabled = id === 1;
    document.getElementById('nextBtn').disabled = id === maxKural;
    
    document.querySelectorAll('.carousel').forEach(c => c.scrollLeft = 0);
}

// முன்னும் பின்னும் நகர்த்துதல்
function navigateKural(step) {
    const newId = currentKuralId + step;
    if (newId >= 1 && newId <= maxKural) {
        currentKuralId = newId;
        renderKural(currentKuralId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// தேடுதல் செயல்பாடு
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
