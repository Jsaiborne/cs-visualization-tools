#!/usr/bin/env python3
import sys
import json

def simulate_dfa(dfa_config, input_string):
    states = dfa_config.get("states", [])
    alphabet = dfa_config.get("alphabet", [])
    start_state = dfa_config.get("startState")
    accept_states = set(dfa_config.get("acceptStates", []))
    raw_transitions = dfa_config.get("transitions", {})

    # Normalize transitions table
    # Can be dict of dicts: {"q0": {"0": "q1"}}
    # Or list of dicts: [{"from": "q0", "to": "q1", "symbol": "0"}]
    transition_table = {}
    if isinstance(raw_transitions, list):
        for t in raw_transitions:
            src = t["from"]
            dst = t["to"]
            sym = t["symbol"]
            if src not in transition_table:
                transition_table[src] = {}
            transition_table[src][sym] = dst
    elif isinstance(raw_transitions, dict):
        transition_table = raw_transitions

    steps = []
    current_state = start_state
    
    # Step 0: Start
    steps.append({
        "stepIndex": 0,
        "currentState": current_state,
        "consumedInput": "",
        "remainingInput": input_string,
        "currentSymbol": None,
        "status": "PENDING",
        "description": f"Initial state: {current_state}"
    })

    for i, char in enumerate(input_string):
        if alphabet and char not in alphabet:
            steps.append({
                "stepIndex": i + 1,
                "currentState": current_state,
                "consumedInput": input_string[:i],
                "remainingInput": input_string[i:],
                "currentSymbol": char,
                "status": "REJECTED",
                "description": f"Invalid symbol '{char}' not in alphabet"
            })
            return {"accepted": False, "steps": steps, "reason": "Invalid symbol"}

        next_state = transition_table.get(current_state, {}).get(char)
        if not next_state:
            steps.append({
                "stepIndex": i + 1,
                "currentState": current_state,
                "consumedInput": input_string[:i],
                "remainingInput": input_string[i:],
                "currentSymbol": char,
                "status": "REJECTED",
                "description": f"No transition defined from state {current_state} on symbol '{char}'"
            })
            return {"accepted": False, "steps": steps, "reason": "No transition"}

        consumed = input_string[:i+1]
        remaining = input_string[i+1:]
        current_state = next_state

        steps.append({
            "stepIndex": i + 1,
            "currentState": current_state,
            "consumedInput": consumed,
            "remainingInput": remaining,
            "currentSymbol": char,
            "status": "STEPPING",
            "description": f"Transitioned to {current_state} on symbol '{char}'"
        })

    is_accept = current_state in accept_states
    final_status = "ACCEPTED" if is_accept else "REJECTED"
    steps[-1]["status"] = final_status
    steps[-1]["description"] += f" -> Final state {current_state} ({'Accepted' if is_accept else 'Rejected'})"

    return {
        "accepted": is_accept,
        "finalState": current_state,
        "steps": steps
    }

def main():
    if len(sys.argv) < 3:
        print("Usage: python dfa_oracle.py '<dfa_json_string>' '<input_string>'")
        sys.exit(1)

    try:
        dfa_config = json.loads(sys.argv[1])
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON config: {str(e)}"}))
        sys.exit(1)

    input_string = sys.argv[2]
    result = simulate_dfa(dfa_config, input_string)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()