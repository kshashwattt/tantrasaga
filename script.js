(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const form = $('#booking-form');
  const status = $('#form-status');
  const dialog = $('#admin-dialog');
  const toast = $('#toast');
  const storeKey = 'tantrasaga.bookingRequests.v1';
  let toastTimer;

  const readRequests = () => {
    try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); }
    catch { return []; }
  };
  const saveRequests = requests => localStorage.setItem(storeKey, JSON.stringify(requests));
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function renderRequests() {
    const requests = readRequests();
    const count = requests.length;
    $('#request-count').textContent = count;
    $('#metric-total').textContent = count;
    $('#metric-new').textContent = requests.filter(request => !request.reviewed).length;
    const renderList = items => items.length ? items.map((request, index) => `<article class="request-item"><div><strong>${escapeHtml(request.name)} <span style="color:#a58c60;font-weight:400">· ${escapeHtml(request.service)}</span></strong><small>${escapeHtml(request.email)}${request.phone ? ` · ${escapeHtml(request.phone)}` : ''}<br>${escapeHtml(request.message)}</small></div><div><time>${escapeHtml(request.date)}${request.reviewed ? ' · Reviewed' : ''}</time><br><button class="subtle-button review-request" data-id="${escapeHtml(request.id)}" aria-label="${request.reviewed ? 'Mark as new' : 'Mark as reviewed'}: ${escapeHtml(request.name)}">${request.reviewed ? 'Mark new' : 'Mark reviewed'}</button></div></article>`).join('') : '<div class="empty-state">No requests yet. New consultation requests will appear here.</div>';
    $('#recent-requests').innerHTML = renderList(requests.slice(0, 4));
    $('#all-requests').innerHTML = renderList(requests);
  }

  function setPanel(panelName) {
    $$('.admin-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === panelName));
    $$('.admin-panel').forEach(panel => panel.classList.toggle('active', panel.id === `panel-${panelName}`));
    const labels = {overview:'Dashboard',requests:'Booking requests','services-admin':'Services'};
    $('#admin-title').textContent = labels[panelName] || 'Dashboard';
  }

  function openBooking(service) {
    if (service) form.elements.service.value = service;
    $('#contact').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    setTimeout(() => form.elements.name.focus({preventScroll:true}), 450);
  }

  $$('[data-book]').forEach(button => button.addEventListener('click', () => openBooking(button.dataset.service)));
  $('#year').textContent = new Date().getFullYear();

  const menuButton = $('.menu-toggle');
  const nav = $('#primary-nav');
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  });
  $$('#primary-nav a').forEach(link => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
  }));

  form.addEventListener('submit', event => {
    event.preventDefault();
    status.classList.remove('error');
    if (!form.reportValidity()) {
      status.textContent = document.documentElement.lang === 'hi' ? 'कृपया चिह्नित फ़ील्ड जाँचें और फिर प्रयास करें।' : 'Please check the highlighted fields and try again.';
      status.classList.add('error');
      return;
    }
    const data = new FormData(form);
    const requests = readRequests();
    requests.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: data.get('name').trim(), email: data.get('email').trim(), phone: data.get('phone').trim(),
      service: data.get('service'), message: data.get('message').trim(),
      date: new Intl.DateTimeFormat(undefined, {dateStyle:'medium'}).format(new Date()), reviewed:false
    });
    try {
      saveRequests(requests);
      form.reset();
      status.textContent = document.documentElement.lang === 'hi' ? 'धन्यवाद। आपका अनुरोध इस पूर्वावलोकन में सहेज लिया गया है।' : 'Thank you. Your request has been saved in this preview.';
      showToast(document.documentElement.lang === 'hi' ? 'परामर्श अनुरोध प्राप्त हुआ।' : 'Consultation request received.');
    } catch {
      status.textContent = document.documentElement.lang === 'hi' ? 'यह ब्राउज़र आपका अनुरोध सहेज नहीं सका। कृपया सीधे संपर्क करें।' : 'This browser could not save your request. Please contact us directly.';
      status.classList.add('error');
    }
  });

  $('#admin-trigger').addEventListener('click', () => { renderRequests(); dialog.showModal(); });
  $('#close-admin').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  $$('.admin-tab').forEach(tab => tab.addEventListener('click', () => setPanel(tab.dataset.tab)));
  $$('[data-goto]').forEach(button => button.addEventListener('click', () => setPanel(button.dataset.goto)));
  dialog.addEventListener('click', event => {
    const reviewButton = event.target.closest('.review-request');
    if (!reviewButton) return;
    const requests = readRequests();
    const request = requests.find(item => item.id === reviewButton.dataset.id);
    if (request) request.reviewed = !request.reviewed;
    saveRequests(requests);
    renderRequests();
  });
  $('#clear-requests').addEventListener('click', () => {
    if (!readRequests().length) return;
    if (window.confirm('Clear all consultation requests saved in this browser?')) {
      saveRequests([]);
      renderRequests();
      showToast('Requests cleared from this browser.');
    }
  });
  const localePicker = $('#language-picker');
  const englishCopy = new Map();
  const hindiCopy = {
    '.primary-nav a:nth-child(1)': 'मुखपृष्ठ', '.primary-nav a:nth-child(2)': 'हमारी सेवाएँ', '.primary-nav a:nth-child(3)': 'आचार्य के बारे में', '.primary-nav a:nth-child(4)': 'संपर्क',
    '.nav-book': 'परामर्श बुक करें <span>↗</span>',
    '.hero .eyebrow': '<i></i> परंपरा से जुड़ा एक मार्ग <i></i>', '.hero h1': 'प्राचीन आध्यात्मिक ज्ञान।<br><em>शाश्वत परंपराएँ।</em>',
    '.hero-copy': 'काला जादू, शत्रु बाधा, वास्तु शांति, अनुष्ठान, पूजा और अन्य पारंपरिक तांत्रिक मार्गदर्शन के लिए आचार्य गोपाल के. शर्मा से संपर्क करें।',
    '.hero-actions .button-gold': 'परामर्श बुक करें <span>↗</span>', '.hero-actions .button-outline': 'सेवाएँ देखें <span>↓</span>',
    '.hero-note': '<span class="note-line"></span><span>श्रद्धा से मार्गदर्शन। उद्देश्य के साथ साधना।</span><span class="note-line"></span>',
    '.intro-copy .eyebrow': 'तंत्रसागा की दृष्टि', '.intro-copy h2': 'जीवन में संतुलन लाने वाला<br><em>ज्ञान और मार्गदर्शन।</em>',
    '.intro-copy p:nth-of-type(2)': 'कुछ सवालों के जवाब के लिए ध्यान से सुनना, पारंपरिक ज्ञान और आपके अनुसार तय मार्ग की आवश्यकता होती है।',
    '.intro-copy p:nth-of-type(3)': 'आचार्य गोपाल के. शर्मा को तंत्र साधना में 10 वर्षों का अनुभव है। माँ बगलामुखी और माँ काली के भक्त आचार्य श्रद्धा और सावधानी के साथ महाकालेश्वर, उज्जैन, मध्य प्रदेश से पारंपरिक मार्गदर्शन और अनुष्ठान सेवाएँ प्रदान करते हैं।',
    '.intro-copy .text-link': 'आचार्य से मिलें <span>↗</span>',
    '.profile-caption': 'आचार्य गोपाल के. शर्मा <span>·</span> महाकालेश्वर, उज्जैन',
    '.section-heading .eyebrow': 'पारंपरिक साधनाएँ', '.section-heading h2': 'अपनी आवश्यकता के लिए<br><em>मार्गदर्शन पाएँ।</em>',
    '.section-heading > p': 'आपकी आवश्यकता और परंपरा के अनुसार व्यक्तिगत मार्गदर्शन और धार्मिक अनुष्ठान।',
    '.service-card:nth-child(1) h3': 'काला जादू एवं शत्रु बाधा', '.service-card:nth-child(1) p': 'काला जादू, शत्रु बाधा या नकारात्मक प्रभावों से जुड़ी चिंताओं के लिए गोपनीय मार्गदर्शन और पारंपरिक अनुष्ठान सहायता।',
    '.service-card:nth-child(2) h3': 'वास्तु शांति', '.service-card:nth-child(2) p': 'घर या कार्यस्थल में सामंजस्य और संतुलन के लिए पारंपरिक वास्तु परामर्श और शांति अनुष्ठान।',
    '.service-card:nth-child(3) h3': 'अनुष्ठान एवं पूजा', '.service-card:nth-child(3) p': 'आपकी परंपरा का सम्मान करते हुए सावधानी से आयोजित पारंपरिक अनुष्ठान, पूजा और धार्मिक विधियाँ।',
    '.service-card:nth-child(4) h3': 'तंत्र एवं अन्य अनुष्ठान', '.service-card:nth-child(4) p': 'विभिन्न पारंपरिक तंत्र साधनाओं और अनुष्ठानों के लिए व्यक्तिगत परामर्श। मार्गदर्शन हेतु अपनी बात साझा करें।',
    '.card-link': 'इस सेवा के बारे में पूछें <span>↗</span>',
    '.quote-band blockquote': '“जब हम परंपरा के ज्ञान का सम्मान करते हैं,<br>तो वर्तमान में संतुलन के लिए जगह बनती है।”',
    '.quote-band p': 'आचार्य गोपाल के. शर्मा',
    '.booking-copy .eyebrow': 'बातचीत शुरू करें', '.booking-copy h2': 'एक सार्थक पहला<br><em>कदम यहाँ से।</em>',
    '.booking-copy > p:not(.eyebrow)': 'अपनी आवश्यकता साझा करें। हम आपसे संपर्क करके आपकी स्थिति समझेंगे और उपयुक्त मार्गदर्शन पर चर्चा करेंगे।',
    '.booking-copy .contact-detail:nth-of-type(1) small': 'आचार्य एवं आध्यात्मिक मार्गदर्शक', '.booking-copy .contact-detail:nth-of-type(2) small': 'पता',
    '.booking-copy .contact-detail:nth-of-type(2) strong': 'महाकालेश्वर, उज्जैन, मध्य प्रदेश', '.booking-copy .contact-detail:nth-of-type(3) small': 'पूछताछ के लिए कॉल करें', '.booking-copy .contact-detail:nth-of-type(4) small': 'परामर्श', '.booking-copy .contact-detail:nth-of-type(4) strong': 'पूर्व-निर्धारित समय पर',
    '.booking-form option[value=""]': 'सेवा चुनें', '.booking-form option[value="Black Magic & Satru Badha"]': 'काला जादू एवं शत्रु बाधा', '.booking-form option[value="Vastu Shanti"]': 'वास्तु शांति', '.booking-form option[value="Anushthan & Puja"]': 'अनुष्ठान एवं पूजा', '.booking-form option[value="Tantra & Other Rituals"]': 'तंत्र एवं अन्य अनुष्ठान', '.booking-form option[value="Other / Not sure"]': 'अन्य / निश्चित नहीं',
    '.submit-button': 'परामर्श अनुरोध भेजें <span>↗</span>', '.privacy-note': 'आपकी जानकारी गोपनीय रखी जाएगी।',
    '.footer-top > p': 'आचार्य गोपाल के. शर्मा<br>महाकालेश्वर, उज्जैन, मध्य प्रदेश<br><a href="tel:+919074555184">+91 90745 55184</a>', '.footer-cta': 'बातचीत शुरू करें <span>↗</span>',
    '.admin-trigger': 'प्रशासन', '.admin-brand': '<span>✳</span> TANTRASAGA', '.admin-label': 'कार्यक्षेत्र', '.admin-tab[data-tab="overview"]': '▦ &nbsp; अवलोकन', '.admin-tab[data-tab="requests"]': '✉ &nbsp; बुकिंग अनुरोध <b id="request-count">0</b>', '.admin-tab[data-tab="services-admin"]': '✧ &nbsp; सेवाएँ',
    '.admin-welcome h3': 'आपका स्वागत है।', '.admin-welcome p': 'आए हुए अनुरोध देखें और अपनी सेवाओं का प्रबंधन करें।', '.metric:nth-child(1) span': 'कुल अनुरोध', '.metric:nth-child(1) small': 'इस ब्राउज़र में सहेजे गए', '.metric:nth-child(2) span': 'नए अनुरोध', '.metric:nth-child(2) small': 'आपके उत्तर की प्रतीक्षा में', '.metric:nth-child(3) span': 'सेवाएँ', '.metric:nth-child(3) small': 'वर्तमान में उपलब्ध',
    '#clear-requests': 'सभी हटाएँ', '.admin-hint': 'सेवा सामग्री इस साइट के पूर्वावलोकन का हिस्सा है। इसे ऑनलाइन संपादित करने के लिए CMS जोड़ें।'
  };
  const originalFormLabels = new Map();
  function applyLanguage(language) {
    document.documentElement.lang = language;
    for (const [selector, translation] of Object.entries(hindiCopy)) {
      const nodes = [...document.querySelectorAll(selector)];
      if (!englishCopy.has(selector)) englishCopy.set(selector, {nodes, original: nodes.map(node => node.innerHTML)});
      const saved = englishCopy.get(selector);
      saved.nodes.forEach(node => { node.innerHTML = language === 'hi' ? translation : saved.original[saved.nodes.indexOf(node)]; });
    }
    const formLabels = {name:'आपका नाम',email:'ईमेल पता',phone:'फ़ोन नंबर ',service:'मार्गदर्शन का विषय',message:'आपकी सहायता कैसे कर सकते हैं?'};
    for (const [name, hindi] of Object.entries(formLabels)) {
      const label = $(`[name="${name}"]`).closest('label');
      const firstText = [...label.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
      if (!originalFormLabels.has(name)) originalFormLabels.set(name, firstText.textContent);
      firstText.textContent = language === 'hi' ? hindi : originalFormLabels.get(name);
    }
    $('.optional').textContent = language === 'hi' ? '(वैकल्पिक)' : '(optional)';
    const placeholders = language === 'hi' ? ['आपको किस नाम से संबोधित करें?','you@example.com','देश कोड सहित नंबर','अपनी आवश्यकता के बारे में थोड़ा बताएँ…'] : ['How should we address you?','you@example.com','Include country code','Tell us a little about what you’re looking for…'];
    ['[name="name"]','[name="email"]','[name="phone"]','[name="message"]'].forEach((selector,index)=>$(selector).placeholder=placeholders[index]);
    $('#primary-nav').setAttribute('aria-label', language === 'hi' ? 'मुख्य नेविगेशन' : 'Main navigation');
    $('#language-picker').setAttribute('aria-label', language === 'hi' ? 'वेबसाइट की भाषा' : 'Website language');
    document.title = language === 'hi' ? 'तंत्रसागा — प्राचीन ज्ञान, शाश्वत परंपराएँ' : 'TantraSaga — Ancient Wisdom, Timeless Traditions';
    localStorage.setItem('tantrasaga.language', language);
  }
  localePicker.value = localStorage.getItem('tantrasaga.language') || 'en';
  localePicker.addEventListener('change', () => applyLanguage(localePicker.value));
  applyLanguage(localePicker.value);

  renderRequests();
})();