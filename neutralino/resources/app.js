let currentPath = '..';

async function scan(path) {
  try {
    const cmd = `go run ../main.go -dir "${path}" -json`;
    const result = await Neutralino.os.execCommand(cmd);
    const items = JSON.parse(result.stdOut);
    currentPath = path;
    document.getElementById('cwd').textContent = path;
    render(items);
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

scan(currentPath);
