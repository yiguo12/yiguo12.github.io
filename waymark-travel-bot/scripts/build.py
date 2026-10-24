from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'src'
GENERATED = ROOT / '.generated'
GENERATED.mkdir(exist_ok=True)

javascript = (SOURCE / 'app.js').read_text(encoding='utf-8')
javascript = javascript.replace('__ICONS__', (SOURCE / 'icons.json').read_text(encoding='utf-8'))
javascript = javascript.replace('__RESULTS_JS__', (SOURCE / 'results.js').read_text(encoding='utf-8'))
styles = (SOURCE / 'styles.css').read_text(encoding='utf-8') + '\n' + (SOURCE / 'results.css').read_text(encoding='utf-8')
template = (SOURCE / 'template.html').read_text(encoding='utf-8')

for entry, filename, script in [('chat', 'index.html', 'app.js'), ('results', 'results.html', 'results.js')]:
    code = javascript.replace('__BOOT_VIEW__', repr(entry))
    html = template.replace('__CSS__', styles).replace('__JS__', code)
    (ROOT / filename).write_text(html, encoding='utf-8')
    (GENERATED / script).write_text(code, encoding='utf-8')
    print('Built', filename)

node = shutil.which('node')
if node:
    subprocess.run([node, str(ROOT / 'scripts' / 'prerender.cjs')], cwd=ROOT, check=True)
