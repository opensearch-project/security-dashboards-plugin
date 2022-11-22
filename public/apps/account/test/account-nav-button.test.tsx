/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

exports[`Account navigation button renders 1`] = `
<EuiHeaderSectionItemButton
  id="user-icon-btn"
>
  <EuiPopover
    anchorPosition="downCenter"
    button={
      <EuiAvatar
        name="user1"
      />
    }
    closePopover={[Function]}
    data-test-subj="account-popover"
    display="inlineBlock"
    hasArrow={true}
    id="actionsMenu"
    isOpen={false}
    onClick={[Function]}
    ownFocus={true}
    panelPaddingSize="s"
  >
    <EuiContextMenuPanel
      hasFocus={true}
      items={Array []}
    >
      <div
        style={
          Object {
            "maxWidth": "256px",
          }
        }
      >
        <EuiFlexGroup
          gutterSize="s"
        >
          <EuiFlexItem
            grow={null}
          >
            <EuiAvatar
              name="user1"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiListGroup
              gutterSize="none"
            >
              <EuiListGroupItem
                key="username"
                label={
                  <EuiText
                    size="s"
                  >
                    <h5>
                      user1
                    </h5>
                  </EuiText>
                }
                wrapText={true}
              />
            </EuiListGroup>
            <EuiListGroupItem
              color="subdued"
              key="tenant"
              label={
                <EuiText
                  id="tenantName"
                  size="xs"
                >
                  tenant1
                </EuiText>
              }
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiHorizontalRule
          margin="xs"
        />
        <EuiButtonEmpty
          data-test-subj="view-roles-and-identities"
          onClick={[Function]}
          size="xs"
        >
          View roles and identities
        </EuiButtonEmpty>
        <EuiHorizontalRule
          margin="xs"
        />
        <EuiButtonEmpty
          data-test-subj="switch-tenants"
          onClick={[Function]}
          size="xs"
        >
          Switch tenants
        </EuiButtonEmpty>
        <EuiHorizontalRule
          margin="xs"
        />
        <EuiButtonEmpty
          data-test-subj="reset-password"
          onClick={[Function]}
          size="xs"
        >
          Reset password
        </EuiButtonEmpty>
        <LogoutButton
          authType="dummy"
          divider={
            <EuiHorizontalRule
              margin="xs"
            />
          }
          http={1}
        />
      </div>
    </EuiContextMenuPanel>
  </EuiPopover>
</EuiHeaderSectionItemButton>
`;
