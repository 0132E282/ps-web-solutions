---
name: api-verification
description: Parse and verify standardized API responses from the Essentials ecosystem. Use when you need to validate that an API request was successful and that the returned data matches the expected structure.
license: MIT
metadata:
  author: 0132e282
  version: "1.0"
---

# API Verification Skill

This skill allows an agent to reliably interact with and verify the output of the Essentials Admin API.

## 🚀 Capabilities

- **Response Parsing**: Extract `item` or `items` from `Resource::item()` and `Resource::items()` responses.
- **Success Validation**: Check for the `type: success` property in the JSON response.
- **Structure Enforcement**: Verify that paginated responses contain the standard `pagination` metadata.
- **Error Handling**: Identify and parse standardized error messages from `Resource::error()`.

## 📖 Instructions

1.  **Inspect Response**: Look for the JSON root properties.
2.  **Validate Type**: Ensure `type` is `success`.
3.  **Process Data**:
    - For single items, use the `item` property.
    - For collections, use the `items` property.
4.  **Check Pagination**: If the response is paginated, verify `current_page`, `per_page`, `total`, and `last_page`.

## 📝 Example Response Structure

```json
{
    "type": "success",
    "items": [...],
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7
}
```
