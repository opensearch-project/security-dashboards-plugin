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

import React, { useState } from 'react';
import { EuiOverlayMask, EuiConfirmModal, EuiText } from '@elastic/eui';

/**
 *
 * @param handleDelete: [Type: func] delete function which needs to be execute on click of confirm button.
 * @param entity: e.g. role(s), tenant(s), user(s), mapping etc. This will display in confirmation text before deletion.
 * @param customConfirmationText: If you want other than default confirm message, pass it as customConfirmationText.
 */
export function useDeleteConfirmState(
  handleDelete: () => Promise<void>,
  entity: string,
  customConfirmationText?: React.ReactNode
): [() => void, React.ReactNode] {
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const closeDeleteConfirmModal = () => setIsDeleteConfirmModalVisible(false);
  const showDeleteConfirmModal = () => setIsDeleteConfirmModalVisible(true);

  const handleConfirm = async () => {
    await handleDelete();
    closeDeleteConfirmModal();
  };

  let deleteConfirmModal;
  if (isDeleteConfirmModalVisible) {
    deleteConfirmModal = (
      <EuiOverlayMask>
        <EuiConfirmModal
          title="Confirm Delete"
          onCancel={closeDeleteConfirmModal}
          onConfirm={handleConfirm}
          cancelButtonText="Cancel"
          confirmButtonText="Confirm"
          defaultFocusedButton="confirm"
        >
          {customConfirmationText ? (
            customConfirmationText
          ) : (
            <EuiText size="s">
              <p>Do you really want to delete selected {entity}?</p>
            </EuiText>
          )}
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }
  return [showDeleteConfirmModal, deleteConfirmModal];
}
