"""
Prompt building utilities for AI analysis
"""
from typing import Dict, Any, Optional


def build_comprehensive_analysis_prompt(
    comprehensive_data: Dict[str, Any], 
    context: Optional[str] = None
) -> str:
    """
    Build an advanced prompt for comprehensive analysis across the entire incident chain
    
    Args:
        comprehensive_data: Dict containing log, incident, service, actions, and related_logs
        context: Optional additional context
        
    Returns:
        Formatted prompt string for Groq AI
    """
    
    prompt = f"""You are an expert DevOps AI Agent with deep expertise in incident response, root cause analysis, and system reliability engineering.

**MISSION: End-to-End Incident Analysis & Resolution**

You have been provided with comprehensive data spanning the entire incident lifecycle:
- Error logs that triggered the issue
- Related incidents and their status
- Affected service configuration and health
- Actions already taken by the team
- Historical context from related logs

**YOUR TASK:**

1. **INCIDENT CHAIN ANALYSIS**
   - Trace the error from initial log entry through incident creation to current state
   - Identify if this is a recurring issue or a new problem
   - Determine the blast radius (how many services/users affected)

2. **ROOT CAUSE DETERMINATION**
   - Analyze error patterns across related logs
   - Examine service configuration and deployment history
   - Review actions already attempted and their results
   - Identify the PRIMARY root cause (not just symptoms)

3. **SEVERITY & IMPACT ASSESSMENT**
   - Critical: Service down, data loss risk, security breach
   - High: Major functionality impaired, performance degraded >50%
   - Medium: Minor functionality issues, some users affected
   - Low: Cosmetic issues, no user impact

4. **RESOLUTION STRATEGY**
   - Immediate actions (stop the bleeding)
   - Short-term fixes (restore service)
   - Long-term preventive measures
   - Specific commands to run (if applicable)

5. **LEARNING & PREVENTION**
   - What monitoring alerts should be added?
   - What architectural changes would prevent recurrence?
   - Should this trigger a post-mortem?

**DATA PROVIDED:**

"""
    
    # Add log data
    if comprehensive_data.get("log"):
        log = comprehensive_data["log"]
        prompt += f"""
**PRIMARY ERROR LOG:**
- Level: {log.get('level', 'N/A')}
- Service: {log.get('service', 'N/A')}
- Message: {log.get('message', 'N/A')}
- Timestamp: {log.get('timestamp', 'N/A')}
- Stack Trace: {log.get('stackTrace', 'N/A')[:500] if log.get('stackTrace') else 'None'}
"""
    
    # Add incident data
    if comprehensive_data.get("incident"):
        incident = comprehensive_data["incident"]
        prompt += f"""
**RELATED INCIDENT:**
- ID: {incident.get('id', 'N/A')}
- Title: {incident.get('title', 'N/A')}
- Severity: {incident.get('severity', 'N/A')}
- Status: {incident.get('status', 'N/A')}
- Description: {incident.get('description', 'N/A')}
- Reported: {incident.get('reportedAt', 'N/A')}
- Resolved: {incident.get('resolvedAt', 'N/A')}
"""
    
    # Add service data
    if comprehensive_data.get("service"):
        service = comprehensive_data["service"]
        prompt += f"""
**AFFECTED SERVICE:**
- Name: {service.get('name', 'N/A')}
- Status: {service.get('status', 'N/A')}
- URL: {service.get('url', 'N/A')}
- Health Check: {service.get('healthCheckUrl', 'N/A')}
- Last Updated: {service.get('updatedAt', 'N/A')}
"""
    
    # Add actions taken
    if comprehensive_data.get("actions"):
        actions = comprehensive_data["actions"]
        prompt += f"""
**ACTIONS ALREADY TAKEN ({len(actions)} total):**
"""
        for i, action in enumerate(actions[:5], 1):  # Show up to 5 actions
            prompt += f"""
Action {i}:
  - Command: {action.get('commandRun', 'N/A')}
  - Result: {action.get('result', 'N/A')}
  - Timestamp: {action.get('timestamp', 'N/A')}
"""
    
    # Add related logs
    if comprehensive_data.get("related_logs"):
        related_logs = comprehensive_data["related_logs"]
        prompt += f"""
**RELATED ERROR LOGS ({len(related_logs)} found):**
"""
        for i, log in enumerate(related_logs[:3], 1):  # Show up to 3
            prompt += f"""
Log {i}: [{log.get('level')}] {log.get('message', 'N/A')[:100]}...
"""
    
    if context:
        prompt += f"\n**ADDITIONAL CONTEXT:** {context}\n"
    
    prompt += """

**YOUR RESPONSE MUST INCLUDE:**

## 🔴 SEVERITY: [Critical/High/Medium/Low]

## 🔍 ROOT CAUSE ANALYSIS
[Detailed explanation of what's causing the issue]

## 💥 IMPACT ASSESSMENT
- Users Affected: 
- Services Down: 
- Data at Risk: 

## ⚡ IMMEDIATE ACTIONS REQUIRED
1. [Specific command or action]
2. [Specific command or action]
3. [Specific command or action]

## 🔧 RESOLUTION STEPS
### Short-term Fix:
[Steps to restore service]

### Long-term Solution:
[Steps to prevent recurrence]

## 📊 RECOMMENDED COMMANDS
```bash
# Commands to run for diagnosis
[specific commands]

# Commands to fix the issue
[specific commands]
```

## 🛡️ PREVENTION STRATEGY
- Monitoring improvements
- Architecture changes
- Alert configurations

## ✅ VERIFICATION STEPS
1. [How to verify the fix worked]
2. [What metrics to monitor]

Be specific, actionable, and prioritize by urgency. Think like an SRE responding to a production incident.
"""
    
    return prompt


def build_analysis_prompt(
    source: str, 
    data: Any, 
    context: Optional[str] = None
) -> str:
    """
    Build a standard analysis prompt for single-source data
    
    Args:
        source: Data source type (logs, incidents, etc.)
        data: The actual data to analyze
        context: Optional additional context
        
    Returns:
        Formatted prompt string for Groq AI
    """
    
    base_prompt = f"""You are an expert DevOps AI Agent specializing in application reliability, performance optimization, and incident management.

Your mission: Analyze the following {source} data and provide actionable insights to help developers maintain robust, high-performing applications.

**Analysis Framework:**

1. **ASSESSMENT**
   - Scan for errors, warnings, anomalies, and performance degradation
   - Evaluate severity levels (Critical, High, Medium, Low)
   - Identify patterns and trends

2. **ROOT CAUSE ANALYSIS**
   - Determine likely root causes for each issue
   - Consider common failure modes: resource exhaustion, configuration errors, code bugs, dependency failures, network issues
   - Look for cascading failures or systemic problems

3. **IMPACT EVALUATION**
   - Assess impact on users, services, and business operations
   - Identify affected components and dependencies

4. **RECOMMENDATIONS**
   - Provide specific, actionable remediation steps
   - Suggest preventive measures and monitoring improvements
   - Recommend infrastructure or code changes if applicable
   - Prioritize actions by urgency

5. **HEALTH CHECK**
   - If no critical issues found, confirm system health status
   - Highlight any minor optimizations or best practices

**Response Format:**
Structure your response with clear sections using markdown:
- 🔴 **Critical Issues**
- ⚠️ **Warnings & Anomalies**
- 🔍 **Root Cause Analysis**
- 💡 **Recommended Actions**
- 📊 **System Health Summary**

"""
    
    if context:
        base_prompt += f"\n**Additional Context Provided:**\n{context}\n"
    
    base_prompt += f"\n**Data to Analyze ({source}):**\n```json\n{data}\n```\n"
    
    return base_prompt
