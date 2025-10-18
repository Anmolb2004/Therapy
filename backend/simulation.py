# backend/simulation.py

from typing import List, TypedDict
from agents import create_therapist_agent, create_persona_agent
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, END

# --- Graph state definition is the same ---
class GraphState(TypedDict):
    chat_history: List[BaseMessage]
    persona: str
    therapist_version: str
    turn_count: int
    max_turns: int

# --- Node definitions are the same ---
def therapist_node(state: GraphState):
    print(f"--- Turn {state['turn_count'] + 1} (Therapist) ---")
    response = create_therapist_agent(state['therapist_version'], state['chat_history'])
    state['chat_history'].append(AIMessage(content=response))
    state['turn_count'] += 1 # Increment turn AFTER therapist responds
    print(f"Therapist: {response}")
    return state

def persona_node(state: GraphState):
    print(f"--- Turn {state['turn_count']} (Persona) ---")
    response = create_persona_agent(state['persona'], state['chat_history'])
    state['chat_history'].append(HumanMessage(content=response))
    print(f"User: {response}")
    return state

# --- Conditional edge definition is the same ---
def should_continue(state: GraphState):
    if state['turn_count'] >= state['max_turns']:
        return "end"
    else:
        return "continue"

# --- THIS IS THE CORRECTED GRAPH STRUCTURE ---
workflow = StateGraph(GraphState)

workflow.add_node("therapist", therapist_node)
workflow.add_node("persona", persona_node)

# The conversation starts with the user's opening message, so the therapist speaks first.
workflow.set_entry_point("therapist")

# The therapist's response leads to the persona's response.
workflow.add_edge("therapist", "persona")

# After the persona speaks, we check if we should continue.
workflow.add_conditional_edges(
    "persona", # The decision happens AFTER the persona speaks
    should_continue,
    {
        "continue": "therapist", # If we continue, the therapist speaks next
        "end": END,
    },
)

langgraph_app = workflow.compile()
# --- END OF CORRECTED GRAPH STRUCTURE ---

def format_transcript(chat_history: list) -> str:
    transcript = ""
    for message in chat_history:
        if isinstance(message, HumanMessage):
            transcript += f"User: {message.content}\n"
        elif isinstance(message, AIMessage):
            transcript += f"Therapist: {message.content}\n"
    return transcript

def run_simulation(persona: str, therapist_version: str, num_turns: int = 10):
    print(f"\n--- Starting LangGraph Simulation ---")
    print(f"Persona: {persona[:100]}...")
    print(f"Therapist Version: {therapist_version}")

    initial_prompt = "Introduce yourself to the therapist and briefly explain the main problem you are facing based on your persona."
    opening_message = create_persona_agent(persona, [HumanMessage(content=initial_prompt)])
    print(f"User: {opening_message}")
    
    initial_state = {
        "chat_history": [HumanMessage(content=opening_message)],
        "persona": persona,
        "therapist_version": therapist_version,
        "turn_count": 0,
        "max_turns": num_turns
    }

    final_state = langgraph_app.invoke(initial_state)
    
    print("\n--- Simulation Complete ---")
    return format_transcript(final_state['chat_history'])