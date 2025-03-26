#!/usr/bin/env python3
import sys
import json
import os
from predict_rules import predict_fraud

def main():
    """
    Main entry point for prediction requests.
    Takes JSON input data, processes it with the rule-based model,
    and returns the prediction results.
    """
    try:
        # Get input data from command line argument
        if len(sys.argv) != 2:
            print(json.dumps({
                "error": "Invalid number of arguments",
                "details": "Expected exactly one argument with JSON data"
            }))
            sys.exit(1)
        
        # Parse JSON input
        try:
            input_data = json.loads(sys.argv[1])
        except json.JSONDecodeError as e:
            print(json.dumps({
                "error": "Invalid JSON input",
                "details": str(e)
            }))
            sys.exit(1)
        
        # Validate required fields
        required_fields = ['lead_time', 'no_of_adults']
        missing_fields = [field for field in required_fields if field not in input_data]
        
        if missing_fields:
            print(json.dumps({
                "error": "Missing required fields",
                "details": f"The following fields are required: {', '.join(missing_fields)}"
            }))
            sys.exit(1)
        
        # Process with rule-based model
        result = predict_fraud(input_data)
        
        # Return JSON result
        print(json.dumps(result))
        
    except Exception as e:
        import traceback
        print(json.dumps({
            "error": "Unexpected error during prediction",
            "details": str(e),
            "trace": traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == "__main__":
    main() 