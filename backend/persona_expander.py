from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic.v1 import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser

class ExpandedPersona(BaseModel):
    """Detailed persona profile for realistic therapy simulation."""
    core_issue: str = Field(description="The main problem they're seeking therapy for")
    background: str = Field(description="Brief background (age, occupation, living situation)")
    recent_trigger: str = Field(description="What recently made them seek therapy")
    emotional_state: str = Field(description="Current emotional state (anxious, depressed, angry, etc.)")
    past_attempts: str = Field(description="What they've already tried to fix this problem")
    resistance_points: str = Field(description="What makes change difficult for them (fears, beliefs, habits)")
    specific_examples: str = Field(description="2-3 specific recent situations that illustrate their problem")
    communication_style: str = Field(description="How they talk (withdrawn, defensive, oversharing, etc.)")
    goals: str = Field(description="What they hope to get from therapy (even if unclear)")

def expand_persona(short_persona: str) -> dict:
    """
    Takes a 1-line persona and expands it into a rich, detailed character.
    
    Args:
        short_persona: A brief description like "Someone struggling with anxiety at work"
    
    Returns:
        A dictionary with the expanded persona details
    """
    parser = JsonOutputParser(pydantic_object=ExpandedPersona)
    
    system_prompt = (
        "You are an expert at creating realistic therapy patient personas. "
        "Given a brief description, create a detailed, psychologically realistic character "
        "who would seek therapy. Make them feel like a REAL person with:\n"
        "- Specific life circumstances and history\n"
        "- Concrete recent examples of their struggles\n"
        "- Believable resistance to change\n"
        "- Authentic emotional complexity\n\n"
        "Make the persona detailed enough that someone could roleplay them convincingly.\n\n"
        "{format_instructions}"
    )
    
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Brief persona description: {short_persona}\n\nCreate a detailed, realistic therapy patient profile.")
    ])
    
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    chain = prompt_template | llm | parser
    
    response = chain.invoke({
        "short_persona": short_persona,
        "format_instructions": parser.get_format_instructions()
    })
    
    return response

def format_expanded_persona(expanded: dict) -> str:
    """Formats the expanded persona into a readable string for the agent."""
    return f"""
**CORE ISSUE:** {expanded['core_issue']}

**BACKGROUND:** {expanded['background']}

**RECENT TRIGGER:** {expanded['recent_trigger']}

**EMOTIONAL STATE:** {expanded['emotional_state']}

**PAST ATTEMPTS:** {expanded['past_attempts']}

**RESISTANCE POINTS:** {expanded['resistance_points']}

**SPECIFIC EXAMPLES:**
{expanded['specific_examples']}

**COMMUNICATION STYLE:** {expanded['communication_style']}

**GOALS:** {expanded['goals']}
"""


# Example usage:
if __name__ == "__main__":
    # Test with a simple persona
    short_persona = "Someone with social anxiety who avoids meetings"
    
    expanded = expand_persona(short_persona)
    formatted = format_expanded_persona(expanded)
    
    print("SHORT PERSONA:")
    print(short_persona)
    print("\n" + "="*50)
    print("\nEXPANDED PERSONA:")
    print(formatted)