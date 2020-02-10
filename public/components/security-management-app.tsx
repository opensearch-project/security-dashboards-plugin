import React, { Component } from 'react';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { EuiPanel } from '@elastic/eui';
import { RoleManagement } from './security-management/roles/role-management-app';
import { AppMountContext } from '../../../../src/core/public';

class SecurityManagementAppProps {
  element!: HTMLElement;
  appMountContext!: AppMountContext;
  basePath!: string;
}
class SecurityManagementAppState {
  selectedTab?: EuiTabbedContentTab;
}

class SecurityManagementApp extends Component<SecurityManagementAppProps, SecurityManagementAppState> {
  private tabs: EuiTabbedContentTab[] = [
    {
      id: 'roles',
      name: 'Roles',
      content: (<RoleManagement/>)
    },
    {
      id: 'action_groups',
      name: 'Action Groups',
      content: (<div>bbb</div>)
    },
    {
      id: 'internal_user_database',
      name: 'Internal User Database',
      content: (<div>ccc</div>)
    }
  ];

  constructor(props: SecurityManagementAppProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.setState( {
      selectedTab: this.tabs[0],
    } );
  }

  render() {
    return <div>
      <EuiPanel paddingSize="m">
        <EuiTabbedContent 
          tabs={this.tabs}
          selectedTab={this.state.selectedTab}
          onTabClick={this.onTabClick}
        />
      </EuiPanel>
    </div>
  }

  onTabClick = (tab: EuiTabbedContentTab) => {
    this.setState({ selectedTab: tab });
  };
}

export default SecurityManagementApp;