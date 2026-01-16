Problem
​Data Privacy: Current EML source files contain PII/Production data and cannot be used for testing until sanitized.
​Manual Effort: We don't have a way to quickly create high-volume datasets. Manually creating 10k users or complex email threads is a bottleneck.
​Testing Gaps: We can’t effectively run performance/load tests because we lack "width and depth" in our test data (e.g., simulating a channel with 10k users).
​Inconsistency: Without a centralized utility, test data is fragmented across different connectors and types.
​Desired Outcome
​Sanitization Script: A tool that scrubs PII from raw EML files so they are safe for test environments.
​Data Multiplier: A utility that takes one sanitized EML and "multiplies" it into bulk data (e.g., 50+ unique emails) by randomizing subjects, names, and IDs.
​Parameterization: Ability to inject variables into EML fields (subject, summary, etc.) to cover different functional scenarios.
​Support for NFRs: Capability to generate enough data volume to support both functional edge cases (all attachment types) and non-functional load testing.
​Next Steps
​Sync with Presley: Review existing scripts to see what can be reused for the sanitization logic.
​Connector Data: Rakesh to follow up with Vijay and Alex to grab data types/samples for other connectors.
​Schema Audit: Backend team to verify that the current schema fields are still fit for purpose before we build the parameterization logic.
​Build Multiplier Logic: Develop the script to handle bulk injection and randomization (specifically for "width and depth" scenarios like 10k users).
​Template Creation: Create a base set of EML templates, including one with all attachment types.
​Would you like me to draft the specific logic/pseudocode for the EML parameterization script?