(function openInChromeIfWebView() {
    try {
        const ua = navigator.userAgent || '';
        if (!/Android/i.test(ua) || !/^https?:$/.test(location.protocol)) return;
        const inWebView = /; wv\)/.test(ua) || (/Version\/[\d.]+/.test(ua) && !/SamsungBrowser/.test(ua)) || !('speechSynthesis' in window);
        if (!inWebView) return;

        const chromeUrl = 'intent://' + location.host + location.pathname + location.search + location.hash +
            '#Intent;scheme=' + location.protocol.replace(':', '') + ';package=com.android.chrome;end';

        let tried = false;
        try { tried = sessionStorage.getItem('triedChrome') === '1'; sessionStorage.setItem('triedChrome', '1'); } catch (e) {}
        if (!tried) { location.href = chromeUrl; }

        document.addEventListener('DOMContentLoaded', () => {
            const b = document.createElement('button');
            b.type = 'button';
            b.innerText = '🌐 Voice-ku Chrome-la open pannunga';
            b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:76px;z-index:99999;padding:14px;border:none;border-radius:12px;background:#1a73e8;color:#fff;font-size:15px;font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,.3);';
            b.onclick = () => { location.href = chromeUrl; };
            document.body.appendChild(b);
        });
    } catch (e) {}
})();

if (typeof pdfjsLib !== 'undefined') { pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }

let currentExtractedText = "";
let currentUser = null;
let activeAccounts = [];
let reportHistory = [];
let currentReportId = null;
let speechUnlocked = false;
let translationFailed = false;

const languages = [
    { code: 'en', name: 'English', native: 'English', voiceCode: 'en-US' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', voiceCode: 'ta-IN' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', voiceCode: 'te-IN' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', voiceCode: 'hi-IN' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', voiceCode: 'ml-IN' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', voiceCode: 'kn-IN' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', voiceCode: 'mr-IN' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', voiceCode: 'bn-IN' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', voiceCode: 'gu-IN' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', voiceCode: 'pa-IN' },
    { code: 'ja', name: 'Japanese', native: '日本語', voiceCode: 'ja-JP' },
    { code: 'zh', name: 'Chinese', native: '中文', voiceCode: 'zh-CN' },
    { code: 'ko', name: 'Korean', native: '한국어', voiceCode: 'ko-KR' },
    { code: 'th', name: 'Thai', native: 'ไทย', voiceCode: 'th-TH' }
];

const i18n = {
    en: { welcomeSub: "Understand your health in your language.", welcomeMain: "Medical Reports Made Simple", welcomeDesc: "Upload report, understand complex medical terms easily.", btnStart: "Get Started", btnContinue: "Continue", langTitle: "Choose your language", langDesc: "We will use this language throughout the app.", homeSub: "Good health, better understanding", homeHello: "Hello, ", heroTitle: "Medical Reports Made Simple", heroDesc: "Clear explanations from complex medical documents.", btnUpload: "Upload Report", resultHeader: "Detailed Patient Friendly Explanation", extractedHeader: "Extracted Text", riskTitle: "Health Risk Status", graphTitle: "🩺 Saved Reports", navHome: "🏠 Home", navUpload: "📤 Upload", navLang: "🌐 Language" },
    ta: { welcomeSub: "உங்கள் ஆரோக்கியத்தை உங்கள் மொழியில் புரிந்து கொள்ளுங்கள்.", welcomeMain: "மருத்துவ Reports எளிமையாக புரிந்துகொள்ளலாம்", welcomeDesc: "அறிக்கையைப் பதிவேற்றி, கடினமான மருத்துவ சொற்களை எளிதில் புரிந்து கொள்ளுங்கள்.", btnStart: "தொடங்குங்கள்", btnContinue: "தொடரவும்", langTitle: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்", langDesc: "செயலி முழுவதும் இந்த மொழி பயன்படுத்தப்படும்.", homeSub: "நல்ல ஆரோக்கியம், சிறந்த புரிதல்", homeHello: "வணக்கம், ", heroTitle: "மருத்துவ அறிக்கை விளக்கம்", heroDesc: "சிக்கலான மருத்துவ அறிக்கைகளின் விரிவான எளிய விளக்கம்.", btnUpload: "அறிக்கையைப் பதிவேற்றுக", resultHeader: "விரிவான நோயாளிக்கான விளக்கம்", extractedHeader: "அறிக்கையிலிருந்து பெறப்பட்ட உரை", riskTitle: "சுகாதார ஆபத்து மதிப்பீடு", graphTitle: "🩺 சேமிக்கப்பட்ட அறிக்கைகள்", navHome: "🏠 முகப்பு", navUpload: "📤 பதிவேற்று", navLang: "🌐 மொழி" },
    te: { welcomeSub: "మీ భాషలో మీ ఆరోగ్యాన్ని అర్థం చేసుకోండి.", welcomeMain: "వైద్య నివేదికలు సులభంగా అర్థమవుతాయి", welcomeDesc: "నివేదికను అప్‌లోడ్ చేయండి, క్లిష్టమైన వైద్య పదాలను సులభంగా అర్థం చేసుకోండి.", btnStart: "ప్రారంభించండి", btnContinue: "కొనసాగించండి", langTitle: "మీ భాషను ఎంచుకోండి", langDesc: "యాప్‌లో ఈ భాష ఉపయోగించబడుతుంది.", homeSub: "మంచి ఆరోగ్యం, మెరుగైన అవగాహన", homeHello: "నమస్కారం, ", heroTitle: "వైద్య నివేదిక విశ్లేషణ", heroDesc: "క్లిష్టమైన నివేదికల సరళమైన వివరణ.", btnUpload: "రిపోర్ట్ అప్‌‌లోడ్ చేయండి", resultHeader: "వివరణాత్మక వివరణ", extractedHeader: "సేకరించిన పాఠం", riskTitle: "ఆరోగ్య ప్రమాద స్థితి", graphTitle: "🩺 సేవ్ చేసిన నివేదికలు", navHome: "🏠 హోమ్", navUpload: "📤 అప్‌లోడ్", navLang: "🌐 భాష" },
    hi: { welcomeSub: "अपनी भाषा में अपने स्वास्थ्य को समझें।", welcomeMain: "मेडिकल रिपोर्ट को आसानी से समझें", welcomeDesc: "रिपोर्ट अपलोड करें और जटिल शब्दों को आसानी से समझें।", btnStart: "शुरू करें", btnContinue: "आगे बढ़ें", langTitle: "अपनी भाषा चुनें", langDesc: "ऐप में इस भाषा का उपयोग किया जाएगा।", homeSub: "अच्छा स्वास्थ्य, बेहतर समझ", homeHello: "नमस्ते, ", heroTitle: "मेडिकल रिपोर्ट का सरल विवरण", heroDesc: "कठिन रिपोर्ट की आसान समझ।", btnUpload: "रिपोर्ट अपलोड करें", resultHeader: "विस्तृत विवरण", extractedHeader: "निकाला गया टेक्स्ट", riskTitle: "स्वास्थ्य जोखिम मूल्यांकन", graphTitle: "🩺 सेव की गई रिपोर्ट", navHome: "🏠 होम", navUpload: "📤 अपलोड", navLang: "🌐 भाषा" },
    ml: { welcomeSub: "നിങ്ങളുടെ ഭാഷയിൽ ആരോഗ്യം മനസ്സിലാക്കുക.", welcomeMain: "മെഡിക്കൽ റിപ്പോർട്ടുകൾ ലളിതമായി വായിക്കാം", welcomeDesc: "റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്ത് വിവരങ്ങൾ എളുപ്പത്തിൽ മനസ്സിലാക്കുക.", btnStart: "തുടങ്ങുക", btnContinue: "തുടരുക", langTitle: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക", langDesc: "ആപ്പിൽ ഈ ഭാഷ ഉപയോഗിക്കും.", homeSub: "നല്ല ആരോഗ്യം, മികച്ച അറിവ്", homeHello: "നമസ്കാരം, ", heroTitle: "മെഡിക്കൽ റിപ്പോർട്ട് വിശദീകരണം", heroDesc: "സങ്കീർണ്ണമായ റിപ്പോർട്ടുകളുടെ ലളിതമായ വിവരണം.", btnUpload: "റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്യുക", resultHeader: "വിശദമായ വിവരണം", extractedHeader: "വേർതിരിച്ചെടുത്ത അക്ഷരങ്ങൾ", riskTitle: "ആരോഗ്യ അപകടസാധ്യത", graphTitle: "🩺 സേവ് ചെയ്ത റിപ്പോർട്ടുകൾ", navHome: "🏠 ഹോം", navUpload: "📤 അപ്‌ലോഡ്", navLang: "🌐 ഭാഷ" },
    kn: { welcomeSub: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ನಿಮ್ಮ ಆರೋಗ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.", welcomeMain: "ವೈದ್ಯಕೀಯ ವರದಿಗಳು ಸರಳವಾಗಿ ಅರ್ಥವಾಗಲಿವೆ", welcomeDesc: "ವರದಿಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಸುಲಭವಾಗಿ ವಿವರಣೆ ಪಡೆಯಿರಿ.", btnStart: "ಪ್ರಾರಂಭಿಸಿ", btnContinue: "ಮುಂದುವರಿಸಿ", langTitle: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ", langDesc: "ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ಈ ಭಾಷೆಯನ್ನು ಬಳಸಲಾಗುತ್ತದೆ.", homeSub: "ಉತ್ತಮ ಆರೋಗ್ಯ, ಉತ್ತಮ ತಿಳುವಳಿಕೆ", homeHello: "ನಮಸ್ಕಾರ, ", heroTitle: "ವೈದ್ಯಕೀಯ ವರದಿ ವಿವರಣೆ", heroDesc: "ಸಂಕೀರ್ಣ ವರದಿಗಳ ಸರಳ ವಿವರಣೆ.", btnUpload: "ವರದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", resultHeader: "ವಿವರವಾದ ವಿವರಣೆ", extractedHeader: "ಪಡೆಯಲಾದ ಪಠ್ಯ", riskTitle: "ಆರೋಗ್ಯ ಅಪಾಯದ ಸ್ಥಿತಿ", graphTitle: "🩺 ಉಳಿಸಿದ ವರದಿಗಳು", navHome: "🏠 ಮುಖಪುಟ", navUpload: "📤 ಅಪ್‌ಲೋಡ್", navLang: "🌐 ಭಾಷೆ" },
    mr: { welcomeSub: "तुमच्या भाषेत तुमचे आरोग्य समजून घ्या.", welcomeMain: "वैद्यकीय अहवाल सोप्या भाषेत", welcomeDesc: "रिपोर्ट अपलोड करा आणि वैद्यकीय शब्द सहज समजून घ्या.", btnStart: "सुरू करा", btnContinue: "पुढे जा", langTitle: "तुमची भाषा निवडा", langDesc: "अॅपमध्ये ही भाषा वापरली जाईल.", homeSub: "चांगले आरोग्य, उत्तम समज", homeHello: "नमस्कार, ", heroTitle: "वैद्यकीय अहवाल स्पष्टीकरण", heroDesc: "कठीण अहवालांचे सोपे स्पष्टीकरण.", btnUpload: "अहवाल अपलोड करा", resultHeader: "सविस्तर स्पष्टीकरण", extractedHeader: "काढलेला मजकूर", riskTitle: "आरोग्य धोका स्थिती", graphTitle: "🩺 सेव्ह केलेले अहवाल", navHome: "🏠 होम", navUpload: "📤 अपलोड", navLang: "🌐 भाषा" },
    bn: { welcomeSub: "আপনার নিজের ভাষায় স্বাস্থ্য বুঝুন।", welcomeMain: "মেডিকেল রিপোর্ট এখন সহজ", welcomeDesc: "রিপোর্ট আপলোড করুন এবং জটিল শব্দ সহজে বুঝুন।", btnStart: "শুরু করুন", btnContinue: "এগিয়ে যান", langTitle: "আপনার ভাষা বেছে নিন", langDesc: "অ্যাপটিতে এই ভাষা ব্যবহার করা হবে।", homeSub: "ভালো স্বাস্থ্য, উন্নত বোঝাপড়া", homeHello: "হ্যালো, ", heroTitle: "মেডিকেল রিপোর্ট বিশ্লেষণ", heroDesc: "জটিল রিপোর্টের সহজ বিবরণ।", btnUpload: "রিপোর্ট আপলোড করুন", resultHeader: "বিস্তারিত ব্যাখ্যা", extractedHeader: "সংগৃহীত টেক্সট", riskTitle: "স্বাস্থ্য ঝুঁকির অবস্থা", graphTitle: "🩺 সংরক্ষিত রিপোর্ট", navHome: "🏠 হোম", navUpload: "📤 আপলোড", navLang: "🌐 ভাষা" },
    gu: { welcomeSub: "તમારી ભાષામાં તમારું સ્વાસ્થ્ય સમજો.", welcomeMain: "મેડિકલ રિપોર્ટ સરળ ભાષામાં", welcomeDesc: "રિપોર્ટ અપલોડ કરો અને જટિલ શબ્દો સરળતાથી સમજો.", btnStart: "શરૂ કરો", btnContinue: "આગળ વધો", langTitle: "તમારી ભાષા પસંદ કરો", langDesc: "એપમાં આ ભાષાનો ઉપયોગ થશે.", homeSub: "સારું સ્વાસ્થ્ય, સારી સમજ", homeHello: "નમસ્તે, ", heroTitle: "મેડિકલ રિપોર્ટ સમજૂતી", heroDesc: "અઘરા રિપોર્ટની સરળ સમજૂતી.", btnUpload: "રિપોર્ટ અપલોડ કરો", resultHeader: "વિગતવાર સમજૂતી", extractedHeader: "મેળવેલ ટેક્સ્ટ", riskTitle: "સ્વાસ્થ્ય જોખમ સ્થિતિ", graphTitle: "🩺 સાચવેલ રિપોર્ટ્સ", navHome: "🏠 હોમ", navUpload: "📤 અપલોડ", navLang: "🌐 ભાષા" },
    pa: { welcomeSub: "ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਆਪਣੀ ਸਿਹਤ ਨੂੰ ਸਮਝੋ।", welcomeMain: "ਮੈਡੀਕਲ ਰਿਪੋਰਟਾਂ ਹੁਣ ਆਸਾਨ", welcomeDesc: "ਰਿਪੋਰਟ ਅੱਪਲੋਡ ਕਰੋ ਅਤੇ ਔਖੇ ਸ਼ਬਦ ਆਸਾਨੀ ਨਾਲ ਸਮਝੋ।", btnStart: "ਸ਼ੁਰੂ ਕਰੋ", btnContinue: "ਅੱਗੇ ਵਧੋ", langTitle: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ", langDesc: "ਐਪ ਵਿੱਚ ਇਹ ਭਾਸ਼ਾ ਵਰਤੀ ਜਾਵੇਗੀ।", homeSub: "ਚੰਗੀ ਸਿਹਤ, ਬਿਹਤਰ ਸਮਝ", homeHello: "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ, ", heroTitle: "ਮੈਡੀਕਲ ਰਿਪੋਰਟ ਵਿਆਖਿਆ", heroDesc: "ਔਖੀਆਂ ਰਿਪੋਰਟਾਂ ਦੀ ਆਸਾਨ ਸਮਝ।", btnUpload: "ਰਿਪੋਰਟ ਅੱਪਲੋਡ ਕਰੋ", resultHeader: "ਵਿਸਥਾਰਪੂਰਵਕ ਵਿਆਖਿਆ", extractedHeader: "ਪ੍ਰਾਪਤ ਕੀਤਾ ਟੈਕਸਟ", riskTitle: "ਸਿਹਤ ਜੋਖਮ ਦੀ ਸਥਿਤੀ", graphTitle: "🩺 ਸੰਭਾਲੀਆਂ ਰਿਪੋਰਟਾਂ", navHome: "🏠 ਹੋਮ", navUpload: "📤 ਅੱਪਲੋਡ", navLang: "🌐 ਭਾਸ਼ਾ" },
    ja: { welcomeSub: "あなたの言語で健康状態を理解しましょう。", welcomeMain: "医療レポートを簡単に解釈", welcomeDesc: "レポートをアップロードして難しい用語を簡単に理解します。", btnStart: "始める", btnContinue: "次へ", langTitle: "言語を選択してください", langDesc: "アプリ内でこの言語が使用されます。", homeSub: "より良い健康、より深い理解", homeHello: "こんにちは、", heroTitle: "医療レポートの簡単解説", heroDesc: "複雑な医療ドキュメントをわかりやすく説明します。", btnUpload: "レポートをアップロード", resultHeader: "詳細な解説", extractedHeader: "抽出されたテキスト", riskTitle: "健康リスク状況", graphTitle: "🩺 保存されたレポート", navHome: "🏠 ホーム", navUpload: "📤 アップロード", navLang: "🌐 言語" },
    zh: { welcomeSub: "用您的母语了解您的健康状况。", welcomeMain: "让医疗报告变得简单易懂", welcomeDesc: "上传报告，轻松理解复杂的医学术语。", btnStart: "开始", btnContinue: "继续", langTitle: "选择您的语言", langDesc: "将在整个应用中使用此语言。", homeSub: "良好的健康，更好的理解", homeHello: "你好，", heroTitle: "医疗报告解析", heroDesc: "简单清晰地解释复杂的医疗报告。", btnUpload: "上传报告", resultHeader: "详细解释", extractedHeader: "提取的文本", riskTitle: "健康风险评估", graphTitle: "🩺 已保存的报告", navHome: "🏠 首页", navUpload: "📤 上传", navLang: "🌐 语言" },
    ko: { welcomeSub: "당신의 언어로 건강 상태를 이해하세요.", welcomeMain: "쉬운 의료 리포트 분석", welcomeDesc: "보고서를 업로드하고 어려운 의학 용어를 쉽게 이해하세요.", btnStart: "시작하기", btnContinue: "계속하기", langTitle: "언어를 선택하세요", langDesc: "앱 전반에 이 언어가 사용됩니다.", homeSub: "더 나은 건강, 더 나은 이해", homeHello: "안녕하세요, ", heroTitle: "의료 리포트 설명", heroDesc: "복잡한 보고서를 알기 쉽게 설명해 드립니다.", btnUpload: "리포트 업로드", resultHeader: "상세한 설명", extractedHeader: "추출된 텍스트", riskTitle: "건강 위험 상태", graphTitle: "🩺 저장된 리포트", navHome: "🏠 홈", navUpload: "📤 업로드", navLang: "🌐 언어" },
    th: { welcomeSub: "เข้าใจสุขภาพของคุณในภาษาของคุณเอง", welcomeMain: "เข้าใจรายงานการแพทย์ได้ง่ายๆ", welcomeDesc: "อัปโหลดรายงานเพื่อเข้าใจ ศัพท์แพทย์ ยากๆ ได้ง่ายขึ้น", btnStart: "เริ่มต้น", btnContinue: "ดำเนินการต่อ", langTitle: "เลือกภาษาของคุณ", langDesc: "ภาษานี้จะถูกใช้ในแอปทั้งหมด", homeSub: "สุขภาพที่ดี มาจากการเข้าใจที่ดี", homeHello: "สวัสดี, ", heroTitle: "คำอธิบายรายงานการแพทย์", heroDesc: "อธิบายรายงานแพทย์ที่ซับซ้อนให้เข้าใจง่าย", btnUpload: "อัปโหลดรายงาน", resultHeader: "คำอธิบายโดยละเอียด", extractedHeader: "ข้อความที่สกัดได้", riskTitle: "สถานะความเสี่ยงสุขภาพ", graphTitle: "🩺 รายงานที่บันทึกไว้", navHome: "🏠 หน้าแรก", navUpload: "📤 อัปโหลด", navLang: "🌐 ภาษา" }
};

let selectedLang = 'en';

const medicalRef = {
    'hemoglobin': { min: 12.0, max: 17.5, unit: 'g/dL', fullName: 'Hemoglobin (Hb)', desc: 'Carries oxygen from your lungs to the rest of your body.' },
    'hb': { min: 12.0, max: 17.5, unit: 'g/dL', fullName: 'Hemoglobin (Hb)', desc: 'Protein in red blood cells responsible for transporting oxygen.' },
    'wbc': { min: 4000, max: 11000, unit: 'cells/cu.mm', fullName: 'White Blood Cell Count (WBC)', desc: 'Part of the immune system that fights off infections and foreign invaders.' },
    'rbc': { min: 4.2, max: 5.9, unit: 'million/cu.mm', fullName: 'Red Blood Cell Count (RBC)', desc: 'Cells that carry oxygen throughout the body.' },
    'platelets': { min: 150000, max: 450000, unit: 'cells/cu.mm', fullName: 'Platelet Count', desc: 'Blood cells that help your blood clot to stop bleeding.' },
    'glucose': { min: 70, max: 100, unit: 'mg/dL', fullName: 'Fasting Blood Glucose', desc: 'Measures sugar levels in your blood after fasting.' },
    'fbs': { min: 70, max: 100, unit: 'mg/dL', fullName: 'Fasting Blood Sugar', desc: 'Primary indicator for diagnosing diabetes or monitoring blood sugar levels.' },
    'hba1c': { min: 4.0, max: 5.6, unit: '%', fullName: 'HbA1c (Glycated Hemoglobin)', desc: 'Shows your average blood sugar levels over the past 2 to 3 months.' },
    'cholesterol': { min: 125, max: 200, unit: 'mg/dL', fullName: 'Total Blood Cholesterol', desc: 'Fat-like substance in your blood vital for cells, but high levels increase heart risks.' },
    'triglycerides': { min: 50, max: 150, unit: 'mg/dL', fullName: 'Triglycerides', desc: 'Type of fat found in your blood used for energy.' },
    'thyroid': { min: 0.4, max: 4.0, unit: 'uIU/mL', fullName: 'TSH (Thyroid Stimulating Hormone)', desc: 'Controls metabolism and overall body energy balance.' },
    'tsh': { min: 0.4, max: 4.0, unit: 'uIU/mL', fullName: 'TSH (Thyroid Hormone)', desc: 'Hormone regulating thyroid gland activity and metabolic speed.' },
    'creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL', fullName: 'Serum Creatinine', desc: 'Waste product filtered out by kidneys; key test for renal/kidney health.' },
    'urea': { min: 7, max: 20, unit: 'mg/dL', fullName: 'Blood Urea Nitrogen', desc: 'Waste product formed from breakdown of protein, excreted by kidneys.' }
};

document.addEventListener('DOMContentLoaded', () => {
    initLangGrid();
    setupNetworkStatusListener();
    checkPersistentLogin();
    ['click', 'touchstart', 'touchend'].forEach(ev => {
        document.addEventListener(ev, unlockSpeech, { passive: true });
    });
    const video = document.getElementById('introVideo');
    if (video) {
        video.play().catch(err => console.log(err));
        video.onended = () => skipIntro();
    }
});

function unlockSpeech() {
    if (speechUnlocked) return;
    speechUnlocked = true;
    try {
        const a = getTtsEl();
        a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        const p = a.play();
        if (p && p.catch) p.catch(() => { speechUnlocked = false; });
    } catch (e) { speechUnlocked = false; }
    if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
        try {
            const u = new SpeechSynthesisUtterance(' ');
            u.volume = 0;
            window.speechSynthesis.speak(u);
        } catch (e) {}
    }
}

function checkPersistentLogin() {
    activeAccounts = JSON.parse(localStorage.getItem('savedAccounts')) || [];
    const savedUser = localStorage.getItem('activeUser');
    if (savedUser && activeAccounts.includes(savedUser)) {
        currentUser = savedUser;
        loadUserData();
        const introScreen = document.getElementById('screen-intro');
        if (introScreen && introScreen.classList.contains('active')) {
        } else {
            showScreen('screen-home');
            document.getElementById('bottomNav').style.display = 'flex';
            updateUI();
        }
    }
    renderAccountSwitcher();
}

function skipIntro() {
    const introScreen = document.getElementById('screen-intro');
    const video = document.getElementById('introVideo');
    if (video) video.pause();
    if (introScreen) {
        introScreen.style.setProperty('display', 'none', 'important');
        introScreen.classList.remove('active');
    }
    const savedUser = localStorage.getItem('activeUser');
    if (savedUser && activeAccounts.includes(savedUser)) {
        currentUser = savedUser;
        loadUserData();
        showScreen('screen-home');
        document.getElementById('bottomNav').style.display = 'flex';
        updateUI();
    } else {
        showScreen('screen-login');
    }
}

function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const inputVal = document.getElementById('loginUser').value.trim();
    if (!inputVal) return;
    activeAccounts = JSON.parse(localStorage.getItem('savedAccounts')) || [];
    if (!activeAccounts.includes(inputVal)) {
        if (activeAccounts.length >= 3) {
            alert("Maximum limit of 3 accounts reached. Please remove one account to add another.");
            return;
        }
        activeAccounts.push(inputVal);
        localStorage.setItem('savedAccounts', JSON.stringify(activeAccounts));
    }
    currentUser = inputVal;
    localStorage.setItem('activeUser', currentUser);
    loadUserData();
    showScreen('screen-welcome');
    document.getElementById('bottomNav').style.display = 'flex';
    updateUI();
    renderAccountSwitcher();
}

function switchAccount(userName) {
    currentUser = userName;
    localStorage.setItem('activeUser', currentUser);
    loadUserData();
    updateUI();
    renderAccountSwitcher();
    document.getElementById('resultArea').style.display = 'none';
    window.speechSynthesis && window.speechSynthesis.cancel();
}

function removeAccount(userName) {
    activeAccounts = activeAccounts.filter(acc => acc !== userName);
    localStorage.setItem('savedAccounts', JSON.stringify(activeAccounts));
    if (currentUser === userName) {
        if (activeAccounts.length > 0) switchAccount(activeAccounts[0]);
        else handleLogout();
    } else renderAccountSwitcher();
}

function renderAccountSwitcher() {
    let switcherContainer = document.getElementById('accountSwitcher');
    if (!switcherContainer) {
        switcherContainer = document.createElement('div');
        switcherContainer.id = 'accountSwitcher';
        switcherContainer.style.cssText = "padding: 10px; background: rgba(0,0,0,0.03); border-radius: 8px; margin: 10px 0;";
        const homeHeader = document.getElementById('t-home-hello');
        if (homeHeader && homeHeader.parentNode) homeHeader.parentNode.insertBefore(switcherContainer, homeHeader.nextSibling);
    }
    if (activeAccounts.length === 0) {
        switcherContainer.style.display = 'none';
        return;
    }
    switcherContainer.style.display = 'block';
    switcherContainer.innerHTML = `
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 6px; color: #555;">👥 Accounts (${activeAccounts.length}/3):</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${activeAccounts.map(acc => `
                <div style="background: ${acc === currentUser ? 'var(--primary, #2c3e50)' : '#fff'}; color: ${acc === currentUser ? '#fff' : '#333'}; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #ccc; display: flex; align-items: center; gap: 6px;">
                    <span onclick="switchAccount('${acc}')" style="cursor: pointer; font-weight: 500;">👤 ${acc}</span>
                    <span onclick="removeAccount('${acc}')" style="cursor: pointer; color: ${acc === currentUser ? '#ff8888' : '#e74c3c'}; font-weight: bold; padding-left: 4px;">×</span>
                </div>
            `).join('')}
        </div>
    `;
}

function handleLogout() {
    localStorage.removeItem('activeUser');
    currentUser = null;
    reportHistory = [];
    currentReportId = null;
    window.speechSynthesis && window.speechSynthesis.cancel();
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('resultArea').style.display = 'none';
    currentExtractedText = "";
    const loginInput = document.getElementById('loginUser');
    if (loginInput) loginInput.value = "";
    showScreen('screen-login');
}

function setupNetworkStatusListener() {
    const updateBanner = () => {
        let banner = document.getElementById('offlineBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'offlineBanner';
            banner.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; background: #e74c3c; color: white; text-align: center; padding: 6px; font-size: 12px; z-index: 9999; display: none; font-weight: 500;";
            document.body.prepend(banner);
        }
        if (!navigator.onLine) {
            banner.innerText = "⚡ Offline Mode: Processing files locally. Online translation is paused.";
            banner.style.display = 'block';
        } else banner.style.display = 'none';
    };
    window.addEventListener('online', updateBanner);
    window.addEventListener('offline', updateBanner);
    updateBanner();
}

function loadUserData() {
    if (!currentUser) return;
    const key = `medicalReports_${currentUser}`;
    reportHistory = JSON.parse(localStorage.getItem(key)) || [];
    renderHistoryList();
}

function saveUserData() {
    if (!currentUser) return;
    const key = `medicalReports_${currentUser}`;
    try { localStorage.setItem(key, JSON.stringify(reportHistory)); }
    catch (e) { console.warn("Storage full", e); }
}

function initLangGrid() {
    let grid = document.getElementById('lang-grid');
    if (!grid) {
        const scr = document.getElementById('screen-lang');
        if (!scr) return;
        grid = document.createElement('div');
        grid.id = 'lang-grid';
        scr.appendChild(grid);
    }
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px;';
    grid.innerHTML = '';
    languages.forEach(l => {
        const card = document.createElement('div');
        card.className = `lang-card ${l.code === selectedLang ? 'selected' : ''}`;
        card.onclick = () => selectLanguage(l.code);
        card.style.cssText = "padding: 12px; border-radius: 8px; border: 1px solid #ddd; text-align: center; cursor: pointer;";
        card.innerHTML = `<strong style="font-size: 15px; display: block;">${l.native}</strong><span style="font-size: 12px; color: #666;">${l.name}</span>`;
        grid.appendChild(card);
    });
}

async function selectLanguage(code) {
    selectedLang = code;
    initLangGrid();
    updateUI();
    if (currentExtractedText) {
        const idx = reportHistory.findIndex(r => r.id === currentReportId);
        const prev = idx >= 0 ? (reportHistory[idx + 1] || null) : null;
        await generateDynamicAnalysis(currentExtractedText, prev);
        speakText();
    }
}

function updateUI() {
    const t = i18n[selectedLang] || i18n['en'];
    const fallback = i18n['en'];
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };
    setText('t-welcome-sub', t.welcomeSub || fallback.welcomeSub);
    setText('t-welcome-main', t.welcomeMain || fallback.welcomeMain);
    setText('t-welcome-desc', t.welcomeDesc || fallback.welcomeDesc);
    setText('t-btn-start', t.btnStart || fallback.btnStart);
    setText('t-btn-continue', t.btnContinue || fallback.btnContinue);
    setText('t-lang-title', t.langTitle || fallback.langTitle);
    setText('t-lang-desc', t.langDesc || fallback.langDesc);
    setText('t-home-sub', t.homeSub || fallback.homeSub);
    setText('t-home-hello', (t.homeHello || fallback.homeHello) + (currentUser || "User") + " 👋");
    setText('t-hero-title', t.heroTitle || fallback.heroTitle);
    setText('t-hero-desc', t.heroDesc || fallback.heroDesc);
    setText('t-btn-upload', t.btnUpload || fallback.btnUpload);
    setText('t-result-header', t.resultHeader || fallback.resultHeader);
    setText('t-extracted-header', t.extractedHeader || fallback.extractedHeader);
    setText('t-risk-title', t.riskTitle || fallback.riskTitle);
    setText('t-nav-home', t.navHome || fallback.navHome);
    setText('t-nav-upload', t.navUpload || fallback.navUpload);
    setText('t-nav-lang', t.navLang || fallback.navLang);
    renderHistoryList();
    renderAccountSwitcher();
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        if (s.id !== 'screen-intro') {
            s.style.display = 'none';
            s.classList.remove('active');
        }
    });
    const target = document.getElementById(id);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        if (id === 'screen-home' || id === 'screen-lang') bottomNav.style.display = 'flex';
        else bottomNav.style.display = 'none';
    }
    if (id === 'screen-lang') initLangGrid();
    if (id === 'screen-home') {
        renderHistoryList();
        renderAccountSwitcher();
    }
}

async function processFile(file) {
    if (!file) return;
    unlockSpeech();
    const pBar = document.getElementById('progressBar');
    const pFill = document.getElementById('progressFill');
    if (pBar) pBar.style.display = 'block';
    if (pFill) pFill.style.width = '30%';
    try {
        currentExtractedText = "";
        if (file.type === 'application/pdf') currentExtractedText = await extractPdfText(file);
        else {
            const res = await Tesseract.recognize(file);
            currentExtractedText = res.data.text;
        }
        if (pFill) pFill.style.width = '70%';
        if (!currentExtractedText || currentExtractedText.trim() === "") {
            alert("Could not extract text from document.");
            if (pBar) pBar.style.display = 'none';
            return;
        }
        const prev = reportHistory[0] || null;
        const analysis = await generateDynamicAnalysis(currentExtractedText, prev);
        const newReport = {
            id: Date.now(),
            fileName: (file.name && file.name !== "blob") ? file.name : "📷 Camera_Report.jpg",
            time: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: currentExtractedText,
            parsed: analysis.parsed,
            analysis: { translatedText: analysis.translatedText, isHighRisk: analysis.isHighRisk }
        };
        reportHistory.unshift(newReport);
        currentReportId = newReport.id;
        saveUserData();
        renderHistoryList();
        const extractedEl = document.getElementById('extractedText');
        if (extractedEl) extractedEl.innerText = currentExtractedText;
        const resultEl = document.getElementById('resultArea');
        if (resultEl) {
            resultEl.style.display = 'block';
            resultEl.scrollIntoView({ behavior: 'smooth' });
        }
        if (pFill) pFill.style.width = '100%';
        setTimeout(() => { if (pBar) pBar.style.display = 'none'; }, 500);
        const fileInp = document.getElementById('fileInput');
        if (fileInp) fileInp.value = "";
        const camInp = document.getElementById('cameraInput');
        if (camInp) camInp.value = "";
        speakText();
    } catch (err) {
        alert("Error processing file: " + err.message);
        if (pBar) pBar.style.display = 'none';
    }
}

async function extractPdfText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(s => s.str).join(" ") + "\n";
    }
    return fullText;
}

async function translateDynamicText(text, targetLangCode) {
    if (targetLangCode === 'en' || !navigator.onLine) return text;
    const lines = text.split('\n');
    const chunks = [];
    let cur = "";
    lines.forEach(l => {
        if ((cur + "\n" + l).length > 450 && cur) { chunks.push(cur); cur = l; }
        else cur = cur ? cur + "\n" + l : l;
    });
    if (cur) chunks.push(cur);
    const translateOne = async (chunk) => {
        try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 8000);
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(chunk)}`;
            const res = await fetch(url, { signal: ctrl.signal });
            clearTimeout(tid);
            const data = await res.json();
            if (data && data[0]) return data[0].map(i => i[0]).join("");
        } catch (e) {}
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${targetLangCode}`);
            const data = await res.json();
            if (data && data.responseData && data.responseData.translatedText) return data.responseData.translatedText;
        } catch (e) {}
        translationFailed = true;
        return chunk;
    };
    const out = await Promise.all(chunks.map(translateOne));
    return out.join("\n");
}

Object.assign(medicalRef, {
    'ldl': { min: 0, max: 100, unit: 'mg/dL', fullName: 'LDL Cholesterol', desc: 'Often called bad cholesterol; high levels raise heart disease risk.' },
    'hdl': { min: 40, max: 100, unit: 'mg/dL', fullName: 'HDL Cholesterol', desc: 'Often called good cholesterol; it helps protect your heart.' },
    'uricacid': { min: 3.5, max: 7.2, unit: 'mg/dL', fullName: 'Uric Acid', desc: 'High levels can cause gout and joint pain.' },
    'sgpt': { min: 7, max: 56, unit: 'U/L', fullName: 'SGPT / ALT (Liver Enzyme)', desc: 'Liver enzyme that rises when the liver is stressed or damaged.' },
    'sgot': { min: 10, max: 40, unit: 'U/L', fullName: 'SGOT / AST (Liver Enzyme)', desc: 'Enzyme found in liver and muscles; high levels may show liver or muscle stress.' },
    'bilirubin': { min: 0.1, max: 1.2, unit: 'mg/dL', fullName: 'Total Bilirubin', desc: 'Yellow pigment processed by the liver; high levels can cause jaundice.' },
    'sodium': { min: 135, max: 145, unit: 'mmol/L', fullName: 'Sodium', desc: 'Salt balance in the blood, important for nerves and muscles.' },
    'potassium': { min: 3.5, max: 5.0, unit: 'mmol/L', fullName: 'Potassium', desc: 'Mineral needed for heart rhythm and muscle function.' },
    'esr': { min: 0, max: 20, unit: 'mm/hr', fullName: 'ESR', desc: 'General marker of inflammation in the body.' },
    'hematocrit': { min: 36, max: 50, unit: '%', fullName: 'Hematocrit (PCV)', desc: 'Percentage of your blood made up of red blood cells.' },
    'mcv': { min: 80, max: 100, unit: 'fL', fullName: 'MCV', desc: 'Average size of your red blood cells.' },
    'vitamind': { min: 30, max: 100, unit: 'ng/mL', fullName: 'Vitamin D', desc: 'Needed for strong bones and immunity.' },
    'vitaminb12': { min: 200, max: 900, unit: 'pg/mL', fullName: 'Vitamin B12', desc: 'Needed for nerves and healthy red blood cells.' }
});

const testPatterns = [
    { ref: 'hba1c', re: /hba1c|glyc(?:o)?(?:sylated|ated)\s*h(?:a)?emoglobin|\ba1c\b/ig },
    { ref: 'hemoglobin', re: /h(?:a)?emoglobin|\bhgb\b|\bhb\b/ig, skipBefore: /glyc\w*\s*$/i, skipAfter: /^\s*a1c/i },
    { ref: 'wbc', re: /\bwbc\b|\btlc\b|total\s*leu?kocyte\s*count|white\s*blood\s*cells?/ig },
    { ref: 'rbc', re: /\brbc\b|red\s*blood\s*cells?/ig },
    { ref: 'platelets', re: /platelets?(?:\s*count)?|\bplt\b/ig },
    { ref: 'glucose', re: /glucose|blood\s*sugar|\bfbs\b|\brbs\b|\bppbs\b/ig, skipBefore: /(average|estimated|mean|eag)\s*$/i },
    { ref: 'cholesterol', re: /cholesterol/ig, skipBefore: /(hdl|ldl|vldl|non[\s-]*hdl)[\s-]*$/i },
    { ref: 'ldl', re: /\bldl\b(?:[\s-]*cholesterol)?/ig },
    { ref: 'hdl', re: /\bhdl\b(?:[\s-]*cholesterol)?/ig },
    { ref: 'triglycerides', re: /triglycerides?|\btg\b/ig },
    { ref: 'tsh', re: /\btsh\b|thyroid\s*stimulating/ig },
    { ref: 'creatinine', re: /creatinine/ig, skipAfter: /^\s*clearance/i },
    { ref: 'urea', re: /\burea\b|\bbun\b/ig },
    { ref: 'uricacid', re: /uric\s*acid/ig },
    { ref: 'sgpt', re: /\bsgpt\b|\balt\b|alanine/ig },
    { ref: 'sgot', re: /\bsgot\b|\bast\b|aspartate/ig },
    { ref: 'bilirubin', re: /bilirubin/ig, skipBefore: /(direct|indirect|conjugated)\s*$/i },
    { ref: 'sodium', re: /\bsodium\b/ig },
    { ref: 'potassium', re: /potassium/ig },
    { ref: 'esr', re: /\besr\b|erythrocyte\s*sedimentation/ig },
    { ref: 'hematocrit', re: /h(?:a)?ematocrit|\bpcv\b/ig },
    { ref: 'mcv', re: /\bmcv\b/ig },
    { ref: 'vitamind', re: /vitamin[\s-]*d\b/ig },
    { ref: 'vitaminb12', re: /vitamin[\s-]*b[\s-]*12|\bb12\b|cobalamin/ig }
];

function parseValues(text) {
    const out = [];
    const src = (text || '').replace(/[ \t]+/g, ' ');
    testPatterns.forEach(tp => {
        const ref = medicalRef[tp.ref];
        if (!ref || out.some(o => o.name === ref.fullName)) return;
        tp.re.lastIndex = 0;
        let m;
        while ((m = tp.re.exec(src)) !== null) {
            if (m[0].length === 0) { tp.re.lastIndex++; continue; }
            const end = m.index + m[0].length;
            const before = src.slice(Math.max(0, m.index - 20), m.index);
            const afterName = src.slice(end, end + 12);
            if (tp.skipBefore && tp.skipBefore.test(before)) continue;
            if (tp.skipAfter && tp.skipAfter.test(afterName)) continue;
            const nm = src.slice(end, end + 80).match(/^[^0-9]{0,50}?(\d+(?:\.\d+)?)/);
            if (!nm) continue;
            let val = parseFloat(nm[1]);
            if (tp.ref === 'wbc' && val < 100) val = val * 1000;
            if (tp.ref === 'platelets') { if (val < 10) val = val * 100000; else if (val < 1000) val = val * 1000; }
            if (!(val > 0) || val > ref.max * 10 || val < ref.min / 10) continue;
            out.push({ name: ref.fullName, val, unit: ref.unit, min: ref.min, max: ref.max, ref });
            break;
        }
    });
    return out;
}

async function generateDynamicAnalysis(text, prevReport) {
    const summaryList = document.getElementById('summaryText');
    const badge = document.getElementById('riskBadge');
    if (summaryList) summaryList.innerHTML = `<p style="color:#666;font-style:italic;">⏳ Generating detailed explanation...</p>`;
    let parsedData = [];
    let isHighRisk = false;
    parseValues(text).forEach(f => {
        const ref = f.ref, val = f.val, unit = f.unit;
        const percentage = Math.round((val / ((ref.min + ref.max) / 2)) * 100);
        let status, meaning;
        if (val < ref.min) {
            status = "Low"; isHighRisk = true;
            meaning = `Your result is ${val} ${unit}, which is LOWER than the healthy range of ${ref.min} - ${ref.max} ${unit}. ${ref.desc}`;
        } else if (val > ref.max) {
            status = "High"; isHighRisk = true;
            meaning = `Your result is ${val} ${unit}, which is HIGHER than the healthy range of ${ref.min} - ${ref.max} ${unit}. ${ref.desc}`;
        } else {
            status = "Normal";
            meaning = `Your result is ${val} ${unit}, which is inside the normal healthy range of ${ref.min} - ${ref.max} ${unit}. ${ref.desc}`;
        }
        parsedData.push({ name: ref.fullName, val, unit, status, percentage, min: ref.min, max: ref.max, range: `${ref.min} - ${ref.max} ${unit}`, meaning });
    });
    let reportDoc = [];
    reportDoc.push("OVERALL MEDICAL REPORT EXPLANATION");
    reportDoc.push("This explanation is based only on the values found in your uploaded report.");
    reportDoc.push("\nSIMPLIFIED SUMMARY:");
    if (parsedData.length > 0) parsedData.forEach(item => reportDoc.push(`• ${item.name}: ${item.val} ${item.unit} (${item.status})`));
    else reportDoc.push("• Scan finished. No known test values were detected.");
    if (parsedData.length > 0) {
        reportDoc.push("\nDETAILED TEST BREAKDOWN:");
        parsedData.forEach((item, idx) => {
            reportDoc.push(`${idx + 1}. ${item.name}: ${item.val} ${item.unit} - ${item.status}.`);
            reportDoc.push(`Normal range is ${item.range}. ${item.meaning}`);
        });
    }
    reportDoc.push("\nHEALTH TREND:");
    const norm = s => (s || '').toLowerCase().replace(/[^a-z]/g, '');
    const prevParsed = prevReport ? ((prevReport.parsed && prevReport.parsed.length) ? prevReport.parsed : parseValues(prevReport.text)) : [];
    let trendRows = [];
    if (prevReport && prevParsed.length) {
        reportDoc.push(`Compared with your previous report (${prevReport.fileName}, ${prevReport.time}):`);
        const dist = (v, mn, mx) => (mn == null ? 0 : v < mn ? mn - v : v > mx ? v - mx : 0);
        let improved = 0, worsened = 0, compared = 0;
        parsedData.forEach(cur => {
            const old = prevParsed.find(p => norm(p.name) === norm(cur.name));
            if (!old) return;
            compared++;
            const diff = +(cur.val - old.val).toFixed(2);
            const pct = old.val !== 0 ? Math.round((diff / old.val) * 100) : 0;
            const arrow = diff > 0 ? "increased" : diff < 0 ? "decreased" : "unchanged";
            let verdict;
            if (cur.min == null) verdict = "changed";
            else {
                const dOld = dist(old.val, cur.min, cur.max);
                const dNew = dist(cur.val, cur.min, cur.max);
                if (dNew < dOld) { verdict = "Improved"; improved++; }
                else if (dNew > dOld) { verdict = "Worsened"; worsened++; }
                else verdict = dNew === 0 ? "Stable and normal" : "No change, still out of range";
            }
            reportDoc.push(`• ${cur.name}: ${old.val} to ${cur.val} ${cur.unit} (${arrow} ${Math.abs(pct)} percent) - ${verdict}`);
            trendRows.push({ name: cur.name, oldVal: old.val, newVal: cur.val, unit: cur.unit, diff, pct, verdict });
        });
        if (compared === 0) reportDoc.push("No matching tests found between the two reports.");
        else if (worsened > improved) reportDoc.push("Overall: Some values got worse since the last report. Please consult your doctor.");
        else if (improved > worsened) reportDoc.push("Overall: Your health is trending better. Keep it up!");
        else reportDoc.push("Overall: Your health is mostly stable compared to the last report.");
    } else reportDoc.push("This is your first report. Upload your next report to see a comparison trend.");
    reportDoc.push("\nMEDICAL ADVICE AND NEXT STEPS:");
    if (!parsedData.length) {
        reportDoc.push("1. No known test values could be read from this file.");
        reportDoc.push("2. Please upload a clear photo or PDF of a lab report (Hemoglobin, Sugar, Cholesterol, etc.).");
    } else if (isHighRisk) {
        reportDoc.push("1. One or more values are outside the normal range.");
        reportDoc.push("2. Please show this report to your doctor for personal advice.");
        reportDoc.push("3. Track these values regularly.");
    } else {
        reportDoc.push("1. All detected values look normal.");
        reportDoc.push("2. Keep a healthy diet, drink water and stay active.");
        reportDoc.push("3. Do regular health check-ups.");
    }
    translationFailed = false;
    const translatedText = await translateDynamicText(reportDoc.join("\n"), selectedLang);
    const noticeHtml = (selectedLang !== 'en' && translationFailed)
        ? '<div style="background:#fff3cd;color:#664d03;padding:8px;border-radius:8px;font-size:12px;margin-bottom:8px;">⚠️ Translation load aagala (internet check pannunga). English-la kaattuthu.</div>'
        : '';
    if (summaryList) {
        summaryList.innerHTML = noticeHtml + translatedText.split('\n').filter(l => l.trim().length > 0)
            .map(l => `<p style="margin:8px 0;font-size:14px;line-height:1.6;">${l}</p>`).join("");
    }
    if (badge) {
        badge.style.backgroundColor = isHighRisk ? "#e74c3c" : "#4caf50";
        badge.innerText = isHighRisk ? "Attention Needed" : "Normal / Stable";
    }
    const oldCard = document.getElementById('trendCard');
    if (oldCard) oldCard.remove();
    let card = null;
    if (summaryList) {
        card = document.createElement('div');
        card.id = 'trendCard';
        summaryList.appendChild(card);
    }
    if (card) {
        const known = parsedData.filter(p => p.min != null);
        if (!trendRows.length && known.length) {
            const title = await translateDynamicText("Health Trend (baseline - upload next report to compare)", selectedLang);
            card.style.cssText = "margin:12px 0;padding:12px;border-radius:10px;background:#f4f8ff;border:1px solid #cfe0ff;";
            card.innerHTML = `<div style="font-weight:bold;font-size:15px;margin-bottom:8px;">📈 ${title}</div>` +
                known.map(p => {
                    const span = p.max - p.min;
                    const lo = p.min - span * 0.5, hi = p.max + span * 0.5;
                    let pos = ((p.val - lo) / (hi - lo)) * 100;
                    pos = Math.max(2, Math.min(98, pos));
                    const color = p.status === 'Normal' ? '#2e7d32' : '#c62828';
                    const icon = p.status === 'Normal' ? '✅' : '⚠️';
                    return `<div style="padding:6px 0;border-top:1px solid #e1ebff;font-size:13px;">
                        <div style="display:flex;justify-content:space-between;gap:8px;"><span>${icon} ${p.name}</span><span style="color:${color};font-weight:600;white-space:nowrap;">${p.val} ${p.unit}</span></div>
                        <div style="position:relative;height:8px;background:#e8e8e8;border-radius:4px;margin-top:6px;"><div style="position:absolute;left:25%;width:50%;height:100%;background:#c8e6c9;border-radius:4px;"></div><div style="position:absolute;left:${pos}%;top:-3px;width:4px;height:14px;background:${color};border-radius:2px;"></div></div>
                    </div>`;
                }).join('');
        } else if (trendRows.length) {
            const title = await translateDynamicText("Health Trend", selectedLang);
            card.style.cssText = "margin:12px 0;padding:12px;border-radius:10px;background:#f4f8ff;border:1px solid #cfe0ff;";
            card.innerHTML = `<div style="font-weight:bold;font-size:15px;margin-bottom:8px;">📈 ${title}</div>` +
                trendRows.map(r => {
                    const good = r.verdict.indexOf('Improved') === 0 || r.verdict === 'Stable and normal';
                    const bad = r.verdict === 'Worsened';
                    const color = good ? '#2e7d32' : bad ? '#c62828' : '#666';
                    const icon = good ? '✅' : bad ? '⚠️' : '➖';
                    const arrow = r.diff > 0 ? '⬆' : r.diff < 0 ? '⬇' : '➡';
                    return `<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid #e1ebff;font-size:13px;"><span>${icon} ${r.name}</span><span style="color:${color};font-weight:600;white-space:nowrap;">${r.oldVal} ${arrow} ${r.newVal} ${r.unit}</span></div>`;
                }).join('');
        } else {
            const title = await translateDynamicText("Health Trend", selectedLang);
            const msg = await translateDynamicText(parsedData.length ? "Values saved as baseline. Upload your next report to compare." : "No test values detected in this report.", selectedLang);
            card.style.cssText = "margin:12px 0;padding:12px;border-radius:10px;background:#f4f8ff;border:1px solid #cfe0ff;";
            card.innerHTML = `<div style="font-weight:bold;font-size:15px;margin-bottom:8px;">📈 ${title}</div>` +
                parsedData.map(p => `<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid #e1ebff;font-size:13px;"><span>${p.name}</span><span style="font-weight:600;white-space:nowrap;">${p.val} ${p.unit}</span></div>`).join('') +
                `<div style="font-size:12px;color:#666;margin-top:6px;">${msg}</div>`;
        }
    }
    if (summaryList && summaryList.parentNode && !document.getElementById('listenBar')) {
        const bar = document.createElement('div');
        bar.id = 'listenBar';
        bar.style.cssText = "display:flex;gap:8px;margin:8px 0;";
        bar.innerHTML = `<button type="button" onclick="speakText()" style="flex:1;padding:10px;border:none;border-radius:8px;background:#2c3e50;color:#fff;font-size:14px;">🔊 Listen</button><button type="button" onclick="stopSpeech()" style="padding:10px 14px;border:none;border-radius:8px;background:#e74c3c;color:#fff;font-size:14px;">⏹</button>`;
        summaryList.parentNode.insertBefore(bar, summaryList);
        const st = document.createElement('div');
        st.id = 'voiceStatus';
        st.style.cssText = "font-size:12px;color:#555;margin:0 0 8px 0;min-height:14px;";
        summaryList.parentNode.insertBefore(st, summaryList);
    }
    return { translatedText, isHighRisk, parsed: parsedData };
}

async function openSavedReport(reportId) {
    const idx = reportHistory.findIndex(r => r.id === reportId);
    if (idx === -1) return;
    const report = reportHistory[idx];
    const prev = reportHistory[idx + 1] || null;
    currentReportId = reportId;
    currentExtractedText = report.text;
    const extractedEl = document.getElementById('extractedText');
    if (extractedEl) extractedEl.innerText = report.text;
    const resultEl = document.getElementById('resultArea');
    if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.scrollIntoView({ behavior: 'smooth' });
    }
    await generateDynamicAnalysis(report.text, prev);
}

function deleteReport(event, reportId) {
    event.stopPropagation();
    if (confirm("Are you sure you want to delete this report?")) {
        reportHistory = reportHistory.filter(r => r.id !== reportId);
        saveUserData();
        renderHistoryList();
        const resultEl = document.getElementById('resultArea');
        if (resultEl) resultEl.style.display = 'none';
        window.speechSynthesis && window.speechSynthesis.cancel();
    }
}

function renderHistoryList() {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer) return;
    const t = i18n[selectedLang] || i18n['en'];
    historyContainer.innerHTML = `<h4 style="margin: 0 0 10px 0; color: var(--primary, #2c3e50); font-size: 15px;">${t.graphTitle || '🩺 Saved Reports'} (${reportHistory.length})</h4><div id="historyList" style="max-height: 250px; overflow-y: auto;"></div>`;
    const listDiv = document.getElementById('historyList');
    if (reportHistory.length === 0) {
        listDiv.innerHTML = `<p style="font-size: 13px; color: #888; text-align: center;">No saved reports found for ${currentUser}.</p>`;
        return;
    }
    listDiv.innerHTML = reportHistory.map(item => `
        <div onclick="openSavedReport(${item.id})" style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e0e0e0; border-left: 4px solid var(--primary, #2c3e50); margin-bottom: 8px; cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 14px; color: #2c3e50; word-break: break-all;">📄 ${item.fileName}</strong>
                <button onclick="deleteReport(event, ${item.id})" style="background: transparent; border: none; color: #e74c3c; cursor: pointer; font-size: 16px; padding: 4px;">🗑️</button>
            </div>
            <div style="font-size: 11px; color: #777; margin-top: 2px;">🕒 ${item.time}</div>
            <div style="margin-top: 6px; font-size: 12px; color: #444; font-weight: 500;">👉 Click to view detailed analysis</div>
        </div>`).join("");
}

let ttsEl = null;
let voiceRun = 0;

function getTtsEl() {
    if (!ttsEl) {
        ttsEl = new Audio();
        ttsEl.preload = 'auto';
    }
    return ttsEl;
}

function setVoiceStatus(msg) {
    const el = document.getElementById('voiceStatus');
    if (el) el.innerText = msg || '';
}

function stopSpeech() {
    voiceRun++;
    try { window.Capacitor.Plugins.TextToSpeech.stop(); } catch (e) {}
    try {
        if (ttsEl) { ttsEl.onended = null; ttsEl.onerror = null; ttsEl.pause(); }
    } catch (e) {}
    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    setVoiceStatus('');
}

function getSpeechText() {
    return Array.from(document.querySelectorAll('#summaryText p')).map(p => p.innerText).join('. ')
        .replace(/[\u{1F000}-\u{1FFFF}☀-➿️•]/gu, '').replace(/\s+/g, ' ').trim();
}

function splitChunks(text, max) {
    const sentences = text.match(/[^.!?।。]+[.!?।。]?/g) || [text];
    const chunks = [];
    let cur = "";
    sentences.forEach(s => {
        s = s.trim();
        if (!s) return;
        if ((cur + " " + s).length > max && cur) { chunks.push(cur); cur = s; }
        else cur = cur ? cur + " " + s : s;
    });
    if (cur) chunks.push(cur);
    const out = [];
    chunks.forEach(c => {
        while (c.length > max + 20) {
            let cut = c.lastIndexOf(' ', max);
            if (cut < 40) cut = max;
            out.push(c.slice(0, cut));
            c = c.slice(cut).trim();
        }
        if (c) out.push(c);
    });
    return out;
}

function ensureNoReferrer() {
    try {
        if (!document.querySelector('meta[name="referrer"]')) {
            const m = document.createElement('meta');
            m.name = 'referrer';
            m.content = 'no-referrer';
            document.head.appendChild(m);
        }
    } catch (e) {}
}

function showChromeHelp() {
    const st = document.getElementById('voiceStatus');
    if (!st || document.getElementById('chromeBtn') || !/^https?:$/.test(location.protocol)) return;
    const b = document.createElement('button');
    b.id = 'chromeBtn';
    b.type = 'button';
    b.innerText = '🌐 Open in Chrome';
    b.style.cssText = "padding:8px 12px;border:none;border-radius:8px;background:#1a73e8;color:#fff;font-size:13px;margin-bottom:8px;";
    b.onclick = () => {
        location.href = 'intent://' + location.host + location.pathname + location.search +
            '#Intent;scheme=' + location.protocol.replace(':', '') + ';package=com.android.chrome;end';
    };
    st.parentNode.insertBefore(b, st.nextSibling);
}

function speakOnline(text) {
    const langObj = languages.find(l => l.code === selectedLang) || languages[0];
    const tl = langObj.code === 'zh' ? 'zh-CN' : langObj.code;
    const chunks = splitChunks(text, 160);
    if (!chunks.length) return;
    stopSpeech();
    ensureNoReferrer();
    let lastErr = 0;
    const run = ++voiceRun;
    const a = getTtsEl();
    setVoiceStatus('🔊 Loading voice...');
    const urlsFor = q => [
        `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${q}`,
        `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${tl}&q=${q}`
    ];
    const playChunk = (idx, tryNo) => {
        if (run !== voiceRun) return;
        if (idx >= chunks.length) { setVoiceStatus(''); return; }
        const list = urlsFor(encodeURIComponent(chunks[idx]));
        if (tryNo >= list.length) {
            if (idx === 0) {
                setVoiceStatus('❌ Voice load aagala (code ' + lastErr + '). Indha app-la voice block aaguthu. Chrome browser-la open pannunga.');
                showChromeHelp();
                return;
            }
            playChunk(idx + 1, 0);
            return;
        }
        a.onended = () => playChunk(idx + 1, 0);
        a.onerror = () => { lastErr = (a.error && a.error.code) || 0; playChunk(idx, tryNo + 1); };
        a.onplaying = () => { if (run === voiceRun) setVoiceStatus('🔊 Playing...'); };
        a.src = list[tryNo];
        const p = a.play();
        if (p && p.catch) p.catch(err => {
            if (run !== voiceRun) return;
            if (err && err.name === 'NotAllowedError') setVoiceStatus('👆 Voice start aaga 🔊 Listen button-a tap pannunga');
            else if (err && err.name !== 'AbortError') playChunk(idx, tryNo + 1);
        });
    };
    playChunk(0, 0);
}

function speakText() {
    const text = getSpeechText();
    if (!text || text.indexOf('Generating detailed') !== -1) return;
    const langObj = languages.find(l => l.code === selectedLang) || languages[0];
    stopSpeech();
    try {
        const capTts = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech;
        if (capTts) {
            setVoiceStatus('🔊 Playing...');
            Promise.resolve(capTts.speak({ text: text, lang: langObj.voiceCode, rate: 0.95, pitch: 1.0, volume: 1.0 }))
                .then(() => setVoiceStatus('')).catch(() => speakOnline(text));
            return;
        }
        if (window.TTS && typeof window.TTS.speak === 'function') {
            window.TTS.speak({ text: text, locale: langObj.voiceCode, rate: 0.95 }, function () {}, function () {});
            return;
        }
    } catch (e) {}
    const hasNative = ('speechSynthesis' in window) && (typeof SpeechSynthesisUtterance !== 'undefined');
    if (!hasNative) { speakOnline(text); return; }
    let voices = [];
    try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; }
    const voice = voices.find(v => v.lang && v.lang.replace('_', '-') === langObj.voiceCode) ||
        voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langObj.code));
    if (!voice && langObj.code !== 'en') { speakOnline(text); return; }
    const run = ++voiceRun;
    let started = false;
    const chunks = splitChunks(text, 180);
    chunks.forEach((c, idx) => {
        const u = new SpeechSynthesisUtterance(c);
        u.lang = langObj.voiceCode;
        u.rate = 0.95;
        if (voice) u.voice = voice;
        if (idx === 0) u.onstart = () => { started = true; setVoiceStatus('🔊 Playing...'); };
        if (idx === chunks.length - 1) u.onend = () => { if (run === voiceRun) setVoiceStatus(''); };
        try { window.speechSynthesis.speak(u); } catch (e) {}
    });
    setTimeout(() => {
        if (run === voiceRun && !started) {
            try { window.speechSynthesis.cancel(); } catch (e) {}
            speakOnline(text);
        }
    }, 2500);
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        try { window.speechSynthesis.getVoices(); } catch (e) {}
    };
}

function openCameraCapture() {
    const cameraInput = document.getElementById('cameraInput');
    if (cameraInput) cameraInput.click();
}
