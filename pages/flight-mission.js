document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#flight-form');
  const steps = [...document.querySelectorAll('.form-step')];
  const stepButtons = [...document.querySelectorAll('[data-step-target]')];
  const toast = document.querySelector('.toast');
  let currentStep = 1;
  let highestStep = 1;
  let toastTimer;

  const missionOptions = [
    { name: '風災後作物倒伏巡查', type: '一般巡田', location: '屏東縣內埔鄉示範田區', altitude: 35, duration: 18 },
    { name: '病蟲害疑似區影像巡查', type: '作物觀察', location: '屏東縣長治鄉教學農場', altitude: 25, duration: 20 },
    { name: '灌溉不均區域巡查', type: '一般巡田', location: '高雄市美濃區示範田區', altitude: 40, duration: 22 },
    { name: '作物生長差異影像紀錄', type: '影像紀錄', location: '嘉義縣大林鎮黑豆田區', altitude: 45, duration: 25 },
    { name: '豪雨後積水範圍巡查', type: '一般巡田', location: '屏東縣萬丹鄉水稻田區', altitude: 50, duration: 16 },
    { name: '採收前田區影像紀錄', type: '影像紀錄', location: '台南市玉井區果園', altitude: 38, duration: 24 },
    { name: '田區缺株與裸露地觀察', type: '作物觀察', location: '雲林縣西螺鎮蔬菜田區', altitude: 30, duration: 15 },
    { name: '農地邊界與地形測繪', type: '地形測繪', location: '花蓮縣壽豐鄉教學田區', altitude: 70, duration: 30 },
    { name: '棚架與防風設施巡查', type: '一般巡田', location: '南投縣信義鄉葡萄園', altitude: 28, duration: 17 },
    { name: '空拍航線規劃教學練習', type: '教學練習', location: '校內農場無人機練習區', altitude: 20, duration: 12 }
  ];
  const cropOptions = [
    { name: '水稻', type: '低矮作物' }, { name: '花生', type: '低矮作物' },
    { name: '草莓', type: '低矮作物' }, { name: '玉米', type: '中型作物' },
    { name: '甘蔗', type: '中型作物' }, { name: '香蕉', type: '高大作物' },
    { name: '芒果', type: '果園／林木' }, { name: '蓮霧', type: '果園／林木' },
    { name: '葡萄', type: '棚架作物' }, { name: '百香果', type: '棚架作物' }
  ];
  const environmentOptions = [
    { wind: 2.1, gust: 3.4, rain: 'none', visibility: 'good', thunder: false, unstable: false },
    { wind: 4.8, gust: 8.2, rain: 'none', visibility: 'good', thunder: false, unstable: false },
    { wind: 5.5, gust: 10.6, rain: 'possible', visibility: 'good', thunder: false, unstable: true },
    { wind: 3.2, gust: 5.1, rain: 'light', visibility: 'limited', thunder: false, unstable: false },
    { wind: 7.4, gust: 12.8, rain: 'none', visibility: 'good', thunder: false, unstable: false },
    { wind: 1.8, gust: 3.0, rain: 'none', visibility: 'poor', thunder: false, unstable: false },
    { wind: 4.0, gust: 7.5, rain: 'heavy', visibility: 'limited', thunder: true, unstable: true },
    { wind: 10.2, gust: 15.4, rain: 'none', visibility: 'good', thunder: false, unstable: false },
    { wind: 2.7, gust: 4.9, rain: 'possible', visibility: 'limited', thunder: false, unstable: false },
    { wind: 3.6, gust: 6.1, rain: 'none', visibility: 'good', thunder: false, unstable: true }
  ];
  const airspaceOptions = ['clear', 'uncertain', 'restricted'];
  const STORAGE_KEY = 'aiakos-flight-assessment-v2';
  let pendingAssessment = null;

  const showToast = (title, message) => {
    toast.querySelector('strong').textContent = title;
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    toast.setAttribute('aria-hidden', 'false');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      toast.setAttribute('aria-hidden', 'true');
    }, 3200);
  };

  const showStep = (number) => {
    if (number > highestStep) return;
    currentStep = number;
    steps.forEach((step) => {
      const active = Number(step.dataset.step) === number;
      step.hidden = !active;
      step.classList.toggle('active', active);
    });
    stepButtons.forEach((button) => {
      const value = Number(button.dataset.stepTarget);
      button.classList.toggle('active', value === number);
      button.classList.toggle('complete', value < highestStep);
      if (value === number) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showError = (field, message) => {
    field.classList.add('invalid');
    const label = field.closest('label');
    const group = field.closest('fieldset');
    const error = label?.querySelector('.error') || group?.querySelector('.error');
    if (error) error.textContent = message;
  };

  const clearErrors = (step) => {
    step.querySelectorAll('.invalid').forEach((field) => field.classList.remove('invalid'));
    step.querySelectorAll('.error').forEach((error) => { error.textContent = ''; });
  };

  const validateStep = (number) => {
    const step = steps.find((item) => Number(item.dataset.step) === number);
    clearErrors(step);
    let valid = true;
    step.querySelectorAll('[required]').forEach((field) => {
      if (field.type === 'radio') {
        const group = step.querySelectorAll(`[name="${field.name}"]`);
        if (![...group].some((radio) => radio.checked)) {
          if (field === group[0]) showError(field, '請選擇一項空域查詢結果。');
          valid = false;
        }
      } else if (field.type === 'checkbox' && !field.checked) {
        showError(field, '請確認此項聲明。');
        valid = false;
      } else if (!field.value.trim()) {
        showError(field, '此欄位為必填。');
        valid = false;
      } else if (!field.checkValidity()) {
        showError(field, '請輸入有效範圍內的數值。');
        valid = false;
      }
    });
    if (!valid) showToast('資料尚未完成', '請完成標示的必填欄位，再進入下一步。');
    return valid;
  };

  const value = (name) => form.elements[name];
  const isChecked = (name) => Boolean(value(name)?.checked);
  const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
  const updateCropType = () => {
    const crop = cropOptions.find((item) => item.name === value('cropName').value);
    value('cropType').value = crop?.type || '';
  };

  document.querySelector('[data-random-mission]').addEventListener('click', () => {
    const mission = randomItem(missionOptions);
    value('missionName').value = mission.name;
    value('missionType').value = mission.type;
    value('location').value = mission.location;
    value('altitude').value = mission.altitude;
    value('duration').value = mission.duration;
    const date = new Date(Date.now() + (1 + Math.floor(Math.random() * 10)) * 86400000);
    date.setHours(8 + Math.floor(Math.random() * 8), Math.random() > .5 ? 30 : 0, 0, 0);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    value('flightTime').value = local;
    showToast('已產生隨機任務', `${mission.name}｜${mission.type}`);
  });
  document.querySelector('[data-random-crop]').addEventListener('click', () => {
    const crop = randomItem(cropOptions);
    value('cropName').value = crop.name;
    updateCropType();
    showToast('已產生隨機作物', `${crop.name}｜${crop.type}`);
  });
  value('cropName').addEventListener('change', updateCropType);

  const environmentNote = steps[1].querySelector('.input-note');
  const environmentButton = document.createElement('button');
  environmentButton.type = 'button';
  environmentButton.className = 'field-random inline-random';
  environmentButton.textContent = '🎲 隨機產生環境';
  environmentNote.append(environmentButton);
  environmentButton.addEventListener('click', () => {
    const item = randomItem(environmentOptions);
    value('wind').value = item.wind;
    value('gust').value = item.gust;
    value('rain').value = item.rain;
    value('visibility').value = item.visibility;
    value('thunder').checked = item.thunder;
    value('unstableWeather').checked = item.unstable;
    showToast('已產生模擬環境', `平均風速 ${item.wind} m/s｜陣風 ${item.gust} m/s`);
  });

  const airspaceLegend = steps[2].querySelector('fieldset legend');
  const airspaceButton = document.createElement('button');
  airspaceButton.type = 'button';
  airspaceButton.className = 'field-random inline-random';
  airspaceButton.textContent = '🎲 隨機空域題目';
  airspaceLegend.append(airspaceButton);
  airspaceButton.addEventListener('click', () => {
    const selected = randomItem(airspaceOptions);
    form.querySelector(`[name="airspace"][value="${selected}"]`).checked = true;
    const labels = { clear: '可依規定飛行', uncertain: '尚未確認', restricted: '禁止或未取得許可' };
    showToast('已更換空域題目', labels[selected]);
  });

  const evaluate = () => {
    const blockers = [];
    const cautions = [];
    const positives = [];
    const wind = Number(value('wind').value);
    const gust = Number(value('gust').value);
    const altitude = Number(value('altitude').value);
    const airspace = form.querySelector('[name="airspace"]:checked')?.value;

    if (airspace === 'restricted') blockers.push('空域禁止飛行，或尚未取得必要許可。');
    if (value('rain').value === 'heavy' || value('rain').value === 'light') blockers.push('現場正在降雨，不建議執行本次任務。');
    if (value('visibility').value === 'poor') blockers.push('無法持續目視飛行器，不符合安全操作條件。');
    if (isChecked('thunder')) blockers.push('現場有雷雨、閃電或雷聲。');
    if (wind >= 10 || gust >= 14) blockers.push('輸入的風速或陣風已達本系統保守停止門檻，並須另查機型限制。');

    if (airspace === 'uncertain') cautions.push('官方空域與許可要求尚未確認。');
    if (value('rain').value === 'possible') cautions.push('可能降雨，請在起飛前重新檢查雷達回波與現場雲況。');
    if (value('visibility').value === 'limited') cautions.push('能見度受到影響，須確認能全程維持目視。');
    if (isChecked('unstableWeather')) cautions.push('天候快速變化，建議暫緩並持續觀察。');
    if (wind >= 6 || gust >= 9) cautions.push('風況偏強，須確認機型限制、載重與返航餘裕。');
    if (altitude > 120) cautions.push('填寫高度超過 120 公尺，必須另行確認現行法規、空域與核准要求。');

    const safetyChecks = [
      ['peopleClear', '起降區與航線的人員安全尚未確認。'],
      ['obstaclesChecked', '電線、樹木或建物等障礙尚未完成檢查。'],
      ['landPermission', '場域或土地使用同意尚未確認。'],
      ['qualified', '操作資格尚未確認符合本次任務。'],
      ['conditionGood', '操作人員身心狀況尚未確認。'],
      ['observerReady', '任務所需的觀察員或協助人員尚未確認。'],
      ['aircraftOk', '機體、槳葉與馬達檢查尚未完成。'],
      ['batteryOk', '飛行器或遙控器電量尚未確認。'],
      ['homePoint', '定位、返航點或返航高度尚未確認。']
    ];
    safetyChecks.forEach(([name, message]) => { if (!isChecked(name)) cautions.push(message); });

    if (wind < 6 && gust < 9) positives.push('使用者輸入的風況落在本系統保守提醒門檻內。');
    if (value('rain').value === 'none') positives.push('使用者回報現場目前無降雨。');
    if (value('visibility').value === 'good') positives.push('使用者回報能見度良好。');
    if (airspace === 'clear') positives.push('使用者確認已查詢官方空域並可依規定飛行。');

    const state = blockers.length ? 'no-go' : cautions.length ? 'hold' : 'go';
    return { state, blockers, cautions, positives };
  };

  const renderQuestion = () => {
    const panel = document.querySelector('.result-hero');
    panel.dataset.resultState = 'hold';
    panel.querySelector('.result-icon').textContent = '?';
    document.querySelector('#result-title').textContent = '請做出您的飛行判斷';
    document.querySelector('#result-lead').textContent = '閱讀任務摘要與已知條件後，選擇可飛、暫緩或不可飛，再進行 AI 飛行評估。';
    const summary = document.querySelector('#mission-summary');
    summary.replaceChildren();
    const airspace = form.querySelector('[name="airspace"]:checked')?.value;
    const labels = { clear: '已查詢，可依規定飛行', uncertain: '尚未確認或不確定', restricted: '禁止或未取得必要許可' };
    const pairs = [
      ['任務', value('missionName').value], ['作物', `${value('cropName').value}（${value('cropType').value}）`],
      ['類型', value('missionType').value], ['地點', value('location').value],
      ['高度', `${value('altitude').value} 公尺`], ['風況', `${value('wind').value}／陣風 ${value('gust').value} m/s`],
      ['降雨', value('rain').selectedOptions[0].textContent], ['能見度', value('visibility').selectedOptions[0].textContent],
      ['空域', labels[airspace]]
    ];
    pairs.forEach(([term, description]) => {
      const dt = document.createElement('dt'); const dd = document.createElement('dd');
      dt.textContent = term; dd.textContent = description; summary.append(dt, dd);
    });
    const reasons = document.querySelector('#decision-reasons');
    reasons.innerHTML = '<li>平均風速與陣風是否適合？</li><li>降雨、雷雨及能見度是否構成風險？</li><li>空域、現場、人員及設備檢查是否完整？</li><li>作物型態與飛行高度是否需要額外注意？</li>';
    let quiz = document.querySelector('#assessment-quiz');
    if (!quiz) {
      quiz = document.createElement('section'); quiz.id = 'assessment-quiz'; quiz.className = 'assessment-quiz';
      quiz.innerHTML = '<h3>本次任務應如何處理？</h3><div class="decision-options"><label><input type="radio" name="studentDecision" value="go"><span>可以飛行</span></label><label><input type="radio" name="studentDecision" value="hold"><span>暫緩飛行</span></label><label><input type="radio" name="studentDecision" value="no-go"><span>不可飛行</span></label></div><button class="primary" type="button" data-assess>AI 飛行評估 ✦</button><p class="quiz-error" aria-live="polite"></p>';
      document.querySelector('.result-grid').after(quiz);
      quiz.querySelector('[data-assess]').addEventListener('click', submitAssessment);
    }
    quiz.hidden = false;
    quiz.querySelectorAll('input').forEach((input) => { input.checked = false; });
    highestStep = 5; showStep(5);
  };

  function submitAssessment() {
    const selected = form.querySelector('[name="studentDecision"]:checked')?.value;
    const quiz = document.querySelector('#assessment-quiz');
    if (!selected) { quiz.querySelector('.quiz-error').textContent = '請先選擇一項飛行判斷。'; return; }
    quiz.querySelector('.quiz-error').textContent = '';
    const correct = selected === pendingAssessment.state;
    renderResult(pendingAssessment.state, pendingAssessment.blockers, pendingAssessment.cautions, pendingAssessment.positives);
    quiz.hidden = true;
    saveRecord(selected, correct);
    renderProgress(correct);
  }

  const getRecords = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } };
  const saveRecord = (answer, correct) => {
    const records = getRecords();
    records.unshift({ id: Date.now(), date: new Date().toLocaleString('zh-TW'), mission: value('missionName').value, crop: value('cropName').value, answer, correctAnswer: pendingAssessment.state, correct });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 20)));
  };
  const renderProgress = (lastCorrect) => {
    let panel = document.querySelector('#learning-progress');
    if (!panel) { panel = document.createElement('section'); panel.id = 'learning-progress'; panel.className = 'learning-progress'; document.querySelector('.result-warning').after(panel); }
    const records = getRecords(); const correctCount = records.filter((r) => r.correct).length;
    panel.innerHTML = `<h3>${lastCorrect ? '✅ 本題判斷正確' : '💡 本題尚需加強'}</h3><p>最近保存 ${records.length} 筆｜答對 ${correctCount} 題｜證書進度 ${Math.min(correctCount, 10)}／10</p><div class="record-actions"><button type="button" class="secondary" data-records>查看飛行紀錄</button>${correctCount >= 10 ? '<button type="button" class="primary" data-certificate>下載 AI 飛行評估小證書</button>' : ''}</div><div class="records-list" hidden></div>`;
    panel.querySelector('[data-records]').addEventListener('click', () => renderRecords(panel));
    panel.querySelector('[data-certificate]')?.addEventListener('click', downloadCertificate);
  };
  const renderRecords = (panel) => {
    const list = panel.querySelector('.records-list'); const records = getRecords(); list.hidden = false;
    list.innerHTML = records.length ? records.map((r) => `<article><span>${r.correct ? '✅' : '❌'} ${r.date}｜${r.crop}｜${r.mission}</span><button type="button" data-delete-record="${r.id}" aria-label="刪除此筆紀錄">刪除</button></article>`).join('') + '<button type="button" class="danger-text" data-clear-records>清除全部紀錄</button>' : '<p>目前尚無紀錄。</p>';
    list.querySelectorAll('[data-delete-record]').forEach((button) => button.addEventListener('click', () => { const next = getRecords().filter((r) => r.id !== Number(button.dataset.deleteRecord)); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); renderRecords(panel); }));
    list.querySelector('[data-clear-records]')?.addEventListener('click', () => { if (confirm('確定要清除全部飛行評估紀錄嗎？')) { localStorage.removeItem(STORAGE_KEY); renderRecords(panel); } });
  };
  const downloadCertificate = () => {
    const name = prompt('請輸入證書上的姓名：', '')?.trim(); if (!name) return;
    const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1100; const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f7f4e8'; ctx.fillRect(0, 0, 1600, 1100); ctx.strokeStyle = '#0d5a43'; ctx.lineWidth = 18; ctx.strokeRect(45, 45, 1510, 1010);
    ctx.textAlign = 'center'; ctx.fillStyle = '#0d5a43'; ctx.font = 'bold 66px sans-serif'; ctx.fillText('AI 農業空拍飛行前評估能力小證書', 800, 250);
    ctx.fillStyle = '#222'; ctx.font = '42px sans-serif'; ctx.fillText(name, 800, 410); ctx.font = '32px sans-serif'; ctx.fillText('已完成情境模擬訓練並累積答對 10 題', 800, 520); ctx.fillText('此為教學學習成果，不代表操作證或實際飛行資格', 800, 620);
    ctx.font = '28px sans-serif'; ctx.fillText(`完成日期：${new Date().toLocaleDateString('zh-TW')}　證書編號：AF-${Date.now().toString().slice(-8)}`, 800, 800); ctx.fillText('AIAKOS AI農業飛行任務中心', 800, 920);
    const link = document.createElement('a'); link.download = `AI飛行評估小證書-${name}.png`; link.href = canvas.toDataURL('image/png'); link.click();
  };

  const renderResult = (state, blockers, cautions, positives) => {
    const panel = document.querySelector('.result-hero');
    const title = document.querySelector('#result-title');
    const lead = document.querySelector('#result-lead');
    const icon = panel.querySelector('.result-icon');
    const messages = state === 'no-go' ? [...blockers, ...cautions] : state === 'hold' ? cautions : positives;
    const result = {
      go: ['可飛：完成最終現場確認', '目前輸入未出現規則式阻擋或提醒項目；起飛前仍須再次確認最新狀況。', '✓'],
      hold: ['暫緩：完成必要確認', '目前仍有待確認或風險提醒，建議處理完成後再重新判斷。', '!'],
      'no-go': ['不可飛：停止本次任務', '目前輸入出現明確停止條件，請勿起飛，待條件排除後重新規劃。', '×']
    }[state];
    panel.dataset.resultState = state;
    title.textContent = result[0];
    lead.textContent = result[1];
    icon.textContent = result[2];

    const summary = document.querySelector('#mission-summary');
    summary.replaceChildren();
    const pairs = [
      ['任務', value('missionName').value],
      ['作物', value('cropName').value],
      ['作物型態', value('cropType').value],
      ['類型', value('missionType').value],
      ['地點', value('location').value],
      ['時間', value('flightTime').value.replace('T', ' ')],
      ['高度', `${value('altitude').value} 公尺`],
      ['預計時間', `${value('duration').value} 分鐘`],
      ['風況', `${value('wind').value}／陣風 ${value('gust').value} m/s`],
      ['降雨', value('rain').selectedOptions[0].textContent],
      ['能見度', value('visibility').selectedOptions[0].textContent],
      ['空域', ({ clear: '已查詢，可依規定飛行', uncertain: '尚未確認或不確定', restricted: '禁止或未取得必要許可' })[form.querySelector('[name="airspace"]:checked')?.value]]
    ];
    pairs.forEach(([term, description]) => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = term;
      dd.textContent = description;
      summary.append(dt, dd);
    });

    const reasons = document.querySelector('#decision-reasons');
    reasons.replaceChildren();
    (messages.length ? messages : ['已完成基本檢核，但仍須以現場與官方資訊為準。']).forEach((message) => {
      const li = document.createElement('li');
      li.textContent = message;
      reasons.append(li);
    });
    highestStep = 5;
    showStep(5);
  };

  document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    highestStep = Math.max(highestStep, currentStep + 1);
    showStep(currentStep + 1);
  }));
  document.querySelectorAll('[data-prev]').forEach((button) => button.addEventListener('click', () => showStep(currentStep - 1)));
  stepButtons.forEach((button) => button.addEventListener('click', () => showStep(Number(button.dataset.stepTarget))));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (validateStep(4)) { pendingAssessment = evaluate(); renderQuestion(); }
  });
  document.querySelector('[data-edit]').addEventListener('click', () => showStep(4));
  document.querySelector('[data-reset]').addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('.error').forEach((error) => { error.textContent = ''; });
    form.querySelectorAll('.invalid').forEach((field) => field.classList.remove('invalid'));
    highestStep = 1;
    pendingAssessment = null;
    document.querySelector('#assessment-quiz')?.remove();
    document.querySelector('#learning-progress')?.remove();
    showStep(1);
  });
});
