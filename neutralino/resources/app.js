let currentPath = '..';
let currentTheme = 'light';

async function loadSession() {
  try {
    const data = await Neutralino.storage.getData('session');
    if (data) {
      const session = JSON.parse(data);
      if (session.path) currentPath = session.path;
      if (session.theme) setTheme(session.theme);
    }
  } catch (e) {
    console.warn('No session', e);
  }
}

function setTheme(theme) {
  currentTheme = theme;
  document.body.classList.remove('light', 'dark');
  document.body.classList.add(theme);
}

async function saveSession() {
  try {
    await Neutralino.storage.setData(
      'session',
      JSON.stringify({ path: currentPath, theme: currentTheme })
    );
  } catch (e) {
    console.error('saveSession failed', e);
  }
}

async function scan(path) {
  try {
    const cmd = `go run ../main.go -dir "${path}" -json`;
    const result = await Neutralino.os.execCommand(cmd);
    const items = JSON.parse(result.stdOut);
    currentPath = path;
    document.getElementById('cwd').textContent = path;
    render(items);
    await saveSession();
  } catch (e) {
    console.error(e);
  }
}

function render(items) {
  const list = document.getElementById('items');
  list.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} (${item.size})`;
    if (item.isDir) {
      li.classList.add('dir');
      li.addEventListener('click', () => scan(item.path));
    }
    list.appendChild(li);
  });
}

document.getElementById('up').addEventListener('click', () => {
  scan(currentPath + '/..');
});

document.getElementById('toggle-theme').addEventListener('click', () => {
  const next = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(next);
  saveSession();
});

(async function init() {
  await loadSession();
  scan(currentPath);
})();
