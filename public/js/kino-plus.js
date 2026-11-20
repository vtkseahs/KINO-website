'use strict';

const downloadReport = document.getElementById('download-report');
if (downloadReport) {
  downloadReport.hidden = false;
  downloadReport.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    const feedback = document.getElementById('report-feedback');
    if (!ctx) {
      feedback.textContent = 'Браузер не смог создать карточку.';
      return;
    }

    const { period, count, minutes } = downloadReport.dataset;
    ctx.fillStyle = '#2a191f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f7a8ad';
    ctx.fillRect(64, 71, 46, 5);
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('КИНО PLUS', 132, 82);
    ctx.fillStyle = '#fff5f6';
    ctx.font = 'bold 76px system-ui, sans-serif';
    ctx.fillText('Мои киноитоги', 64, 205, 832);
    ctx.fillStyle = '#e8cdd6';
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillText(period, 66, 268);
    ctx.fillStyle = '#fff5f6';
    ctx.font = 'bold 88px system-ui, sans-serif';
    ctx.fillText(count, 64, 454);
    ctx.fillText((Number(minutes) / 60).toLocaleString('ru-RU', { maximumFractionDigits: 1 }), 516, 454, 380);
    ctx.fillStyle = '#e8cdd6';
    ctx.font = '30px system-ui, sans-serif';
    ctx.fillText('Фильмы', 66, 510);
    ctx.fillText('Часы просмотра', 518, 510);

    canvas.toBlob((image) => {
      if (!image) {
        feedback.textContent = 'Карточку не удалось сохранить.';
        return;
      }
      const objectUrl = URL.createObjectURL(image);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'kino-itogi.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }, 'image/png');
  });
}

const copyGroupLink = document.getElementById('copy-group-link');
if (copyGroupLink && navigator.clipboard) {
  copyGroupLink.hidden = false;
  copyGroupLink.addEventListener('click', async () => {
    const feedback = document.getElementById('group-feedback');
    try {
      await navigator.clipboard.writeText(window.location.href);
      feedback.textContent = 'Ссылка скопирована.';
    } catch {
      feedback.textContent = 'Скопируйте ссылку из адресной строки.';
    }
  });
}
