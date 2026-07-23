(() => {
  'use strict';

  const form = document.querySelector('#patrol-form');
  const steps = [...document.querySelectorAll('.form-step')];
  const stepButtons = [...document.querySelectorAll('[data-step-target]')];
  const toast = document.querySelector('.toast');
  const storageKey = 'aiakos-field-patrol-v2-records';
  const plotIds = ['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4'];
  const targetLabels = {
    growth:'生長差異', drought:'水分不足或灌溉異常', drainage:'積水或排水異常',
    pest:'疑似病蟲害', storm:'倒伏或風雨損傷', weed:'雜草或競爭區域'
  };
  const valueLabels = {
    low:'低空（10～20 公尺）', mid:'中空（20～40 公尺）', high:'較高空（40 公尺以上）',
    grid:'網格式全區覆蓋', row:'沿作物行列往返', focus:'疑似區定點環繞', random:'自由飛行',
    top:'垂直俯視', oblique:'斜角拍攝', mixed:'俯視＋斜拍',
    quick:'快速巡查（60%／50%）', standard:'標準巡田（75%／65%）', precision:'精細巡查（85%／75%）'
  };

  const scenarios = [
    {id:'G01',crop:'水稻',type:'低矮作物',stage:'分蘗期',area:'中型田區（1～3 公頃）',location:'屏東縣萬丹鄉教學田區',clue:'農民發現田區東側植株高度較矮，葉色也比其他區域淡，但近期供水正常。',target:'growth',height:'mid',route:'grid',angle:'top',overlap:'standard',abnormal:['A3','B3','C3'],reason:'需要比較全區冠層高度與葉色分布，確認生長不一致的位置。'},
    {id:'G02',crop:'玉米',type:'中型作物',stage:'拔節期',area:'大型田區（3 公頃以上）',location:'嘉義縣大林鎮示範田',clue:'同一批播種的植株出現明顯高矮落差，中央數個區域覆蓋率較低，未見萎凋。',target:'growth',height:'mid',route:'row',angle:'mixed',overlap:'standard',abnormal:['B2','B3','C2'],reason:'沿作物行列比較株高與覆蓋差異，能有效定位生長落後區。'},
    {id:'G03',crop:'葡萄',type:'棚架作物',stage:'果實膨大期',area:'小型田區（1 公頃以下）',location:'彰化縣大村鄉葡萄園',clue:'農民觀察到部分棚架的葉幕密度較稀，果串生長速度也與鄰近區域不同。',target:'growth',height:'low',route:'row',angle:'mixed',overlap:'precision',abnormal:['A2','B2'],reason:'棚架作物需要較低高度與俯斜混合影像，比較葉幕及立體生長狀況。'},
    {id:'G04',crop:'香蕉',type:'高大作物',stage:'營養生長期',area:'中型田區（1～3 公頃）',location:'屏東縣內埔鄉香蕉園',clue:'同一田區部分植株的新葉展開速度較慢，冠層大小形成數個不連續的小區塊。',target:'growth',height:'mid',route:'grid',angle:'mixed',overlap:'standard',abnormal:['A4','B4','C3'],reason:'需同時比較冠層大小與植株立體狀況，找出不連續的生長弱勢區。'},
    {id:'D01',crop:'玉米',type:'中型作物',stage:'營養生長期',area:'大型田區（3 公頃以上）',location:'雲林縣虎尾鎮玉米田',clue:'連續多日高溫少雨，午後田區西南側葉片捲曲較明顯，靠近供水端的植株則維持正常。',target:'drought',height:'mid',route:'row',angle:'mixed',overlap:'standard',abnormal:['B1','C1','C2'],reason:'線索顯示供水分布可能不均，應比較行列間的捲葉與冠層差異。'},
    {id:'D02',crop:'花生',type:'低矮作物',stage:'開花下針期',area:'中型田區（1～3 公頃）',location:'雲林縣元長鄉花生田',clue:'滴灌系統末端附近植株中午恢復較慢，土表偏乾，但田區入口端生長正常。',target:'drought',height:'low',route:'row',angle:'top',overlap:'precision',abnormal:['A4','B4','C4'],reason:'異常沿灌溉末端分布，沿行列低空拍攝能確認供水末端的範圍。'},
    {id:'D03',crop:'芒果',type:'果園／林木',stage:'幼果期',area:'小型田區（1 公頃以下）',location:'屏東縣枋山鄉芒果園',clue:'坡地上方數列果樹新梢略微下垂，近期無明顯病斑，園主懷疑部分管線出水不穩。',target:'drought',height:'mid',route:'row',angle:'mixed',overlap:'precision',abnormal:['A1','A2'],reason:'應沿管線與果樹列檢查冠層水分壓力，俯斜混拍可兼顧分布與新梢狀況。'},
    {id:'D04',crop:'百香果',type:'棚架作物',stage:'開花期',area:'小型田區（1 公頃以下）',location:'南投縣埔里鎮百香果園',clue:'棚架中段在晴天午後較早出現葉片下垂，灌溉控制器紀錄顯示該區流量曾短暫下降。',target:'drought',height:'low',route:'row',angle:'mixed',overlap:'precision',abnormal:['B2','B3'],reason:'需要針對棚架中段精細巡查，確認流量異常是否對應冠層反應。'},
    {id:'W01',crop:'水稻',type:'低矮作物',stage:'幼穗形成期',area:'大型田區（3 公頃以上）',location:'彰化縣溪州鄉水稻田',clue:'昨夜短時強降雨後，田區北側退水較慢，早晨仍可見數片反光區域。',target:'drainage',height:'mid',route:'grid',angle:'top',overlap:'standard',abnormal:['A1','A2','B1'],reason:'垂直俯視與全區網格能辨識水面反光及低窪積水的連續範圍。'},
    {id:'W02',crop:'花生',type:'低矮作物',stage:'結莢期',area:'中型田區（1～3 公頃）',location:'嘉義縣六腳鄉花生田',clue:'雨後兩天，低窪處土色仍深，附近植株開始黃化，而較高處已恢復乾燥。',target:'drainage',height:'low',route:'grid',angle:'top',overlap:'precision',abnormal:['B2','B3','C3'],reason:'需要精細比較土色、低窪地形與植株黃化的空間關係。'},
    {id:'W03',crop:'香蕉',type:'高大作物',stage:'抽蕾期',area:'中型田區（1～3 公頃）',location:'高雄市旗山區香蕉園',clue:'豪雨後靠近園區排水出口的地面長時間潮濕，數列香蕉下位葉開始失去光澤。',target:'drainage',height:'mid',route:'row',angle:'mixed',overlap:'standard',abnormal:['B4','C3','C4'],reason:'沿行列與排水方向巡查，能比較地表濕度線索及植株側面反應。'},
    {id:'W04',crop:'甘藍',type:'低矮作物',stage:'結球初期',area:'小型田區（1 公頃以下）',location:'雲林縣西螺鎮蔬菜田',clue:'畦溝雨後排水速度不一，中央兩畦仍有亮面水跡，植株外葉顏色較暗。',target:'drainage',height:'low',route:'row',angle:'top',overlap:'precision',abnormal:['A2','B2'],reason:'沿畦溝低空俯拍可精確確認水跡與受影響植株範圍。'},
    {id:'P01',crop:'芒果',type:'果園／林木',stage:'果實膨大期',area:'中型田區（1～3 公頃）',location:'台南市玉井區芒果園',clue:'園主發現數棵樹冠有不規則褐色斑塊，落葉量增加，但異常並未沿灌溉管線分布。',target:'pest',height:'low',route:'grid',angle:'mixed',overlap:'precision',abnormal:['A3','B2','B3'],reason:'不規則局部斑塊需要較高重疊及俯斜混拍，之後再到現場確認病蟲原因。'},
    {id:'P02',crop:'水稻',type:'低矮作物',stage:'孕穗期',area:'大型田區（3 公頃以上）',location:'嘉義縣太保市水稻田',clue:'巡田者看到幾個近圓形的黃褐色區塊，與田埂和進水方向都不一致，近期供水穩定。',target:'pest',height:'mid',route:'grid',angle:'top',overlap:'precision',abnormal:['A4','B3','C2','C3'],reason:'近圓形不規則斑塊需用高重疊俯視影像定位，再安排田間採樣複查。'},
    {id:'P03',crop:'葡萄',type:'棚架作物',stage:'轉色期',area:'小型田區（1 公頃以下）',location:'台中市新社區葡萄園',clue:'棚架東側葉片出現零星失綠與缺刻，受影響位置呈群聚狀，並非整排一致。',target:'pest',height:'low',route:'row',angle:'mixed',overlap:'precision',abnormal:['A3','A4'],reason:'群聚型葉片異常適合低空精細影像，但確診仍必須近距離檢查葉片。'},
    {id:'P04',crop:'百香果',type:'棚架作物',stage:'結果期',area:'小型田區（1 公頃以下）',location:'南投縣國姓鄉百香果園',clue:'部分棚面形成斑駁黃化區，農民回報附近葉片背面可見不明小點，其他區域生長正常。',target:'pest',height:'low',route:'grid',angle:'mixed',overlap:'precision',abnormal:['B1','B2','C1'],reason:'斑駁且局部的冠層異常需精細定位，空拍只負責找區域，不能直接確診。'},
    {id:'S01',crop:'香蕉',type:'高大作物',stage:'結果期',area:'中型田區（1～3 公頃）',location:'屏東縣南州鄉香蕉園',clue:'昨晚出現強陣風，今早園區中段有數列植株朝相近方向傾斜，部分葉片破裂。',target:'storm',height:'mid',route:'row',angle:'mixed',overlap:'standard',abnormal:['A2','B2','C2'],reason:'沿行列與俯斜混拍可辨識同方向傾斜及受損帶狀範圍。'},
    {id:'S02',crop:'玉米',type:'中型作物',stage:'抽雄期',area:'大型田區（3 公頃以上）',location:'嘉義縣義竹鄉玉米田',clue:'雷雨過後，田區南側植株倒向一致，中央仍大致直立，農民希望先估算受影響面積。',target:'storm',height:'mid',route:'grid',angle:'mixed',overlap:'standard',abnormal:['C1','C2','C3','C4'],reason:'網格覆蓋適合估算大面積受害比例，斜拍可輔助確認倒伏方向。'},
    {id:'S03',crop:'水稻',type:'低矮作物',stage:'乳熟期',area:'中型田區（1～3 公頃）',location:'宜蘭縣三星鄉水稻田',clue:'午後強降雨伴隨陣風，田區形成兩片植株朝同方向壓低的區域，其他位置仍直立。',target:'storm',height:'low',route:'grid',angle:'mixed',overlap:'precision',abnormal:['A3','B3'],reason:'乳熟期倒伏需較精細的俯斜影像，確認範圍與植株方向。'},
    {id:'S04',crop:'芒果',type:'果園／林木',stage:'採收前',area:'小型田區（1 公頃以下）',location:'屏東縣枋山鄉芒果園',clue:'颱風外圍環流後，坡面下方數棵果樹枝條折損，樹冠形狀與鄰近植株明顯不同。',target:'storm',height:'low',route:'row',angle:'mixed',overlap:'precision',abnormal:['B3','C3','C4'],reason:'果樹枝條與樹冠受損需要低空、多角度及高重疊影像輔助盤點。'},
    {id:'V01',crop:'水稻',type:'低矮作物',stage:'分蘗期',area:'大型田區（3 公頃以上）',location:'雲林縣土庫鎮水稻田',clue:'田間出現數條較深綠、葉形與水稻不同的帶狀區，主要沿田埂缺口向內延伸。',target:'weed',height:'mid',route:'grid',angle:'top',overlap:'standard',abnormal:['A1','B1','B2'],reason:'垂直俯視能比較非作物植被的顏色、形狀及帶狀分布。'},
    {id:'V02',crop:'花生',type:'低矮作物',stage:'營養生長期',area:'中型田區（1～3 公頃）',location:'屏東縣新園鄉花生田',clue:'行間出現多個植被密度特別高的小區塊，其葉形與整齊栽培行列不一致。',target:'weed',height:'low',route:'row',angle:'top',overlap:'precision',abnormal:['A2','B3','C2'],reason:'沿行列低空俯拍能區分規則作物與行間不規則植被。'},
    {id:'V03',crop:'玉米',type:'中型作物',stage:'苗期',area:'大型田區（3 公頃以上）',location:'台南市後壁區玉米田',clue:'播種行列之間出現連續綠帶，生長速度比玉米苗快，且在田區邊緣最為密集。',target:'weed',height:'mid',route:'row',angle:'top',overlap:'standard',abnormal:['A1','A2','B1','C1'],reason:'沿行列巡查可快速確認邊緣入侵與行間競爭植被的分布。'},
    {id:'V04',crop:'葡萄',type:'棚架作物',stage:'開花期',area:'小型田區（1 公頃以下）',location:'彰化縣溪湖鎮葡萄園',clue:'棚架下方部分區域地表植被快速增厚，靠近立柱處最密，可能影響通風與田間作業。',target:'weed',height:'low',route:'row',angle:'oblique',overlap:'precision',abnormal:['B2','B3','C2'],reason:'棚下植被需以較低空斜角沿行列觀察，才能看到棚架下方與立柱周邊。'}
  ];

  let currentStep = 1;
  let highestStep = 1;
  let currentScenario = null;
  let selectedPlots = [];
  let resultCreated = false;

  const field = name => form.elements[name];
  const selectedValue = name => form.querySelector(`[name="${name}"]:checked`)?.value || '';
  const showToast = message => {
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    toast.setAttribute('aria-hidden','false');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.classList.remove('show'); toast.setAttribute('aria-hidden','true'); }, 2800);
  };
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const today = () => new Date().toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit'});

  const go = (number, allowRecords = false) => {
    if (number > highestStep && !allowRecords) return showToast('請依序完成前面的巡田步驟。');
    currentStep = number;
    steps.forEach(step => {
      const active = Number(step.dataset.step) === number;
      step.hidden = !active;
      step.classList.toggle('active',active);
    });
    stepButtons.forEach(button => {
      const value = Number(button.dataset.stepTarget);
      button.classList.toggle('active',value === number);
      button.classList.toggle('done',value < highestStep);
    });
    if (number >= 2 && number <= 4) renderContexts();
    window.scrollTo({top:document.querySelector('.workspace').offsetTop - 78,behavior:'smooth'});
  };

  const validateStep = number => {
    const section = document.querySelector(`[data-step="${number}"]`);
    let valid = true;
    section.querySelectorAll('.error').forEach(error => error.textContent = '');
    const checkedNames = new Set();
    section.querySelectorAll('[required]').forEach(control => {
      if ((control.type === 'radio' || control.type === 'checkbox') && checkedNames.has(control.name)) return;
      checkedNames.add(control.name);
      const ok = control.type === 'radio' ? !!form.querySelector(`[name="${control.name}"]:checked`) : control.checkValidity();
      if (!ok) {
        valid = false;
        const holder = control.type === 'radio' ? control.closest('fieldset') : control.closest('label') || control.closest('section');
        const error = holder?.querySelector('.error');
        if (error) error.textContent = '請完成此項目';
      }
    });
    if (number === 3 && form.querySelectorAll('[name="safety"]:checked').length < 3) {
      valid = false;
      document.querySelector('.safety-error').textContent = '起飛前必須完成全部三項安全確認';
    }
    if (number === 4 && selectedPlots.length === 0) {
      valid = false;
      showToast('請至少標記一個需要田間複查的影像區塊。');
    }
    if (!valid) showToast(number === 1 ? '請先隨機產生一組巡田題目。' : '請完成本頁所有必填內容後再繼續。');
    return valid;
  };

  const missionHtml = () => currentScenario ? `<strong>${escapeHtml(currentScenario.crop)}｜${escapeHtml(currentScenario.stage)}｜${escapeHtml(currentScenario.area)}</strong><p>${escapeHtml(currentScenario.location)}<br>已知線索：${escapeHtml(currentScenario.clue)}</p>` : '';
  const renderContexts = () => {
    const target = selectedValue('target');
    document.querySelector('[data-context="mission"]').innerHTML = `<small>📋 第一頁巡田題目</small>${missionHtml()}`;
    document.querySelector('[data-context="plan"]').innerHTML = `<small>📋 累積任務資料</small>${missionHtml()}<p class="context-answer"><strong>第二頁｜我的目標判斷：</strong>${escapeHtml(targetLabels[target] || '尚未選擇')}</p>`;
    document.querySelector('[data-context="image"]').innerHTML = `<small>📋 巡田任務總整理</small>${missionHtml()}<p class="context-answer"><strong>我的目標：</strong>${escapeHtml(targetLabels[target] || '—')}<br><strong>我的空拍規劃：</strong>${escapeHtml([valueLabels[field('height').value],valueLabels[field('route').value],valueLabels[field('angle').value],valueLabels[selectedValue('overlap')]].filter(Boolean).join('／'))}</p>`;
  };

  const renderMission = () => {
    document.querySelector('#mission-placeholder').hidden = true;
    document.querySelector('#mission-card').hidden = false;
    document.querySelector('#mission-id').textContent = currentScenario.id;
    document.querySelector('#mission-category').textContent = `${currentScenario.type}任務`;
    document.querySelector('#mission-crop').textContent = `${currentScenario.crop}｜${currentScenario.type}`;
    document.querySelector('#mission-stage').textContent = currentScenario.stage;
    document.querySelector('#mission-area').textContent = currentScenario.area;
    document.querySelector('#mission-location').textContent = currentScenario.location;
    document.querySelector('#mission-date').textContent = today();
    document.querySelector('#mission-clue').textContent = currentScenario.clue;
    field('scenarioId').value = currentScenario.id;
  };

  const textureFor = (index, abnormal) => {
    const base = index % 3 === 0
      ? 'repeating-linear-gradient(100deg,#6eaa49 0 9px,#639d43 9px 17px)'
      : index % 3 === 1
        ? 'repeating-linear-gradient(85deg,#70a94b 0 7px,#66a044 8px 15px)'
        : 'repeating-linear-gradient(110deg,#75ad4e 0 10px,#67a146 10px 19px)';
    const variations = {
      growth:'radial-gradient(ellipse at 55% 52%,rgba(210,204,93,.66) 0 26%,transparent 50%)',
      drought:'linear-gradient(135deg,transparent 15%,rgba(194,169,76,.7) 38%,rgba(173,145,65,.62) 65%,transparent 85%)',
      drainage:'radial-gradient(ellipse at 50% 55%,rgba(58,117,126,.62) 0 28%,rgba(54,97,119,.35) 42%,transparent 64%)',
      pest:'radial-gradient(circle at 34% 36%,rgba(132,113,54,.72) 0 10%,transparent 22%),radial-gradient(circle at 66% 63%,rgba(211,191,74,.65) 0 13%,transparent 25%)',
      storm:'linear-gradient(25deg,transparent 0 33%,rgba(101,120,58,.7) 34% 48%,transparent 49% 62%,rgba(112,126,62,.62) 63% 75%,transparent 76%)',
      weed:'radial-gradient(ellipse at 55% 50%,rgba(24,111,61,.75) 0 26%,transparent 51%)'
    };
    return {base,variation:abnormal ? variations[currentScenario.target] : 'linear-gradient(90deg,rgba(255,255,255,.03),rgba(0,0,0,.03))'};
  };

  const renderFieldMap = () => {
    const map = document.querySelector('#field-map');
    map.innerHTML = plotIds.map((id,index) => {
      const texture = textureFor(index,currentScenario.abnormal.includes(id));
      return `<button type="button" class="plot" data-plot="${id}" style="--texture:${texture.base};--variation:${texture.variation}"><span>${id}</span></button>`;
    }).join('');
    map.querySelectorAll('.plot').forEach(plot => plot.addEventListener('click',() => {
      if (resultCreated) return;
      const id = plot.dataset.plot;
      selectedPlots = selectedPlots.includes(id) ? selectedPlots.filter(value => value !== id) : [...selectedPlots,id];
      plot.classList.toggle('selected',selectedPlots.includes(id));
      renderSelectedPlots();
    }));
  };

  const randomScenario = () => {
    const previousId = currentScenario?.id;
    const pool = scenarios.filter(item => item.id !== previousId);
    currentScenario = pool[Math.floor(Math.random() * pool.length)];
    form.reset();
    field('scenarioId').value = currentScenario.id;
    selectedPlots = [];
    resultCreated = false;
    renderMission();
    renderFieldMap();
    renderSelectedPlots();
    highestStep = 1;
    showToast(`已抽出 ${currentScenario.id} 巡田題目，請先閱讀已知線索。`);
  };

  const renderSelectedPlots = () => {
    document.querySelector('#selected-plots').textContent = selectedPlots.length ? selectedPlots.join('、') : '尚未標記';
    document.querySelector('#selected-count').textContent = `${selectedPlots.length} 個區域`;
  };

  const getRecords = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  };
  const saveRecords = records => localStorage.setItem(storageKey,JSON.stringify(records.slice(0,20)));
  const renderRecords = () => {
    const records = getRecords();
    const list = document.querySelector('#records-list');
    document.querySelector('#completed-count').textContent = records.length;
    document.querySelector('#average-score').textContent = records.length ? `${Math.round(records.reduce((sum,record) => sum + record.score,0) / records.length)} 分` : '--';
    if (!records.length) {
      list.innerHTML = '<p class="empty">尚無巡田紀錄，完成第一個任務後會顯示在這裡。</p>';
      return;
    }
    list.innerHTML = records.map(record => `<article class="record"><p><strong>${escapeHtml(record.id)}｜${escapeHtml(record.crop)}｜${escapeHtml(record.target)}</strong><small>${escapeHtml(record.time)} · 正確 ${record.hits} · 漏選 ${record.missed} · 誤選 ${record.wrong}</small></p><strong>${record.score} 分</strong><button type="button" data-delete="${record.recordId}" aria-label="刪除紀錄">刪除</button></article>`).join('');
  };

  const itemScore = (actual,expected,points) => actual === expected ? points : 0;
  const calculate = () => {
    const target = selectedValue('target');
    const overlap = selectedValue('overlap');
    const targetScore = itemScore(target,currentScenario.target,20);
    const planParts = [
      {key:'height',label:'飛行高度',actual:field('height').value,expected:currentScenario.height,points:8},
      {key:'route',label:'航線方式',actual:field('route').value,expected:currentScenario.route,points:8},
      {key:'angle',label:'拍攝角度',actual:field('angle').value,expected:currentScenario.angle,points:7},
      {key:'overlap',label:'影像重疊',actual:overlap,expected:currentScenario.overlap,points:7}
    ];
    const planScore = planParts.reduce((sum,item) => sum + itemScore(item.actual,item.expected,item.points),0);
    const correct = currentScenario.abnormal;
    const hits = selectedPlots.filter(id => correct.includes(id));
    const missed = correct.filter(id => !selectedPlots.includes(id));
    const wrong = selectedPlots.filter(id => !correct.includes(id));
    const imageRaw = Math.max(0,Math.round((hits.length / correct.length) * 30 - wrong.length * 5));
    const imageScore = Math.min(30,imageRaw);
    const safetyScore = form.querySelectorAll('[name="safety"]:checked').length === 3 ? 10 : 0;
    const actionScore = field('action').value === 'field' ? 10 : 0;
    const decisionScore = safetyScore + actionScore;
    const total = targetScore + planScore + imageScore + decisionScore;
    return {target,targetScore,planParts,planScore,hits,missed,wrong,imageScore,safetyScore,actionScore,decisionScore,total};
  };

  const answerRow = (label,actual,expected,score,max,explanation='') => {
    const correct = actual === expected;
    return `<article class="answer-row ${correct ? 'correct' : 'incorrect'}"><span>${correct ? '✓' : '!'}</span><p><strong>${escapeHtml(label)}</strong><small>我的答案：${escapeHtml(actual)}<br>建議答案：${escapeHtml(expected)}${explanation ? `<br>${escapeHtml(explanation)}` : ''}</small></p><strong>${score}／${max}</strong></article>`;
  };

  const createResult = () => {
    const result = calculate();
    const score = result.total;
    document.querySelector('#score').textContent = `${score} 分`;
    document.querySelector('#score-target').textContent = `${result.targetScore}／20`;
    document.querySelector('#score-plan').textContent = `${result.planScore}／30`;
    document.querySelector('#score-image').textContent = `${result.imageScore}／30`;
    document.querySelector('#score-safety').textContent = `${result.decisionScore}／20`;
    document.querySelector('#result-title').textContent = score >= 90 ? '巡田任務表現優秀' : score >= 75 ? '巡田任務表現良好' : score >= 60 ? '已掌握基本流程' : '建議重新檢視任務';
    document.querySelector('#result-lead').textContent = score >= 75 ? '您已能把田間線索、空拍規劃與影像判讀連成一次完整任務。' : '請比較自己的答案與建議答案，找出下一次可以改進的判斷。';

    const details = [];
    details.push(answerRow('主要巡田目標',targetLabels[result.target],targetLabels[currentScenario.target],result.targetScore,20,currentScenario.reason));
    result.planParts.forEach(item => details.push(answerRow(item.label,valueLabels[item.actual],valueLabels[item.expected],itemScore(item.actual,item.expected,item.points),item.points)));
    details.push(`<article class="answer-row ${result.missed.length === 0 && result.wrong.length === 0 ? 'correct' : 'incorrect'}"><span>${result.missed.length === 0 && result.wrong.length === 0 ? '✓' : '!'}</span><p><strong>疑似異常區標記</strong><small>正確標記：${escapeHtml(result.hits.join('、') || '無')}<br>漏選：${escapeHtml(result.missed.join('、') || '無')}｜誤選：${escapeHtml(result.wrong.join('、') || '無')}<br>正確答案：${escapeHtml(currentScenario.abnormal.join('、'))}</small></p><strong>${result.imageScore}／30</strong></article>`);
    details.push(answerRow('影像判讀後續行動',field('action').selectedOptions[0].text,'前往標記區域進行田間複查',result.actionScore,10,'空拍只能協助定位疑似異常，不能直接確診。'));
    document.querySelector('#answer-details').innerHTML = details.join('');

    const summary = [
      ['題目編號',currentScenario.id],['作物',`${currentScenario.crop}（${currentScenario.type}）`],
      ['地點',currentScenario.location],['已知線索',currentScenario.clue],
      ['正確目標',targetLabels[currentScenario.target]],['正確異常區',currentScenario.abnormal.join('、')]
    ];
    document.querySelector('#summary').innerHTML = summary.map(([key,value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join('');

    const feedback = [];
    if (!result.targetScore) feedback.push(`先從已知線索判斷優先任務；本題主要應確認「${targetLabels[currentScenario.target]}」。`);
    result.planParts.filter(item => item.actual !== item.expected).forEach(item => feedback.push(`${item.label}可改為「${valueLabels[item.expected]}」，讓影像更符合本次任務。`));
    if (result.missed.length) feedback.push(`漏選 ${result.missed.join('、')}，下次可加強比較相鄰區塊的顏色、紋理與排列差異。`);
    if (result.wrong.length) feedback.push(`誤選 ${result.wrong.join('、')}，不要只看單一深淺，應同時比較形狀、分布與題目線索。`);
    if (!result.actionScore) feedback.push('空拍影像不能當作確診結果；正確流程是先定位，再到現場複查。');
    if (!feedback.length) feedback.push('各項判斷完整正確。下一步可練習向同學說明：為什麼這組航線、角度與重疊率適合本題。');
    feedback.push('實際任務還要結合氣象、空域、設備續航、地形及現場人員安全。');
    document.querySelector('#feedback').innerHTML = feedback.map(item => `<li>${escapeHtml(item)}</li>`).join('');

    document.querySelectorAll('.plot').forEach(plot => {
      const id = plot.dataset.plot;
      plot.classList.toggle('reveal-correct',currentScenario.abnormal.includes(id));
      plot.classList.toggle('reveal-wrong',selectedPlots.includes(id) && !currentScenario.abnormal.includes(id));
    });

    const records = getRecords();
    records.unshift({
      recordId:Date.now(),id:currentScenario.id,time:new Date().toLocaleString('zh-TW',{hour12:false}),
      crop:currentScenario.crop,target:targetLabels[result.target],hits:result.hits.length,
      missed:result.missed.length,wrong:result.wrong.length,score
    });
    saveRecords(records);
    resultCreated = true;
    renderRecords();
  };

  document.querySelector('[data-random]').addEventListener('click',randomScenario);
  document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click',() => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 3) renderFieldMap();
    highestStep = Math.max(highestStep,currentStep + 1);
    go(currentStep + 1);
  }));
  document.querySelectorAll('[data-prev]').forEach(button => button.addEventListener('click',() => go(currentStep - 1)));
  stepButtons.forEach(button => button.addEventListener('click',() => go(Number(button.dataset.stepTarget))));
  document.querySelector('[data-clear-plots]').addEventListener('click',() => {
    if (resultCreated) return;
    selectedPlots = [];
    document.querySelectorAll('.plot').forEach(plot => plot.classList.remove('selected'));
    renderSelectedPlots();
  });
  document.querySelector('[data-toggle-overlap]').addEventListener('click',event => {
    const panel = document.querySelector('[data-overlap-explainer]');
    panel.hidden = !panel.hidden;
    event.currentTarget.setAttribute('aria-expanded',String(!panel.hidden));
    event.currentTarget.textContent = panel.hidden ? '查看專業說明＋' : '收起專業說明－';
  });
  document.querySelectorAll('[name="overlap"]').forEach(input => input.addEventListener('change',() => {
    const messages = {
      quick:['快速巡查','完整度較低｜飛行較快｜照片較少｜拼接風險較高'],
      standard:['標準巡田','完整度良好｜時間適中｜照片適中｜一般巡田適用'],
      precision:['精細巡查','完整度高｜飛行較久｜照片較多｜細部判讀適用']
    };
    const [title,text] = messages[input.value];
    document.querySelector('#overlap-impact').innerHTML = `<strong>${title}</strong><span>${text}</span>`;
  }));
  form.addEventListener('submit',event => {
    event.preventDefault();
    if (!validateStep(4)) return;
    createResult();
    highestStep = 5;
    go(5);
  });
  document.querySelector('[data-open-records]').addEventListener('click',() => {
    renderRecords();
    document.querySelector('#score').textContent = '--';
    document.querySelector('#result-title').textContent = '我的巡田紀錄';
    document.querySelector('#result-lead').textContent = '這裡保存最近 20 筆教學模擬紀錄。';
    document.querySelector('#answer-details').innerHTML = '<p class="empty">完成新的巡田任務後，這裡會顯示逐項答案與理由。</p>';
    document.querySelector('#summary').innerHTML = '<dt>查看模式</dt><dd>學習歷程</dd>';
    document.querySelector('#feedback').innerHTML = '<li>可觀察完成次數、平均分數，以及每次影像判讀的漏選與誤選情形。</li>';
    ['score-target','score-plan','score-image','score-safety'].forEach(id => document.querySelector(`#${id}`).textContent = '--');
    go(5,true);
  });
  document.querySelector('[data-edit]').addEventListener('click',() => go(resultCreated ? 4 : 1,true));
  document.querySelector('[data-reset]').addEventListener('click',() => {
    form.reset();
    currentScenario = null;
    selectedPlots = [];
    resultCreated = false;
    currentStep = highestStep = 1;
    document.querySelector('#mission-placeholder').hidden = false;
    document.querySelector('#mission-card').hidden = true;
    document.querySelector('#field-map').innerHTML = '';
    renderSelectedPlots();
    go(1,true);
  });
  document.querySelector('[data-clear-records]').addEventListener('click',() => {
    if (confirm('確定要清除全部巡田紀錄嗎？此動作無法復原。')) {
      saveRecords([]);
      renderRecords();
      showToast('巡田紀錄已清除。');
    }
  });
  document.querySelector('#records-list').addEventListener('click',event => {
    const id = event.target.dataset.delete;
    if (!id) return;
    if (confirm('確定刪除這筆紀錄嗎？')) {
      saveRecords(getRecords().filter(record => String(record.recordId) !== id));
      renderRecords();
    }
  });

  renderRecords();
})();
