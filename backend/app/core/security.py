import re
from typing import Any

SENSITIVE_KEY_PATTERNS = [
    re.compile(r"pass(word)?", re.IGNORECASE),
    re.compile(r"secret", re.IGNORECASE),
    re.compile(r"token", re.IGNORECASE),
    re.compile(r"key", re.IGNORECASE),
    re.compile(r"auth", re.IGNORECASE),
    re.compile(r"credential", re.IGNORECASE),
    re.compile(r"private", re.IGNORECASE),
]

REDACTED_PLACEHOLDER = "[REDACTED_CONFIDENTIAL]"

def is_sensitive_key(key: str) -> bool:
    for pattern in SENSITIVE_KEY_PATTERNS:
        if pattern.search(key):
            return True
    return False

def redact_sensitive_data(obj: Any) -> Any:
    """Recursively traverses dictionaries and lists to redact sensitive fields."""
    if isinstance(obj, dict):
        redacted = {}
        for k, v in obj.items():
            if is_sensitive_key(str(k)):
                redacted[k] = REDACTED_PLACEHOLDER
            else:
                redacted[k] = redact_sensitive_data(v)
        return redacted
    elif isinstance(obj, list):
        return [redact_sensitive_data(item) for item in obj]
    return obj
