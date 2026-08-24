import re

with open('app/globals.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Remove glowing text shadows
css = re.sub(r'text-shadow: 0 0 20px rgba\([^)]+\);', '', css)

# Make sure all stat values are dark
css = re.sub(r'\.stat-card-app \.stat-value\s*\{[^}]*\}', 
             '.stat-card-app .stat-value { font-size: 2.2rem; font-weight: 700; color: #1e293b; z-index: 1; }', css)

# Make sure stat labels are dark
css = re.sub(r'\.stat-card-app \.stat-label\s*\{[^}]*\}', 
             '.stat-card-app .stat-label { color: #475569; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; z-index: 1; }', css)

# Remove glowing effects from quick actions
css = css.replace('background: rgba(16, 185, 129, 0.1);', 'background: var(--success-color);')
css = css.replace('color: #fff;', 'color: #1e293b;')
css = css.replace('color: var(--text-primary);', 'color: #1e293b;')

with open('app/globals.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('Cleaned up text shadows and colors')
