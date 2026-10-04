# Skill marketplace

The Skills console opens a marketplace alongside **My skills**. The same
component is reused in skill picker dialogs. Source names, links and supported
views are fixed in code: AceDataCloud, skills.sh and SkillsMP.

- The platform catalog keeps publisher filtering and direct installation.
- External search and ranking come from the selected marketplace's API, with a
  short cache. Browsing does not create database records.
- Only an explicit install imports into the existing Skill/UserSkill tables.
- Repository stars, marketplace installs and local installs remain separate.
- An unavailable/unconfigured source shows an explicit state and an original
  marketplace link. skills.sh still needs a rotating Vercel project identity.

Requires the AuthBackend marketplace adapter endpoints. No schema migration or
additional scheduled job is needed. Existing six-hour skill sync also refreshes
skills explicitly imported from a marketplace.

The screenshot is a local UI preview and does not indicate a production release.

![Local skill marketplace preview](images/skill-marketplace.jpg)
