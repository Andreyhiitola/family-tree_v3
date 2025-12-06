with open('script.js', 'r') as f:
    lines = f.readlines()

in_method = False
method_stack = []

for i, line in enumerate(lines, 1):
    stripped = line.strip()
    
    # Начало метода класса (4 пробела в начале, затем имя метода)
    if line.startswith('    ') and not line.startswith('     ') and ' {' in line and '(' in line:
        if not in_method:
            print(f"Method starts at line {i}: {stripped}")
            in_method = True
        else:
            print(f"ERROR: Nested method at line {i} without closing previous")
    
    # Закрывающая скобка метода
    if stripped == '}':
        if in_method:
            print(f"Method ends at line {i}")
            in_method = False
        else:
            print(f"ERROR: Extra closing brace at line {i}")

    if i >= 350 and i <= 400:
        print(f"Line {i}: {stripped}")

print(f"\nAt line 384, in_method = {in_method}")
