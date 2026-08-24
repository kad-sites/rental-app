import re

with open('app/globals.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix background rgba values (dark transparent to light transparent)
css = re.sub(r'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.0[0-9]\s*\)', 'rgba(0, 0, 0, 0.04)', css)
css = re.sub(r'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.1\s*\)', 'rgba(0, 0, 0, 0.08)', css)
css = re.sub(r'rgba\(\s*30\s*,\s*41\s*,\s*59\s*,\s*0\.[3-9]\s*\)', 'var(--surface-color)', css)
css = re.sub(r'rgba\(\s*15\s*,\s*23\s*,\s*42\s*,\s*0\.[7-9]\s*\)', 'var(--surface-color)', css)
css = css.replace("color: #fff;", "color: var(--text-primary);")
css = css.replace("color: #ffffff;", "color: var(--text-primary);")
css = css.replace("color: white;", "color: var(--text-primary);")
css = css.replace("background: #050505;", "background: var(--surface-color);")
css = css.replace("background: #000;", "background: var(--surface-color);")

# Remove glows
css = re.sub(r'text-shadow: 0 0 20px rgba\([^)]+\);', '', css)
css = css.replace('box-shadow: 0 15px 35px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.3), inset 0 0 10px rgba(16, 185, 129, 0.1);', 'box-shadow: 0 8px 30px rgba(0,0,0,0.04);')
css = css.replace('box-shadow: 0 15px 35px rgba(0,0,0,0.5), 0 0 15px rgba(239, 68, 68, 0.3), inset 0 0 10px rgba(239, 68, 68, 0.1);', 'box-shadow: 0 8px 30px rgba(0,0,0,0.04);')
css = css.replace('backdrop-filter: blur(12px);', 'box-shadow: 0 2px 10px rgba(0,0,0,0.02);')

# Update stat cards
css = css.replace('.stat-card-app {', '.stat-card-app { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); background: var(--surface-color);')
css = css.replace('.stat-card-app:hover {\n  transform: translateY(-5px);\n  background: rgba(30, 41, 59, 0.6);\n}', '.stat-card-app:hover {\n  transform: translateY(-2px);\n}')

# Specific colors for stat values
css = re.sub(r'\.stat-card-app \.stat-value\s*\{[^}]*\}', 
             '.stat-card-app .stat-value { font-size: 2.2rem; font-weight: 600; z-index: 1; }', css)
css = re.sub(r'\.stat-card-app \.stat-label\s*\{[^}]*\}', 
             '.stat-card-app .stat-label { color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; z-index: 1; margin-bottom: 0.5rem; }', css)

# Make sure values are colored based on their card type
# We'll inject these rules
css += "\n.stat-card-app.card-tenants .stat-value { color: #1e293b; }\n.stat-card-app.card-rent .stat-value { color: #0284c7; }\n.stat-card-app.card-deposits .stat-value { color: #8b5cf6; }\n"
css += "\n.stat-card-app.card-tenants { border-top: 3px solid #14b8a6; }\n.stat-card-app.card-rent { border-top: 3px solid #0284c7; }\n.stat-card-app.card-deposits { border-top: 3px solid #8b5cf6; }\n"

# Remove button dark background override
css = css.replace('background: linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));', 'background: var(--surface-color);')

with open('app/globals.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('Updated globals.css')
