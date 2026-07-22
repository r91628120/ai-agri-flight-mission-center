document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#flight-form');
  const steps = [...document.querySelectorAll('.form-step')];
  const stepButtons = [...document.querySelectorAll('[data-step-target]')];
  const toast = document.querySelector('.toast');
  let currentStep = 1;
  let highestStep = 1;
  let toastTimer;

  const missionOptions = [
    { name: '風災後作物倒伏巡查', type: '一般巡田' },
    { name: '病蟲害疑似區影像巡查', type: '作物觀察' },
    { name: '灌溉不均區域巡查', type: '一般巡田' },
    { name: '作物生長差異影像紀錄', type: '影像紀錄' },
    { name: '豪雨後積水範圍巡查', type: '一般巡田' },
    { name: '採收前田區影像紀錄', type: '影像紀錄' },
    { name: '田區缺株與裸露地觀察', type: '作物觀察' },
    { name: '農地邊界與地形測繪', type: '地形測繪' },
    { name: '棚架與防風設施巡查', type: '一般巡田' },
    { name: '空拍航線規劃教學練習', type: '教學練習' }
  ];
  const cropOptions = [
    { name: '水稻', type: '低矮作物' }, { name: '花生', type: '低矮作物' },
    { name: '草莓', type: '低矮作物' }, { name: '玉米', type: '中型作物' },
    { name: '甘蔗', type: '中型作物' }, { name: '香蕉', type: '高大作物' },
    { name: '芒果', type: '果園／林木' }, { name: '蓮霧', type: '果園／林木' },
    { name: '葡萄', type: '棚架作物' }, { name: '百香果', type: '棚架作物' }
  ];

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
    showToast('已產生隨機任務', `${mission.name}｜${mission.type}`);
  });
  document.querySelector('[data-random-crop]').addEventListener('click', () => {
    const crop = randomItem(cropOptions);
    value('cropName').value = crop.name;
    updateCropType();
    showToast('已產生隨機作物', `${crop.name}｜${crop.type}`);
  });
  value('cropName').addEventListener('change', updateCropType);

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
    renderResult(state, blockers, cautions, positives);
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
      ['預計時間', `${value('duration').value} 分鐘`]
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
    if (validateStep(4)) evaluate();
  });
  document.querySelector('[data-edit]').addEventListener('click', () => showStep(4));
  document.querySelector('[data-reset]').addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('.error').forEach((error) => { error.textContent = ''; });
    form.querySelectorAll('.invalid').forEach((field) => field.classList.remove('invalid'));
    highestStep = 1;
    showStep(1);
  });
});
