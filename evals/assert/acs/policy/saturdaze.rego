# ACS policy for agent-drafted weekends (ADR-023, L2-209). Mirrors
# AgentControlGate rule for rule:
#
#   input          CheckInputAsync     another family's names, emails, address or ids in a prompt -> deny
#   pre_tool_call  CheckToolCall       a tool off the allow-list, or arguments outside its schema -> deny
#   output         RecordOutputViolation / CheckResearchRows
#                                      a pick that is not a catalog id, a research row citing a URL
#                                      the web search did not return -> deny (the item is dropped)
#
# Host snapshot (the workflow supplies it with every check):
#   snapshot.protected_values  array[str]  other families' names, emails, addresses, ids
#   snapshot.catalog_ids       array[str]  ids in the family's catalog view
#   snapshot.search_urls       array[str]  URLs the research pass's web search returned

package agent_control_specification.saturdaze

import rego.v1

default verdict := {"decision": "allow"}
default input_verdict := {"decision": "allow"}
default pre_tool_call_verdict := {"decision": "allow"}
default output_verdict := {"decision": "allow"}

verdict := input_verdict if input.intervention_point == "input"
verdict := pre_tool_call_verdict if input.intervention_point == "pre_tool_call"
verdict := output_verdict if input.intervention_point == "output"

snapshot := object.get(input, "snapshot", {})
target := object.get(input.policy_target, "value", {})
tool_name := object.get(object.get(input, "tool", {}), "name", "")

deny(reason, message) := {"decision": "deny", "reason": reason, "message": message}

# ── input: no_cross_family_data ─────────────────────────────────────────────

prompt_text := lower(target) if is_string(target)
prompt_text := lower(object.get(target, "text", "")) if is_object(target)

input_verdict := deny("no_cross_family_data", "The prompt carries another family's details.") if {
	some value in object.get(snapshot, "protected_values", [])
	count(value) > 2
	contains(prompt_text, lower(value))
}

# ── pre_tool_call: tool_allow_list ──────────────────────────────────────────

allowed_tools := {"search_catalog", "get_place", "get_weather", "get_daylight", "get_drive_minutes"}

kinds := {"activity", "event", "restaurant", "any"}

days := {"Saturday", "Sunday"}

pre_tool_call_verdict := deny("tool_allow_list", sprintf("Tool %v is not available to the agents.", [tool_name])) if {
	not tool_name in allowed_tools
}

pre_tool_call_verdict := deny("tool_schema", "search_catalog takes a kind of activity, event, restaurant or any.") if {
	tool_name == "search_catalog"
	not object.get(target, "kind", "any") in kinds
}

pre_tool_call_verdict := deny("tool_schema", "get_place and get_drive_minutes take a catalog id.") if {
	tool_name in {"get_place", "get_drive_minutes"}
	not is_string(object.get(target, "id", null))
}

pre_tool_call_verdict := deny("tool_schema", "get_weather and get_daylight take Saturday or Sunday.") if {
	tool_name in {"get_weather", "get_daylight"}
	not object.get(target, "day", "") in days
}

# ── output: catalog_ids_only, verified_sources ─────────────────────────────

output_obj := json.unmarshal(target) if is_string(target)
output_obj := target if is_object(target)

catalog := {id | some id in object.get(snapshot, "catalog_ids", [])}
search_urls := {url | some url in object.get(snapshot, "search_urls", [])}

picked_ids contains id if {
	some item in array.concat(object.get(output_obj, "picks", []), object.get(output_obj, "shortlist", []))
	id := object.get(item, "id", "")
}

output_verdict := deny("catalog_ids_only", sprintf("Pick %v is not in the family's catalog.", [id])) if {
	count(catalog) > 0
	some id in picked_ids
	not id in catalog
}

output_verdict := deny("verified_sources", sprintf("Research cites %v, which the search did not return.", [url])) if {
	some row in object.get(output_obj, "rows", [])
	url := object.get(row, "url", "")
	url != ""
	not url in search_urls
}
