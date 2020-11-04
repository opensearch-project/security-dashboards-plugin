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

import React from 'react';
import {
  EuiLink,
  EuiCodeBlock,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
} from '@elastic/eui';

export function ExpressionModal(props: { title: string; expression: object }) {
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const closeModal = () => setIsModalVisible(false);

  const showModal = () => setIsModalVisible(true);

  let modal;

  if (isModalVisible) {
    modal = (
      <EuiOverlayMask>
        <EuiModal data-test-subj="expression-modal" onClose={closeModal}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>{props.title}</EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            <EuiCodeBlock fontSize="m" paddingSize="m" color="dark" overflowHeight={300} isCopyable>
              {JSON.stringify(props.expression, null, 2)}
            </EuiCodeBlock>
          </EuiModalBody>
        </EuiModal>
      </EuiOverlayMask>
    );
  }

  return (
    <div>
      <EuiLink data-test-subj="view-expression" onClick={showModal}>
        View expression
      </EuiLink>
      {modal}
    </div>
  );
}
