#!/usr/bin/env python3
import subprocess
import json
import sys
import os

def run_prediction(args):
    """Run ML prediction with given arguments"""
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    predict_script = os.path.join(script_dir, 'predict.py')
    
    cmd = ['python', predict_script] + [str(arg) for arg in args]
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=script_dir)
    if result.returncode != 0:
        print(f"Error running prediction: {result.stderr}")
        return None
    try:
        return json.loads(result.stdout.strip())
    except json.JSONDecodeError:
        print(f"Error parsing JSON: {result.stdout}")
        return None

def test_scenario(name, args, expected_range=None):
    """Test a specific scenario and print results"""
    print(f"\n🧪 {name}")
    print(f"   Input: {args}")

    result = run_prediction(args)
    if result:
        mean = result['mean']
        variance = result['variance']
        tail_risk = result['tail_risk']

        print(f"   Mean: {mean:.2f} minutes")
        print(f"   Variance: {variance:.2f}")
        print(f"   Tail Risk: {tail_risk:.4f}")
        if expected_range:
            if expected_range[0] <= mean <= expected_range[1]:
                print("   ✅ Within expected range")
            else:
                print(f"   ⚠️  Outside expected range {expected_range}")

        return mean, variance, tail_risk
    else:
        print("   ❌ Failed to get prediction")
        return None, None, None

def main():
    print("🧪 MediQueueAI ML Model Comprehensive Testing")
    print("=" * 50)

    # Test different queue lengths
    print("\n📊 QUEUE LENGTH VARIATION")
    queue_tests = [
        ("Empty Queue", [0, 0, 2, 0.5, 40, 3, 10, "2026-01-17T14:00:00Z"]),
        ("Light Queue", [3, 2, 2, 0.5, 40, 3, 10, "2026-01-17T14:00:00Z"]),
        ("Medium Queue", [8, 5, 2, 0.5, 40, 3, 10, "2026-01-17T14:00:00Z"]),
        ("Heavy Queue", [15, 10, 2, 0.5, 40, 3, 10, "2026-01-17T14:00:00Z"])
    ]

    for test_name, args in queue_tests:
        test_scenario(test_name, args)

    # Test time of day effects
    print("\n⏰ TIME OF DAY VARIATION")
    time_tests = [
        ("Early Morning", [8, 5, 2, 0.5, 40, 3, 10, "2026-01-17T08:00:00Z"]),
        ("Afternoon Peak", [8, 5, 2, 0.5, 40, 3, 10, "2026-01-17T14:00:00Z"]),
        ("Evening", [8, 5, 2, 0.5, 40, 3, 10, "2026-01-17T17:30:00Z"])
    ]

    for test_name, args in time_tests:
        test_scenario(test_name, args)

    # Test staff availability
    print("\n👥 STAFF AVAILABILITY VARIATION")
    staff_tests = [
        ("Understaffed", [8, 5, 1, 0.5, 40, 3, 10, "2026-01-17T14:00:00Z"]),
        ("Normal Staff", [8, 5, 2, 0.5, 40, 3, 10, "2026-01-17T14:00:00Z"]),
        ("Well Staffed", [8, 5, 3, 0.5, 40, 3, 10, "2026-01-17T14:00:00Z"])
    ]

    for test_name, args in staff_tests:
        test_scenario(test_name, args)

    print("\n🎯 Testing Complete!")

if __name__ == "__main__":
    main()