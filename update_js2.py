import os
import re

for root, _, files in os.walk('app'):
    for f in files:
        if f.endswith('.js') or f.endswith('.jsx') or f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            content = re.sub(r'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(0\.\d+)\s*\)', r'rgba(0,0,0,\1)', content)
            
            # replace hardcoded hex
            content = content.replace("color: '#fff'", "color: 'var(--text-primary)'")
            content = content.replace("color: 'white'", "color: 'var(--text-primary)'")
            content = content.replace("color: '#ffffff'", "color: 'var(--text-primary)'")
            content = content.replace("background: '#050505'", "background: 'var(--surface-color)'")
            
            with open(path, 'w', encoding='utf-8') as file:
                file.write(content)
