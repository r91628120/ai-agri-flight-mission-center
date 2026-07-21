document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-button');
  const navLinks = document.querySelector('#nav-links');
  const toast = document.querySelector('.toast');
  let toastTimer;

  const showToast = (title, message) => {
    if (!toast) return;
    const toastTitle = toast.querySelector('strong');
    const toastMessage = toast.querySelector('span');
    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = message;
    toast.classList.add('show');
    toast.setAttribute('aria-hidden', 'false');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('show');
      toast.setAttribute('aria-hidden', 'true');
    }, 3200);
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navLinks?.classList.toggle('open', !isOpen);
  });

  navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuButton?.setAttribute('aria-expanded', 'false');
    });
  });

  document.querySelectorAll('[data-planned]').forEach((element) => {
    element.addEventListener('click', () => {
      showToast('功能規劃中', '此功能將於後續版本逐步建立。');
    });
  });

  document.querySelector('[data-advice-detail]')?.addEventListener('click', () => {
    showToast('今日 AI 飛行建議', '依示範風速 3.2 m/s、降雨機率 10% 整理；空域仍須另行確認。');
  });

  document.querySelector('[data-summary-detail]')?.addEventListener('click', () => {
    showToast('AI 決策摘要說明', '目前為介面示範，尚未連接真實氣象、田區、衛星或空域資料。');
  });

  document.querySelectorAll('[data-announcement]').forEach((button) => {
    button.addEventListener('click', () => {
      showToast('公告內容', button.dataset.announcement || '暫無更多內容。');
    });
  });
});
