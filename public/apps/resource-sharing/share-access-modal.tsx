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
  EuiAccordion,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiComboBox,
  EuiConfirmModal,
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
  EuiSuperSelect,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';

import { ResourceRow, ShareRecipients, ShareWith } from './types';
import {
  cloneShareWith,
  diffShareWith,
  extractHttpErrorLines,
  fromOptions,
  hasNonEmptyShareWith,
  humanizeAccessLevel,
  toOptions,
} from './share-utils';
import { PrivateLockIcon, SharedWithIcon } from './share-icons';

export interface ShareAccessModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  resource: ResourceRow;
  /** Human-readable resource name shown instead of the opaque id when provided */
  resourceName?: string;
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
  resourceName,
  resourceType,
  resourceTypeIndex,
  accessLevels,
}) => {
  const original = useMemo(() => cloneShareWith(resource?.share_with), [resource?.share_with]);
  const ACCESS_LEVELS = useMemo(() => Array.from(new Set(accessLevels ?? [])), [accessLevels]);

  // Full share-with being edited: one entry per access level ("section").
  const seed = (): ShareWith => {
    if (mode === 'edit') return cloneShareWith(resource?.share_with);
    // Create: start with a single empty section at the first level so the
    // common single-level case needs no extra click.
    return ACCESS_LEVELS.length ? { [ACCESS_LEVELS[0]]: {} } : {};
  };
  const [working, setWorking] = useState<ShareWith>(seed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorLines, setErrorLines] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setWorking(seed());
    setErrorLines([]);
    setShowConfirm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, resource]);

  const usedLevels = Object.keys(working);
  const canAddLevel = usedLevels.length < ACCESS_LEVELS.length;

  const addLevel = () => {
    const next = ACCESS_LEVELS.find((l) => !usedLevels.includes(l));
    if (!next) return;
    setWorking({ ...working, [next]: {} });
  };

  const removeLevel = (level: string) => {
    const next = cloneShareWith(working);
    delete next[level];
    setWorking(next);
  };

  const renameLevel = (oldLevel: string, newLevel: string) => {
    if (!newLevel || newLevel === oldLevel || working[newLevel]) return;
    const next = cloneShareWith(working);
    next[newLevel] = next[oldLevel] || {};
    delete next[oldLevel];
    setWorking(next);
  };

  const setRecipients = (level: string, key: keyof ShareRecipients, values: string[]) => {
    setWorking((prev) => ({
      ...prev,
      [level]: { ...(prev[level] || {}), [key]: values },
    }));
  };

  const diff = useMemo(() => diffShareWith(original || {}, working || {}), [original, working]);
  const hasChanges = Boolean(diff.add || diff.revoke);
  const currentlyShared = hasNonEmptyShareWith(original);
  const sharedNow = hasNonEmptyShareWith(working);

  const disabledReason = (): string | undefined => {
    if (!ACCESS_LEVELS.length) return 'No access levels are defined for this resource type.';
    if (!hasChanges) {
      return mode === 'create'
        ? 'Add at least one user, role, or backend role to share.'
        : 'No changes to save.';
    }
    return undefined;
  };

  const removeAllSharing = () => setWorking({});

  const handleSubmit = async () => {
    if (!hasChanges) return;
    if (mode === 'edit' && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    await performSubmit();
  };

  const performSubmit = async () => {
    setShowConfirm(false);
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
          setIsSubmitting(false);
          return;
        }
        await onSubmit({
          resource_id: resource.resource_id,
          resource_type: resourceTypeIndex,
          ...(diff.add ? { add: diff.add } : {}),
          ...(diff.revoke ? { revoke: diff.revoke } : {}),
        });
      }
      onClose();
    } catch (e: any) {
      const lines = extractHttpErrorLines(e);
      setErrorLines(lines.length ? lines : ['Failed to submit changes.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Plain-language summary of the pending add/revoke diff for confirmation. */
  const summarizeDiff = (): string[] => {
    const lines: string[] = [];
    const describe = (sw: ShareWith | undefined, verb: string) => {
      for (const [level, r] of Object.entries(sw || {})) {
        const who = [
          ...(r.users || []).map((u) => `user ${u}`),
          ...(r.roles || []).map((x) => `role ${x}`),
          ...(r.backend_roles || []).map((b) => `backend role ${b}`),
        ];
        if (who.length) lines.push(`${verb} ${who.join(', ')} (${humanizeAccessLevel(level)})`);
      }
    };
    describe(diff.add, 'Grant');
    describe(diff.revoke, 'Revoke');
    return lines;
  };

  if (!isOpen) return null;

  const sharedNowLabel = sharedNow ? 'Shared' : 'Private';

  return (
    <EuiModal onClose={onClose} style={{ width: 640 }} data-test-subj="share-access-modal">
      <EuiModalHeader>
        <div>
          <EuiModalHeaderTitle>
            {mode === 'create' ? 'Share resource' : 'Manage access'}
          </EuiModalHeaderTitle>
          <EuiText size="s" color="subdued">
            <p style={{ margin: 0 }}>Review who has access or change their permission.</p>
          </EuiText>
        </div>
      </EuiModalHeader>

      <EuiModalBody>
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

        {/* Resource summary: name + type on the left, status on the right */}
        <EuiPanel hasShadow={false} hasBorder paddingSize="m">
          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="m">
            <EuiFlexItem>
              <EuiText size="s">
                <strong>{resourceName || resource.resource_id}</strong>
              </EuiText>
              <EuiText size="xs" color="subdued">
                {resourceType}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <span
                className={`osdResourceShareStatus osdResourceShareStatus--${
                  sharedNow ? 'shared' : 'private'
                }`}
                data-test-subj="share-access-modal-status"
              >
                {sharedNow ? <SharedWithIcon /> : <PrivateLockIcon />}
                {sharedNowLabel}
              </span>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
        <EuiSpacer size="m" />

        <EuiText size="xs" color="subdued">
          <p style={{ margin: `0 0 8px` }}>
            Share at one or more access levels. Each level can have its own users, roles, and
            backend roles.
          </p>
        </EuiText>

        <EuiForm component="form">
          {usedLevels.length === 0 && (
            <EuiText color="subdued" size="s">
              <p>No access levels added yet.</p>
            </EuiText>
          )}

          {Object.entries(working).map(([level, recipients]) => {
            const others = usedLevels.filter((l) => l !== level);
            const levelOptions = ACCESS_LEVELS.filter(
              (l) => l === level || !others.includes(l)
            ).map((l) => ({ value: l, inputDisplay: humanizeAccessLevel(l) }));

            return (
              <React.Fragment key={level}>
                <EuiPanel
                  paddingSize="m"
                  hasShadow={false}
                  hasBorder
                  data-test-subj={`share-access-section-${level}`}
                >
                  <EuiFlexGroup gutterSize="m" alignItems="flexEnd">
                    <EuiFlexItem>
                      <EuiFormRow label="Access level">
                        <EuiSuperSelect
                          options={levelOptions}
                          valueOfSelected={level}
                          onChange={(v) => renameLevel(level, v)}
                          data-test-subj={`share-access-level-${level}`}
                        />
                      </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButtonEmpty
                        color="danger"
                        iconType="trash"
                        onClick={() => removeLevel(level)}
                        data-test-subj={`share-access-remove-level-${level}`}
                      >
                        Remove level
                      </EuiButtonEmpty>
                    </EuiFlexItem>
                  </EuiFlexGroup>

                  <EuiFormRow
                    label="Users"
                    helpText="Type a username and press Enter."
                  >
                    <EuiComboBox
                      noSuggestions
                      placeholder="Enter a username, then press Enter"
                      selectedOptions={toOptions(recipients.users)}
                      onCreateOption={(v) =>
                        setRecipients(level, 'users', [...(recipients.users || []), v])
                      }
                      onChange={(opts) => setRecipients(level, 'users', fromOptions(opts))}
                      data-test-subj={`share-access-users-${level}`}
                    />
                  </EuiFormRow>

                  <EuiAccordion
                    id={`share-access-advanced-${level}`}
                    buttonContent="Advanced access options"
                  >
                    <EuiSpacer size="s" />
                    <EuiFormRow label="Roles">
                      <EuiComboBox
                        noSuggestions
                        placeholder="Add roles"
                        selectedOptions={toOptions(recipients.roles)}
                        onCreateOption={(v) =>
                          setRecipients(level, 'roles', [...(recipients.roles || []), v])
                        }
                        onChange={(opts) => setRecipients(level, 'roles', fromOptions(opts))}
                      />
                    </EuiFormRow>
                    <EuiFormRow label="Backend roles">
                      <EuiComboBox
                        noSuggestions
                        placeholder="Add backend roles"
                        selectedOptions={toOptions(recipients.backend_roles)}
                        onCreateOption={(v) =>
                          setRecipients(level, 'backend_roles', [
                            ...(recipients.backend_roles || []),
                            v,
                          ])
                        }
                        onChange={(opts) =>
                          setRecipients(level, 'backend_roles', fromOptions(opts))
                        }
                      />
                    </EuiFormRow>
                  </EuiAccordion>
                </EuiPanel>
                <EuiSpacer size="s" />
              </React.Fragment>
            );
          })}

          <EuiButtonEmpty
            iconType="plusInCircle"
            onClick={addLevel}
            isDisabled={!canAddLevel}
            data-test-subj="share-access-add-level"
          >
            Add access level
          </EuiButtonEmpty>

          {currentlyShared && sharedNow && (
            <>
              <EuiSpacer size="l" />
              <EuiPanel color="danger" hasShadow={false} paddingSize="m">
                <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="m">
                  <EuiFlexItem>
                    <EuiText size="s">
                      <strong>Remove all sharing</strong>
                    </EuiText>
                    <EuiText size="xs" color="subdued">
                      The resource becomes private again.
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      color="danger"
                      onClick={removeAllSharing}
                      data-test-subj="share-access-remove-all"
                    >
                      Remove access
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
            </>
          )}
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
            isDisabled={!hasChanges || isSubmitting}
            data-test-subj="share-access-modal-submit"
          >
            {mode === 'create' ? 'Share' : 'Save changes'}
          </EuiButton>
        </EuiToolTip>
      </EuiModalFooter>

      {showConfirm && (
        <EuiConfirmModal
          title="Confirm access changes"
          onCancel={() => setShowConfirm(false)}
          onConfirm={performSubmit}
          cancelButtonText="Back"
          confirmButtonText="Save changes"
          defaultFocusedButton="confirm"
          data-test-subj="share-access-confirm-modal"
        >
          <EuiText size="s">
            <p>
              The following changes will be applied to{' '}
              <strong>{resourceName || resource.resource_id}</strong>:
            </p>
            <ul>
              {summarizeDiff().map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </EuiText>
        </EuiConfirmModal>
      )}
    </EuiModal>
  );
};
