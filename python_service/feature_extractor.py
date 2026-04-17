import re
import math
from collections import Counter

def extract_features(code: str, language: str = "auto") -> dict:
    """Извлекает признаки из кода для модели."""
    code_no_comments = re.sub(r'#.*|//.*|/\*[\s\S]*?\*/', '', code)

    lines = code.split('\n')
    non_empty_lines = [l for l in lines if l.strip()]

    features = {
        'char_count': len(code),
        'line_count': len(non_empty_lines),
        'avg_line_length': len(code) / max(1, len(non_empty_lines)),
        'indentation_variety': len(set(len(l) - len(l.lstrip()) for l in non_empty_lines)),
        'comment_ratio': (len(code) - len(code_no_comments)) / max(1, len(code)),
    }

    keywords = ['def', 'class', 'import', 'if', 'for', 'while', 'return']
    word_counts = Counter(re.findall(r'\b\w+\b', code_no_comments))
    for kw in keywords:
        features[f'kw_{kw}'] = word_counts.get(kw, 0)

    char_freq = Counter(code)
    total = len(code)
    entropy = -sum((c/total) * math.log2(c/total) for c in char_freq.values() if c > 0)
    features['char_entropy'] = entropy

    return features
