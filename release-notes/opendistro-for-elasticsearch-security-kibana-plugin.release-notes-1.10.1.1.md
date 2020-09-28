## Version 1.10.1.1 (2020-9-28)

Redesign and implmemented a new Kibana Security Plugin. The new Kibana security plugin is re-designed to streamline workflows, improve usability, and leverage the new Kibana Plugin platform.

The new Kibana security plugin supoorts Kibana `7.9.1`.

Notable changes are:
* Introduction and Tutorial page to help users get up and running quickly.
* Renamed `backend_role` to `External entity` on UI and move the role mapping function to role page. Now you can map roles to backend_role or users on role edit page.
* Created account drop down menu to replace the logout button. Moved `account info` and `switching tenant` function to the account drop down menu.
* Added audit logging configuration function into Kibana security plugin
* Combined `security_authentication` and `security_preferences` cookie into one, because Kibana new plugin platform only support one session cookie.