#!/bin/bash
case "$1" in
    start)
        python3 -m http.server 8760 &
        echo "Сервер запущен на порту 8760"
        ;;
    stop)
        pkill -f "http.server 8760"
        echo "Сервер остановлен"
        ;;
    restart)
        pkill -f "http.server 8760"
        sleep 1
        python3 -m http.server 8760 &
        echo "Сервер перезапущен"
        ;;
    status)
        if pgrep -f "http.server 8760" > /dev/null; then
            echo "✅ Сервер работает на порту 8760"
        else
            echo "❌ Сервер не работает"
        fi
        ;;
    *)
        echo "Использование: $0 {start|stop|restart|status}"
        exit 1
esac
