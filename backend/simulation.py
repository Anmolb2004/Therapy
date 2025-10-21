from typing import List, TypedDict
from agents import create_therapist_agent, create_persona_agent
from persona_expander import expand_persona, format_expanded_persona
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage, SystemMessage
from langgraph.graph import StateGraph, END

# --- Graph state definition ---
class GraphState(TypedDict):
    chat_history: List[BaseMessage]
    persona: str  # This will now be the EXPANDED persona
    therapist_version: str
    turn_count: int
    max_turns: int

# --- Node definitions ---
def therapist_node(state: GraphState):
    """Generates the therapist's response."""
    print(f"--- Turn {state['turn_count'] + 1} (Therapist: {state['therapist_version']}) ---")
    try:
        response = create_therapist_agent(state['therapist_version'], state['chat_history'])
        if not response or not response.strip():
             print("!!! Therapist agent returned an empty response. Ending simulation. !!!")
             state['chat_history'].append(
                 SystemMessage(content="--- Simulation ended: Therapist agent returned an empty response. ---")
             )
             state['turn_count'] = state['max_turns']
        else:
            state['chat_history'].append(AIMessage(content=response))
            state['turn_count'] += 1
            print(f"Therapist: {response}")
    except Exception as e:
        print(f"!!! Error in therapist_node: {e} !!!")
        state['chat_history'].append(
            SystemMessage(content=f"--- Simulation ended: Error during therapist turn: {e} ---")
        )
        state['turn_count'] = state['max_turns']
    return state

def persona_node(state: GraphState):
    """Generates the persona's response, handling empty results."""
    print(f"--- Turn {state['turn_count']} (Persona) ---")
    try:
        response = create_persona_agent(state['persona'], state['chat_history'])

        if not response or not response.strip():
            print("!!! Persona agent returned an empty response. Ending this simulation gracefully. !!!")
            state['chat_history'].append(
                SystemMessage(content="--- Simulation ended: Persona agent returned an empty response. ---")
            )
            state['turn_count'] = state['max_turns']
        else:
            state['chat_history'].append(HumanMessage(content=response))
            print(f"User: {response}")
    except Exception as e:
        print(f"!!! Error in persona_node: {e} !!!")
        state['chat_history'].append(
            SystemMessage(content=f"--- Simulation ended: Error during persona turn: {e} ---")
        )
        state['turn_count'] = state['max_turns']
    return state

# --- Conditional edge definition ---
def should_continue(state: GraphState):
    """Determines whether to continue the conversation or end."""
    if state['turn_count'] >= state['max_turns']:
        return "end"
    else:
        return "continue"

# --- Graph structure definition ---
workflow = StateGraph(GraphState)

workflow.add_node("therapist", therapist_node)
workflow.add_node("persona", persona_node)

workflow.set_entry_point("therapist")
workflow.add_edge("therapist", "persona")
workflow.add_conditional_edges(
    "persona",
    should_continue,
    {"continue": "therapist", "end": END},
)

langgraph_app = workflow.compile()

# --- Utility to format the transcript ---
def format_transcript(chat_history: list) -> str:
    """Formats the chat history into a readable string, including system messages."""
    transcript = ""
    for message in chat_history:
        if isinstance(message, HumanMessage):
            transcript += f"User: {message.content}\n"
        elif isinstance(message, AIMessage):
            transcript += f"Therapist: {message.content}\n"
        elif isinstance(message, SystemMessage):
            transcript += f"\nSYSTEM: {message.content}\n"
    return transcript.strip()

# --- Main simulation function ---
def run_simulation(persona: str, therapist_version: str, num_turns: int = 10):
    """
    Runs a single simulation conversation using the compiled LangGraph app.
    NOW WITH AUTOMATIC PERSONA EXPANSION!
    """
    print(f"\n--- Starting LangGraph Simulation ---")
    print(f"Short Persona Input: {persona}")
    
    # ✨ EXPAND THE PERSONA AUTOMATICALLY
    print("\n🔄 Expanding persona into detailed profile...")
    try:
        expanded_persona_dict = expand_persona(persona)
        expanded_persona = format_expanded_persona(expanded_persona_dict)
        print("\n✅ Persona expanded successfully!")
        print(f"\nExpanded Profile Preview:\n{expanded_persona[:300]}...")
    except Exception as e:
        print(f"❌ Error expanding persona: {e}")
        print("⚠️ Falling back to short persona...")
        expanded_persona = persona
    
    print(f"\nTherapist Version: {therapist_version}")
    print(f"Max Turns: {num_turns}")

    # Generate the initial opening message using the EXPANDED persona
    initial_prompt = "Introduce yourself to the therapist and briefly explain the main problem you are facing based on your persona."
    opening_message = ""
    try:
        opening_message = create_persona_agent(expanded_persona, [HumanMessage(content=initial_prompt)])

        if not opening_message or not opening_message.strip():
            print("!!! Persona agent returned an empty OPENING message. Aborting this simulation. !!!")
            return "SYSTEM: Simulation aborted. The persona agent failed to provide an initial message."

        print(f"\nUser (Opening): {opening_message}")

        # Define the initial state with the EXPANDED persona
        initial_state = {
            "chat_history": [HumanMessage(content=opening_message)],
            "persona": expanded_persona,  # ✨ Using expanded version
            "therapist_version": therapist_version,
            "turn_count": 0,
            "max_turns": num_turns
        }

        # Invoke the LangGraph application
        final_state = langgraph_app.invoke(initial_state)

        print("\n--- Simulation Complete ---")
        return format_transcript(final_state['chat_history'])

    except Exception as e:
        print(f"!!! Critical error during simulation execution: {e} !!!")
        import traceback
        traceback.print_exc()
        return f"SYSTEM: Simulation failed critically. Error: {e}"



# --- Optional: Direct expansion for testing ---
def test_persona_expansion(short_persona: str):
    """Test function to see what an expanded persona looks like."""
    expanded = expand_persona(short_persona)
    formatted = format_expanded_persona(expanded)
    return formatted