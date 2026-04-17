from flask import Flask, request, jsonify
import pickle
import numpy as np
from feature_extractor import extract_features
import sys

app = Flask(__name__)

# Пробуем загрузить модель
try:
    with open('model.pkl', 'rb') as f:
        loaded = pickle.load(f)
    print(f"📦 Model file loaded")
    USE_HEURISTICS = False if hasattr(loaded, 'predict') else True
except:
    USE_HEURISTICS = True

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({'error': 'No code provided'}), 400

    code = data['code']
    language = data.get('language', 'auto')

    features_dict = extract_features(code, language)

    print("\n" + "="*50)
    print(f"📊 Analyzing code ({len(code)} chars)")

    # Извлекаем метрики
    entropy = features_dict.get('char_entropy', 4.0)
    comment_ratio = features_dict.get('comment_ratio', 0.1)
    avg_line_length = features_dict.get('avg_line_length', 40)
    line_count = features_dict.get('line_count', 1)
    indentation_variety = features_dict.get('indentation_variety', 3)

    # НОВЫЕ, БОЛЕЕ МЯГКИЕ КРИТЕРИИ
    ai_score = 0.0

    # Энтропия (30%) - пониженный вес и пороги
    if entropy > 4.8:
        ai_score += 0.30  # Очень высокая энтропия
    elif entropy > 4.5:
        ai_score += 0.20  # Высокая энтропия
    elif entropy > 4.2:
        ai_score += 0.10  # Средне-высокая энтропия
    elif entropy < 3.8:
        ai_score -= 0.10  # Низкая энтропия (признак человека)

    # Длина строк (25%) - пониженные пороги
    if avg_line_length > 80:
        ai_score += 0.25
    elif avg_line_length > 60:
        ai_score += 0.15
    elif avg_line_length > 40:
        ai_score += 0.05
    elif avg_line_length < 25:
        ai_score -= 0.10  # Короткие строки (человек)

    # Комментарии (25%) - меньший штраф за комментарии
    if comment_ratio < 0.03:
        ai_score += 0.25  # Почти нет комментариев
    elif comment_ratio < 0.08:
        ai_score += 0.15  # Очень мало комментариев
    elif comment_ratio < 0.15:
        ai_score += 0.05  # Мало комментариев
    elif comment_ratio > 0.30:
        ai_score -= 0.15  # Много комментариев (человек)
    elif comment_ratio > 0.20:
        ai_score -= 0.05  # Умеренно много комментариев

    # Вариативность отступов (20%)
    if indentation_variety < 2:
        ai_score += 0.20  # Очень однообразно
    elif indentation_variety < 4:
        ai_score += 0.10  # Однообразно
    elif indentation_variety > 8:
        ai_score -= 0.10  # Разнообразно (человек)
    elif indentation_variety > 6:
        ai_score -= 0.05

    # Дополнительные признаки человеческого кода
    # Наличие TODO/FIXME/NOTE
    if any(marker in code.lower() for marker in ['todo', 'fixme', 'note', 'hack', 'xxx']):
        ai_score -= 0.15
        print("  ✓ Found TODO/FIXME (-0.15)")

    # Наличие отладочных print
    if code.count('print(') > 3:
        ai_score -= 0.05
        print("  ✓ Many print statements (-0.05)")

    # Наличие комментариев с пояснениями (а не просто код)
    comment_lines = len([l for l in code.split('\n') if l.strip().startswith('#') and len(l.strip()) > 10])
    if comment_lines > 5:
        ai_score -= 0.10
        print("  ✓ Detailed comments (-0.10)")

    # Базовая вероятность 40% (было 25%)
    ai_probability = 0.40 + ai_score

    # Ограничиваем диапазон 5-95%
    ai_probability = min(0.95, max(0.05, ai_probability))

    print(f"  Entropy: {entropy:.3f}")
    print(f"  Comment ratio: {comment_ratio:.1%}")
    print(f"  Avg line length: {avg_line_length:.1f}")
    print(f"  Indentation variety: {indentation_variety}")
    print(f"  AI Score: {ai_score:+.3f}")
    print(f"  → Probability: {ai_probability:.1%}")

    # Определяем вердикт
    if ai_probability > 0.65:
        verdict = "🤖 Скорее AI"
    elif ai_probability > 0.50:
        verdict = "🤖➡️👤 Неопределённо (ближе к AI)"
    elif ai_probability > 0.35:
        verdict = "👤➡️🤖 Неопределённо (ближе к человеку)"
    else:
        verdict = "👤 Скорее человек"

    print(f"  → Verdict: {verdict}")
    print("="*50 + "\n")
    sys.stdout.flush()

    return jsonify({
        'probability': ai_probability,
        'is_ai_generated': ai_probability > 0.5,
        'features': {
            'line_count': line_count,
            'char_count': features_dict['char_count'],
            'comment_ratio': round(comment_ratio, 3),
            'entropy': round(entropy, 2)
        }
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'mode': 'heuristic_v2'})

if __name__ == '__main__':
    print("🚀 Starting server with BALANCED heuristic detection...")
    print("📊 Base probability: 40%")
    print("📊 AI score range: -0.35 to +0.55")
    print("📊 Final range: 5% to 95%")
    app.run(host='127.0.0.1', port=5000, debug=True)
