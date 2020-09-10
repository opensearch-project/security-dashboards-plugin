/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import { EuiCodeEditor, EuiText, EuiTextColor } from '@elastic/eui';
import React from 'react';
import 'brace/theme/textmate';
import 'brace/mode/json';

export function JsonCodeEditor(props: {
  initialValue: string;
  errorMessage: string;
  handleCodeChange: (val: string) => void;
  handleCodeInvalid: (error: boolean) => void;
}) {
  const [value, setValue] = React.useState<string>(props.initialValue);
  const [invalid, setInvalid] = React.useState<boolean>(false);

  const onChange = (newValue: string) => {
    setValue(newValue);

    try {
      // validate json format.
      JSON.parse(newValue);
      props.handleCodeChange(newValue);
      props.handleCodeInvalid(false);
      setInvalid(false);
    } catch (e) {
      setInvalid(true);
      props.handleCodeInvalid(true);
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
        maxLines={25} // in case of large json, it is inline scroll instead of whole-page scroll.
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
            <small>{props.errorMessage}</small>
          </EuiTextColor>
        </EuiText>
      )}
    </>
  );
}
