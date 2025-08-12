I need you to intelligently update a feature documentation file to capture current context for future Claude instances.

**Target file**: If I provide an argument ($ARGUMENTS), use that filename. Otherwise, infer the most relevant feature file from notes/*.md by prioritizing files containing "feature", "roadmap", "task", or "plan" in the name, then ask for confirmation.

**Your task**: Read the current feature file and append a new section that captures:

1. **Current Status**: What's working, what's broken, what's partially implemented
2. **Key Insights**: Important discoveries, gotchas, patterns, or decisions made during recent work
3. **Technical Context**: 
   - Architecture decisions and why they were made
   - Code patterns established or changed
   - Dependencies, integrations, or constraints discovered
   - Performance, security, or compatibility considerations
4. **Implementation State**:
   - What files were modified and why
   - What approaches were tried and abandoned (with reasons)
   - Current test coverage and gaps
   - Known issues or technical debt introduced
5. **Handoff Information**:
   - What a future Claude needs to know to continue this work
   - Critical context that would be hard to rediscover
   - Recommended next steps with reasoning

**Style**: Write concisely but completely. Focus on information that would save a future Claude hours of investigation. Avoid redundant timestamps or git metadata - focus on the conceptual and technical understanding needed.

Make the update feel like a natural extension of the existing document, not a rigid template.