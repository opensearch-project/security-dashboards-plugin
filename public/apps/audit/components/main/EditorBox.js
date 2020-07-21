import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { EuiCodeEditor, EuiText, EuiTextColor } from '@elastic/eui';
import { get } from 'lodash';

import 'brace/theme/textmate';
import 'brace/mode/json';

function EditorBox({ setting, config, handleChange, handleInvalid }) {
  const [value, updateValue] = useState(JSON.stringify(get(config, setting.path), null, 2));
  const [invalid, setInvalid] = useState(false);

  const onChange = text => {
    updateValue(text);
    try {
      let parsed = JSON.parse(text);
      handleChange(setting, parsed);
      handleInvalid(setting.path, false);
      setInvalid(false);
    } catch (e) {
      setInvalid(true);
      handleInvalid(setting.path, true);
    }
  };

  return (
    <>
      <EuiCodeEditor
        mode="json"
        theme="textmate"
        width="100%"
        height="auto"
        showGutter={false}
        minLines={5}
        maxLines={25}
        setOptions={{
          showLineNumbers: false,
          tabSize: 2,
        }}
        value={value}
        onChange={onChange}
      />
      {invalid && (
        <EuiText size="s">
          <EuiTextColor color="danger">
            <small>{setting.error}</small>
          </EuiTextColor>
        </EuiText>
      )}
    </>
  );
}

EditorBox.propTypes = {
  setting: PropTypes.object,
  config: PropTypes.object,
  handleChange: PropTypes.func,
  handleInvalid: PropTypes.func,
};

export default EditorBox;
