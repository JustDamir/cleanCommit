# Clean Commit

[![Go Version](https://img.shields.io/badge/Go-1.20+-00ADD8?logo=go)](https://golang.org/)
[![Python Version](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Accuracy](https://img.shields.io/badge/Accuracy-97.6%25-success)]()

**Clean Commit** — AI-powered сервис для определения, был ли код написан человеком или сгенерирован искусственным интеллектом.

<p align="center">
  <img src=".github/screenshot.png" alt="Clean Commit Screenshot" width="800"/>
</p>

## Возможности

- **Точность 97.6%** — XGBoost модель обучена на 10,000 образцах
- **4 языка** — Python, Java, C, C++
- **2 темы** — светлая и тёмная (терминальный стиль)
- **Быстрый анализ** — <100ms на запрос
- **Подробные метрики** — энтропия, строки, комментарии

## Быстрый старт

### Требования
- Go 1.20+
- Python 3.8+
- 100 MB RAM

### Установка и запуск

```bash
git clone https://github.com/JustDamir/clean-commit.git
cd clean-commit

chmod +x start.sh
chmod +x python_service/start.sh

./start.sh
