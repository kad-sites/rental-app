with open('app/globals.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace('border-radius: 20px;', 'border-radius: 32px;')
css = css.replace('border-radius: 16px;', 'border-radius: 24px;')

with open('app/globals.css', 'w', encoding='utf-8') as f:
    f.write(css)
