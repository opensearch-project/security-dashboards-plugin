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

import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';

import { ResourceRow, ShareRecipients, ShareWith } from './types';
import {
  cloneShareWith,
  diffShareWith,
  emptyLevels,
  extractHttpErrorLines,
  fromOptions,
  hasNonEmptyShareWith,
  toOptions,
} from './share-utils';

export interface ShareAccessModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  resource: ResourceRow;
  resourceType: string; // display label
  resourceTypeIndex: string; // raw resource type sent to backend
  accessLevels: string[];
}

export const ShareAccessModal: React.FC<ShareAccessModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  resource,
  resourceType,
  resourceTypeIndex,
  accessLevels,
}) => {
  const original = useMemo(() => cloneShareWith(resource?.share_with), [resource?.share_with]);
  const [working, setWorking] = useState<ShareWith>(() =>
    mode === 'edit' ? cloneShareWith(resource?.share_with) : {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorLines, setErrorLines] = useState<string[]>([]);

  useEffect(() => {
    if (mode === 'edit') setWorking(cloneShareWith(resource?.share_with));
    else setWorking({});
    setErrorLines([]);
  }, [mode, resource]);

  const levels = Object.keys(working);
  // suggestions list for this modal (unique + keep order)
  const ACCESS_LEVELS = useMemo(() => Array.from(new Set(accessLevels ?? [])), [accessLevels]);

  const addLevel = () => {
    // If no suggestions were provided for this type, do nothing.
    if (!ACCESS_LEVELS.length) {
      return;
    }

    // Pick the first unused suggestion
    const base = ACCESS_LEVELS.find((level) => !levels.includes(level));
    if (!base) return; // all suggestions already used

    setWorking({ ...working, [base]: {} });
  };

  const removeLevel = (g: string) => {
    const next = cloneShareWith(working);
    delete next[g];
    setWorking(next);
  };

  const setLevelName = (g: string, newName: string) => {
    if (!newName || newName === g) return;
    if (working[newName]) return;
    const copy = cloneShareWith(working);
    copy[newName] = copy[g] || {};
    delete copy[g];
    setWorking(copy);
  };

  const setRecipients = (g: string, key: keyof ShareRecipients, values: string[]) => {
    setWorking((prev) => ({
      ...prev,
      [g]: {
        ...(prev[g] || {}),
        [key]: values,
      },
    }));
  };

  // compute whether there are changes
  const diff = useMemo(() => diffShareWith(original || {}, working || {}), [original, working]);
  const levelsWithNoRecipients = useMemo(() => emptyLevels(working), [working]);
  const hasChanges =
    mode === 'create' ? hasNonEmptyShareWith(working) : Boolean(diff.add || diff.revoke);
  const isInvalid = levelsWithNoRecipients.length > 0;

  const disabledReason = (): string | undefined => {
    if (isInvalid) {
      return `These access-levels have no recipients: ${levelsWithNoRecipients.join(', ')}`;
    }

    if (!hasChanges) {
      return mode === 'create'
        ? 'Add at least one user, role, or backend role to share.'
        : 'No changes detected.';
    }

    return undefined;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorLines([]);
    try {
      if (mode === 'create') {
        await onSubmit({
          resource_id: resource.resource_id,
          resource_type: resourceTypeIndex,
          share_with: working,
        });
      } else {
        if (!diff.add && !diff.revoke) {
          // Shouldn’t happen since button is hidden, but safe-guard anyway
          setIsSubmitting(false);
          return;
        }
        const payload: any = {
          resource_id: resource.resource_id,
          resource_type: resourceTypeIndex,
          ...(diff.add ? { add: diff.add } : {}),
          ...(diff.revoke ? { revoke: diff.revoke } : {}),
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (e: any) {
      const lines = extractHttpErrorLines(e);
      setErrorLines(lines.length ? lines : ['Failed to submit changes.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <EuiModal onClose={onClose} style={{ width: 700 }}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {mode === 'create' ? 'Share Resource' : 'Update Access'}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiText size="s">
          <p>
            <strong>Resource:</strong> {resource.resource_id} &nbsp;·&nbsp; <strong>Type:</strong>{' '}
            {resourceType}
          </p>
        </EuiText>
        <EuiSpacer size="m" />
        {!isSubmitting && errorLines.length > 0 && (
          <>
            <EuiCallOut announceOnMount title="Request failed" color="danger" iconType="alert">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {errorLines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </EuiCallOut>
            <EuiSpacer />
          </>
        )}
        {isInvalid && (
          <>
            <EuiCallOut announceOnMount title="Add recipients" color="warning" iconType="alert">
              The following access-levels have no recipients: {levelsWithNoRecipients.join(', ')}
            </EuiCallOut>
            <EuiSpacer size="s" />
          </>
        )}
        <EuiForm component="form">
          <EuiFormRow label="Access-levels">
            <EuiButtonEmpty iconType="plusInCircle" onClick={addLevel}>
              Add access-level
            </EuiButtonEmpty>
          </EuiFormRow>

          {Object.keys(working).length === 0 && (
            <EuiText color="subdued" size="s">
              No access-levels added yet.
            </EuiText>
          )}

          {Object.entries(working).map(([levelName, recipients]) => {
            const levelOptions = [...new Set([levelName, ...ACCESS_LEVELS])].map((l) => ({
              label: l,
            }));

            return (
              <EuiPanel key={levelName} paddingSize="m" hasShadow={false} hasBorder>
                <EuiFlexGroup gutterSize="m" alignItems="center">
                  <EuiFlexItem grow={3}>
                    <EuiFormRow label="Access-level">
                      <EuiComboBox
                        singleSelection={{ asPlainText: true }}
                        options={levelOptions}
                        selectedOptions={[{ label: levelName }]}
                        onChange={(opts) => {
                          const newLabel = opts[0]?.label || levelName;
                          setLevelName(levelName, newLabel);
                        }}
                        onCreateOption={(label: string) => setLevelName(levelName, label)}
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      color="danger"
                      iconType="trash"
                      onClick={() => removeLevel(levelName)}
                    >
                      Remove
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiFormRow label="Users">
                  <EuiComboBox
                    placeholder="Add users…"
                    noSuggestions
                    selectedOptions={toOptions(recipients.users)}
                    onCreateOption={(v) =>
                      setRecipients(levelName, 'users', [...(recipients.users || []), v])
                    }
                    onChange={(opts) => setRecipients(levelName, 'users', fromOptions(opts))}
                  />
                </EuiFormRow>
                <EuiFormRow label="Roles">
                  <EuiComboBox
                    placeholder="Add roles…"
                    noSuggestions
                    selectedOptions={toOptions(recipients.roles)}
                    onCreateOption={(v) =>
                      setRecipients(levelName, 'roles', [...(recipients.roles || []), v])
                    }
                    onChange={(opts) => setRecipients(levelName, 'roles', fromOptions(opts))}
                  />
                </EuiFormRow>
                <EuiFormRow label="Backend roles">
                  <EuiComboBox
                    placeholder="Add backend roles…"
                    noSuggestions
                    selectedOptions={toOptions(recipients.backend_roles)}
                    onCreateOption={(v) =>
                      setRecipients(levelName, 'backend_roles', [
                        ...(recipients.backend_roles || []),
                        v,
                      ])
                    }
                    onChange={(opts) =>
                      setRecipients(levelName, 'backend_roles', fromOptions(opts))
                    }
                  />
                </EuiFormRow>
              </EuiPanel>
            );
          })}
        </EuiForm>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose} isDisabled={isSubmitting}>
          Cancel
        </EuiButtonEmpty>
        <EuiToolTip content={disabledReason()}>
          <EuiButton
            onClick={handleSubmit}
            fill
            isLoading={isSubmitting}
            isDisabled={!hasChanges || isInvalid || isSubmitting}
            data-test-subj="share-access-modal-submit"
          >
            {mode === 'create' ? 'Share' : 'Update Access'}
          </EuiButton>
        </EuiToolTip>
      </EuiModalFooter>
    </EuiModal>
  );
};
