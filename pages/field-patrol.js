(() => {
  'use strict';
  const form = document.querySelector('#patrol-form');
  const steps = [...document.querySelectorAll('.form-step')];
  const stepButtons = [...document.querySelectorAll('[data-step-target]')];
  const toast = document.querySelector('.toast');
  const storageKey = 'aiakos-field-patrol-v1-records';
  const cropTypes = {水稻:'低矮作物',玉米:'中型作物',花生:'低矮作物',香蕉:'高大作物',芒果:'果園／林木',蓮霧:'果園／林木',葡萄:'棚架作物',百香果:'棚架作物'};
  const scenarios = [
    ['水稻','屏東縣萬丹鄉教學田區','營養生長期','中型田區（1～3公頃）','生長差異','田區局部顏色異常'],
    ['香蕉','屏東縣內埔鄉香蕉園','營養生長期','小型田區（1公頃以下）','倒伏或風災損傷','曾有強風或豪雨'],
    ['芒果','屏東縣枋山鄉芒果園','結果／充實期','中型田區（1～3公頃）','疑似病蟲害','農民回報生長不一致'],
    ['花生','雲林縣元長鄉花生田','開花期','大型田區（3公頃以上）','缺水或排水異常','近期降雨不均'],
    ['葡萄','彰化縣大村鄉葡萄園','結果／充實期','小型田區（1公頃以下）','生長差異','田區局部顏色異常'],
    ['玉米','嘉義縣大林鎮玉米田','營養生長期','大型田區（3公頃以上）','倒伏或風災損傷','曾有強風或豪雨']
  ];
  let currentStep = 1;
  let highestStep = 1;
  let selectedPlots = [];
  let resultCreated = false;

  const field = name => form.elements[name];
  const showToast = message => {
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    toast.setAttribute('aria-hidden','false');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.classList.remove('show'); toast.setAttribute('aria-hidden','true'); }, 2600);
  };
  const go = (number, allowRecords = false) => {
    if (number > highestStep && !allowRecords) return showToast('請依序完成前面的巡田步驟。');
    currentStep = number;
    steps.forEach(step => { const active = Number(step.dataset.step) === number; step.hidden = !active; step.classList.toggle('active',active); });
    stepButtons.forEach(button => {
      const value = Number(button.dataset.stepTarget);
      button.classList.toggle('active',value === number);
      button.classList.toggle('done',value < highestStep);
    });
    window.scrollTo({top:document.querySelector('.workspace').offsetTop - 80,behavior:'smooth'});
  };
  const validateStep = number => {
    const section = document.querySelector(`[data-step="${number}"]`);
    let valid = true;
    section.querySelectorAll('.error').forEach(error => error.textContent = '');
    section.querySelectorAll('[required]').forEach(control => {
      const radioGroup = control.type === 'radio';
      const ok = radioGroup ? !!form.querySelector(`[name="${control.name}"]:checked`) : control.checkValidity();
      if (!ok) {
        valid = false;
        const holder = radioGroup ? control.closest('fieldset') : control.closest('label');
        const error = holder && holder.querySelector('.error');
        if (error) error.textContent = '請完成此欄位';
      }
    });
    if (number === 3 && form.querySelectorAll('[name="safety"]:checked').length < 3) {
      valid = false;
      showToast('三項起飛前安全確認都必須完成。');
    }
    if (number === 4 && selectedPlots.length === 0) {
      valid = false;
      showToast('請至少標記一個需要田間複查的區域。');
    }
    if (!valid) showToast('請完成所有必填內容後再繼續。');
    return valid;
  };
  const setCropType = () => { field('cropType').value = cropTypes[field('crop').value] || ''; };
  const setRadio = (name,value) => {
    const input = form.querySelector(`[name="${name}"][value="${value}"]`);
    if (input) input.checked = true;
  };
  const randomScenario = () => {
    const s = scenarios[Math.floor(Math.random()*scenarios.length)];
    field('crop').value=s[0]; setCropType(); field('location').value=s[1];
    field('date').value=new Date().toISOString().slice(0,10); field('stage').value=s[2]; field('area').value=s[3];
    setRadio('target',s[4]);
    form.querySelectorAll('[name="clue"]').forEach(c => c.checked=c.value===s[5]);
    showToast('已產生完整情境，仍需由您完成巡田規劃。');
  };
  const renderPlots = () => {
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
    document.querySelector('#average-score').textContent = records.length ? `${Math.round(records.reduce((a,r)=>a+r.score,0)/records.length)}分` : '--';
    if (!records.length) { list.innerHTML='<p class="empty">尚無巡田紀錄，完成第一個任務後會顯示在這裡。</p>'; return; }
    list.innerHTML = records.map(r => `<article class="record"><p><strong>${r.crop}｜${r.target}</strong><small>${r.time} · 標記 ${r.plots.join('、')}</small></p><strong>${r.score}分</strong><button type="button" data-delete="${r.id}" aria-label="刪除紀錄">刪除</button></article>`).join('');
  };
  const calculate = () => {
    let score = 40;
    const feedback = [];
    const route = field('route').value, target = form.querySelector('[name="target"]:checked').value;
    if (route !== 'random') score += 15; else feedback.push('自由飛行缺乏一致的影像覆蓋，建議改用網格、行列或定點航線。');
    if (field('overlap').value === 'adequate') score += 15; else feedback.push('影像重疊不足，可能造成田區遺漏或不利後續比較。');
    if (field('action').value === 'field') score += 20; else feedback.push('空拍影像只能標記疑似異常，正確下一步是到田間複查。');
    const correct = ['A3','B2','B3'];
    const hit = selectedPlots.filter(p => correct.includes(p)).length;
    if (hit >= 2) score += 10; else feedback.push('模擬影像中的 A3、B2、B3 顏色與紋理較不一致，值得優先複查。');
    if (!feedback.length) feedback.push('規劃完整：任務目標、航線、影像重疊與田間複查的順序皆正確。');
    feedback.push(`本次「${target}」只完成初步篩查，實際原因仍需結合近距離觀察、歷史紀錄與專業判斷。`);
    return {score:Math.min(score,100),feedback};
  };
  const createResult = () => {
    const {score,feedback} = calculate();
    document.querySelector('#score').textContent=`${score}分`;
    document.querySelector('#result-title').textContent=score>=80?'巡田規劃表現良好':score>=60?'巡田規劃基本完成':'巡田規劃需要調整';
    document.querySelector('#result-lead').textContent=score>=80?'您已掌握先設定目標、再規劃影像與安排田間複查的基本流程。':'請閱讀回饋後返回修改，再建立更完整的巡田策略。';
    const data = new FormData(form);
    const summary=[['作物',`${data.get('crop')}（${data.get('cropType')}）`],['地點',data.get('location')],['觀察目標',data.get('target')],['航線',field('route').selectedOptions[0].text],['拍攝',`${field('height').selectedOptions[0].text}／${field('angle').selectedOptions[0].text}`],['標記區域',selectedPlots.join('、')]];
    document.querySelector('#summary').innerHTML=summary.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');
    document.querySelector('#feedback').innerHTML=feedback.map(item=>`<li>${item}</li>`).join('');
    const records=getRecords();
    records.unshift({id:Date.now(),time:new Date().toLocaleString('zh-TW',{hour12:false}),crop:data.get('crop'),target:data.get('target'),plots:[...selectedPlots],score});
    saveRecords(records); resultCreated=true; renderRecords();
  };

  field('crop').addEventListener('change',setCropType);
  document.querySelector('[data-random]').addEventListener('click',randomScenario);
  document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click',() => {
    if (!validateStep(currentStep)) return;
    highestStep=Math.max(highestStep,currentStep+1); go(currentStep+1);
  }));
  document.querySelectorAll('[data-prev]').forEach(button=>button.addEventListener('click',()=>go(currentStep-1)));
  stepButtons.forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.stepTarget))));
  document.querySelectorAll('.plot').forEach(plot=>plot.addEventListener('click',()=>{
    const id=plot.dataset.plot;
    selectedPlots=selectedPlots.includes(id)?selectedPlots.filter(p=>p!==id):[...selectedPlots,id];
    plot.classList.toggle('selected',selectedPlots.includes(id)); renderPlots();
  }));
  document.querySelector('[data-clear-plots]').addEventListener('click',()=>{selectedPlots=[];document.querySelectorAll('.plot').forEach(p=>p.classList.remove('selected'));renderPlots();});
  form.addEventListener('submit',event=>{event.preventDefault();if(!validateStep(4))return;createResult();highestStep=5;go(5);});
  document.querySelector('[data-open-records]').addEventListener('click',()=>{renderRecords();document.querySelector('#score').textContent='--';document.querySelector('#result-title').textContent='我的巡田紀錄';document.querySelector('#result-lead').textContent='這裡保存最近20筆教學模擬紀錄。';document.querySelector('#summary').innerHTML='<dt>查看模式</dt><dd>學習歷程</dd>';document.querySelector('#feedback').innerHTML='<li>完成新的巡田任務後，系統會更新完成次數與平均分數。</li>';go(5,true);});
  document.querySelector('[data-edit]').addEventListener('click',()=>go(resultCreated?4:1,true));
  document.querySelector('[data-reset]').addEventListener('click',()=>{form.reset();setCropType();selectedPlots=[];document.querySelectorAll('.plot').forEach(p=>p.classList.remove('selected'));renderPlots();currentStep=highestStep=1;resultCreated=false;go(1,true);});
  document.querySelector('[data-clear-records]').addEventListener('click',()=>{if(confirm('確定要清除全部巡田紀錄嗎？此動作無法復原。')){saveRecords([]);renderRecords();showToast('巡田紀錄已清除。');}});
  document.querySelector('#records-list').addEventListener('click',event=>{const id=event.target.dataset.delete;if(!id)return;if(confirm('確定刪除這筆紀錄嗎？')){saveRecords(getRecords().filter(r=>String(r.id)!==id));renderRecords();}});
  renderRecords();
})();
