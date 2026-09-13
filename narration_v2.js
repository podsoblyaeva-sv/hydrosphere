/* Готовая русская озвучка: один файл, синхронизация с его временем воспроизведения. */
(() => {
  'use strict';
  const audio = document.getElementById('narration-audio');
  const button = document.getElementById('narration-button');
  const controls = document.getElementById('narration-controls');
  const status = document.getElementById('narration-status');
  const progress = document.getElementById('narration-progress');
  const stageButtons = Array.from(document.querySelectorAll('.stg-btn'));
  const cues = window.hydrosphereNarrationCues;
  if (!audio || !button || !Array.isArray(cues) || cues.length !== 5) return;
  let active = false;
  let run = 0;
  let currentStage = -1;
  const allSelected = () => stageButtons.some(b => b.dataset.stg === 'all' && b.classList.contains('on'));
  const setPlaying = playing => {
    document.body.classList.toggle('narration-playing', playing);
    document.dispatchEvent(new CustomEvent('hydrosphere:narration', {detail: {playing}}));
  };
  function restoreOverview() {
    if (!allSelected()) return;
    document.querySelectorAll('.three-info').forEach(el => el.classList.toggle('vis', el.id === 'ti-all'));
  }
  function stop(message = 'Ксения · русский язык', restore = true) {
    active = false;
    run++;
    audio.pause();
    audio.currentTime = 0;
    currentStage = -1;
    button.textContent = '🔊 Озвучить все этапы';
    button.setAttribute('aria-pressed', 'false');
    status.textContent = message;
    progress.hidden = true;
    progress.value = 0;
    stageButtons.forEach(b => b.classList.remove('narrating'));
    setPlaying(false);
    if (restore) restoreOverview();
  }
  function syncStage() {
    if (!active) return;
    const cue = [...cues].reverse().find(c => audio.currentTime >= c.start) || cues[0];
    if (Number.isFinite(audio.duration) && audio.duration > 0) progress.value = Math.min(100, audio.currentTime / audio.duration * 100);
    if (cue.stage === currentStage) return;
    currentStage = cue.stage;
    stageButtons.forEach(b => b.classList.toggle('narrating', b.dataset.stg === String(cue.stage)));
    document.querySelectorAll('.three-info').forEach(el => el.classList.toggle('vis', el.id === 'ti-' + cue.stage));
    status.textContent = `${cue.stage + 1} из ${cues.length} · ${cue.title}`;
  }
  button.addEventListener('click', () => {
    if (active) { stop('Озвучка остановлена. Можно включить заново.'); return; }
    if (!allSelected()) return;
    const token = ++run;
    active = true;
    audio.currentTime = 0;
    button.textContent = '⏹ Остановить озвучку';
    button.setAttribute('aria-pressed', 'true');
    status.textContent = 'Загружаем озвучку…';
    progress.hidden = false;
    setPlaying(true);
    // Вызов play непосредственно из нажатия нужен для мобильных браузеров.
    const result = audio.play();
    if (result && result.catch) result.catch(() => {
      if (token === run) stop('Не удалось включить звук. Проверьте интернет и нажмите ещё раз.');
    });
  });
  audio.addEventListener('playing', () => { if (active) syncStage(); else audio.pause(); });
  audio.addEventListener('timeupdate', syncStage);
  audio.addEventListener('ended', () => { if (active) stop('Все пять этапов озвучены. Послушаем ещё раз?'); });
  audio.addEventListener('error', () => { if (active) stop('Не удалось загрузить озвучку. Проверьте интернет и попробуйте снова.'); });
  audio.addEventListener('pause', () => { if (active && audio.paused && !audio.ended) stop('Озвучка остановлена. Можно включить заново.'); });
  stageButtons.forEach(b => b.addEventListener('click', () => {
    if (active) stop('Ксения · русский язык', false);
    controls.hidden = b.dataset.stg !== 'all';
  }, true));
  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.tab !== 'p-3d' && active) stop();
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden && active) stop(); });
  window.addEventListener('pagehide', () => { if (active) stop(); });
})();
