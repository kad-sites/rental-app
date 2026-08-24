import re

with open('app/globals.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add specific background colors to cards
css = css.replace('.stat-card-app.card-tenants:hover, .stat-card-app.card-tenants.active {', 
                  '.stat-card-app.card-tenants { background: var(--success-color); border: none; }\n.stat-card-app.card-tenants:hover, .stat-card-app.card-tenants.active {')

css = css.replace('.stat-card-app.card-rent:hover, .stat-card-app.card-rent.active {', 
                  '.stat-card-app.card-rent { background: var(--warning-color); border: none; }\n.stat-card-app.card-rent:hover, .stat-card-app.card-rent.active {')

css = css.replace('.stat-card-app.card-deposits:hover, .stat-card-app.card-deposits.active {', 
                  '.stat-card-app.card-deposits { background: var(--primary-color); border: none; }\n.stat-card-app.card-deposits:hover, .stat-card-app.card-deposits.active {')

# Also text inside them should be dark
css = css.replace('.stat-card-app .stat-value {\n  font-size: 2.2rem;\n  font-weight: 500;\n  color: var(--text-primary);',
                  '.stat-card-app .stat-value {\n  font-size: 2.2rem;\n  font-weight: 700;\n  color: #1e293b;')
                  
css = css.replace('.stat-card-app .stat-label {\n  color: var(--text-secondary);',
                  '.stat-card-app .stat-label {\n  color: #475569;')

with open('app/globals.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('Updated card colors')
