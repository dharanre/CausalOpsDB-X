import json
import logging
import hcl2
from typing import Any, Optional
from backend.app.schemas.terraform import ResourceChange, TerraformParseResponse
from backend.app.core.security import redact_sensitive_data, is_sensitive_key

logger = logging.getLogger(__name__)

class TerraformParser:
    @staticmethod
    def parse_hcl(content: str) -> TerraformParseResponse:
        """Parses HCL .tf configuration content using python-hcl2 and extracts resources."""
        warnings: list[str] = []
        errors: list[str] = []
        resource_changes: list[ResourceChange] = []

        try:
            parsed = hcl2.loads(content)
        except Exception as e:
            return TerraformParseResponse(
                success=False,
                format_version="HCL_2.0",
                resource_changes=[],
                total_changes=0,
                warnings=[],
                errors=[f"HCL Syntax Parse Error: {str(e)}"]
            )

        resources_block = parsed.get("resource", [])
        for block in resources_block:
            for raw_res_type, instances in block.items():
                res_type = raw_res_type.strip('"\'')
                for raw_res_name, res_config in instances.items():
                    res_name = raw_res_name.strip('"\'')
                    address = f"{res_type}.{res_name}"
                    
                    # Extract dependencies
                    dependencies = []
                    if "depends_on" in res_config:
                        dep_val = res_config["depends_on"]
                        if isinstance(dep_val, list):
                            dependencies.extend([str(d) for d in dep_val])
                        else:
                            dependencies.append(str(dep_val))
                    
                    # Check for referenced resources in attributes
                    for attr_key, attr_val in res_config.items():
                        if isinstance(attr_val, str) and "${" in attr_val:
                            dependencies.append(attr_val)
                    
                    # Check sensitive attributes
                    sensitive_attrs = [k for k in res_config.keys() if is_sensitive_key(k)]
                    safe_after = redact_sensitive_data(res_config)

                    resource_changes.append(
                        ResourceChange(
                            address=address,
                            type=res_type,
                            name=res_name,
                            action="create",  # HCL declares intended desired state
                            before=None,
                            after=safe_after,
                            attributes_changed=list(res_config.keys()),
                            sensitive_attributes=sensitive_attrs,
                            dependencies=dependencies
                        )
                    )

        return TerraformParseResponse(
            success=True,
            format_version="HCL_2.0",
            resource_changes=resource_changes,
            total_changes=len(resource_changes),
            warnings=warnings,
            errors=errors
        )

    @staticmethod
    def parse_plan_json(content: str) -> TerraformParseResponse:
        """Parses standard Terraform plan JSON generated via `terraform show -json`."""
        warnings: list[str] = []
        errors: list[str] = []
        resource_changes: list[ResourceChange] = []

        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            return TerraformParseResponse(
                success=False,
                format_version="UNKNOWN",
                resource_changes=[],
                total_changes=0,
                warnings=[],
                errors=[f"Invalid JSON: {str(e)}"]
            )

        format_version = data.get("format_version", "1.0")
        if not format_version.startswith("1."):
            warnings.append(f"Format version '{format_version}' detected. Expected 1.x.")

        raw_changes = data.get("resource_changes", [])
        for rc in raw_changes:
            address = rc.get("address", "unknown.resource")
            res_type = rc.get("type", "unknown")
            res_name = rc.get("name", "unknown")
            change_obj = rc.get("change", {})
            actions = change_obj.get("actions", ["no-op"])

            action_str = "no-op"
            if "delete" in actions and "create" in actions:
                action_str = "replace"
            elif "create" in actions:
                action_str = "create"
            elif "update" in actions:
                action_str = "update"
            elif "delete" in actions:
                action_str = "delete"

            before = change_obj.get("before") or {}
            after = change_obj.get("after") or {}

            # Calculate modified attributes
            changed_keys = []
            all_keys = set(before.keys()).union(set(after.keys()))
            for k in all_keys:
                if before.get(k) != after.get(k):
                    changed_keys.append(k)

            # Redact sensitive attributes
            sensitive_attrs = [k for k in all_keys if is_sensitive_key(k)]
            safe_before = redact_sensitive_data(before) if before else None
            safe_after = redact_sensitive_data(after) if after else None

            # Dependencies
            dependencies = rc.get("depends_on", [])

            resource_changes.append(
                ResourceChange(
                    address=address,
                    type=res_type,
                    name=res_name,
                    action=action_str,
                    before=safe_before,
                    after=safe_after,
                    attributes_changed=changed_keys,
                    sensitive_attributes=sensitive_attrs,
                    dependencies=dependencies
                )
            )

        return TerraformParseResponse(
            success=True,
            format_version=format_version,
            resource_changes=resource_changes,
            total_changes=len(resource_changes),
            warnings=warnings,
            errors=errors
        )

    @classmethod
    def parse(cls, content: str, file_type: str = "hcl") -> TerraformParseResponse:
        content_stripped = content.strip()
        if file_type == "json" or content_stripped.startswith("{"):
            return cls.parse_plan_json(content)
        else:
            return cls.parse_hcl(content)
