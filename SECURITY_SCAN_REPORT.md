SECURITY VULNERABILITY SCAN REPORT
===================================

Date: 2026-05-07
Scan Tool: Trivy v0.70.0
Severity Filter: HIGH and CRITICAL vulnerabilities only

SUMMARY OF FINDINGS:
===================

CRITICAL VULNERABILITIES (3):
1. form-data@2.3.3 - CVE-2025-7783 (Fixed in: 2.5.4, 3.0.4, 4.0.4)
2. handlebars@4.7.8 - CVE-2026-33937 (Fixed in: 4.7.9)

HIGH VULNERABILITIES (48):
1. axios@0.26.1 - Multiple CVEs (Fixed in: 1.16.0) - PARTIALLY FIXED
2. @nestjs/microservices@11.1.6 - CVE-2026-40879 (Fixed in: 11.1.19)
3. basic-ftp@5.2.0 - Multiple CVEs (Fixed in: 5.3.0)
4. glob@11.0.3 - CVE-2025-64756 (Fixed in: 11.1.0, 10.5.0)
5. handlebars@4.7.8 - Multiple CVEs (Fixed in: 4.7.9)
6. minimatch@9.0.3 - Multiple CVEs (Fixed in: 10.2.3+)
7. picomatch@4.0.2/4.0.3 - CVE-2026-33671 (Fixed in: 4.0.4+)
8. tar@6.2.1 - Multiple CVEs (Fixed in: 7.5.11+)
9. tar-fs@3.0.4 - Multiple CVEs (Fixed in: 3.1.1+)
10. ws@8.13.0/8.16.0 - CVE-2024-37890 (Fixed in: 8.17.1+)

ACTIONS TAKEN:
==============
1. Updated axios from 1.13.5 to 1.16.0 in package.json
2. Rebuilt Docker images with updated dependencies
3. Verified axios 1.16.0 is now present in images

REMAINING ISSUES:
================
- Multiple axios versions still present (0.26.1 and 1.16.0)
- Transitive dependencies need resolution overrides
- Some vulnerabilities are in indirect dependencies

RECOMMENDATIONS:
===============
1. Add pnpm overrides for vulnerable packages
2. Update NestJS packages to latest versions
3. Consider using npm audit fix or pnpm audit --fix
4. Implement dependency scanning in CI/CD pipeline

BRANCH NAME: security/fix-high-critical-vulnerabilities
COMMIT MESSAGE: 
security: update axios to fix high severity vulnerabilities

- Update axios from 1.13.5 to 1.16.0 to address CVE-2025-27152, CVE-2026-25639, CVE-2026-42033, CVE-2026-42035, CVE-2026-42043
- Rebuild Docker images with updated dependencies
- Partial fix for high and critical security vulnerabilities identified by Trivy scan
- Additional transitive dependency updates required for complete resolution

Fixes: Multiple HIGH severity axios vulnerabilities
Scan-tool: Trivy v0.70.0
