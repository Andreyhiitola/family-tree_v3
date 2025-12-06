with open('script.js', 'r') as f:
    content = f.read()

lines = content.split('\n')
stack = []

for i, line in enumerate(lines, 1):
    for j, char in enumerate(line):
        if char == '{':
            stack.append((i, j+1))
        elif char == '}':
            if stack:
                stack.pop()
            else:
                print(f"Extra '}}' at line {i}, column {j+1}")

print(f"\nUnclosed braces at line 384:")
for line_num, col in stack:
    if line_num < 384:
        print(f"  Line {line_num}, column {col}: {lines[line_num-1]}")

if stack and stack[-1][0] < 384:
    print(f"\nLast unclosed brace at line {stack[-1][0]}")
    print(f"Context: {lines[stack[-1][0]-1]}")
