const box = document.getElementById('on');
chrome.storage.local.get('xtEnabled', (d) => { box.checked = d.xtEnabled !== false; });
box.addEventListener('change', () => chrome.storage.local.set({ xtEnabled: box.checked }));
