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

import { renderHook, act } from '@testing-library/react-hooks';
import { useToastState, createUnknownErrorToast, getSuccessToastMessage } from '../toast-utils';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';

describe('Toast utils', () => {
  describe('useToastState', () => {
    const sampleToast1: Toast = {
      id: 'toast1',
      color: 'success',
      title: 'title1',
    };

    const sampleToast2: Toast = {
      id: 'toast2',
      color: 'success',
      title: 'title2',
    };

    it('should return an empty array when there is no toasts', () => {
      const { result } = renderHook(() => useToastState());
      const toasts = result.current[0];
      expect(toasts).toEqual([]);
    });

    it('should add a toast', () => {
      const { result } = renderHook(() => useToastState());

      const addToast = result.current[1];
      act(() => {
        addToast(sampleToast1);
      });

      const toasts = result.current[0];
      expect(toasts.length).toBe(1);
      expect(toasts).toEqual([sampleToast1]);
    });

    it('should add multiple toasts', () => {
      const { result } = renderHook(() => useToastState());

      const addToast = result.current[1];
      act(() => {
        addToast(sampleToast1);
        addToast(sampleToast2);
      });

      const toasts = result.current[0];
      expect(toasts.length).toBe(2);
      expect(toasts).toEqual([sampleToast1, sampleToast2]);
    });

    it('should remove a toast', () => {
      const { result } = renderHook(() => useToastState());

      const addToast = result.current[1];
      act(() => {
        addToast(sampleToast1);
        addToast(sampleToast2);
      });

      const removeToast = result.current[2];
      act(() => {
        removeToast(sampleToast1);
      });

      const toasts = result.current[0];
      expect(toasts.length).toBe(1);
      expect(toasts).toEqual([sampleToast2]);
    });
  });

  describe('Create unknown error toast', () => {
    it('should return unknown error toast', () => {
      const result = createUnknownErrorToast('dummy', 'dummy_action');
      const expectedUnknownErrorToast: Toast = {
        id: 'dummy',
        iconType: 'alert',
        color: 'danger',
        title: 'Failed to dummy_action',
        text:
          'Failed to dummy_action. You may refresh the page to retry or see browser console for more information.',
      };
      expect(result).toEqual(expectedUnknownErrorToast);
    });
  });

  describe('getSuccessToastMessage', () => {
    it('should return successful create message', () => {
      const result = getSuccessToastMessage('User', 'create', 'user1');

      expect(result).toEqual('User "user1" successfully created');
    });

    it('should return successful update message', () => {
      const result = getSuccessToastMessage('Role', 'edit', 'role1');

      expect(result).toEqual('Role "role1" successfully updated');
    });

    it('should return empty message for unknown action', () => {
      const result = getSuccessToastMessage('User', '', 'user1');

      expect(result).toEqual('');
    });
  });
});
