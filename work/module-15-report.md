# Module 15 Completion Report

## Script Metadata
- Filename: validate_walkthroughs.py
- Language: Python
- Purpose: Recursively scans files matching a configurable filename under a configurable directory, validates required Markdown headings, and writes a consolidated validation report without overwriting an existing report.

## Script Contents
```python
#!/usr/bin/env python3
"""Validate all matching files under a target directory tree.

This follows the repo rule set in instructions/validation-rules.md and writes a
single consolidated report to the requested output path.
"""

from __future__ import annotations

import argparse
import re
from datetime import datetime
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


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for the validator."""
    parser = argparse.ArgumentParser(
        description="Validate files matching a target filename pattern in a directory tree."
    )
    parser.add_argument(
        "--directory",
        default="modules",
        help="Directory to scan recursively (default: modules).",
    )
    parser.add_argument(
        "--report-name",
        default="missing_section_report.txt",
        help="Name of the consolidated report file to create (default: missing_section_report.txt).",
    )
    parser.add_argument(
        "--file-name",
        default="walkthrough.md",
        help="Filename pattern to match (default: walkthrough.md).",
    )
    return parser.parse_args()


def choose_report_path(target_dir: Path, report_name: str) -> Path:
    """Return a unique report path, adding a timestamp when the file already exists."""
    base_path = (target_dir / report_name).resolve()
    if not base_path.exists():
        return base_path

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    stem = base_path.stem
    suffix = base_path.suffix
    return base_path.with_name(f"{stem}_{timestamp}{suffix}")


def main() -> int:
    """Validate all matching files and write a consolidated report."""
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    target_dir = (repo_root / args.directory).resolve()
    report_path = choose_report_path(target_dir, args.report_name)

    matching_files = sorted(target_dir.rglob(args.file_name))
    entries = [validate_walkthrough(path) for path in matching_files]
    report_content = build_report(entries, report_path)
    report_path.write_text(report_content, encoding="utf-8")

    failed = sum(1 for entry in entries if entry["status"] == "FAIL")
    print(f"Generated report: {report_path}")
    print(f"Processed {len(entries)} matching files; {failed} failed.")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
```

## Parameters
| Parameter | Description | Default |
|-----------|-------------|---------|
| `--directory` | Directory to scan recursively for matching files. | `modules` |
| `--report-name` | Name of the consolidated report file. If it already exists, a timestamp is added to create a new report. | `missing_section_report.txt` |
| `--file-name` | Filename pattern to match during the recursive scan. | `walkthrough.md` |

## Test Run Output
The script was run against the single test directory `modules/module1`:

```text
Generated report: C:\workspace\hello-genai\modules\module1\module15_test_report.txt
Processed 1 matching files; 1 failed.
```

The command exited with status `1` because the test walkthrough is missing one or more required sections. The temporary test report was removed after the run.