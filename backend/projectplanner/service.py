from projectplanner.schema import ProjectResponse, ProjectStep

def generate_plan(user_input: str) -> ProjectResponse:
    """
    Turns a raw project description into structured steps.
    Phase 1: mock logic (for now...i wanna see the E2E for this to work)
    """

    steps = [
        ProjectStep(
            id=1,
            title="Understand project requirements",
            description=f"Interpreting user request: {user_input}"
        ),
        ProjectStep(
            id=2,
            title="Gather materials",
            description="Identify required tools and materials"
        ),
        ProjectStep(
            id=3,
            title="Execute installation",
            description="Follow standard DIY procedure step-by-step"
        )
    ]

    return ProjectResponse(steps=steps)