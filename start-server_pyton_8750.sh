#!/bin/bash
# Зайди в папку проекта
cd /home/andy/family-tree_v3


pkill -f http.server
# Python 3
python3 -m http.server 8760

# Открой браузер: http://localhost:8760
