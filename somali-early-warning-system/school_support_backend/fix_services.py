with open('dashboard/services.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('.get_full_name()', '.name')

with open('dashboard/services.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all get_full_name() -> .name")
