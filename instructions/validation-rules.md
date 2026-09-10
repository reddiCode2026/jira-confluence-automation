# Walkthrough Validation Rules

## Purpose

Every `walkthrough.md` file in the repository must be checked for required section headings before it is considered complete. This validation ensures each walkthrough is consistent, easy to follow, and aligned with the module specification.

## Required Validation Flow

1. Read each target `walkthrough.md` file in the `modules` directory.
2. Extract all Markdown section headings from the file.
3. Compare the headings against the required sections defined for that walkthrough or the current module standard.
4. For each section, mark it as `Present` or `Missing`.
5. Generate a section-by-section validation report for that file.
6. Consolidate the validation results for all processed `walkthrough.md` files into one `missing_section_report.txt` file in the `./modules` directory.
7. Append or update the consolidated report with each processed `walkthrough.md` file result.
8. Include the full generated report file path in the validation output.
9. If any required sections are missing, treat the walkthrough as not valid until the missing sections are added.

## Required Section Rules

A valid `walkthrough.md` file must include all sections required by the module or template. At minimum, the following sections must be checked:

- `Summary`
- `Quiz`


If a module-specific template defines additional sections, those sections must also be validated against the current walkthrough file.

## Comparison Logic

The validator should follow this logic:

- Parse headings using Markdown heading syntax such as `#`, `##`, `###`.
- Normalize heading text by trimming spaces and lowercasing for comparison.
- Compare the extracted section list against the required section list.
- Record the result per section in a clear output report.

## Output Rules

The validation report must be created once in the `./modules` directory and named exactly:

- `missing_section_report.txt`

The consolidated report must contain:

- Full file path of the generated `missing_section_report.txt` file
- Full file path of each `walkthrough.md` file under review
- Validation status (`PASS` or `FAIL`) for each file
- List of required sections
- List of present sections
- Full list of missing sections for each `walkthrough.md` file
- Section-by-section summary of every required section for each processed file
- A final summary of the overall validation result across all processed walkthrough files

The report must specifically call out which sections are missing so the file reviewer can immediately see what needs to be added. This is required for every `walkthrough.md` file processed, even when only one section is missing.

## Example Report Format

```text
Walkthrough Validation Report
============================
Generated report file path: C:\workspace\hello-genai\modules\missing_section_report.txt

File 1:
Full walkthrough path: C:\workspace\hello-genai\modules\module1\walkthrough.md
Validation status: FAIL

Required sections:
- Summary
- Quiz
- Prerequisites
- Step-by-Step Instructions
- Success Criteria
- Troubleshooting
- Next Steps

Present sections:
- Prerequisites
- Step-by-Step Instructions
- Success Criteria
- Troubleshooting
- Next Steps

Missing sections:
- Summary
- Quiz

Section-by-section summary:
- Summary: Missing
- Quiz: Missing
- Prerequisites: Present
- Step-by-Step Instructions: Present
- Success Criteria: Present
- Troubleshooting: Present
- Next Steps: Present

File 2:
Full walkthrough path: C:\workspace\hello-genai\modules\module2\walkthrough.md
Validation status: FAIL
...

Overall result: 2 files processed, 2 failed, 0 passed
```

## Acceptance Criteria

A `walkthrough.md` file is accepted only when:

- it has been read and parsed,
- all required sections are checked,
- each required section is marked as present or missing,
- a single consolidated `missing_section_report.txt` is generated in the `./modules` directory for all processed `walkthrough.md` files,
- the generated report file path is included in the validation output,
- no required section remains missing.

## Repository Standard

This rule applies to all `walkthrough.md` files across modules. The validator must not skip files simply because a file appears complete at a glance; it must scan and compare the actual headings before deciding the result.
