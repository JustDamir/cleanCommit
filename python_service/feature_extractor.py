import re
import math
from collections import Counter
import numpy as np

class CodeFeatureExtractor:
    
    def __init__(self):
        self.keywords = {
            'python': {'def', 'class', 'import', 'from', 'if', 'else', 'elif', 
                      'for', 'while', 'try', 'except', 'finally', 'with', 
                      'return', 'yield', 'lambda', 'True', 'False', 'None'},
            'java': {'public', 'private', 'protected', 'class', 'static', 'void',
                    'main', 'extends', 'implements', 'interface', 'abstract', 'final',
                    'try', 'catch', 'finally', 'throw', 'throws', 'new', 'this',
                    'super', 'true', 'false', 'null', 'String', 'System'},
            'c': {'include', 'int', 'char', 'float', 'double', 'void', 'struct',
                 'typedef', 'enum', 'union', 'if', 'else', 'for', 'while', 'do',
                 'switch', 'case', 'break', 'continue', 'return', 'sizeof', 'NULL',
                 'malloc', 'free', 'printf', 'scanf', 'main', 'const'},
            'cpp': {'include', 'using', 'namespace', 'class', 'public', 'private',
                   'protected', 'virtual', 'override', 'const', 'static', 'template',
                   'typename', 'friend', 'operator', 'new', 'delete', 'true', 'false',
                   'nullptr', 'std', 'cout', 'cin', 'endl', 'vector', 'string'}
        }
    
    def extract_all_features(self, code, language='auto'):
        features = {}
        lang = language.lower() if language else 'auto'
        features.update(self._lexical_features(code, lang))
        features.update(self._structural_features(code))
        features.update(self._semantic_features(code))
        features.update(self._behavioral_features(code))
        return features
    
    def _lexical_features(self, code, language):
        features = {}
        lines = code.split('\n')
        non_empty = [l for l in lines if l.strip()]
        
        features['char_count'] = len(code)
        features['line_count'] = len(non_empty)
        features['avg_line_length'] = np.mean([len(l) for l in non_empty]) if non_empty else 0
        features['max_line_length'] = max([len(l) for l in non_empty]) if non_empty else 0
        
        comment_lines = 0
        for line in lines:
            stripped = line.strip()
            if stripped.startswith(('#', '//', '/*', '*', '*/')):
                comment_lines += 1
        features['comment_ratio'] = comment_lines / max(1, len(lines))
        
        if language in self.keywords:
            kw_set = self.keywords[language]
        else:
            kw_set = set()
            for kws in self.keywords.values():
                kw_set.update(kws)
        
        words = re.findall(r'\b\w+\b', code)
        kw_count = sum(1 for w in words if w in kw_set)
        features['keyword_density'] = kw_count / max(1, len(words))
        features['unique_word_ratio'] = len(set(words)) / max(1, len(words))
        
        char_freq = Counter(code)
        total = len(code)
        if total > 0:
            entropy = -sum((c/total) * math.log2(c/total) for c in char_freq.values() if c > 0)
        else:
            entropy = 0
        features['char_entropy'] = entropy
        
        return features
    
    def _structural_features(self, code):
        features = {}
        lines = code.split('\n')
        
        indentations = [len(l) - len(l.lstrip()) for l in lines if l.strip()]
        if indentations:
            features['indentation_variety'] = len(set(indentations))
            features['avg_indentation'] = np.mean(indentations)
            features['max_indentation'] = max(indentations)
        else:
            features['indentation_variety'] = 0
            features['avg_indentation'] = 0
            features['max_indentation'] = 0
        
        conditionals = len(re.findall(r'\b(if|else|elif|for|while|case|catch|switch)\b', code))
        features['cyclomatic_complexity'] = conditionals + 1
        
        max_depth = 0
        current_depth = 0
        for line in lines:
            stripped = line.strip()
            if stripped.endswith('{') or stripped.endswith(':'):
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            elif stripped.startswith('}'):
                current_depth = max(0, current_depth - 1)
        features['max_nesting_depth'] = max_depth
        
        functions = len(re.findall(r'\bdef\s+\w+\s*\(|\b\w+\s+\w+\s*\([^)]*\)\s*\{', code))
        features['function_count'] = functions
        
        return features
    
    def _semantic_features(self, code):
        features = {}
        
        variables = re.findall(r'\b([a-zA-Z_]\w*)\s*[=:]', code)
        if variables:
            features['avg_variable_name_length'] = np.mean([len(v) for v in variables])
        else:
            features['avg_variable_name_length'] = 5
        
        comments = re.findall(r'(?:#|//|/\*)\s*(.+?)(?:\n|$|\*/)', code)
        comment_text = ' '.join(comments)
        features['comment_length'] = len(comment_text)
        
        stdlib_imports = len(re.findall(r'import\s+\w+|#include\s*<\w+>', code))
        features['stdlib_usage'] = stdlib_imports
        
        return features
    
    def _behavioral_features(self, code):
        features = {}
        
        ops_with_spaces = len(re.findall(r'\s[+\-*/%=<>!&|^]=?\s', code))
        ops_total = len(re.findall(r'[+\-*/%=<>!&|^]=?', code))
        features['operator_spacing_ratio'] = ops_with_spaces / max(1, ops_total)
        
        lines = code.split('\n')
        empty_lines = len([l for l in lines if l.strip() == ''])
        features['empty_line_ratio'] = empty_lines / max(1, len(lines))
        
        blocks = re.split(r'\n\s*\n', code)
        features['avg_block_length'] = np.mean([len(b.split('\n')) for b in blocks]) if blocks else 0
        
        todos = len(re.findall(r'(TODO|FIXME|NOTE|XXX|HACK)', code, re.IGNORECASE))
        features['todo_count'] = todos
        
        return features
    
    def get_feature_vector(self, code, language='auto'):
        features = self.extract_all_features(code, language)
        
        feature_order = [
            'char_count', 'line_count', 'avg_line_length', 'max_line_length',
            'comment_ratio', 'keyword_density', 'unique_word_ratio', 'char_entropy',
            'indentation_variety', 'avg_indentation', 'max_indentation',
            'cyclomatic_complexity', 'max_nesting_depth', 'function_count',
            'avg_variable_name_length', 'comment_length', 'stdlib_usage',
            'operator_spacing_ratio', 'empty_line_ratio', 'avg_block_length', 'todo_count'
        ]
        
        return np.array([features.get(f, 0) for f in feature_order]), feature_order
