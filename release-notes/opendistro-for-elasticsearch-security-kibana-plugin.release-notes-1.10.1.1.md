## Version 1.10.1.1 (2020-9-28)

The Kibana security plugin is re-designed and re-implemented to streamline workflows, improve usability, and leverage the new Kibana Plugin platform.

### Features
* Added `Introduction and Tutorial` page to help users get up and running quickly.
* Added audit logging configuration function into Kibana security plugin.
* Replace the logout button with account drop down menu. Moved `account info` and `switching tenant` function to the account drop down menu.

### Maintenance
* Added support for Kibana `7.9.1`.

### Infrastructure
* Kibana security plugin is now implementated on top of Kibana's new plugin platform.

### Refactoring
* Renamed `backend role` to `external entity` on UI.
* Moved the role mapping function to role editing page.
* Combined `security_authentication` and `security_preferences` cookies into one, as Kibana new plugin platform only support one session cookie.