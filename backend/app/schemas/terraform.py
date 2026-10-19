from typing import Any, Optional
from pydantic import BaseModel, Field

class ResourceChange(BaseModel):
    address: str
    type: str
    name: str
    action: str  # create, update, delete, replace, no-op
    before: Optional[dict[str, Any]] = None
    after: Optional[dict[str, Any]] = None
    attributes_changed: list[str] = Field(default_factory=list)
    sensitive_attributes: list[str] = Field(default_factory=list)
    dependencies: list[str] = Field(default_factory=list)

class TerraformParseRequest(BaseModel):
    content: str
    file_type: str = "hcl"  # "hcl" or "json"
    file_name: Optional[str] = None

class TerraformParseResponse(BaseModel):
    success: bool
    format_version: str
    resource_changes: list[ResourceChange] = Field(default_factory=list)
    total_changes: int = 0
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
