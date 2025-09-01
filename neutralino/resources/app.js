let currentPath = '..';
let currentTheme = 'light';
const progressEl = document.getElementById('progress');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');

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
    const proc = await Neutralino.os.spawnProcess(cmd);
    progressEl.classList.remove('hidden');
    progressBar.value = 0;
    progressPercent.textContent = '0%';

    let stdout = '';
    let stderrBuf = '';
    const handler = async evt => {
      if (evt.detail.id !== proc.id) return;
      switch (evt.detail.action) {
        case 'stdOut':
          stdout += evt.detail.data;
          break;
        case 'stdErr':
          stderrBuf += evt.detail.data;
          const lines = stderrBuf.split('\n');
          stderrBuf = lines.pop();
          lines.forEach(line => {
            const m = line.match(/PROGRESS (\d+) (\d+)/);
            if (m) {
              const current = parseInt(m[1], 10);
              const total = parseInt(m[2], 10);
              const percent = Math.round((current / total) * 100);
              progressBar.value = percent;
              progressPercent.textContent = `${percent}%`;
            }
          });
          break;
        case 'exit':
          Neutralino.events.off('spawnedProcess', handler);
          progressEl.classList.add('hidden');
          try {
            const items = JSON.parse(stdout);
            currentPath = path;
            document.getElementById('cwd').textContent = path;
            render(items);
            await saveSession();
          } catch (e) {
            console.error('parse failed', e);
          }
          break;
      }
    };

    Neutralino.events.on('spawnedProcess', handler);
  } catch (e) {
    console.error(e);
  }
}

function render(items) {
  const list = document.getElementById('items');
  list.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${item.name} (${item.size})`;
    if (item.isDir) {
      li.classList.add('dir');
      nameSpan.addEventListener('click', () => scan(item.path));
    }
    li.appendChild(nameSpan);

    const actions = document.createElement('span');
    actions.classList.add('actions');

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      deleteItem(item.path);
    });
    actions.appendChild(delBtn);

    const renBtn = document.createElement('button');
    renBtn.textContent = 'Rename';
    renBtn.addEventListener('click', e => {
      e.stopPropagation();
      renameItem(item.path);
    });
    actions.appendChild(renBtn);

    const moveBtn = document.createElement('button');
    moveBtn.textContent = 'Move';
    moveBtn.addEventListener('click', e => {
      e.stopPropagation();
      moveItem(item.path);
    });
    actions.appendChild(moveBtn);

    li.appendChild(actions);
    list.appendChild(li);
  });
}

async function deleteItem(path) {
  if (confirm('Delete this item?')) {
    try {
      await Neutralino.os.execCommand(`rm -rf "${path}"`);
      scan(currentPath);
    } catch (e) {
      console.error('delete failed', e);
    }
  }
}

async function renameItem(path) {
  const parts = path.split('/');
  const currentName = parts.pop();
  const dir = parts.join('/');
  const newName = prompt('Enter new name', currentName);
  if (newName && newName !== currentName) {
    try {
      await Neutralino.os.execCommand(`mv "${path}" "${dir}/${newName}"`);
      scan(currentPath);
    } catch (e) {
      console.error('rename failed', e);
    }
  }
}

async function moveItem(path) {
  const targetDir = prompt('Move to directory', currentPath);
  if (targetDir) {
    try {
      await Neutralino.os.execCommand(`mv "${path}" "${targetDir}"`);
      scan(currentPath);
    } catch (e) {
      console.error('move failed', e);
    }
  }
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
