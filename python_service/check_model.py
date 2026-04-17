import pickle
import sys

print("🔍 Analyzing model.pkl file...")
print("="*60)

try:
    with open('model.pkl', 'rb') as f:
        data = pickle.load(f)

    print(f"Type: {type(data)}")

    if isinstance(data, tuple):
        print(f"\nTuple with {len(data)} elements:")
        for i, item in enumerate(data):
            print(f"\n[{i}] Type: {type(item)}")
            print(f"    Class: {item.__class__.__name__}")
            print(f"    Attributes: {[attr for attr in dir(item) if not attr.startswith('_')][:10]}")

            if hasattr(item, 'predict'):
                print("    ✓ Has predict()")
            if hasattr(item, 'predict_proba'):
                print("    ✓ Has predict_proba()")
            if hasattr(item, 'transform'):
                print("    ✓ Has transform()")
            if hasattr(item, 'get_params'):
                print(f"    Params: {item.get_params()}")

    elif hasattr(data, 'named_steps'):
        print(f"\nPipeline with steps:")
        for name, step in data.named_steps.items():
            print(f"  - {name}: {type(step)}")

    elif hasattr(data, 'predict'):
        print(f"\nSingle model object")
        print(f"Has predict: {hasattr(data, 'predict')}")
        print(f"Has predict_proba: {hasattr(data, 'predict_proba')}")

except Exception as e:
    print(f"Error loading model: {e}")
    import traceback
    traceback.print_exc()
