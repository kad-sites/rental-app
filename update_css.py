import re

with open('app/globals.css', 'r') as f:
    css = f.read()

css = re.sub(r'rgba\(255,\s*255,\s*255,\s*0\.0[0-9]\)', 'rgba(0, 0, 0, 0.05)', css)
css = re.sub(r'rgba\(255,\s*255,\s*255,\s*0\.1\)', 'rgba(0, 0, 0, 0.08)', css)
css = re.sub(r'rgba\(30,\s*41,\s*59,\s*0\.[3-9]\)', 'var(--surface-color)', css)
css = re.sub(r'rgba\(15,\s*23,\s*42,\s*0\.[7-9]\)', 'var(--surface-color)', css)
css = css.replace('color: #fff;', 'color: var(--text-primary);')
css = css.replace('color: #ffffff;', 'color: var(--text-primary);')
css = css.replace('color: white;', 'color: var(--text-primary);')
css = css.replace('background: #050505;', 'background: var(--surface-color);')
css = css.replace('background: #000;', 'background: var(--surface-color);')
css = css.replace('border-bottom: 1px solid rgba(255,255,255,0.03);', 'border-bottom: 1px solid rgba(0,0,0,0.03);')
css = css.replace('border: 1px solid rgba(255,255,255,0.05);', 'border: 1px solid rgba(0,0,0,0.05);')

css = css.replace('box-shadow: 0 15px 35px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.3), inset 0 0 10px rgba(16, 185, 129, 0.1);', 'box-shadow: 0 15px 35px rgba(0,0,0,0.05);')
css = css.replace('box-shadow: 0 15px 35px rgba(0,0,0,0.5), 0 0 15px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.1);', 'box-shadow: 0 15px 35px rgba(0,0,0,0.05);')
css = css.replace('backdrop-filter: blur(12px);', 'box-shadow: 0 10px 25px rgba(0,0,0,0.02);')
css = css.replace('border-color: rgba(16, 185, 129, 0.4);', 'border-color: rgba(0, 0, 0, 0.1);')
css = css.replace('background: linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));', 'background: var(--surface-color);')

with open('app/globals.css', 'w') as f:
    f.write(css)
print('Updated globals.css')
