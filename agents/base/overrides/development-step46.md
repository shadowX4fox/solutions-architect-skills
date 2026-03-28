**Step 4.6: Populate Section 1.6 Stack Validation Checklist**

Section 1.6 requires evaluating 26 technology checklist items against `ARCHITECTURE.md` Section 8 (Technology Stack). Read Section 8 carefully before evaluating each item.

**Status icons**: ✅ PASS | ❌ FAIL | ❓ UNKNOWN | ⚪ N/A

**Item format**: `- {ICON} {QUESTION} ({EVIDENCE})`
- EVIDENCE: quote the value found in ARCHITECTURE.md (e.g., "Java 17 LTS — Section 8.1") or "Not documented in Section 8"
- For N/A items: use the reason the section does not apply (e.g., "No Java detected in technology stack")

**Evaluation criteria per section**:

**Java Backend (6 items) → `[JAVA_ITEM_1]`–`[JAVA_ITEM_6]`**:
1. Java version — PASS: Java 11/17/21 LTS | FAIL: Java 8 or older | N/A: Java not used | UNKNOWN: Java present but version unspecified
2. Spring Boot version — PASS: Spring Boot 2.7+ or 3.x | FAIL: Spring Boot < 2.7 | N/A: Spring Boot not used | UNKNOWN: version unspecified
3. Official tools (Maven/Gradle, JUnit, SonarQube) — PASS: build tool + test framework + code quality documented | N/A: Java not used | UNKNOWN: mentioned but not specified
4. Container deployment (Docker + AKS/EKS/GKE/OpenShift) — PASS: Docker + approved K8s variant | FAIL: unapproved platform | N/A: Java not used | UNKNOWN: containerization unspecified
5. Approved libraries only — PASS: library inventory documented and verified | FAIL: unapproved library detected | N/A: Java not used | UNKNOWN: approval status unverified
6. Naming conventions — PASS: conventions documented | FAIL: conventions violated | N/A: Java not used | UNKNOWN: not documented

**`.NET` Backend (6 items) → `[DOTNET_ITEM_1]`–`[DOTNET_ITEM_6]`**:
1. C#/.NET version — PASS: .NET Core 3.1 / .NET 6/7/8 | FAIL: .NET Core 2.x or .NET Framework 4.x | N/A: .NET not used | UNKNOWN: version unspecified
2. ASP.NET Core as main framework — PASS: ASP.NET Core documented | FAIL: legacy ASP.NET Framework | N/A: .NET not used | UNKNOWN: framework type unspecified
3. Official tools (NuGet, xUnit/NUnit, SonarQube) — PASS: package manager + testing + code quality | N/A: .NET not used | UNKNOWN: mentioned but not specified
4. Container deployment — same criteria as Java item 4 | N/A: .NET not used
5. Approved libraries only — same criteria as Java item 5 | N/A: .NET not used
6. Naming conventions — same criteria as Java item 6 | N/A: .NET not used

**Frontend (6 items) → `[FRONTEND_ITEM_1]`–`[FRONTEND_ITEM_6]`**:
1. Approved framework (Angular v12+, React v17+, Vue.js v3+) — PASS: version in approved list | FAIL: deprecated version | N/A: no frontend | UNKNOWN: framework present but version unspecified
2. TypeScript or JavaScript ES6+ — PASS: TypeScript or JS ES6+ documented | FAIL: ES5 or older | N/A: no frontend | UNKNOWN: language version unclear
3. Official tools (NPM/Yarn, Webpack/Vite, Jest/Cypress) — PASS: package manager + bundler + testing | N/A: no frontend | UNKNOWN: tools unspecified
4. Architecture SPA or Micro-Frontends — PASS: SPA or Micro-Frontends documented with justification | FAIL: MPA without justification | N/A: no frontend | UNKNOWN: pattern unspecified
5. Approved libraries only — same criteria as Java item 5 | N/A: no frontend
6. Naming conventions — same criteria as Java item 6 | N/A: no frontend

**Other Stacks and Components (5 items) → `[OTHER_STACKS_ITEM_1]`–`[OTHER_STACKS_ITEM_5]`**:
1. Automation (Python 3.x / Shell / RPA) — PASS: tool in approved list | FAIL: Python 2.x or unapproved RPA | N/A: no automation | UNKNOWN: mentioned but tool unspecified
2. Infrastructure as Code (Terraform, Ansible, Azure DevOps Pipelines) — PASS: IaC tool in approved list | FAIL: unapproved IaC | N/A: PaaS-only | UNKNOWN: IaC mentioned but tool unspecified
3. Database platform (PostgreSQL, SQL Server, Oracle, MongoDB) — PASS: database in approved catalog with version | FAIL: unapproved database or EOL | N/A: stateless app | UNKNOWN: database present but platform/version unspecified
4. API standards (OpenAPI 3.0, REST, gRPC) — PASS: API spec format documented | FAIL: Swagger 2.0 or non-standard | N/A: no APIs exposed | UNKNOWN: APIs present but spec format undocumented
5. CI/CD platform (Azure DevOps, Jenkins, GitHub Actions) — PASS: platform in approved list | FAIL: unapproved platform | N/A: no custom CI/CD | UNKNOWN: CI/CD mentioned but platform unspecified

**Exceptions and Action Plan (3 items) → `[EXCEPTIONS_ITEM_1]`–`[EXCEPTIONS_ITEM_3]`**:
1. Any deviation from official stack? — PASS: no deviations OR all deviations have exception docs | FAIL: deviations without exception | UNKNOWN: incomplete docs
2. Exception and action plan documented? — PASS: all deviations have ADR with justification + risk | FAIL: deviations exist but undocumented | N/A: no deviations detected | UNKNOWN: ADR completeness unverifiable
3. Action plan approved and registered? — PASS: all exceptions have review board approval + registered | FAIL: exceptions not approved | N/A: no deviations detected | UNKNOWN: approval status unverifiable

**After evaluating all 26 items, replace the following placeholders**:

- `[TOTAL_ITEMS]` → `26`
- `[PASS_COUNT]` → count of PASS items
- `[FAIL_COUNT]` → count of FAIL items
- `[NA_COUNT]` → count of N/A items
- `[UNKNOWN_COUNT]` → count of UNKNOWN items
- `[PASS_PERCENTAGE]` → `round((PASS_COUNT / 26) * 100)` (integer)
- `[FAIL_PERCENTAGE]` → `round((FAIL_COUNT / 26) * 100)` (integer)
- `[NA_PERCENTAGE]` → `round((NA_COUNT / 26) * 100)` (integer)
- `[UNKNOWN_PERCENTAGE]` → `round((UNKNOWN_COUNT / 26) * 100)` (integer)
- `[VALIDATION_STATUS_BADGE]` → `✅ **PASS** (Compliant)` if FAIL_COUNT == 0, else `❌ **FAIL** (Non-Compliant)`
- `[JAVA_SUMMARY]` → e.g., `5 PASS, 0 FAIL, 1 N/A, 0 UNKNOWN`
- `[DOTNET_SUMMARY]` → same format for .NET section
- `[FRONTEND_SUMMARY]` → same format for Frontend section
- `[OTHER_STACKS_SUMMARY]` → same format for Other Stacks section
- `[EXCEPTIONS_SUMMARY]` → same format for Exceptions section
- `[DEVIATIONS_LIST]` → numbered list of any detected FAIL items with version/tool name and location, or `"None detected"` if FAIL_COUNT == 0
- `[RECOMMENDATIONS_LIST]` → numbered list of UNKNOWN items with what needs to be documented, or `"None"` if UNKNOWN_COUNT == 0
- `[SOURCE_LINES]` → e.g., `ARCHITECTURE.md Section 8 (Technology Stack), lines X–Y`
