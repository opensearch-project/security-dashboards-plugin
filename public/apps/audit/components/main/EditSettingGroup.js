import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiCallOut,
  EuiCodeBlock,
  EuiComboBox,
  EuiDescribedFormGroup,
  EuiFormRow,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTextColor,
  EuiTitle,
} from '@elastic/eui';
import { get } from 'lodash';
import {
  displayBoolean,
  displayLabel,
  generateComboBoxLabels,
  removeComboBoxLabels,
  filterReadonly,
} from './utils';
import EditorBox from './EditorBox';

function EditSettingGroup({
  settingGroup,
  config,
  handleChange,
  handleInvalid,
  readonly,
  showPanel,
}) {
  const renderField = (config, setting, handleChange, handleInvalid) => {
    const val = get(config, setting.path);
    if (setting.type === 'bool') {
      return (
        <EuiSwitch
          label={displayBoolean(val)}
          checked={val}
          onChange={e => {
            handleChange(setting, e.target.checked);
          }}
        />
      );
    } else if (setting.type === 'array' && typeof setting.options !== 'undefined') {
      return (
        <EuiComboBox
          placeholder={setting.title}
          options={generateComboBoxLabels(setting.options)}
          selectedOptions={generateComboBoxLabels(val)}
          onChange={selectedOptions => {
            handleChange(setting, removeComboBoxLabels(selectedOptions));
          }}
        />
      );
    } else if (setting.type === 'array') {
      return (
        <EuiComboBox
          noSuggestions
          placeholder={setting.title}
          selectedOptions={generateComboBoxLabels(val)}
          onChange={selectedOptions => {
            handleChange(setting, removeComboBoxLabels(selectedOptions));
          }}
          onCreateOption={searchValue => {
            handleChange(setting, [...val, searchValue]);
          }}
        />
      );
    } else if (setting.type === 'map') {
      return (
        <EditorBox
          config={config}
          handleChange={handleChange}
          handleInvalid={handleInvalid}
          setting={setting}
        />
      );
    } else if (setting.type === 'text') {
      return (
        <EuiText color="subdued" size="s">
          <EuiTextColor color="subdued">
            <p>
              {setting.content}
              <EuiLink href={setting.url}>
                Learn more
                <EuiIcon type="popout" />
              </EuiLink>
            </p>
          </EuiTextColor>
        </EuiText>
      );
    } else {
      return <></>;
    }
  };

  const renderCodeBlock = setting => {
    return (
      <>
        <EuiCodeBlock language="json" paddingSize="none" isCopyable>
          {setting.code}
        </EuiCodeBlock>
      </>
    );
  };

  const renderCallout = message => {
    return (
      <>
        <EuiCallOut>
          <EuiText size="s">
            <EuiTextColor color="default">
              <p>{message}</p>
            </EuiTextColor>
          </EuiText>
        </EuiCallOut>
      </>
    );
  };

  const settingGroupFiltered = filterReadonly(readonly, settingGroup);
  const renderedSettings =
    settingGroupFiltered.settings.length != 0 ? (
      <>
        {settingGroupFiltered.title && (
          <>
            <EuiTitle>
              <h3>{settingGroupFiltered.title}</h3>
            </EuiTitle>
            <EuiSpacer />
          </>
        )}
        {settingGroupFiltered.settings.map(setting => {
          return (
            <Fragment key={setting.path}>
              <EuiDescribedFormGroup
                title={<h3>{setting.title}</h3>}
                description={
                  <>
                    {setting.description}
                    {setting.code && renderCodeBlock(setting)}
                    {setting.note && renderCallout(setting.note)}
                  </>
                }
                fullWidth
              >
                <EuiFormRow label={setting.hideLabel ? null : displayLabel(setting.path)}>
                  {renderField(config, setting, handleChange, handleInvalid)}
                </EuiFormRow>
              </EuiDescribedFormGroup>
            </Fragment>
          );
        })}
      </>
    ) : null;

  return renderedSettings ? (
    <>{showPanel ? <EuiPanel>{renderedSettings}</EuiPanel> : renderedSettings}</>
  ) : null;
}

EditSettingGroup.propTypes = {
  settingGroup: PropTypes.object,
  config: PropTypes.object,
  handleChange: PropTypes.func,
  handleInvalid: PropTypes.func,
  readonly: PropTypes.array,
  showPanel: PropTypes.bool,
};

export default EditSettingGroup;
