# Module 15 Completion Report

## Script Metadata
- Filename: validate_walkthroughs.py
- Language: Python
- Purpose: Recursively scans every `walkthrough.md` file in the `modules` directory, validates required section headings against the repo validation rules, and writes a consolidated report to `./modules/missing_section_report.txt`.

## Script Contents
```python
#!/usr/bin/env python3
"""Validate all walkthrough.md files under the modules tree.

This follows the repo rule set in instructions/validation-rules.md and writes a
single consolidated report to ./modules/missing_section_report.txt.
"""

from __future__ import annotations

import re
from pathlib import Path

REQUIRED_SECTIONS = [
    "Summary",
    "Quiz",
    "Prerequisites",
    "Step-by-Step Instructions",
    "Success Criteria",
    "Troubleshooting",
    "Next Steps",
]


def normalize_heading(value: str) -> str:
    """Normalize a markdown heading for comparison."""
    return re.sub(r"\s+", " ", value).strip()


def extract_headings(markdown_text: str) -> list[str]:
    """Return all markdown headings from the file content."""
    headings: list[str] = []
    for raw_line in markdown_text.splitlines():
        line = raw_line.strip()
        match = re.match(r"^(#{1,6})\s+(.*?)\s*#*\s*$", line)
        if match:
            headings.append(normalize_heading(match.group(2)))
    return headings


def validate_walkthrough(path: Path) -> dict:
    """Validate a single walkthrough and return the findings."""
    content = path.read_text(encoding="utf-8", errors="replace")
    headings = extract_headings(content)
    heading_lookup = {heading.lower(): heading for heading in headings}

    present: list[str] = []
    missing: list[str] = []
    for section in REQUIRED_SECTIONS:
        if section.lower() in heading_lookup:
            present.append(section)
        else:
            missing.append(section)

    status = "PASS" if not missing else "FAIL"
    return {
        "path": path,
        "status": status,
        "required": REQUIRED_SECTIONS,
        "present": present,
        "missing": missing,
    }


def build_report(entries: list[dict], report_path: Path) -> str:
    """Build the consolidated report text."""
    lines: list[str] = []
    lines.append("Walkthrough Validation Report")
    lines.append("============================")
    lines.append(f"Generated report file path: {report_path}")
    lines.append("")

    passed = 0
    failed = 0
    index = 1

    for entry in entries:
        if entry["status"] == "PASS":
            passed += 1
        else:
            failed += 1

        lines.append(f"File {index}:")
        lines.append(f"Full walkthrough path: {entry['path']}")
        lines.append(f"Validation status: {entry['status']}")
        lines.append("")
        lines.append("Required sections:")
        for section in entry["required"]:
            lines.append(f"- {section}")
        lines.append("")
        lines.append("Present sections:")
        if entry["present"]:
            for section in entry["present"]:
                lines.append(f"- {section}")
        else:
            lines.append("- None")
        lines.append("")
        lines.append("Missing sections:")
        if entry["missing"]:
            for section in entry["missing"]:
                lines.append(f"- {section}")
        else:
            lines.append("- None")
        lines.append("")
        lines.append("Section-by-section summary:")
        for section in entry["required"]:
            state = "Missing" if section in entry["missing"] else "Present"
            lines.append(f"- {section}: {state}")
        lines.append("")
        index += 1

    lines.append(f"Overall result: {len(entries)} files processed, {failed} failed, {passed} passed")
    return "\n".join(lines) + "\n"


def main() -> int:
    """Validate all walkthrough files and write a consolidated report."""
    repo_root = Path(__file__).resolve().parents[1]
    modules_dir = repo_root / "modules"
    report_path = modules_dir / "missing_section_report.txt"

    walkthroughs = sorted(modules_dir.rglob("walkthrough.md"))
    entries = [validate_walkthrough(path) for path in walkthroughs]
    report_content = build_report(entries, report_path)
    report_path.write_text(report_content, encoding="utf-8")

    failed = sum(1 for entry in entries if entry["status"] == "FAIL")
    print(f"Generated report: {report_path}")
    print(f"Processed {len(entries)} walkthrough files; {failed} failed.")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
```

## Parameters
| Parameter | Description | Default |
|-----------|-------------|---------|
| None | The script runs without command-line arguments and automatically scans all `walkthrough.md` files under `modules/` recursively. | N/A |

## Test Run Output
```text
Generated report: C:\workspace\hello-genai\modules\missing_section_report.txt
Processed 11 walkthrough files; 11 failed.
```
