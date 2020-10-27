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

import { renderHook, act } from '@testing-library/react-hooks';
import { useDeleteConfirmState } from '../delete-confirm-modal-utils';

describe('Delete confirm modal utils', () => {
  describe('useDeleteConfirmState', () => {
    const handleDelete = jest.fn();
    const entity = 'dummy_entity';

    it('confirm modal should be empty initially', () => {
      const { result } = renderHook(() => useDeleteConfirmState(handleDelete, entity));
      const deleteConfirmModal = result.current[1];
      expect(deleteConfirmModal).toBe(undefined);
    });

    it('deleteConfirmModal should not be undefined after calling showDeleteConfirmModal', () => {
      const { result } = renderHook(() => useDeleteConfirmState(handleDelete, entity));

      const showDeleteConfirmModal = result.current[0];
      act(() => {
        showDeleteConfirmModal();
      });

      expect(typeof showDeleteConfirmModal).toBe('function');

      const deleteConfirmModal = result.current[1];
      expect(typeof deleteConfirmModal).not.toBe(undefined);
    });
  });
});
