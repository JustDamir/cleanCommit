from flask import Flask, request, jsonify
import pickle
import numpy as np
from feature_extraction import CodeFeatureExtractor

app = Flask(__name__)

print("Loading XGBoost model...")
with open('model_xgboost.pkl', 'rb') as f:
    pipeline = pickle.load(f)

scaler = pipeline['scaler']
model = pipeline['model']
extractor = CodeFeatureExtractor()

print(f"Model loaded! Accuracy: {pipeline['metrics']['accuracy']:.2%}")

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    code = data['code']
    language = data.get('language', 'auto')

    features, _ = extractor.get_feature_vector(code, language)
    X = np.array([features])

    X_scaled = scaler.transform(X)

    proba = model.predict_proba(X_scaled)[0]
    ai_probability = float(proba[1])

    lines = code.split('\n')
    non_empty = [l for l in lines if l.strip()]

    print(f"Model prediction: {ai_probability:.1%}")

    return jsonify({
        'probability': ai_probability,
        'is_ai_generated': ai_probability > 0.5,
        'features': {
            'line_count': len(non_empty),
            'char_count': len(code),
            'comment_ratio': float(features[4]),
            'entropy': float(features[7])
        }
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model': 'XGBoost',
        'accuracy': pipeline['metrics']['accuracy']
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
