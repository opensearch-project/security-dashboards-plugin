import React, { useState, useEffect } from 'react';
import {
  EuiCallOut,
  EuiPage,
  EuiPageBody,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
} from '@elastic/eui';
import { toastNotifications } from 'ui/notify';
import { cloneDeep, pull, set } from 'lodash';
import {
  AUDIT_API,
  CONFIG_LABELS,
  SETTING_GROUPS,
  RESPONSE_MESSAGES,
  TOAST_MESSAGES,
} from './config';
import ContentPanel from './ContentPanel';
import DisplaySettingGroup from './DisplaySettingGroup';
import EditSettingGroup from './EditSettingGroup';
import { generateReadonlyPaths } from './utils';

export function Main(props) {
  const [config, setConfig] = useState(null);
  const [editConfig, setEditConfig] = useState(null);
  const [readonly, setReadonly] = useState([]);
  const [showAllSettings, setShowAllSettings] = useState(true);
  const [showConfigureAudit, setShowConfigureAudit] = useState(false);
  const [showConfigureCompliance, setShowConfigureCompliance] = useState(false);
  const [showError, setShowError] = useState(false);
  const [invalidSettings, setInvalidSettings] = useState([]);

  useEffect(() => {
    fetchConfig();
  }, [props.httpClient]);

  const handleChange = (setting, val) => {
    const editedConfig = set(cloneDeep(editConfig), setting.path, val);
    setEditConfig(editedConfig);
  };

  const handleChangeWithSave = (setting, val) => {
    const editedConfig = set(cloneDeep(editConfig), setting.path, val);
    saveConfig(editedConfig, false);
  };

  const handleInvalid = (key, error) => {
    const invalid = pull([...invalidSettings], key);
    if (error) {
      invalid.push(key);
    }
    setInvalidSettings(invalid);
  };

  const toggleDisplay = (
    show_all_settings = true,
    show_configure_audit = false,
    show_configure_compliance = false
  ) => {
    setShowAllSettings(show_all_settings);
    setShowConfigureAudit(show_configure_audit);
    setShowConfigureCompliance(show_configure_compliance);
    window.scrollTo({ top: 0 });
  };

  const cancel = () => {
    toggleDisplay();
    setEditConfig(config);
    setInvalidSettings([]);
  };

  const saveConfig = (payload, showToast = true, successMessage = '') => {
    const { httpClient } = props;
    httpClient
      .post(AUDIT_API.PUT, payload)
      .then(() => {
        if (showToast) {
          toastNotifications.addSuccess({ title: 'Success', text: successMessage });
        }
        toggleDisplay();
        fetchConfig();
      })
      .catch(() => {
        toastNotifications.addDanger(RESPONSE_MESSAGES.UPDATE_FAILURE);
      });
  };

  const fetchConfig = () => {
    const { httpClient } = props;
    httpClient
      .get(AUDIT_API.GET)
      .then(resp => {
        const responseConfig = resp.data.data.config;
        const readonly = generateReadonlyPaths(resp.data.data._readonly);
        setConfig(responseConfig);
        setEditConfig(responseConfig);
        setReadonly(readonly);
        setShowError(false);
      })
      .catch(() => {
        setShowError(true);
      });
  };

  const renderError = () => {
    return showError ? (
      <EuiCallOut title={RESPONSE_MESSAGES.FETCH_ERROR_TITLE} color="danger" iconType="alert">
        <p>{RESPONSE_MESSAGES.FETCH_ERROR_MESSAGE}</p>
      </EuiCallOut>
    ) : null;
  };

  const renderSave = message => {
    return (
      <>
        <EuiSpacer />
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={() => {
                cancel();
              }}
            >
              Cancel
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              isDisabled={invalidSettings.length != 0}
              onClick={() => {
                saveConfig(editConfig, true, message);
              }}
            >
              Save
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    );
  };

  const renderEditableAuditSettings = () => {
    return (
      <>
        <EuiTitle size="l">
          <h1>{CONFIG_LABELS.GENERAL_SETTINGS}</h1>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiPanel>
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.LAYER_SETTINGS}
            config={editConfig}
            handleChange={handleChange}
            readonly={readonly}
          ></EditSettingGroup>
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.ATTRIBUTE_SETTINGS}
            config={editConfig}
            handleChange={handleChange}
            readonly={readonly}
          ></EditSettingGroup>
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.IGNORE_SETTINGS}
            config={editConfig}
            handleChange={handleChange}
            readonly={readonly}
          ></EditSettingGroup>
        </EuiPanel>
        {renderSave(TOAST_MESSAGES.GENERAL_SETTINGS)}
      </>
    );
  };

  const renderEditableComplianceSettings = () => {
    return (
      <>
        <EuiTitle size="l">
          <h1>{CONFIG_LABELS.COMPLIANCE_SETTINGS}</h1>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiPanel>
          <EuiSpacer size="m" />
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.COMPLIANCE_LOGGING_SETTINGS}
            config={editConfig}
            handleChange={handleChange}
            readonly={readonly}
          ></EditSettingGroup>
          {editConfig.compliance.enabled && (
            <>
              <EditSettingGroup
                settingGroup={SETTING_GROUPS.COMPLIANCE_CONFIG_SETTINGS}
                config={editConfig}
                handleChange={handleChange}
                readonly={readonly}
              ></EditSettingGroup>
              <EditSettingGroup
                settingGroup={SETTING_GROUPS.COMPLIANCE_READ_SETTINGS}
                config={editConfig}
                handleChange={handleChange}
                handleInvalid={handleInvalid}
                readonly={readonly}
              ></EditSettingGroup>
              <EditSettingGroup
                settingGroup={SETTING_GROUPS.COMPLIANCE_WRITE_SETTINGS}
                config={editConfig}
                handleChange={handleChange}
                readonly={readonly}
              ></EditSettingGroup>
            </>
          )}
        </EuiPanel>
        {renderSave(TOAST_MESSAGES.COMPLIANCE_SETTINGS)}
      </>
    );
  };

  const renderAllSettings = () => {
    return (
      <>
        <ContentPanel title={CONFIG_LABELS.AUDIT_LOGGING}>
          <EditSettingGroup
            settingGroup={SETTING_GROUPS.AUDIT_SETTINGS}
            config={editConfig}
            handleChange={handleChangeWithSave}
            readonly={readonly}
          ></EditSettingGroup>
          <EuiSpacer size="s" />
        </ContentPanel>
        {config.enabled && (
          <>
            {!readonly.includes('audit') && (
              <>
                <EuiSpacer />
                <ContentPanel
                  title={CONFIG_LABELS.GENERAL_SETTINGS}
                  configureHandler={() => {
                    toggleDisplay(false, true, false);
                  }}
                >
                  <DisplaySettingGroup
                    settingGroup={SETTING_GROUPS.LAYER_SETTINGS}
                    config={config}
                    readonly={readonly}
                  />
                  <DisplaySettingGroup
                    settingGroup={SETTING_GROUPS.ATTRIBUTE_SETTINGS}
                    config={config}
                    readonly={readonly}
                  />
                  <DisplaySettingGroup
                    settingGroup={SETTING_GROUPS.IGNORE_SETTINGS}
                    config={config}
                    readonly={readonly}
                  />
                </ContentPanel>
              </>
            )}
            {!readonly.includes('compliance') && (
              <>
                <EuiSpacer />
                <ContentPanel
                  title={CONFIG_LABELS.COMPLIANCE_SETTINGS}
                  configureHandler={() => {
                    toggleDisplay(false, false, true);
                  }}
                >
                  <DisplaySettingGroup
                    config={config}
                    settingGroup={SETTING_GROUPS.COMPLIANCE_LOGGING_SETTINGS}
                    readonly={readonly}
                  />
                  <DisplaySettingGroup
                    config={config}
                    settingGroup={SETTING_GROUPS.COMPLIANCE_CONFIG_SETTINGS}
                    readonly={readonly}
                  />
                  <DisplaySettingGroup
                    settingGroup={SETTING_GROUPS.COMPLIANCE_READ_SETTINGS}
                    config={config}
                    readonly={readonly}
                  />
                  <DisplaySettingGroup
                    settingGroup={SETTING_GROUPS.COMPLIANCE_WRITE_SETTINGS}
                    config={config}
                    readonly={readonly}
                  />
                </ContentPanel>
              </>
            )}
          </>
        )}
      </>
    );
  };

  const renderBody = () => {
    return config && editConfig ? (
      <>
        {showAllSettings && renderAllSettings()}
        {showConfigureAudit && renderEditableAuditSettings()}
        {showConfigureCompliance && renderEditableComplianceSettings()}
      </>
    ) : null;
  };

  return (
    <EuiPage restrictWidth={true} style={{ width: '100%' }}>
      <EuiPageBody>
        {renderError()}
        {renderBody()}
      </EuiPageBody>
    </EuiPage>
  );
}
